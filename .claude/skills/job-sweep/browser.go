package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os/exec"
)

// This file is the whole of the agent-browser dependency. Everything else in
// the program works on the JSON that comes back, so swapping the fetcher out
// means rewriting only these three functions.

func browserAvailable() error {
	if _, err := exec.LookPath("agent-browser"); err != nil {
		return errors.New("agent-browser not found on PATH — install with: npm install -g agent-browser && agent-browser install")
	}
	return nil
}

func browserOpen(url string) error {
	cmd := exec.Command("agent-browser", "open", url)
	cmd.Stdout, cmd.Stderr = io.Discard, io.Discard
	return cmd.Run()
}

func browserEval(js string) ([]byte, error) {
	cmd := exec.Command("agent-browser", "eval", js)
	var out bytes.Buffer
	cmd.Stdout, cmd.Stderr = &out, io.Discard
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("agent-browser eval: %w", err)
	}
	return unwrapEval(out.Bytes())
}

func browserClose() {
	cmd := exec.Command("agent-browser", "close", "--all")
	cmd.Stdout, cmd.Stderr = io.Discard, io.Discard
	_ = cmd.Run()
}

// unwrapEval peels the JSON string literal agent-browser wraps an eval result
// in. Our extractors already return a JSON string, so the payload arrives
// double-encoded; a future version returning it raw still works.
func unwrapEval(raw []byte) ([]byte, error) {
	s := bytes.TrimSpace(raw)
	if len(s) == 0 {
		return nil, errors.New("empty eval result")
	}
	var inner string
	if err := json.Unmarshal(s, &inner); err == nil {
		return []byte(inner), nil
	}
	return s, nil
}

// mustJS loads one of the embedded in-browser extractors.
func mustJS(name string) (string, error) {
	b, err := jsFS.ReadFile("js/" + name)
	if err != nil {
		return "", fmt.Errorf("embedded js/%s: %w", name, err)
	}
	return string(b), nil
}
