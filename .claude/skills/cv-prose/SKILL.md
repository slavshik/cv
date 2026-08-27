---
name: cv-prose
description: Editorial rules for writing and revising the prose in content/resume.json — what may be claimed, how a line is phrased, what to cut, and where the marks go. Use whenever an entry, the summary, a highlight, a tech line or a project description is being written, rewritten, trimmed or reviewed, and when judging suggestions about the CV from anyone else.
---

# Writing this CV

`AGENTS.md` covers the machinery: data in `content/resume.json`, marks syntax,
print rules, the build. This is the other half — deciding what a line says and
how it says it. It exists because the same arguments kept being had from
scratch, and losing them costs Alexander credibility with a stranger reading
one page.

## The evidence rule

**Never write a claim that has no source.** Rank of sources:

1. **Alexander, in conversation.** He is the only source for anything not
   already written down. When he supplies a fact, use it — that is what makes
   it sourced.
2. **The live LinkedIn profile.** Signed-in, including the `/details/*` pages.
3. **The 2021 CV PDF** (`Dieselpuppet_Alexander_Slavschik_CV.pdf`). His own
   words, but five years old and sometimes disagreeing with LinkedIn.

A gap stays a gap and goes to `content/TODO.md`. If two sources disagree,
record both there and let him settle it — do not average them.

Reviews of this CV from other models will confidently supply numbers,
adjectives and whole bullet points that appear in none of the above. Take the
diagnosis, refuse the invented text, and say which is which.

## Things that read as lies

- **Role inflation.** "Led", "owned", "drove", "architected" each assert
  seniority. Use them only where a source says so. "Part of the move off legacy
  Flash" is what the evidence supported; "Led the transition" was not.
- **Metrics with no origin.** No "30% faster", no "millions of users", unless
  he said it. A number is the most checkable thing on the page and the most
  damaging when it is invented.
- **Scope creep in numbers.** 436 releases was one job, not a career total.
- **Marketing voice.** "Passionate", "dedicated", "eager to make meaningful
  contributions" — the original LinkedIn summary was all three and said
  nothing. Replace with what was built.
- **Career declarations.** "The direction I would like my next job to take"
  reads loud and is rarely a hundred per cent true. State the work; let the
  reader draw the conclusion.

## Things that read as true

- **Lead with the verb, then the detail.** "Built new game clients end-to-end —
  project scaffolding, MobX stores, WebSocket transport…"
- **Name the specific thing.** "An OpenClaw agent on Telegram" beats "an AI
  assistant". "Cocos Creator 2" beats "a game engine". Specific names are what
  make a claim checkable, which is what makes it believable.
- **Concrete beats evaluative.** "A team of 12 inside a company of 150" says
  more than "a large cross-functional team".
- **Cut the closing flourish.** Most paragraphs improve when the last sentence
  goes. Check it before shipping.
- **Process tools are not a stack.** Scrum, Jira and Confluence do not belong
  in a `keywords` line. Put the languages and libraries there.

## Duty or achievement

Borrowed from `Paramchoudhary/ResumeSkills`, which is worth exactly two ideas.

A line is a **duty** if the person who replaced him would write the same
sentence. It is an **achievement** if it says what changed. Both belong on a
CV — a duty establishes scope — but an entry made only of duties reads like a
job description someone pasted in.

Google's X-Y-Z shape is the test: *accomplished X, as measured by Y, by doing
Z.* Most lines here have X and Z and no Y. **Y is not to be invented.** When a
line has no measure, that is a question for Alexander — "what changed after
this shipped, and how did anyone know?" — and if he does not have one, the
line stays a duty and that is fine.

Prompts that have actually produced answers from him: how many people, how
often it shipped, how many platforms or languages, what it replaced, what
broke less afterwards.

**Reject the rest of that repo's advice.** Its `resume-quantifier` skill
instructs the agent to "estimate numbers when exact data unavailable", which is
manufacturing evidence and the opposite of the rule at the top of this file.
Its own claims ("resumes with numbers get 30% more attention") are unsourced,
inside a skill about credibility. Its house voice — "achievement-focused",
"results-driven" — is the marketing register that was stripped out of this CV
once already.

`job-description-analyzer` and `resume-tailor` are a different matter and may
be worth revisiting when there is a specific posting to answer.

## Where prose lives, and where it is thrown away

| Field | Rendered by | Marks parsed |
| --- | --- | --- |
| `basics.summary` | `summary()` — blank line splits paragraphs | yes |
| `work[].summary`, `work[].highlights` | `jobRow` | yes |
| `work[].summary` for a job before `DETAILED_SINCE` | `briefRow` | yes, but see below |
| `projects[].description` | `projectRow` | yes |
| `education[].note` | `educationRow` | yes |
| `work[].keywords`, `skills[].keywords` | escaped only | **no** |

**`DETAILED_SINCE` is `2016-01`.** Anything starting earlier renders through
`briefRow` in the Earlier section: one muted line, no highlights, no tech line.
Marking up prose there is wasted work — Playtika carried marks nobody could
see, because the entry moved to Earlier and nothing rendered them. Earlier
entries stay plain.

The second and later paragraphs of `basics.summary` are set smaller and muted:
that is the aside, for what was not paid work. Do not put commercial experience
there.

## Marks

`**action**`, `__architecture__`, `==scale==`. See `docs/adr/0004`. In practice:

- Roughly a sixth of an entry, and **never three kinds in one short
  paragraph** — that was the state the marks were in when they read as noise.
- `==…==` is for quantities. If an entry has a number worth seeing, mark it;
  if it has three, mark the strongest one.
- One `==…==` per bullet at most. Two yellow blocks on adjacent lines fight.
- An entry with no marks at all in the middle of marked entries is what makes
  the page look half-finished. Even a short entry gets its bold lead.

## Before shipping

```sh
make check && make unit     # types, lint, format, data and renderer
make e2e                    # zero-tolerance screenshots, pinned container
make pdf-ci                 # the PDF as CI renders it — look at every page
```

Then read the PDF, not the page. It is the artefact people receive, the marks
are stripped from it, and a paragraph that only works in colour will show up
here. Check the last page is not one orphan line.

Finally: `git push` and watch the **right** run. `gh run list --limit 1`
straight after a push still returns the previous one, and `gh run watch` on it
reports success while the live page serves the old build. Take the id, or wait.
