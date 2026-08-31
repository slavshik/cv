package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

// The score is a coarse title-and-company filter whose only job is to decide
// which postings are worth spending a description fetch on. It is not the
// verdict — SKILL.md is clear that the tiering comes from reading descriptions.
//
// Go's regexp is RE2 and has no lookaround. Nothing here needs it: `\bjava\b`
// already declines to match "javascript", because there is no word boundary
// between "java" and the "s".

type rule struct {
	re *regexp.Regexp
	w  int
}

func rules(pairs map[string]int) []rule {
	out := make([]rule, 0, len(pairs))
	for pat, w := range pairs {
		out = append(out, rule{regexp.MustCompile(`(?i)` + pat), w})
	}
	// Map iteration is random; sort so `why` reads the same way twice.
	sort.Slice(out, func(i, j int) bool { return out[i].re.String() < out[j].re.String() })
	return out
}

// positive: the domain and rendering stack Alexander actually owns.
var positive = rules(map[string]int{
	`\bgame`:                               4,
	`igaming|casino|slot|betting|gambling`: 4,
	`pixi|phaser|webgl|canvas|cocos|babylon|three\.?js`: 4,
	`html5`:                            3,
	`typescript`:                       3,
	`\bfront.?end\b|\bfrontend\b`:      3,
	`\breact\b`:                        2,
	`javascript|\bjs\b`:                2,
	`mobx|redux`:                       2,
	`senior|lead|principal|staff|sr\.`: 2,
	`\bweb\b`:                          1,
	`node`:                             1,
})

// negative: off-stack or off-role. Tuned against real false positives — AAA
// C++ studios and Angular/Vue shops both score well on title alone otherwise.
var negative = rules(map[string]int{
	`\bangular\b`:                            -3,
	`\bvue\b`:                                -3,
	`\.net|c#|\bjava\b`:                      -3,
	`\bphp\b|\bruby\b|\bgolang\b|\bpython\b`: -2,
	`\bqa\b|tester|manual`:                   -4,
	`\bandroid\b|\bios\b|flutter|react native|kotlin|swift`:            -3,
	`intern|junior|graduate|trainee`:                                   -4,
	`designer|artist|ux/ui|producer|manager|analyst|marketing|recruit`: -4,
	`\bunreal\b|c\+\+`:                          -3,
	`data engineer|devops|sre|backend engineer`: -3,
	`\bunity\b`: -1,
})

var gamingCo = regexp.MustCompile(`(?i)` +
	`aristocrat|igt|evolution|leovegas|playtika|betsson|kindred|pragmatic|entain|` +
	`flutter ent|888|bet365|superbet|sportradar|greentube|novomatic|yggdrasil|relax gaming|playson|` +
	`wargaming|ten square|huuuge|tripledot|playtech|light ?& ?wonder|softswiss|betby|slotegrator|` +
	`gamesys|skywind|spribe|onetouch|betsoft|endorphina|gamzix|3 ?oaks|amusnet|ezugi|pateplay|` +
	`cd projekt|techland|11 bit|people can fly|bloober|creative assembly|king\b|zynga|voodoo|` +
	`gismart|frvr|patrianna|kaizen|game|studio|entertainment|interactive|casino|bet\b`)

func scoreJob(j *Job) {
	title, company, loc := j.Title, j.Company, strings.ToLower(j.Loc)
	j.Score, j.Why = 0, nil

	for _, r := range positive {
		if r.re.MatchString(title) {
			j.Score += r.w
			j.Why = append(j.Why, fmt.Sprintf("+%d %s", r.w, r.re.String()))
		}
	}
	for _, r := range negative {
		if r.re.MatchString(title) {
			j.Score += r.w
			j.Why = append(j.Why, fmt.Sprintf("%d %s", r.w, r.re.String()))
		}
	}
	if gamingCo.MatchString(company) {
		j.Score += 3
		j.Why = append(j.Why, "+3 games/igaming company")
	}
	switch {
	case strings.Contains(loc, "warsaw"):
		j.Score += 2
	case strings.Contains(loc, "poland"):
		j.Score += 1
	}
}

