# The YC job board is a second source, read over plain HTTP

Status: accepted

The sweep read one board, LinkedIn. The Y Combinator job board,
ycombinator.com/jobs, lists roles at YC companies that often never reach
LinkedIn, and it was added as a second source on 2026-09-26.

## What the board is, measured

Checked with `curl` on 2026-09-26 rather than assumed:

- every page is **server-rendered**, with its whole Inertia payload — titles,
  locations, salary, visa policy, the full description — as JSON in a
  `data-page` attribute. A plain GET is enough; no browser, no login;
- `robots.txt` allows `/jobs` and `/companies/*/jobs`;
- a listing is **one page of about forty rows**. `?page=` is ignored, so
  coverage comes from reading several role × place slices, not from paging;
- `/jobs/role/<role>/<place>` filters only for places YC knows (`remote`,
  `europe`, `london`, `berlin`, `amsterdam`, `paris`, `dublin`, `munich`,
  `lisbon`). An unknown slug — `warsaw`, `poland` — answers 200 with the
  unfiltered list, a different random sample on every load;
- of ~230 unique engineering rows across those slices, about half cannot be
  done from Poland: US-only remote, US sites;
- ages are relative — "8 months", "over 1 year" — never a date.

## The decision

`jobsweep sweep` reads the slices in `yc.tsv` after the LinkedIn queries and
writes into the same `raw.ndjson`, so scoring, `seen.json`, the shortlist and
the page all treat both sources alike. What differs is kept in `yc.go`:

- **Plain `net/http`, not `agent-browser`.** `browser.go` stays the whole of
  the browser dependency and stays LinkedIn's. Nine GETs take ten seconds.
- **A slug the board does not honour is refused**, not harvested. A random
  sample would look like a sweep and would churn `seen.json` with noise.
- **Rows nobody in Warsaw can take are dropped** in `shortlist` and `publish`,
  under their own reason, so the page's dropped counts show the board's shape.
- **Dates are computed from the relative age**, and are only as precise as it.
  Liveness is judged by the board's "last active" rather than the posting age,
  because YC postings stay up for a year and more.

The page contract from ADR 0006 does not change: titles, companies, locations
and links to public postings, never description bodies.
