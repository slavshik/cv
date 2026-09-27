package main

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestJudgeDesc(t *testing.T) {
	var got map[string]any
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer k" {
			t.Errorf("Authorization = %q", r.Header.Get("Authorization"))
		}
		b, _ := io.ReadAll(r.Body)
		if err := json.Unmarshal(b, &got); err != nil {
			t.Fatal(err)
		}
		io.WriteString(w, `{"model":"jev-1.13.0","answers":{
			"tier":{"type":"choice","choice":"game_client","confidence":0.9,"probabilities":{"game_client":0.93,"other":0.07}},
			"overlap":{"type":"score","score":2.4,"confidence":0.7},
			"contract":{"type":"noul","noul":0.12}}}`)
	}))
	defer srv.Close()
	defer func(old string) { tsEndpoint = old }(tsEndpoint)
	tsEndpoint = srv.URL

	d := Desc{Title: "Senior Game Client Developer", Company: "Studio", Criteria: []string{"Seniority level Mid-Senior"},
		Body: "We build slots in  PixiJS.", URL: "https://example.com/1"}
	j, err := judgeDesc("k", d, "Warsaw, Mazowieckie, Poland")
	if err != nil {
		t.Fatal(err)
	}

	posting := got["state"].(map[string]any)["posting"].(map[string]any)
	if posting["listed_location"] != "Warsaw, Mazowieckie, Poland" || posting["description"] != "We build slots in PixiJS." {
		t.Errorf("state.posting = %v", posting)
	}
	if qs := got["questions"].(map[string]any); len(qs) != len(judgeQuestions) {
		t.Errorf("sent %d questions, want %d", len(qs), len(judgeQuestions))
	}
	if c, p := j.choice("tier"); c != "game_client" || p != 0.93 {
		t.Errorf("tier = %s %v", c, p)
	}
	if j.score("overlap") != 2.4 || j.noul("contract") != 0.12 || j.noul("relocation") != 0 {
		t.Errorf("answers = %+v", j.Answers)
	}
}

func TestSortJudged(t *testing.T) {
	mk := func(tier string, overlap float64) Judged {
		return Judged{Title: tier, Answers: map[string]tsAnswer{
			"tier":    {Type: "choice", Choice: tier},
			"overlap": {Type: "score", Score: &overlap},
		}}
	}
	js := []Judged{mk("other", 3), mk("product_frontend", 1), mk("game_client", 0.5), mk("product_frontend", 2.5)}
	sortJudged(js)
	want := []string{"game_client", "product_frontend", "product_frontend", "other"}
	for i, j := range js {
		if j.Title != want[i] {
			t.Fatalf("order = %v", js)
		}
	}
	if js[1].score("overlap") != 2.5 {
		t.Errorf("within a tier, higher overlap should come first")
	}
}
