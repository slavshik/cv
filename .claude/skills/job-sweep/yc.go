package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// The Y Combinator job board, ycombinator.com/jobs. Unlike LinkedIn it needs no
// browser: every page is server-rendered with its whole Inertia payload in a
// data-page attribute, so a plain GET and one json.Unmarshal is the scraper.
// robots.txt allows /jobs and /companies/*/jobs, and nothing here logs in.
//
// What the board is, measured on 2026-09-26, because it decides how this reads
// it:
//
//   - A listing is one page of ~40 rows. `?page=` is ignored, so there is no
//     pagination to walk: coverage comes from reading several slices.
//   - /jobs/role/<role>/<place> filters only for the places YC knows. An
//     unknown slug — warsaw, poland, barcelona — quietly answers with the
//     unfiltered list instead, a different random sample on every load, so
//     readYCSlice refuses it rather than harvest noise.
//   - Most rows are US-only. ycReach is what keeps them off the shortlist.
//   - Dates are relative ("8 months", "over 1 year"). ycAgo turns them into a
//     day with the precision of the phrase, no better.

const ycBase = "https://www.ycombinator.com"

// ycSlice is one line of yc.tsv: a role slug and a place slug.
type ycSlice struct {
	Role  string
	Place string
}

func (s ycSlice) path() string {
	p := "/jobs/role/" + s.Role
	if s.Place != "" {
		p += "/" + s.Place
	}
	return p
}

// ycPosting is a row of a listing page, and — with Description filled — the
// `job` prop of a posting page. Only the fields jobsweep uses.
type ycPosting struct {
	Title        string `json:"title"`
	URL          string `json:"url"`
	Location     string `json:"location"`
	Type         string `json:"type"`
	Role         string `json:"roleSpecificType"`
	Salary       string `json:"salaryRange"`
	Equity       string `json:"equityRange"`
	Experience   string `json:"minExperience"`
	Visa         string `json:"visa"`
	CompanyName  string `json:"companyName"`
	Batch        string `json:"companyBatchName"`
	OneLiner     string `json:"companyOneLiner"`
	CreatedAt    string `json:"createdAt"`
	LastActive   string `json:"lastActive"`
	Description  string `json:"description"`
	IsIncomplete bool   `json:"isIncomplete"`
}

type ycListing struct {
	Location *struct {
		Slug string `json:"slug"`
	} `json:"location"`
	JobPostings []ycPosting `json:"jobPostings"`
}

var ycClient = &http.Client{Timeout: 30 * time.Second}

// ycPage GETs a page and decodes the props of its Inertia payload into v.
func ycPage(path string, v any) error {
	req, err := http.NewRequest("GET", ycBase+path, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; jobsweep; +https://slavshik.me/cv)")
	res, err := ycClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("GET %s: %s", path, res.Status)
	}
	b, err := io.ReadAll(io.LimitReader(res.Body, 8<<20))
	if err != nil {
		return err
	}
	return decodeYCPage(b, v)
}

var dataPage = regexp.MustCompile(`data-page="([^"]*)"`)

func decodeYCPage(page []byte, v any) error {
	m := dataPage.FindSubmatch(page)
	if m == nil {
		return errors.New("no data-page payload — has the board changed its markup?")
	}
	var envelope struct {
		Props json.RawMessage `json:"props"`
	}
	if err := json.Unmarshal([]byte(html.UnescapeString(string(m[1]))), &envelope); err != nil {
		return err
	}
	return json.Unmarshal(envelope.Props, v)
}

// readYCSlice returns the postings of one listing, as Jobs, dropping those
// whose company has not touched the board within `days` — YC postings stay up
// for a year and more, and lastActive is the board's own word on which of them
// somebody is still reading applications for.
func readYCSlice(s ycSlice, days int, now time.Time) ([]Job, error) {
	var l ycListing
	if err := ycPage(s.path(), &l); err != nil {
		return nil, err
	}
	if s.Place != "" && (l.Location == nil || l.Location.Slug != s.Place) {
		return nil, fmt.Errorf("YC does not filter by %q, it would answer with a random sample — drop it from yc.tsv", s.Place)
	}

	var out []Job
	for _, p := range l.JobPostings {
		if p.URL == "" || p.IsIncomplete {
			continue
		}
		if ago, ok := ycAgo(p.LastActive); ok && ago > time.Duration(days)*24*time.Hour {
			continue
		}
		out = append(out, ycJob(p, now))
	}
	return out, nil
}

