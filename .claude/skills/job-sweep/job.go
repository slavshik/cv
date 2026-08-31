package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
	"unicode/utf8"
)

// Job is one LinkedIn posting. The lowercase JSON names match what the
// in-browser extractors in js/ produce, so a scraped row unmarshals directly.
type Job struct {
	Title   string `json:"title"`
	Company string `json:"company"`
	Loc     string `json:"loc"`
	Date    string `json:"date"`
	URL     string `json:"url"`

	// Provenance: which query surfaced this row.
	Q    string `json:"q,omitempty"`
	QLoc string `json:"qloc,omitempty"`

	// Filled in by score.
	Queries   []string `json:"queries,omitempty"`
	Score     int      `json:"score"`
	Why       []string `json:"why,omitempty"`
	New       bool     `json:"new"`
	FirstSeen string   `json:"first_seen,omitempty"`
}

// Desc is a fetched job description.
type Desc struct {
	Title    string   `json:"title"`
	Company  string   `json:"company"`
	Criteria []string `json:"criteria"`
	Body     string   `json:"body"`
	URL      string   `json:"url"`
}

func today() string { return time.Now().Format("2006-01-02") }

func defaultOut(root string) string {
	return filepath.Join(root, "runs", today())
}

// readNDJSON decodes a newline-delimited JSON file into a slice.
func readNDJSON[T any](path string) ([]T, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var out []T
	sc := bufio.NewScanner(f)
	sc.Buffer(make([]byte, 0, 64*1024), 8*1024*1024)
	for sc.Scan() {
		line := sc.Bytes()
		if len(line) == 0 {
			continue
		}
		var v T
		if err := json.Unmarshal(line, &v); err != nil {
			continue // a malformed row should not sink the whole run
		}
		out = append(out, v)
	}
	return out, sc.Err()
}

func writeJSON(path string, v any) error {
	b, err := json.MarshalIndent(v, "", " ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, append(b, '\n'), 0o644)
}

// trunc shortens to n runes, never splitting a multi-byte character —
// "Cracow, Małopolskie" must not come out as mojibake in the ranked table.
func trunc(s string, n int) string {
	if utf8.RuneCountInString(s) <= n {
		return s
	}
	r := []rune(s)
	return string(r[:n])
}

// pad right-pads to n display columns after truncating to n runes.
func pad(s string, n int) string {
	s = trunc(s, n)
	return s + spaces(n-utf8.RuneCountInString(s))
}

func spaces(n int) string {
	if n <= 0 {
		return ""
	}
	b := make([]byte, n)
	for i := range b {
		b[i] = ' '
	}
	return string(b)
}

func progressf(format string, a ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", a...)
}
