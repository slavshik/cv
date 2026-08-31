# AGENTS.md

`CLAUDE.md` is a symlink to this file — one set of instructions, two names.

## The repo

My CV at **slavshik.me/cv**. Vite, TypeScript, published to GitHub Pages from a
GitHub Actions workflow. The repository contains only source: `dist/` and the
PDF are never committed.

- `content/resume.json` — the CV itself, in the JSON Resume v1.0.0 schema. The
  single source of content. `content/TODO.md` says what is still missing from
  it and why.
- `src/resume.ts` — the schema as types, plus `parseResume`, a narrow check
  that fails the build loudly rather than printing `undefined` onto a CV.
- `src/render.ts` — `resume.json` → HTML. A pure function: no DOM, no clock, no
  I/O. It runs inside `vite.config.ts` at build time.
- `src/main.ts` — the only script the CV loads: the time-of-day accent and
  the theme button. Nothing else.
- `content/jobs/<date>.json`, `src/jobs.ts`, `src/jobs.css`, `jobs/index.html`
  — the second page, at **slavshik.me/cv/jobs**. One file per sweep, written by
  `jobsweep publish`; the renderer is pure the same way `render.ts` is. Read
  `docs/adr/0006` before touching it, and note what the page must never carry.
- `src/styles.css` — the whole design of the CV, screen and print.
  `src/tokens.css` is the palette, the type stacks and the reset, shared with
  the jobs page; neither page may fork it.
- `index.html` — markup and metadata, and nothing else. `<!--resume-->` and
  `<!--jsonld-->` are where the build injects.
- `scripts/pdf.mjs` — renders the built page to `dist/<Name>-CV.pdf`.
- `docs/adr/` — why this repo looks the way it does. Read before changing the
  build, the deployment or where content lives.

## Working here

- **`npm ci`, then `make dev`** → http://localhost:5173/cv/. `make help` lists
  everything else. Editing `content/resume.json` reloads the page.
- **English.** README, code comments and commit messages are all English here,
  unlike the neighbouring `slavshik.github.io`, which is Russian. That is on
  purpose — do not "restore consistency".
- **Content changes are data changes.** Anything that appears on the page comes
  from `content/resume.json`. If something cannot be expressed there, the fix is
  a field, not a hardcoded string in the renderer.
- **Never invent CV content.** The data came from a LinkedIn export that is
  lossy in places. Where a sentence was cut off, the fragment was dropped and
  logged in `content/TODO.md`. Leave gaps as gaps.
- **The phone number is not in this repository.** It goes into the PDF at print
  time from `CV_PHONE` — a repository secret in CI, `.env.local` here. It must
  never reach `content/resume.json` or the served HTML; there is an e2e test
  that says so.
- **The jobs page is public, and is written as if it were.** The repository is
  public, so `/cv/jobs/` and every `content/jobs/*.json` are readable by
  anybody who has the URL — `noindex` and `robots.txt` are obscurity, not
  privacy. Rows are titles, companies, locations and links to public postings.
  Fetched description bodies are somebody else's text and never leave the
  gitignored `runs/`. The CV's rules do not apply there: it has no print
  stylesheet, no screenshot baseline and no weight budget.
- **The sweep is run by hand.** `make jobs` sweeps, publishes the day's file
  and commits it; you push when you want it on the page, and CI builds the site
  as it always did. There is no schedule. Scheduling it under launchd was tried
  and abandoned — macOS refuses a LaunchAgent access to `~/Documents`, and the
  grant is per binary rather than per process tree, so allowing `/bin/sh` still
  left `go` refused. `docs/adr/0006` has the measurements.
- **`make check` before calling anything done** (types, lint, format), plus
  `make unit`. Run `make test` when a change could move a pixel or the byte
  count.
- **Screenshot baselines are exact.** Tolerance is zero pixels and they only run
  inside the pinned Playwright container (`make e2e`) — macOS and CI Linux
  render type differently. A diff is a real change; look at it before reaching
  for `make e2e-update`.
- **Prettier does not touch HTML** (`.prettierignore`). The markup is aligned by
  hand and its comments sit next to what they explain.
- **The marks are a small syntax, not markdown.** `**action**`, `__architecture__`
  and `==scale==` in the prose of `content/resume.json` become `<strong>`,
  `<span class="term">` and `<mark>`. Only prose is parsed — summaries,
  highlights, project descriptions — and escaping happens first. They are
  stripped in print on purpose: the PDF must stay a plain document. Keep roughly
  a sixth of an entry marked; past that they stop meaning anything. See
  `docs/adr/0004`.
- **Writing or revising the prose is its own job.** What may be claimed, how a
  line is phrased, what to cut, and which prose the renderer throws away are in
  the `cv-prose` skill (`.claude/skills/cv-prose/SKILL.md`). Read it before
  touching `content/resume.json`, and before acting on anybody's suggestions
  about the wording.
- **Keep the page free of JavaScript.** The CV must be entirely readable with
  scripting off — an e2e test enforces it. `src/main.ts` may grow only for
  things that are genuinely decoration.
- **`make size`** holds the whole page under 12 kB gzip. It is a text document;
  there is no reason for it to grow.

## Print is not a second document

`@media print` in `src/styles.css` is what `scripts/pdf.mjs` renders, so the
downloadable PDF and Cmd+P agree by construction. Two things there are load
bearing and look wrong out of context:

- the Gutter becomes a **float** in print. Chromium will not fragment a grid
  container across pages, so a long entry would be pushed whole to the next
  sheet and leave a quarter of a page white;
- only `h3` carries `break-after: avoid`. Chaining it onto the company and
  date lines as well makes Chromium treat the run as one unbreakable lump,
  with the same result.
