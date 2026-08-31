package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// The always-drop and always-fetch rules from SKILL.md, in code. This command
// proposes a shortlist; the agent is expected to read the proposal and trim it
// before spending fetches, which is why it prints what it dropped and why.

// alwaysDrop: scores well on title, never worth a fetch.
var alwaysDrop = []struct {
	re     *regexp.Regexp
	reason string
}{
	{regexp.MustCompile(`(?i)mathematician`), "not an engineering role"},
	{regexp.MustCompile(`(?i)technical art|artist|animator|designer|producer|narrative|level design`), "not an engineering role"},
	{regexp.MustCompile(`(?i)\bqa\b|tester|\bsdet\b`), "QA"},
	{regexp.MustCompile(`(?i)c\+\+|\bunreal\b`), "C++"},
	{regexp.MustCompile(`(?i)\bangular\b`), "Angular"},
	{regexp.MustCompile(`(?i)\bvue\b`), "Vue"},
	{regexp.MustCompile(`(?i)\bunity\b`), "Unity"},
	{regexp.MustCompile(`(?i)react native|\bandroid\b|\bios\b|flutter`), "mobile native"},
	{regexp.MustCompile(`(?i)\.net|c#`), ".NET"},
	{regexp.MustCompile(`(?i)devops|\bsre\b|data scien|data (analyst|engineer)|security|monetization`), "off-role"},
	{regexp.MustCompile(`(?i)intern|junior|graduate|trainee`), "too junior"},
}

// aaaStudio: "Senior Game Programmer" at these is C++ engine work every time,
// whatever the posting's own words say.
var aaaStudio = regexp.MustCompile(`(?i)cd projekt|techland|11 bit|bloober|people can fly|creative assembly`)

// alwaysFetch: the bullseye, regardless of score. The scorer under-weights
// unusual spellings, and a dull title at an iGaming shop still earns a read.
var alwaysFetch = regexp.MustCompile(`(?i)pixi|phaser|cocos|babylon|webgl|spine|html5|canvas|` +
	`video player|\bhls\b|streaming`)

func cmdShortlist(args []string) error {
	fs := flag.NewFlagSet("shortlist", flag.ExitOnError)
	root := fs.String("root", defaultRoot(), "skill directory")
	out := fs.String("out", "", "run directory (default runs/<today>)")
	min := fs.Int("min", 5, "minimum score to consider")
	limit := fs.Int("limit", 32, "cap on proposed fetches")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if *out == "" {
		*out = defaultOut(*root)
	}

	var jobs []*Job
	b, err := os.ReadFile(filepath.Join(*out, "scored.json"))
	if err != nil {
		return fmt.Errorf("run `jobsweep score` first: %w", err)
	}
	if err := unmarshalJSON(b, &jobs); err != nil {
		return err
	}

	var picked []*Job
	dropped := map[string]int{}

	for _, j := range jobs {
		if len(picked) >= *limit {
			break
		}
		title := j.Title

		if aaaStudio.MatchString(j.Company) && !strings.Contains(strings.ToLower(title), "front") {
			dropped["AAA studio (C++)"]++
			continue
		}
		if reason, drop := dropReason(title); drop {
			dropped[reason]++
			continue
		}
		if alwaysFetch.MatchString(title) || j.Score >= *min {
			picked = append(picked, j)
		}
	}

	path := filepath.Join(*out, "shortlist.txt")
	var sb strings.Builder
	for _, j := range picked {
		sb.WriteString(j.URL)
		sb.WriteByte('\n')
	}
	if err := os.WriteFile(path, []byte(sb.String()), 0o644); err != nil {
		return err
	}

	fmt.Printf("proposed %d fetches -> %s\n\n", len(picked), path)
	for i, j := range picked {
		fmt.Printf("%2d. %3d  %s | %s | %s\n", i+1, j.Score, pad(j.Title, 52), pad(j.Company, 24), trunc(j.Loc, 26))
	}
	if len(dropped) > 0 {
		fmt.Println("\ndropped before fetching:")
		for reason, n := range dropped {
			fmt.Printf("  %-24s %d\n", reason, n)
		}
	}
	fmt.Println("\nEdit shortlist.txt before running `jobsweep fetch` — this is a proposal, not a verdict.")
	return nil
}

func dropReason(title string) (string, bool) {
	for _, d := range alwaysDrop {
		if d.re.MatchString(title) {
			return d.reason, true
		}
	}
	return "", false
}
