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
- `content/resume.json` also carries `projects` — the showcase. It renders
  twice, **on screen both times**: as a gallery of thumbnail cards in the CV's
  footer, and in full at
  **slavshik.me/cv/work**, from `src/work.ts`, `src/work.css` and
  `work/index.html`. Not one project reaches the PDF — print hides the rows and
  keeps a single line pointing at the work page. One array, two surfaces; read
  `docs/adr/0007` before touching either, and note that this page is indexed
  where the jobs page is deliberately not.
- `src/styles.css` — the whole design of the CV, screen and print.
  `src/tokens.css` is the palette, the type stacks and the reset, shared with
  all three pages; none of them may fork it.
- `index.html` — markup and metadata, and nothing else. `<!--resume-->` and
  `<!--jsonld-->` are where the build injects.
- `scripts/pdf.mjs` — renders the built page to `dist/`, under the name the
  page itself asks for in the `download` attribute of its own link. That name
  is built by `pdfFileName` from `basics.name` and `meta.pdfRole`.
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
- **Two faces, one per surface.** The screen is set in a humanist sans and the
  PDF in Charter; `--body` is the token, and the print block in
  `src/styles.css` is the only place it is overridden. Both stacks end in faces
  the pinned Playwright image already ships — Bitstream Charter, Liberation Sans,
  Liberation Mono — so the build installs no fonts. Palatino and the
  `fonts-texgyre` apt step were removed on 2026-09-15; do not put either back
  without checking `fc-list` in the container first.
- **The PDF has four things the screen has and it does not**: the reading
  marks, the portrait, the showcase, and — the other way round — the phone
  number, which exists only there. All four are one rule each in `@media print`
  and all four are load bearing. The showcase is the newest: twelve titles and
  their studios is a directory, not a document, and it cost a sheet and a half.
  **The last page of the PDF is settled** — if a change to the showcase moves
  it, the change is wrong. `.showcase` keeps exactly `section`'s margin in
  print for that reason, and `make pdf-ci` is how you check.
- **The first page of the PDF is a budget.** Header, summary and Skills have
  to fit on it, with the history started under them. That is what the section
  order in `renderResume` and the `.facts` rules in the print stylesheet are
  for — both look like fussiness until you render the PDF and count.
  `make pdf-ci`.
- **To test the download button, render the PDF first.** It is a build artefact,
  so `make dev` alone has nothing to serve: `make pdf` once and the dev server
  hands over the real file, or `make preview` for exactly what goes to Pages.
  Asking for it before either answers 404 in words rather than 200 with the
  page, which is what it used to do — and an HTML file saved under a `.pdf`
  name looks like a corrupt PDF, not like a mistake.
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
  things that are genuinely decoration, and for the one thing below.
- **The visit counter is the exception, and it is mine.** `src/hit.ts` sends a
  single same-origin request to `/api/hit` — the Worker that already serves
  slavshik.me, on the same zone, so there is no third party, no cookie and no
  identity that survives midnight. It is silent anywhere but the live host, on
  `?aqa=1`, and for a visitor sending Do-Not-Track or Global Privacy Control,
  which is why neither the screenshots nor the PDF ever count as a reader.
  `/cv/jobs/` is deliberately not counted: that page carries no module script
  at all and is not for anybody but me. The rows are read with `make stats` in
  the `slavshik.github.io` repository, where the Worker and its D1 live.
- **`make size`** holds the whole page under 12 kB gzip. It is a text document;
  there is no reason for it to grow.

## Print is not a second document

`@media print` in `src/styles.css` is what `scripts/pdf.mjs` renders, so the
downloadable PDF and Cmd+P agree by construction. Three things there are load
bearing and look wrong out of context:

- **a dated row is a block with the date floated right, on both surfaces.** It
  reads as a layout choice and it is also what makes the entry paginate:
  Chromium will not fragment a grid container across pages, so while these rows
  were grids a long entry was pushed whole to the next sheet and left a quarter
  of a page white. Print used to undo the grid by hand for exactly this reason;
  it does not have to any more, and the rule that did it is gone. Turn these
  rows back into grids and the white pages come back.
- only `h3` carries `break-after: avoid`. Chaining it onto the company and
  date lines as well makes Chromium treat the run as one unbreakable lump,
  with the same result.
- `.facts` rows **stay** grids, in print as on screen. They are one line each
  and carry `break-inside: avoid`, so there is nothing for them to fragment.
