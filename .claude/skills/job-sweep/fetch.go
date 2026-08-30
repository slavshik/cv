package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

func cmdFetch(args []string) error {
	fs := flag.NewFlagSet("fetch", flag.ExitOnError)
	root := fs.String("root", defaultRoot(), "skill directory")
	out := fs.String("out", "", "run directory (default runs/<today>)")
	if err := fs.Parse(args); err != nil {
		return err
	}
	if *out == "" {
		*out = defaultOut(*root)
	}
	if err := browserAvailable(); err != nil {
		return err
	}

	urls, err := readLines(filepath.Join(*out, "shortlist.txt"))
	if err != nil {
		return err
	}
	descJS, err := mustJS("desc.js")
	if err != nil {
		return err
	}

	f, err := os.Create(filepath.Join(*out, "desc.ndjson"))
	if err != nil {
		return err
	}
	defer f.Close()
	w := bufio.NewWriter(f)
	defer w.Flush()
	enc := json.NewEncoder(w)

	for i, u := range urls {
		if err := browserOpen(u); err != nil {
			progressf("  [%d/%d] open failed: %s", i+1, len(urls), u)
			continue
		}
		payload, err := browserEval(descJS)
		if err != nil {
			progressf("  [%d/%d] eval failed: %s", i+1, len(urls), u)
			continue
		}
		var d Desc
		if err := json.Unmarshal(payload, &d); err != nil {
			progressf("  [%d/%d] unparseable: %s", i+1, len(urls), u)
			continue
		}
		d.URL = u
		if err := enc.Encode(d); err != nil {
			return err
		}
		w.Flush()
		progressf("  [%d/%d] %s", i+1, len(urls), u)
		time.Sleep(2 * time.Second)
	}

	progressf("DESC DONE %d -> %s", len(urls), filepath.Join(*out, "desc.ndjson"))
	return nil
}

func readLines(path string) ([]string, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var out []string
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		s := strings.TrimSpace(sc.Text())
		if s != "" && !strings.HasPrefix(s, "#") {
			out = append(out, s)
		}
	}
	return out, sc.Err()
}

func unmarshalJSON(b []byte, v any) error { return json.Unmarshal(b, v) }

var wsRun = regexp.MustCompile(`\s+`)

func collapse(s string) string { return strings.TrimSpace(wsRun.ReplaceAllString(s, " ")) }
