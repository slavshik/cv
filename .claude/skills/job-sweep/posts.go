package main

import (
	"flag"
	"fmt"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

// Hiring posts are the half of LinkedIn the guest endpoints cannot see: a
// recruiter writing "we are looking for a Pixi dev" in the feed is never a
// job listing and never reaches jobsweep sweep. The rows this command scores
// come out of js/posts.js, evaluated in Alexander's own signed-in Chrome —
// see SKILL.md and docs/adr/0008 for why that exception exists and what it
// costs.
//
// Everything after the extraction is the same machinery as the listings: the
// weights in score.go, the seen.json dedupe, a ranked table. A post scores on
// its whole text rather than a title, so the rules are applied to the body
// and a post that never says it is hiring is dropped before any of that.

// Post is one hiring post. The lowercase JSON names match js/posts.js.
type Post struct {
	Author    string   `json:"author"`
	Headline  string   `json:"headline"`
	Date      string   `json:"date"`
	Text      string   `json:"text"`
	Truncated bool     `json:"truncated"`
	Links     []string `json:"links,omitempty"`
	URL       string   `json:"url"`

	// Provenance: which feed or search this came off.
	Q string `json:"q,omitempty"`

	// Filled in by score.
	Score     int      `json:"score"`
	Why       []string `json:"why,omitempty"`
	New       bool     `json:"new"`
	FirstSeen string   `json:"first_seen,omitempty"`
}

// hiring is the gate. Without it the feed scores its own noise: conference
// write-ups, congratulations and roadmap threads all name the same stack.
var hiring = regexp.MustCompile(`(?i)` +
	`\bhiring\b|\bwe.re looking\b|\bwe are looking\b|looking for a\b|` +
	`join (our|the) team|open (role|position|vacanc)|new (role|opening)|` +
	`\bvacanc|\bapply (now|here|via)|send (me |us )?your (cv|resume)|dm me\b`)

// dropPost is hiring language for somebody who is not Alexander. A post
// offering candidates rather than a job reads identically to the scorer.
var dropPost = regexp.MustCompile(`(?i)` +
	`open to work|#opentowork|looking for (a )?(new )?(opportunit|role|job|position)s? (for )?(myself|me)\b|` +
	`available for (hire|work|freelance)|my (cv|resume) is|bench (list|strength)|` +
	`we (provide|supply|offer) (developers|engineers|talent)|staff augmentation|outstaff`)

// remoteOrHere is the location read. A post has no location field, so this
// is the only signal there is, and "remote" in the text is worth as much as
// Warsaw — most of what the feed surfaces is somewhere else entirely.
var remoteOrHere = regexp.MustCompile(`(?i)\bwarsaw\b|\bwarszawa\b|\bpoland\b|\bpolska\b|\bremote\b|\beu\b|\beurope\b`)

func scorePost(p *Post) {
	text := p.Text
	p.Score, p.Why = 0, nil

	for _, r := range positive {
		if r.re.MatchString(text) {
			p.Score += r.w
			p.Why = append(p.Why, fmt.Sprintf("+%d %s", r.w, r.re.String()))
		}
	}
	for _, r := range negative {
		if r.re.MatchString(text) {
			p.Score += r.w
			p.Why = append(p.Why, fmt.Sprintf("%d %s", r.w, r.re.String()))
		}
	}
	if remoteOrHere.MatchString(text) {
		p.Score += 2
		p.Why = append(p.Why, "+2 warsaw/poland/remote")
	}
	if len(p.Links) > 0 {
		p.Score += 1
		p.Why = append(p.Why, "+1 links out")
	}
	// A post whose body was cut off at "…see more" was scored on an opening
	// paragraph. Say so in `why`; it is a reason to open it, not to trust it.
	if p.Truncated {
		p.Why = append(p.Why, "note: text truncated in the DOM")
	}
}

func cmdPosts(args []string) error {
	fs := flag.NewFlagSet("posts", flag.ExitOnError)
	root := fs.String("root", defaultRoot(), "skill directory")
	out := fs.String("out", "", "run directory (default runs/<today>)")
	in := fs.String("in", "posts.raw.ndjson", "extracted posts, relative to the run directory")
	markSeen := fs.Bool("mark-seen", false, "record these URLs so the next run can flag what is new")
	newOnly := fs.Bool("new-only", false, "print only posts not seen in a previous run")
	min := fs.Int("min", 5, "lowest score to print")
	limit := fs.Int("limit", 40, "rows to print")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if *out == "" {
		*out = defaultOut(*root)
	}

	rows, err := readNDJSON[Post](filepath.Join(*out, *in))
	if err != nil {
		return err
	}

	index := map[string]*Post{}
	var order []string
	var noURL, notHiring, offering int
	for _, r := range rows {
		switch {
		case r.URL == "":
			noURL++
			continue
		case !hiring.MatchString(r.Text):
			notHiring++
			continue
		case dropPost.MatchString(r.Text):
			offering++
			continue
		}
		if _, ok := index[r.URL]; ok {
			continue
		}
		p := r
		index[r.URL] = &p
		order = append(order, r.URL)
	}

	seenPath := filepath.Join(*root, "runs", "seen.json")
	seen, err := loadSeen(seenPath)
	if err != nil {
		return err
	}

	now := today()
	posts := make([]*Post, 0, len(order))
	for _, u := range order {
		p := index[u]
		scorePost(p)
		first, known := seen[u]
		p.New = !known
		if known {
			p.FirstSeen = first
		} else {
			p.FirstSeen = now
		}
		posts = append(posts, p)
	}

	sort.SliceStable(posts, func(a, b int) bool {
		if posts[a].Score != posts[b].Score {
			return posts[a].Score > posts[b].Score
		}
		return posts[a].Date > posts[b].Date
	})

	if err := writeJSON(filepath.Join(*out, "posts.scored.json"), posts); err != nil {
		return err
	}

	if *markSeen {
		for _, p := range posts {
			if _, ok := seen[p.URL]; !ok {
				seen[p.URL] = now
			}
		}
		if err := saveSeen(seenPath, seen); err != nil {
			return err
		}
	}

	nNew := 0
	for _, p := range posts {
		if p.New {
			nNew++
		}
	}
	fmt.Printf("posts: %d scored (from %d extracted)   new since last run: %d\n", len(posts), len(rows), nNew)
	fmt.Printf("dropped: %d not hiring, %d offering candidates, %d without a permalink\n\n",
		notHiring, offering, noURL)

	printed := 0
	for _, p := range posts {
		if *newOnly && !p.New {
			continue
		}
		if p.Score < *min || printed >= *limit {
			continue
		}
		mark := "   "
		if p.New {
			mark = "NEW"
		}
		date := p.Date
		if len(date) > 10 {
			date = date[:10]
		}
		fmt.Printf("%s %3d  %-10s  %s | %s\n", mark, p.Score, date,
			pad(p.Author, 24), trunc(oneLine(p.Text), 92))
		fmt.Printf("            %s\n", p.URL)
		printed++
	}
	if printed == 0 {
		fmt.Println("(nothing at or above the score floor)")
	}
	return nil
}

// oneLine strips the actor furniture the feed card carries ahead of the post
// body, so the table shows the sentence that decides it rather than a name
// and a follower count.
func oneLine(s string) string {
	s = strings.ReplaceAll(s, "\n", " ")
	for _, cut := range []string{"• 1st", "• 2nd", "• 3rd", "followers", "Follow"} {
		if i := strings.Index(s, cut); i >= 0 && i < 120 {
			s = s[i+len(cut):]
		}
	}
	return strings.TrimSpace(s)
}
