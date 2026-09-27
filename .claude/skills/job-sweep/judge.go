package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"
)

// judge asks TypeSafe's Jev the questions summarize can only grep for. A
// keyword list cannot tell "C++ required" from "C++ a plus", or "no Angular
// needed" from an Angular job; a narrow typed judgment over the description
// can. One request per description, every question in it, answered in
// parallel by the service.
//
// The answers are a first read, not the verdict. SKILL.md's tiering is still
// the agent's, and every claim in the write-up still has to trace to the
// description itself — a caveat judge raises is a line to go and find.
//
// This is the one command that sends a description to a third party, which is
// why it is its own step and never runs from `make jobs`. It needs
// TYPESAFE_API_KEY and nothing else; the HTTP API is one POST, so the tool
// stays stdlib-only.

var tsEndpoint = "https://api.typesafe.ai/v1/systemone"

type tsQuestion struct {
	Type         string `json:"type"`
	Instructions string `json:"instructions"`
	Criteria     any    `json:"criteria,omitempty"`
}

// tsAnswer holds all three answer shapes; Type says which fields are set.
type tsAnswer struct {
	Type          string             `json:"type"`
	Choice        string             `json:"choice,omitempty"`
	Noul          *float64           `json:"noul,omitempty"`
	Score         *float64           `json:"score,omitempty"`
	Confidence    float64            `json:"confidence,omitempty"`
	Probabilities map[string]float64 `json:"probabilities,omitempty"`
}

type option struct {
	What   string `json:"what"`
	NotFor string `json:"not_for,omitempty"`
}

// The tiers are SKILL.md's, judged on the work the posting describes. Where
// the job can be done from is a separate question, so tier 3's "Warsaw or
// Poland-remote" is read off `where` rather than folded into the tier.
var judgeQuestions = map[string]tsQuestion{
	"tier": {
		Type: "choice",
		Instructions: "Which kind of role does `posting` describe? Judge by the work the description says " +
			"the person hired will do, not by the company's name.",
		Criteria: map[string]option{
			"game_client": {
				What:   "Building the client side of browser games — HTML5, canvas, WebGL, PixiJS, Phaser or similar — in TypeScript or JavaScript.",
				NotFor: "Game servers, engine work, Unity or C++; the website, back office or lobby of a games company.",
			},
			"games_product_frontend": {
				What:   "Web frontend in TypeScript or JavaScript at a company that makes games, casino or betting products, on its product, platform, lobby or back office rather than on game rendering.",
				NotFor: "Rendering the games themselves; frontend at a company outside games and gambling.",
			},
			"product_frontend": {
				What:   "Web frontend in TypeScript or JavaScript at a company outside games and gambling.",
				NotFor: "Any role at a games, casino or betting company.",
			},
			"other": {
				What: "Anything else: backend, full stack weighted to the server, mobile native, engine or Unity work, data, QA, design, management.",
			},
		},
	},
	"stack": {
		Type: "choice",
		Instructions: "What will the person hired mainly work in, according to the required skills in " +
			"`posting.description`? Skills listed as nice to have, a plus or a bonus do not count.",
		Criteria: map[string]string{
			"ts_rendering":  "TypeScript or JavaScript with a rendering library: PixiJS, Phaser, Three.js, Babylon, Cocos, WebGL or canvas.",
			"ts_react":      "TypeScript or JavaScript with React, including Next.js, MobX or Redux.",
			"ts_other_ui":   "TypeScript or JavaScript with Angular, Vue or Svelte.",
			"ts_server":     "TypeScript or JavaScript on the server: Node.js, NestJS.",
			"engine":        "C++, C#, Unity or Unreal.",
			"other_backend": "Java, Kotlin on the server, .NET, Go, Python, PHP or Ruby.",
			"mobile_native": "Swift, Kotlin for Android, Flutter or React Native.",
			"not_stated":    "The posting does not say what the main technology is.",
		},
	},
	"where": {
		Type: "choice",
		Instructions: "The candidate lives in Warsaw, Poland. Where does `posting` allow the person hired to " +
			"work from? `posting.listed_location` and `posting.criteria` are the listing's own fields; the " +
			"description may narrow or widen them.",
		Criteria: map[string]string{
			"remote_poland":    "Fully remote, and Poland is allowed: worldwide, Europe, the EU, or a list of countries that includes Poland.",
			"remote_elsewhere": "Remote, but only from countries, states or time zones that leave out Poland.",
			"warsaw":           "On site or hybrid in Warsaw.",
			"poland":           "On site or hybrid in a Polish city other than Warsaw.",
			"abroad":           "On site or hybrid outside Poland.",
			"not_stated":       "The posting does not say.",
		},
	},
	"level": {
		Type:         "choice",
		Instructions: "What level is the role in `posting` pitched at, going by its title, criteria and required experience?",
		Criteria: map[string]string{
			"junior":     "Intern, graduate, junior, or under two years of experience.",
			"mid":        "Mid-level, regular, or two to four years of experience.",
			"senior":     "Senior, or five or more years of experience.",
			"lead":       "Lead, staff, principal, architect or head of.",
			"not_stated": "The posting gives no level.",
		},
	},
	"overlap": {
		Type: "score",
		Instructions: "How much of what `posting.description` requires is TypeScript, React, MobX, and HTML5 " +
			"game rendering with PixiJS or canvas? Nice-to-have skills do not count.",
		Criteria: []string{
			"None of the requirements are among these.",
			"One of these is required; most requirements are other technologies.",
			"Most requirements are among these, with one or two other technologies also required.",
			"Every required technology is among these.",
		},
	},
	"contract": {
		Type:         "noul",
		Instructions: "Does `posting` offer the role only as a contract — B2B, contractor or freelance — with no employment option?",
	},
	"no_visa": {
		Type:         "noul",
		Instructions: "Does `posting` say it cannot sponsor a visa, or that the person hired must already have the right to work in a particular country?",
	},
	"relocation": {
		Type:         "noul",
		Instructions: "Does `posting` offer relocation support?",
	},
}

