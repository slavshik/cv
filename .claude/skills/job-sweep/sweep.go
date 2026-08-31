package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// query is one line of queries.tsv.
type query struct {
	Keywords string
	Location string
	Extra    string // raw extra params, e.g. "&f_WT=2" for remote-only
}

// LinkedIn's guest pagination returns 10 cards a page but accepts any start
// offset; three pages is the point where extra requests stop finding anything
// the earlier queries did not already surface.
var startOffsets = []int{0, 25, 50}

func cmdSweep(args []string) error {
	fs := flag.NewFlagSet("sweep", flag.ExitOnError)
	root := fs.String("root", defaultRoot(), "skill directory")
	out := fs.String("out", "", "run directory (default runs/<today>)")
	days := fs.Int("days", 30, "posting age window in days")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if *out == "" {
		*out = defaultOut(*root)
	}
	if err := browserAvailable(); err != nil {
		return err
	}

	queries, err := readQueries(filepath.Join(*root, "queries.tsv"))
	if err != nil {
		return err
	}
	if len(queries) == 0 {
		return fmt.Errorf("no queries in %s", filepath.Join(*root, "queries.tsv"))
	}

	extract, err := mustJS("extract.js")
	if err != nil {
		return err
	}
	if err := os.MkdirAll(*out, 0o755); err != nil {
		return err
	}

	raw := filepath.Join(*out, "raw.ndjson")
	f, err := os.Create(raw)
	if err != nil {
		return err
	}
	defer f.Close()
	w := bufio.NewWriter(f)
	defer w.Flush()
	enc := json.NewEncoder(w)

	window := *days * 86400
	rows := 0

	for _, q := range queries {
		for _, start := range startOffsets {
			u := guestSearchURL(q, start, window)

			if err := browserOpen(u); err != nil {
				progressf("  [%s | %s | start=%d] open failed: %v", q.Keywords, q.Location, start, err)
				continue
			}
			payload, err := browserEval(extract)
			if err != nil {
				progressf("  [%s | %s | start=%d] eval failed: %v", q.Keywords, q.Location, start, err)
				continue
			}

			var jobs []Job
			if err := json.Unmarshal(payload, &jobs); err != nil {
				progressf("  [%s | %s | start=%d] unparseable result: %v", q.Keywords, q.Location, start, err)
				continue
			}
			for _, j := range jobs {
				if j.URL == "" {
					continue
				}
				j.Q, j.QLoc = q.Keywords, q.Location
				if err := enc.Encode(j); err != nil {
					return err
				}
				rows++
			}
			w.Flush()
			progressf("  [%s | %s | start=%d] rows=%d", q.Keywords, q.Location, start, rows)

			// LinkedIn rate-limits the guest endpoints; this pace has run
			// clean and there is no reason to push it.
			time.Sleep(2 * time.Second)
		}
	}

	progressf("SWEEP DONE %d rows -> %s", rows, raw)
	return nil
}

func guestSearchURL(q query, start, window int) string {
	v := url.Values{}
	v.Set("keywords", q.Keywords)
	v.Set("location", q.Location)
	v.Set("start", fmt.Sprint(start))
	v.Set("f_TPR", fmt.Sprintf("r%d", window))
	return "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?" + v.Encode() + q.Extra
}

func readQueries(path string) ([]query, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var out []query
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := strings.TrimRight(sc.Text(), " \t")
		if line == "" || strings.HasPrefix(strings.TrimSpace(line), "#") {
			continue
		}
		parts := strings.Split(line, "\t")
		q := query{Keywords: strings.TrimSpace(parts[0])}
		if len(parts) > 1 {
			q.Location = strings.TrimSpace(parts[1])
		}
		if len(parts) > 2 {
			q.Extra = strings.TrimSpace(parts[2])
		}
		if q.Keywords != "" {
			out = append(out, q)
		}
	}
	return out, sc.Err()
}
