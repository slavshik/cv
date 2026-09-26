package main

import (
	"testing"
	"time"
)

// Locations as the board wrote them on 2026-09-26.
func TestYCReach(t *testing.T) {
	for loc, want := range map[string]bool{
		"US / ES / DE / GB / PL / IN / CA / Remote (US; ES; DE; GB; PL; IN; CA)": true,
		"GB / Remote (GB)":     true,
		"Europe / Remote (US)": true,
		"Remote":               true,
		"Berlin, BE, DE":       true,
		"San Francisco, CA, US / Remote (DE; New York, NY, US; Toronto, ON, CA)": true,
		"San Francisco, CA, US / Remote (US)":                                    false,
		"US / Remote (US)":                                                       false,
		"IN / Remote (IN)":                                                       false,
		"Sunnyvale, CA, US":                                                      false,
		"Wilmington, DE, US / Remote (US)":                                       false, // Delaware
		"Durham, NC, US / Remote (San Francisco, CA, US; Seattle, WA, US)":       false,
	} {
		if got := ycReach(loc); got != want {
			t.Errorf("ycReach(%q) = %v, want %v", loc, got, want)
		}
	}
}

func TestYCAgo(t *testing.T) {
	day := 24 * time.Hour
	for s, want := range map[string]time.Duration{
		"2 days":        2 * day,
		"about 1 month": 30 * day,
		"8 months":      240 * day,
		"over 1 year":   365 * day,
		"about 2 years": 730 * day,
		"an hour":       time.Hour,
	} {
		if got, ok := ycAgo(s); !ok || got != want {
			t.Errorf("ycAgo(%q) = %v, %v; want %v", s, got, ok, want)
		}
	}
	if _, ok := ycAgo("yesterday-ish"); ok {
		t.Error("ycAgo accepted an unknown phrase")
	}
}