// tierOrder is SKILL.md's order: the table reads best tier first.
var tierOrder = map[string]int{"game_client": 0, "games_product_frontend": 1, "product_frontend": 2, "other": 3}

// Judged is one line of judged.json: the posting and Jev's raw answers, kept
// whole so a different reading of them needs no second request.
type Judged struct {
	Title   string              `json:"title"`
	Company string              `json:"company"`
	URL     string              `json:"url"`
	Model   string              `json:"model"`
	Answers map[string]tsAnswer `json:"answers"`
}

func (j Judged) choice(id string) (string, float64) {
	a := j.Answers[id]
	return a.Choice, a.Probabilities[a.Choice]
}

func (j Judged) noul(id string) float64 {
	if a := j.Answers[id]; a.Noul != nil {
		return *a.Noul
	}
	return 0
}

func (j Judged) score(id string) float64 {
	if a := j.Answers[id]; a.Score != nil {
		return *a.Score
	}
	return 0
}

func cmdJudge(args []string) error {
	fs := flag.NewFlagSet("judge", flag.ExitOnError)
	root := fs.String("root", defaultRoot(), "skill directory")
	out := fs.String("out", "", "run directory (default runs/<today>)")
	workers := fs.Int("workers", 4, "requests in flight")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if *out == "" {
		*out = defaultOut(*root)
	}
	key := os.Getenv("TYPESAFE_API_KEY")
	if key == "" {
		return errors.New("TYPESAFE_API_KEY is not set")
	}

	descs, err := readNDJSON[Desc](filepath.Join(*out, "desc.ndjson"))
	if err != nil {
		return err
	}
	// A LinkedIn description carries no location of its own; the listing had one.
	listed := map[string]string{}
	if jobs, err := readScored(filepath.Join(*out, "scored.json")); err == nil {
		for _, j := range jobs {
			listed[j.URL] = j.Loc
		}
	}

	var todo []Desc
	for _, d := range descs {
		if len(collapse(d.Body)) < 300 {
			fmt.Printf("!! THIN  %s  %s\n", d.Title, d.URL)
			continue
		}
		todo = append(todo, d)
	}

	results := make([]*Judged, len(todo))
	var wg sync.WaitGroup
	sem := make(chan struct{}, max(*workers, 1))
	for i, d := range todo {
		wg.Add(1)
		go func() {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			j, err := judgeDesc(key, d, listed[d.URL])
			if err != nil {
				progressf("  [%d/%d] %s: %v", i+1, len(todo), d.URL, err)
				return
			}
			progressf("  [%d/%d] %s", i+1, len(todo), d.URL)
			results[i] = j
		}()
	}
	wg.Wait()

	var judged []Judged
	for _, j := range results {
		if j != nil {
			judged = append(judged, *j)
		}
	}
	sortJudged(judged)
	if err := writeJSON(filepath.Join(*out, "judged.json"), judged); err != nil {
		return err
	}
	for _, j := range judged {
		printJudged(j)
	}
	fmt.Printf("\njudged %d of %d descriptions -> %s\n", len(judged), len(todo), filepath.Join(*out, "judged.json"))
	fmt.Println("A first read, not the verdict: check every caveat against the description before it reaches the write-up.")
	return nil
}