func ycJob(p ycPosting, now time.Time) Job {
	j := Job{
		Title:   p.Title,
		Company: p.CompanyName,
		Loc:     p.Location,
		URL:     ycBase + p.URL,
		Role:    p.Role,
		About:   p.OneLiner,
	}
	if p.Batch != "" {
		j.Company += " (YC " + p.Batch + ")"
	}
	if ago, ok := ycAgo(p.CreatedAt); ok {
		j.Date = now.Add(-ago).Format("2006-01-02")
	}
	return j
}

// fetchYCDesc reads one posting page. The criteria are the facts a LinkedIn
// posting buries in its body and YC states as fields — which is most of what
// the tiering needs to know before reading a word of the description.
func fetchYCDesc(url string) (Desc, error) {
	path := strings.TrimPrefix(url, ycBase)
	var page struct {
		Job ycPosting `json:"job"`
	}
	if err := ycPage(path, &page); err != nil {
		return Desc{}, err
	}
	p := page.Job
	var crit []string
	for _, c := range []struct{ k, v string }{
		{"Location", p.Location},
		{"Employment type", p.Type},
		{"Role", p.Role},
		{"Experience", p.Experience},
		{"Salary", p.Salary},
		{"Equity", p.Equity},
		{"Visa", p.Visa},
		{"Posted", p.CreatedAt + " ago"},
		{"Last active", p.LastActive + " ago"},
	} {
		if strings.TrimSpace(c.v) != "" && c.v != " ago" {
			crit = append(crit, c.k+" "+c.v)
		}
	}
	company := p.CompanyName
	if p.Batch != "" {
		company += " (YC " + p.Batch + ")"
	}
	return Desc{
		Title:    p.Title,
		Company:  company,
		Criteria: crit,
		Body:     trunc(collapse(p.Description), 4000),
		URL:      url,
	}, nil
}

func isYC(url string) bool { return strings.HasPrefix(url, ycBase+"/") }

var agoRE = regexp.MustCompile(`(?i)^(?:about|over|almost|less than)?\s*(\d+|an?)\s+(minute|hour|day|month|year)s?$`)

// ycAgo parses the board's relative ages. "over 1 year" and "about 1 year" both
// come out as a year: the phrase does not say more, so neither does the date.
func ycAgo(s string) (time.Duration, bool) {
	m := agoRE.FindStringSubmatch(strings.TrimSpace(s))
	if m == nil {
		return 0, false
	}
	n := 1
	if v, err := strconv.Atoi(m[1]); err == nil {
		n = v
	}
	day := 24 * time.Hour
	unit := map[string]time.Duration{
		"minute": time.Minute, "hour": time.Hour, "day": day, "month": 30 * day, "year": 365 * day,
	}[strings.ToLower(m[2])]
	return time.Duration(n) * unit, true
}

// Where a candidate in Warsaw can take the job from. A YC location reads
// "City, ST, US / DE / PL / Remote (US; DE; PL)": sites first, then the
// countries remote hires may sit in. Open to Poland means worldwide remote,
// remote that lists Poland or Europe, or a site in Europe — relocating inside
// the EU is on the table, the skill already offers Berlin and Barcelona.
// Everything else is somebody else's market, however good the title.
//
// A place is judged by its last comma-separated part, the country: in
// "Wilmington, DE, US" the DE is Delaware, and only the US counts.
var (
	ycRemoteList = regexp.MustCompile(`Remote \(([^)]*)\)`)
	ycEurope     = regexp.MustCompile(`^(PL|DE|NL|FR|ES|PT|IT|IE|BE|AT|CH|SE|DK|NO|FI|CZ|SK|HU|RO|BG|GR|HR|SI|EE|LV|LT|LU|MT|CY|GB|UK|EU|(?i:europe|emea))$`)
)

func ycReach(loc string) bool {
	if m := ycRemoteList.FindStringSubmatch(loc); m != nil {
		if anyInEurope(strings.Split(m[1], ";")) {
			return true
		}
		loc = strings.Replace(loc, m[0], "", 1) // remote elsewhere; the sites may still qualify
	} else if strings.Contains(loc, "Remote") {
		return true
	}
	return anyInEurope(strings.Split(loc, "/"))
}

func anyInEurope(places []string) bool {
	for _, p := range places {
		parts := strings.Split(p, ",")
		if ycEurope.MatchString(strings.TrimSpace(parts[len(parts)-1])) {
			return true
		}
	}
	return false
}
