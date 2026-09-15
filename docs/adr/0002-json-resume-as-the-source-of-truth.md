# The CV is data, in a schema someone else maintains

Status: accepted

The content had to be separable from the layout — the whole point of building
this rather than exporting a PDF from LinkedIn is that the CV gets edited often
and the page gets redesigned occasionally, and neither should require the other.

That argued for a data file. The choice was between inventing a shape and taking
[JSON Resume](https://jsonresume.org) v1.0.0, a published schema with a
validator, an ecosystem of themes and importers, and no owner here. Inventing
one would have bought nothing except the freedom to name fields differently.

The themes, on the other hand, were not taken. They are built to look
respectable applied to anybody's data; this page has to look like slavshik.me.
So: their schema, our renderer.

## Consequences

- `content/resume.json` validates against the published schema, and a unit test
  keeps it that way — which is what makes the "other tools can read this"
  claim true rather than decorative.
- Two extensions to the standard, both under `meta` — which is where the
  schema itself says "any other tooling configuration" belongs. `openToWork`,
  because there is no field for "currently looking"; and `pdfRole`, the role the
  downloadable file is named after, so that what lands in a recruiter's
  downloads folder is `Alexander-Slavschik-Senior-Frontend-CV.pdf` and not a
  second anonymous `CV.pdf`. The schema permits additional properties, so
  neither costs the file its conformance and the unit test still validates it.
- `src/resume.ts` re-states the shape as TypeScript types and checks it at build
  time. The published schema is checked in tests; the build needs its own check
  because a valid-but-empty field would still reach the page.
- Fields the renderer ignores are still valid in the file. That is a feature:
  the LinkedIn history can be kept in full while the page shows a selection.
