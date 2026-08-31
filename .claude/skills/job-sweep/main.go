// Command jobsweep harvests public LinkedIn guest job listings, scores them
// against the CV in content/resume.json, and condenses the results for reading.
//
// The four subcommands are meant to be run in order, with a human or an agent
// choosing the shortlist in the middle — that choice is the point of the skill
// and is deliberately not automated away:
//
//	jobsweep sweep      harvest every query in queries.tsv
//	jobsweep score      dedupe, rank, flag what is new since the last run
//	jobsweep shortlist  propose which postings earn a description fetch
//	jobsweep fetch      pull the full descriptions for that shortlist
//	jobsweep summarize  condense them to stack signals
//	jobsweep publish    write the day's list into content/jobs/ for the site
//
// Page loads go through agent-browser, which must be on PATH. Only LinkedIn's
// public guest endpoints are used; nothing here touches a signed-in session.
package main

import (
	"embed"
	"fmt"
	"os"
	"path/filepath"
)

//go:embed js
var jsFS embed.FS

const usage = `jobsweep - LinkedIn sweep against content/resume.json

Usage:
  jobsweep sweep      [-out DIR] [-days N] [-root DIR]
  jobsweep score      [-out DIR] [-mark-seen] [-new-only] [-root DIR]
  jobsweep shortlist  [-out DIR] [-min N] [-limit N]
  jobsweep fetch      [-out DIR] [-root DIR]
  jobsweep summarize  [-out DIR]
  jobsweep publish    [-out DIR] [-root DIR] [-repo DIR] [-min N]

  -out    run directory, default runs/<today>
  -root   skill directory holding queries.tsv and runs/, default: next to the
          binary if queries.tsv is there, otherwise the working directory
`

func main() {
	if len(os.Args) < 2 {
		fmt.Fprint(os.Stderr, usage)
		os.Exit(2)
	}

	var err error
	switch os.Args[1] {
	case "sweep":
		err = cmdSweep(os.Args[2:])
	case "score":
		err = cmdScore(os.Args[2:])
	case "shortlist":
		err = cmdShortlist(os.Args[2:])
	case "fetch":
		err = cmdFetch(os.Args[2:])
	case "summarize":
		err = cmdSummarize(os.Args[2:])
	case "publish":
		err = cmdPublish(os.Args[2:])
	case "-h", "--help", "help":
		fmt.Print(usage)
		return
	default:
		fmt.Fprintf(os.Stderr, "jobsweep: unknown command %q\n\n%s", os.Args[1], usage)
		os.Exit(2)
	}

	if err != nil {
		fmt.Fprintln(os.Stderr, "jobsweep:", err)
		os.Exit(1)
	}
}

// defaultRoot finds the skill directory. A built binary sits next to
// queries.tsv; `go run .` does not, so fall back to the working directory.
func defaultRoot() string {
	if exe, err := os.Executable(); err == nil {
		d := filepath.Dir(exe)
		if _, err := os.Stat(filepath.Join(d, "queries.tsv")); err == nil {
			return d
		}
	}
	return "."
}
