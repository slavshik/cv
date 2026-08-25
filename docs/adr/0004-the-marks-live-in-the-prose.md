# The reading marks live in the prose, not beside it

Status: accepted

The CV carries three levels of emphasis, in the spirit of progressive
summarisation from _Building a Second Brain_: what was done and owned, the
technical substance, and the size of it. They exist so the page can be skimmed
in ten seconds or read in three minutes, and they are for the screen only —
a printed CV covered in highlighter is a study copy, not a document you send.

The question was where the annotation lives. The alternative considered was a
parallel list of phrases per entry — `emphasis: ["436 releases", …]` — matched
against the text at build time. That keeps `content/resume.json` prose clean and
portable, and a build-time check could catch a phrase that no longer matches.
It also means editing one sentence in two places, and choosing what to mark is
an act of writing, done while looking at the sentence.

So the marks are inline, in a three-character syntax the renderer parses:
`**action**`, `__architecture__`, `==scale==`.

## Consequences

- **The prose in `content/resume.json` is no longer plain.** Another JSON Resume
  tool reading this file will show the markers as literal characters. The file
  still validates, and the schema does not claim the strings are plain text, but
  this is a real cost of the choice and the reason to keep the syntax small.
- Escaping runs before the markers are parsed, so nothing in the data file can
  open an HTML tag. There is a unit test for exactly that.
- Only prose is parsed — summaries, highlights, project descriptions. Headings,
  companies, dates and skill lists are escaped and nothing more, so a stray `**`
  in a job title cannot turn into markup.
- The marks are stripped by `@media print`, which means the PDF is unaffected by
  any of this. An e2e test asserts it, because the print stylesheet is the only
  thing standing between a highlighter and somebody's inbox.
- Density is a judgement call, not a setting. Around a sixth of the experience
  prose is marked; much more and the marks stop meaning anything.
