package main

import (
	"flag"
	"fmt"
	"path/filepath"
	"regexp"
	"strings"
)

// Never dump desc.ndjson raw — thirty descriptions is ~45 kB, and reading it
// whole crowds out the judgement the skill actually asks for. Print only the
// stack terms that matched, the work-model line and the seniority: enough to
// tier a role and to spot the C++/Java/Angular impostors.

var terms = []string{
	"TypeScript", "JavaScript", "React", "MobX", "Redux", "PixiJS", "Pixi", "Phaser",
	"Three.js", "Babylon", "Cocos", "WebGL", "Canvas", "HTML5", "Spine", "GSAP",
	"Node", "NestJS", "Next.js", "WebSocket", "GraphQL", "Storybook", "Jest",
	"Playwright", "i18n", "Docker", "Go", "Python",
	"Vue", "Angular", "Unity", "C++", "C#", "Java",
	"remote", "hybrid", "on site", "onsite", "relocation", "visa",
	"Warsaw", "Poland", "English", "slot", "live casino", "game",
}

// termRE brackets each term with non-alphanumerics rather than \b, because \b
// does the wrong thing either side of "C++", "C#" and "Next.js".
func termRE(t string) *regexp.Regexp {
	return regexp.MustCompile(`(?i)(^|[^0-9A-Za-z])` + regexp.QuoteMeta(t) + `([^0-9A-Za-z]|$)`)
}

var termREs = func() []*regexp.Regexp {
	out := make([]*regexp.Regexp, len(terms))
	for i, t := range terms {
		out[i] = termRE(t)
	}
	return out
}()

var locLine = regexp.MustCompile(`(?i)(work model|hiring location|location)[:\s][^\n]{0,120}`)

func cmdSummarize(args []string) error {
	fs := flag.NewFlagSet("summarize", flag.ExitOnError)
	root := fs.String("root", defaultRoot(), "skill directory")
	out := fs.String("out", "", "run directory (default runs/<today>)")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if *out == "" {
		*out = defaultOut(*root)
	}

	descs, err := readNDJSON[Desc](filepath.Join(*out, "desc.ndjson"))
	if err != nil {
		return err
	}

	for _, d := range descs {
		body := collapse(d.Body)
		if len(body) < 300 {
			fmt.Printf("!! THIN  %s  %s\n", d.Title, d.URL)
			continue
		}

		var hits []string
		for i, re := range termREs {
			if re.MatchString(body) {
				hits = append(hits, terms[i])
			}
		}

		loc := "-"
		if m := locLine.FindString(body); m != "" {
			loc = trunc(m, 130)
		}

		var lvl []string
		for _, c := range d.Criteria {
			c = strings.ReplaceAll(c, "Seniority level ", "")
			c = strings.ReplaceAll(c, "Employment type ", "")
			lvl = append(lvl, collapse(c))
			if len(lvl) == 2 {
				break
			}
		}

		fmt.Printf("### %s | %s\n", d.Title, d.Company)
		fmt.Printf("    %s\n", d.URL)
		fmt.Printf("    STACK: %s\n", strings.Join(hits, ", "))
		fmt.Printf("    LOC:   %s\n", loc)
		fmt.Printf("    LVL:   %s\n", strings.Join(lvl, "; "))
	}
	return nil
}
