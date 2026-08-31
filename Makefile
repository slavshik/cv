# Short names for things otherwise remembered by heart: server, checks,
# baselines, the PDF. Ordinary npm scripts live underneath — the Makefile does
# not replace them, it lists what can be done in this repository at all.
#
# Needs node 22 (see .nvmrc) and `npm ci`. The screenshot tests run inside the
# official Playwright container, so they need docker too: macOS here and Linux
# in CI render type differently, and a baseline only means something where it
# was taken.

PORT   ?= 5173
URL    := http://localhost:$(PORT)/cv/

PW_IMAGE := mcr.microsoft.com/playwright:v1.62.1-noble
DOCKER   := docker run --rm -v "$(CURDIR)":/repo -v /repo/node_modules -w /repo

# The container ships no Palatino-class serif and no plain mono, so Chromium
# would fall back to Liberation Serif and a CJK mono — see the comment on
# --serif in src/styles.css. CI installs the same package before doing the
# same work; if these two ever disagree, the baselines are meaningless.
FONTS := apt-get update -qq && apt-get install -y -qq fonts-texgyre

.DEFAULT_GOAL := help
.PHONY: help install dev preview build pdf pdf-ci check test unit e2e e2e-update size format lint jobs

help: ## Show this list
	@grep -hE '^[a-z-]+:.*?## ' $(MAKEFILE_LIST) \
	  | awk -F':.*?## ' '{ printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2 }'
	@echo ""
	@echo "  PORT=$(PORT) — dev server port, override with: make dev PORT=9000"

## ─── working ─────────────────────────────────────────────────────────────

install: ## Install dependencies exactly as locked
	npm ci

dev: ## Dev server with hot reload; editing content/resume.json reloads the page
	@echo "$(URL) — Ctrl-C to stop"
	@npx vite --port $(PORT) --strictPort

build: ## Build the site into dist/
	npm run build

pdf: build ## Build the site and render the downloadable PDF into dist/
	npm run pdf

preview: pdf ## Serve exactly what goes to Pages, PDF included
	@npx vite preview --port $(PORT) --strictPort

jobs: ## Sweep LinkedIn and commit today's list into content/jobs/ (~7 min)
	scripts/sweep.sh

## ─── checks ──────────────────────────────────────────────────────────────

check: ## Types, linter, formatting — fast, no browser
	npm run typecheck
	npm run lint
	npm run format:check

unit: ## Unit tests over the data and the renderer
	npm run test:unit

e2e: ## Screenshot tests in the pinned container
	$(DOCKER) $(PW_IMAGE) sh -c "$(FONTS) && npm ci && npx vite build && npx playwright test"

e2e-update: ## Retake the screenshot baselines in that same container
	$(DOCKER) $(PW_IMAGE) sh -c "$(FONTS) && npm ci && npx vite build && npx playwright test --update-snapshots"

pdf-ci: ## Render the PDF the way CI does, to see the fonts it will actually use
	$(DOCKER) $(PW_IMAGE) sh -c "$(FONTS) && npm ci && npx vite build && node scripts/pdf.mjs"

size: build ## Check the weight budget
	node test/size.mjs

test: check unit e2e size ## Everything

## ─── housekeeping ────────────────────────────────────────────────────────

format: ## Reformat everything prettier owns
	npm run format

lint: ## Linter only
	npm run lint
