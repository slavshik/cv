# The PDF is rendered in CI, and never committed

Status: accepted

The download button had to give people a real file with a sensible name, not a
browser print dialog whose output depends on the visitor's margins and whether
they remembered to enable background graphics.

The alternatives were committing a PDF (a binary in every diff, stale the moment
anyone edits the data) or generating one from a separate template (a second
document to keep in sync with the first, which is exactly the problem this repo
exists to avoid).

Instead Chromium renders the built page under its own print stylesheet, in the
CI job that already has a browser, and the result is uploaded alongside `dist/`.

## Consequences

- **The PDF cannot drift from the page.** They are the same document; `@media
print` is the only difference, and Cmd+P gives the same thing.
- The build depends on Playwright's Chromium. It already did, for screenshots.
- The PDF is produced in the container job rather than the fast one, because
  that is where a browser exists, and the Pages artefact has to be uploaded from
  wherever the file is made.
- `?aqa=1` is passed when printing, pinning the time-of-day accent to midday.
  Without it the colour of the document would depend on what time the build ran.
- The phone number rides in here: injected into the page for the moment of
  printing, from `CV_PHONE`. It stays out of the public repository and out of
  the served HTML, which is the only reason it is anywhere at all.
