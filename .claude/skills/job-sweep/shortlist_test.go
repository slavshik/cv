package main

import "testing"

// Titles from the sweep of 2026-09-27. "Internal" and "International" were
// read as "intern" before the pattern had word boundaries.
func TestDropReasonJunior(t *testing.T) {
	for title, want := range map[string]bool{
		"Product Engineer (Internal tools & apps)":  false,
		"Frontend Engineer, International Payments": false,
		"Frontend Developer Intern":                 true,
		"Software Engineering Internship":           true,
		"Summer Interns 2027":                       true,
		"Junior Frontend Developer":                 true,
		"Graduate Software Engineer":                true,
	} {
		reason, drop := dropReason(title)
		if drop != want {
			t.Errorf("dropReason(%q) = %q, %v; want drop=%v", title, reason, drop, want)
		}
	}
}
