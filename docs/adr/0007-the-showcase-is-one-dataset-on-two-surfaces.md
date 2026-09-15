# The showcase is one dataset on two surfaces

Status: accepted

The CV said where Alexander has worked and never what he built. The games were
named inside the job descriptions — Chain Cube 3D under Diesel Puppet, Color
Galaxy under Gismart — which is the right place for them in a history, and the
wrong place for somebody who wants to look at the work itself.

An earlier attempt at a `Projects` section was removed (`content/TODO.md`) and
the reason still holds: it was four bare titles in a column of dates, and a name
with no link and no sentence says nothing the entry above it had not already
said. What is being added here is not that. It is names with addresses,
descriptions and a stack — and the reason it can exist now is that Alexander is
supplying the links.

## Two surfaces, one array

`projects` in `content/resume.json` is the only place a project is written down.
Two renderers read it:

- **`src/render.ts`** puts a `Showcase` **gallery in the footer of the CV** —
  a grid of cards, each a picture, a name and one mono line saying what the
  thing is and whose. It is deliberately not shaped like the sections above it:
  everything from the header down to Education is a document, one column and no
  pictures, and this is what comes after the document ends. The extra distance
  and the rule across the top say so. A card with no picture keeps an outlined
  box, because a half-filled gallery has to stay a grid.
- **`src/work.ts`** builds the page at **`/cv/work/`**, and it is the only
  surface that shows every entry. It groups them **by employer**: flat, twelve
  rows name their studio twelve times and repeat "Slot game on Cocos Creator 2"
  four times running. Grouped, whatever the whole group agrees on — the kind,
  the role — is written once above the titles it covers, and only what they
  disagree about stays on a row. At Skywind that is the kind, because one of the
  two is a slot and the other is blackjack.

    **No addresses on this page, or on the CV's section.** The name is the link.
    Printing a URL beside a title is what a document does because a document
    cannot be clicked, and it was tried here twice: once per row on the work page,
    where the paths wrapped to three lines of monospace each, and once under every
    title in the CV's section, where twelve of them turned it into a directory and
    cost a fifth page. Exactly one address is printed anywhere, in the PDF, and it
    points at this page.

    Thumbnails are optional per project (`image`, a bare filename resolved against
    the page, so the files live in `public/work/`). The slot is reserved for a
    whole group as soon as one entry has a picture: they will arrive a few at a
    time, and a group with two different name columns is what that looks like
    otherwise. `image` is the one field here that JSON Resume does not define;
    `additionalProperties` is true on projects, so it costs the file nothing.

The alternative was a second content file for the page. It was rejected for the
reason ADR 0002 gives for the CV itself: two files describing the same projects
would disagree within a month, and the disagreement would be invisible because
nothing renders them side by side.

Nothing was added to the JSON Resume schema for this. `url`, `entity`,
`highlights` and `keywords` are all standard fields on `projects`, and
`startDate` became optional in `src/resume.ts` — a personal project that is
still running often has no start worth printing, and one that has been taken
offline still has a name.

## None of it reaches the PDF

`@media print` hides `.showcase .row`. Not one project is printed — the fourth
print/screen split in this repository, after the phone number, the reading marks
and the portrait, and it rests on the same argument as all three: the PDF is the
artefact that gets forwarded and parsed, and it stays a document.

It was built the other way first, and the other way was tried twice. As a
section forced onto its own sheet (`break-before: page`) it spent a page on
white to move somewhere it already was. Left to flow it was fine at four
entries and a directory at twelve — a page and a half of titles, studios and
URLs that nobody types off paper. Alexander's call on 2026-09-15 settled it:
none of them.

**One line survives, and it is not a project.** The `.more` line prints as
"All projects — slavshik.me/cv/work", with the address revealed from a span that
is hidden on screen. Without it a reader holding the PDF has no way to know the
portfolio exists at all; with it, the whole of it is one address away. That is
the entire job the showcase does on paper.

## This page is indexed; /cv/jobs/ is not

ADR 0006 keeps the jobs list out of search on purpose: a list of where somebody
is applying does not belong there, and `noindex` plus a `robots.txt` line is how
it stays out. The showcase is the opposite kind of page. It is the portfolio the
CV points at, it is written for strangers, and it is in `public/sitemap.xml`
with full `og:` tags and no `robots` meta at all.

That difference is one line of markup, and it is the line most easily copied
across when one page is scaffolded from another — so `test/e2e/work.spec.ts`
asserts the absence of the `robots` meta rather than trusting it.

## Consequences

- **The page is outside the CV's weight budget**, like the jobs list.
  `test/size.mjs` matches `index.html` and the `/cv/assets/…` it references, so
  `work/index.html` and `assets/work-*.css` are never counted. That is a
  decision resting on how the budget is measured, which is why it is written
  here — see also ADR 0005, which rests on the same convention.
- **No print stylesheet and no screenshot baseline**, again like the jobs list.
  The CV is a document somebody receives on paper; this is a page somebody
  follows a link to. A baseline would be a picture of today's `projects`.
- **`prose` moved from `src/render.ts` to `src/html.ts`.** The marks are used by
  two renderers now, and a second copy of that regular expression is a second
  place for an escaping bug to live.
- **The CV keeps working with `projects` absent.** The section disappears, the
  link with it, and `/cv/work/` says so. That is the state the repository is in
  until the links land.
