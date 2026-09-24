# Hiring posts are read from the signed-in feed, by hand

Status: accepted

The sweep harvests LinkedIn's public guest job listings. An HR contact of
Alexander's pointed out what that misses: a large share of hiring never becomes
a listing at all. A recruiter writes "we are looking for a Pixi developer,
Warsaw, DM me" in the feed, and no job id is ever minted. Her advice was to
watch posts as well as boards, and to like the ones that fit so the feed
learns.

## What is reachable without a login, measured

Three things were checked on 2026-09-23 rather than assumed:

- the **guest job endpoint** the sweep already uses answers a cold `curl` with
  200 and ~29 kB, as it always has;
- **content search** — `linkedin.com/search/results/content/` — answers a guest
  with 307 to a login redirect. There is no guest endpoint for finding posts;
- **an individual public post** _is_ served to a guest: 200, ~107 kB, with the
  post's text in `og:description`.

So a post can be read without an account, and cannot be _found_ without one.
The only guest-side discovery left is a web search engine over
`site:linkedin.com/posts`, which was tried: it returns profiles, job pages and
hiring posts from 2022–2024. Hiring posts are ephemeral and indexed slowly, so
that route finds mostly what has already closed.

## The decision

The feed is read in Alexander's own Chrome, in his own signed-in session, with
him present, by an agent driving the Claude in Chrome extension. `js/posts.js`
is evaluated against the page he is looking at and returns JSON;
`jobsweep posts` scores that JSON with the same weights as the listings.

This overrides the rule stated in `SKILL.md` and repeated in ADR 0006 — "no
login, nothing behind the auth wall". That rule was right about what the _tool_
should do and is unchanged for it: `jobsweep` itself still fetches nothing but
guest endpoints, and `agent-browser` is still a stranger to LinkedIn. What has
changed is that a second, narrower path exists beside it, and it is not
automation of an account so much as a reading of a page a human already opened.

## What it costs, stated plainly

- **It is still against LinkedIn's terms**, which prohibit automated access to
  the service regardless of who is signed in. The exposure is Alexander's
  account, and account restriction is the plausible failure, not a lawsuit.
  He made this call on 2026-09-23 knowing that; it is his account and his
  risk to take, and it is the reason this file exists rather than a line in a
  commit message.
- **Read-only, and that is load bearing.** `js/posts.js` queries the DOM and
  returns JSON. It clicks nothing. No like, no follow, no connection request,
  no comment, no message is ever sent by the agent — the liking habit his HR
  contact recommended is his to do, with his own hands, because a like is a
  public act carrying his name. An extractor that clicked would also be the
  thing that turns "reading my own feed" into "operating my account".
- **Human pace, human volume.** The feed is scrolled a few screens, a search or
  two is opened, and that is the run. There is no pagination loop, no overnight
  job, nothing that could be mistaken for a crawler.
- **Post text never lands in the repository.** `posts.raw.ndjson` and
  `posts.scored.json` live in the gitignored `runs/`, the same as
  `desc.ndjson`. This is the rule ADR 0006 already set for descriptions, and it
  matters more here: a post is a named individual's writing, not a company's
  listing.
- **Posts are not published to `/cv/jobs/`.** `jobsweep publish` is untouched
  and still writes listings only. A post row is a person's name, their words
  and a permalink; republishing that on a public page is a different act from
  linking a company's job ad, and the page gains nothing from it. Posts reach
  Alexander through the judged shortlist, which is his to read.

## Consequences

- **The pipeline forks and rejoins.** `sweep` → `score` is the listing half and
  is unchanged. The post half is: agent opens the feed → `js/posts.js` →
  `runs/<date>/posts.raw.ndjson` → `jobsweep posts`. Both halves share
  `runs/seen.json`, so a post seen last week is not new this week, and both are
  judged by the same tiering in `SKILL.md`.
- **Scoring a body is not scoring a title.** The weights in `score.go` were
  tuned against titles of six words. Run over a paragraph they fire more often
  and on incidental mentions — "no Angular experience needed" costs three
  points, and nothing can be done about that without lookaround Go's RE2 does
  not have. Two gates come first instead: a post must use hiring language, and
  a post offering candidates (open-to-work, outstaffing, bench lists) is
  dropped. On the first fixture, four of six rows were dropped correctly.
- **This half cannot run unattended, by construction.** The extension needs
  Chrome open, Alexander signed in and the session connected. That is a
  feature: ADR 0006 already established that the sweep is run by hand, and this
  is the part of it that must be.