func cmdScore(args []string) error {
	fs := flag.NewFlagSet("score", flag.ExitOnError)
	root := fs.String("root", defaultRoot(), "skill directory")
	out := fs.String("out", "", "run directory (default runs/<today>)")
	markSeen := fs.Bool("mark-seen", false, "record these URLs so the next run can flag what is new")
	newOnly := fs.Bool("new-only", false, "print only postings not seen in a previous run")
	limit := fs.Int("limit", 60, "rows to print")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if *out == "" {
		*out = defaultOut(*root)
	}

	rows, err := readNDJSON[Job](filepath.Join(*out, "raw.ndjson"))
	if err != nil {
		return err
	}

	// Dedupe by URL, keeping every query that surfaced the posting.
	index := map[string]*Job{}
	var order []string
	for _, r := range rows {
		if j, ok := index[r.URL]; ok {
			if !contains(j.Queries, r.Q) {
				j.Queries = append(j.Queries, r.Q)
			}
			continue
		}
		j := r
		j.Queries = []string{r.Q}
		index[r.URL] = &j
		order = append(order, r.URL)
	}

	seenPath := filepath.Join(*root, "runs", "seen.json")
	seen, err := loadSeen(seenPath)
	if err != nil {
		return err
	}

	now := today()
	jobs := make([]*Job, 0, len(order))
	for _, u := range order {
		j := index[u]
		scoreJob(j)
		first, known := seen[u]
		j.New = !known
		if known {
			j.FirstSeen = first
		} else {
			j.FirstSeen = now
		}
		sort.Strings(j.Queries)
		jobs = append(jobs, j)
	}

	sort.SliceStable(jobs, func(a, b int) bool {
		if jobs[a].Score != jobs[b].Score {
			return jobs[a].Score > jobs[b].Score
		}
		return jobs[a].Date < jobs[b].Date
	})

	if err := writeJSON(filepath.Join(*out, "scored.json"), jobs); err != nil {
		return err
	}

	if *markSeen {
		for _, j := range jobs {
			if _, ok := seen[j.URL]; !ok {
				seen[j.URL] = now
			}
		}
		if err := saveSeen(seenPath, seen); err != nil {
			return err
		}
	}

	nNew, hi, mid := 0, 0, 0
	for _, j := range jobs {
		if j.New {
			nNew++
		}
		if j.Score >= 8 {
			hi++
		}
		if j.Score >= 5 {
			mid++
		}
	}

	fmt.Printf("unique: %d (from %d rows)   new since last run: %d\n", len(jobs), len(rows), nNew)
	fmt.Printf("score>=8: %d   >=5: %d\n\n", hi, mid)

	printed := 0
	for _, j := range jobs {
		if *newOnly && !j.New {
			continue
		}
		if printed >= *limit {
			break
		}
		mark := "   "
		if j.New {
			mark = "NEW"
		}
		fmt.Printf("%s %3d  %s  %s | %s | %s\n",
			mark, j.Score, j.Date, pad(j.Title, 56), pad(j.Company, 26), trunc(j.Loc, 28))
		printed++
	}
	if printed == 0 {
		fmt.Println("(nothing to show)")
	}
	return nil
}

func loadSeen(path string) (map[string]string, error) {
	b, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return map[string]string{}, nil
	}
	if err != nil {
		return nil, err
	}
	m := map[string]string{}
	if err := json.Unmarshal(b, &m); err != nil {
		return nil, fmt.Errorf("%s: %w", path, err)
	}
	return m, nil
}

func saveSeen(path string, m map[string]string) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	return writeJSON(path, m)
}

func contains(ss []string, s string) bool {
	for _, v := range ss {
		if v == s {
			return true
		}
	}
	return false
}
