# The portrait is an addition, not part of the page

Status: accepted

A CV in Warsaw is expected to carry a face. A CV read in London or San Francisco
is better off without one: photographs invite exactly the bias that blind
screening exists to remove, and some pipelines drop a document that has one. The
same file cannot satisfy both, so it does not try.

The photograph goes on the **web page** and stays out of the **PDF**. That is
the split this repository already uses twice: the phone number exists only in the
PDF, and the reading marks exist only on screen. `slavshik.me/cv` is a personal
page and a face belongs on it. The PDF is the artefact that gets forwarded and
parsed, and it stays a plain document.

## The weight budget

`test/size.mjs` holds the page under 12 kB gzip, and the whole document
currently costs about 9. A usable portrait is 8–15 kB — larger than every
stylesheet and script on the page put together. Counting it would either break
the budget or force the limit up to a number that no longer means anything.

So it is not counted. The budget answers "what does it cost to read this CV",
and the answer does not change: the page is complete, readable and laid out
before the image arrives. The alternatives were considered and rejected —
raising the limit hides the text cost inside a number dominated by one JPEG, and
a second image budget is ceremony around a single file that either exists or
does not.

## Consequences

- **The 12 kB limit no longer describes the full transfer.** It describes the
  document. Anyone reading the number should know it excludes one image, which
  is why `test/size.mjs` says so at the top.
- The exclusion works because `public/` is copied to `dist/` root while the
  budget walks `dist/assets`. That is a decision resting on a directory
  convention, so it is written down here rather than left to be rediscovered.
  Nothing that the page needs in order to render may be put in `public/`.
- **The image is loaded last and the header does not wait for it.** `width` and
  `height` are set so the box is reserved, `fetchpriority="low"` puts it behind
  the text, and a tinted circle stands in until it lands. `loading="lazy"` is on
  the tag as a statement of intent; the header is in the first screen, so no
  browser actually defers it.
- `basics.image` is the JSON Resume field for this, so the data file gains no
  extension. It is optional, and absent is a working state: the renderer emits
  no tag and `:has()` leaves the header as the single-column stack it was.
- The screenshot baselines move when a photograph is added, and only then.