func readScored(path string) ([]*Job, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var jobs []*Job
	return jobs, unmarshalJSON(b, &jobs)
}

// judgeDesc sends one description with every question, retrying what the
// service says to retry.
func judgeDesc(key string, d Desc, loc string) (*Judged, error) {
	body, err := json.Marshal(map[string]any{
		"model": "jev-latest",
		"state": map[string]any{"posting": map[string]any{
			"title":           d.Title,
			"company":         d.Company,
			"listed_location": loc,
			"criteria":        d.Criteria,
			"description":     collapse(d.Body),
		}},
		"questions": judgeQuestions,
	})
	if err != nil {
		return nil, err
	}

	var res struct {
		Model   string              `json:"model"`
		Answers map[string]tsAnswer `json:"answers"`
	}
	wait := 2 * time.Second
	for attempt := 1; ; attempt++ {
		status, b, err := tsPost(key, body)
		switch {
		case err == nil && status == http.StatusOK:
			if err := json.Unmarshal(b, &res); err != nil {
				return nil, err
			}
			return &Judged{Title: d.Title, Company: d.Company, URL: d.URL, Model: res.Model, Answers: res.Answers}, nil
		case attempt < 4 && (err != nil || status == 429 || status == 529 || status >= 500):
			time.Sleep(wait)
			wait *= 2
		case err != nil:
			return nil, err
		default:
			return nil, fmt.Errorf("HTTP %d: %s", status, trunc(string(b), 200))
		}
	}
}

var tsClient = &http.Client{Timeout: 60 * time.Second}

func tsPost(key string, body []byte) (int, []byte, error) {
	req, err := http.NewRequest("POST", tsEndpoint, bytes.NewReader(body))
	if err != nil {
		return 0, nil, err
	}
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Content-Type", "application/json")
	res, err := tsClient.Do(req)
	if err != nil {
		return 0, nil, err
	}
	defer res.Body.Close()
	b, err := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	return res.StatusCode, b, err
}

// sortJudged puts the best tier first and, within a tier, the posting that
// asks for most of what Alexander has already done — SKILL.md's order.
func sortJudged(js []Judged) {
	sort.SliceStable(js, func(a, b int) bool {
		ta, _ := js[a].choice("tier")
		tb, _ := js[b].choice("tier")
		ra, oka := tierOrder[ta]
		rb, okb := tierOrder[tb]
		if !oka {
			ra = len(tierOrder)
		}
		if !okb {
			rb = len(tierOrder)
		}
		if ra != rb {
			return ra < rb
		}
		return js[a].score("overlap") > js[b].score("overlap")
	})
}

// A flag is printed from this probability up, so the borderline ones are seen
// and read rather than silently dropped. Below 0.65 it carries a "?".
const flagFloor, flagSure = 0.35, 0.65

func printJudged(j Judged) {
	pick := func(id string) string {
		c, p := j.choice(id)
		s := fmt.Sprintf("%s %.2f", c, p)
		if p < 0.6 {
			s += "?"
		}
		return s
	}
	var flags []string
	for _, f := range []struct{ id, label string }{
		{"contract", "contract only"}, {"no_visa", "no visa sponsorship"}, {"relocation", "relocation offered"},
	} {
		p := j.noul(f.id)
		if p < flagFloor {
			continue
		}
		s := fmt.Sprintf("%s %.2f", f.label, p)
		if p < flagSure {
			s += "?"
		}
		flags = append(flags, s)
	}
	if len(flags) == 0 {
		flags = []string{"-"}
	}

	fmt.Printf("### %s | %s\n", j.Title, j.Company)
	fmt.Printf("    %s\n", j.URL)
	fmt.Printf("    TIER:  %-34s OVERLAP: %.1f/3\n", pick("tier"), j.score("overlap"))
	fmt.Printf("    STACK: %-34s LEVEL:   %s\n", pick("stack"), pick("level"))
	fmt.Printf("    WHERE: %s\n", pick("where"))
	fmt.Printf("    FLAGS: %s\n", strings.Join(flags, ", "))
}
