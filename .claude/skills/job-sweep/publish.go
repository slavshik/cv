package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// One run's scored.json, trimmed down to what may be shown on a web page and
// written into content/jobs/<date>.json, where the site build picks it up.
//
// Two things are deliberately not published. Description bodies: desc.ndjson is
// LinkedIn's text, and a page that reprints thirty of them is republishing
// somebody else's copy rather than linking to it. And the query provenance:
// which of the thirteen searches surfaced a row is a tuning signal for
// queries.tsv, not something a reader of the list needs. `why` goes the same
// way: it is a list of raw RE2 sources, written to be read next to score.go.
//
// The drop rules are shortlist.go's, so the page and the fetch proposal agree
// about what is noise. What differs is the cap — shortlist stops at ~30 because
// each row costs a page load, and this stops at nothing because rows are free.

// PubJob is one row on the page.
type PubJob struct {
	Title   string `json:"title"`
	Company string `json:"company"`
	Loc     string `json:"loc"`
	Posted  string `json:"posted"`
	URL     string `json:"url"`

	Score int `json:"score"`

	// New is "not seen by any previous run", which is what earns the badge.
	// FirstSeen dates the ones that are not new — a posting still open after
	// three weeks says something the score does not.
	New       bool   `json:"new"`
	FirstSeen string `json:"firstSeen"`
}

// PubDay is one day's file. Swept and Dropped are what keeps the page honest:
// without them a thin day looks the same as a broken sweep.
type PubDay struct {
	Date    string         `json:"date"`
	Swept   int            `json:"swept"`
	Dropped map[string]int `json:"dropped,omitempty"`
	Jobs    []PubJob       `json:"jobs"`
}

func cmdPublish(args []string) error {
	fs := flag.NewFlagSet("publish", flag.ExitOnError)
	root := fs.String("root", defaultRoot(), "skill directory")
	out := fs.String("out", "", "run directory (default runs/<today>)")
	repo := fs.String("repo", "", "repository root (default: three levels above the skill)")
	min := fs.Int("min", 5, "minimum score to publish, before the always-fetch rules")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if *out == "" {
		*out = defaultOut(*root)
	}
	if *repo == "" {
		*repo = filepath.Join(*root, "..", "..", "..")
	}

	var jobs []*Job
	b, err := os.ReadFile(filepath.Join(*out, "scored.json"))
	if err != nil {
		return fmt.Errorf("run `jobsweep score` first: %w", err)
	}
	if err := unmarshalJSON(b, &jobs); err != nil {
		return err
	}

	day := PubDay{Date: runDate(*out), Swept: len(jobs), Dropped: map[string]int{}}

	for _, j := range jobs {
		if aaaStudio.MatchString(j.Company) && !strings.Contains(strings.ToLower(j.Title), "front") {
			day.Dropped["AAA studio (C++)"]++
			continue
		}
		if reason, drop := dropReason(j.Title); drop {
			day.Dropped[reason]++
			continue
		}
		if !alwaysFetch.MatchString(j.Title) && j.Score < *min {
			day.Dropped["below the line"]++
			continue
		}
		day.Jobs = append(day.Jobs, PubJob{
			Title:     j.Title,
			Company:   j.Company,
			Loc:       j.Loc,
			Posted:    j.Date,
			URL:       j.URL,
			Score:     j.Score,
			New:       j.New,
			FirstSeen: j.FirstSeen,
		})
	}

	dir := filepath.Join(*repo, "content", "jobs")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	path := filepath.Join(dir, day.Date+".json")
	if err := writeJSON(path, day); err != nil {
		return err
	}

	newly := 0
	for _, j := range day.Jobs {
		if j.New {
			newly++
		}
	}
	fmt.Printf("%s: %d of %d postings, %d new -> %s\n", day.Date, len(day.Jobs), day.Swept, newly, path)
	return nil
}

// runDate reads the date off the run directory, so publishing an older run with
// -out lands on that day's file rather than on today's.
func runDate(out string) string {
	base := filepath.Base(out)
	if len(base) == len("2006-01-02") && base[4] == '-' && base[7] == '-' {
		return base
	}
	return today()
}
