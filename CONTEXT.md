# cv

A CV at slavshik.me/cv. One document, and the same document as a PDF. It is a
sibling of slavshik.me and speaks the same visual language; the two must never
read as two different sites.

The page is a document, not an application. It has no state worth keeping, no
data to fetch and one interactive control. Anything that would make it behave
like software is out of place here.

## Language

**Resume**:
The data. `content/resume.json`, in the JSON Resume schema. The only place
content lives — the page, the PDF and the JSON-LD are all derived from it.
_Avoid_: content, data file, profile

**Entry**:
One thing on the CV that has dates: a job, a school, a project, a certificate.
_Avoid_: item, record, block

**Gutter**:
The narrow left column that carries an Entry's dates, or a label. Every section
uses the same one, which is what holds a long document together.
_Avoid_: sidebar, aside, left column

**Earlier**:
The roles that started before `DETAILED_SINCE` in `src/render.ts`, listed one
line each with no description. Eighteen years of history is worth showing;
eighteen years of descriptions is not.
_Avoid_: older jobs, archive, history

**Mark**:
One of the three levels of emphasis laid over the prose: what was done and
owned, the technical substance, the size of it. A reading aid for the screen —
Marks never appear in print.
_Avoid_: highlight, emphasis, formatting

**Accent**:
The single colour that varies with the visitor's local clock through four
phases: dawn, day, sunset, night. Taken from slavshik.me unchanged.
_Avoid_: highlight, brand colour, primary colour

**Accent text**:
The Accent lifted far enough to be legible on a dark ground. The Accent labels
things here rather than just ruling them off, which it never did on
slavshik.me, so it needs a readable variant that the original never had.
_Avoid_: light accent, accent 2

**Theme**:
Light or dark. Follows the visitor's system preference unless overridden by the
button. Print is neither: it is always ink on white.
_Avoid_: colour scheme, mode

**Print sheet**:
The page under `@media print` — A4, ink on white. It is not a second document:
the PDF is this, rendered by Chromium, which is why the two cannot drift.
_Avoid_: pdf styles, print version

**Phone**:
The one piece of contact detail that exists in the PDF and nowhere else.
Injected at print time from `CV_PHONE`; never in `content/resume.json`, never
in the served HTML.
_Avoid_: contact number, secret
