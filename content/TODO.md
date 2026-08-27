# Open questions in resume.json

Most of this came from the LinkedIn profile exported as PDF (`More → Save to
PDF`) on 2026-08-25. That export is lossy. On 2026-08-26 the gaps were checked
against the live profile itself — the signed-in page and its `/details/`
sections — which settled most of them. Nothing below was invented to fill a
gap: a gap is left as a gap.

## For Alexander to decide

- **Summary is verbatim from LinkedIn.** It is the one piece of prose on the
  page written in marketing voice ("eager to make meaningful contributions to my
  clients' success"). Tightening it would help; that is an authorial call.
- **Overlapping dates, carried over as-is.** Evolution runs to 2026-05 while
  BrainRocket starts 2025-09.
- **Diesel Puppet is one entry here, 2020-03 to 2023-02.** LinkedIn splits that
  spell in two — Game Developer, full-time, 2020-03 to 2022-08 in Minsk, and
  Game Developer, self-employed, 2022-08 to 2023-02, remote — with the long
  description attached to the second. Merging them reads better and is kept.
  The description still says "roughly five years", which neither those dates nor
  the separate 2013 stint at the same company add up to; that sentence is
  Alexander's own and only he can decide what it should say.
- **Projects have no descriptions, and cannot get them from LinkedIn.** The
  `/details/projects/` page carries names, dates and the associated company and
  nothing else — Chain Cube 3D, Hidden Object: Brain Teaser, Color Galaxy,
  Fireballs and Friends and Blackjack Card Game all deserve a line each, and
  those lines have to be written, not imported.
- **Gap 2015-06 → 2016-01** between Playtika and Exadel.
- **One game, three names.** The Gismart title is "Color Galaxy" in LinkedIn's
  projects, "Color.io" in the 2021 CV (with a Facebook Instant link), and
  "Galaxy.io" as Alexander describes it — the 3D io game he built the core
  gameplay for, ported from Facebook to Snapchat. The dates, Babylon.js and
  Preact all line up, so it is almost certainly one game. The Experience entry
  now says "Galaxy.io"; `projects` still says "Color Galaxy". Pick one, or say
  which name belongs to which platform, and the two will agree.
- **Snapchat needs a number.** "One of the platform's hits" is Alexander's own
  assessment and reads as an unbacked adjective next to the marked figures
  elsewhere on the page. Installs, DAU, a chart position — any one of them
  would turn the strongest story in this CV into its strongest line.

## Settled by decision

- **Certificates are off the page on purpose.** They live on LinkedIn and
  nowhere else. The section, the `Certificate` type and the row renderer are all
  gone — do not add them back from the LinkedIn data.

## From the 2021 CV (`Dieselpuppet_Alexander_Slavschik_CV.pdf`)

Alexander's own hand-written CV, dated 2021-02-04. Checked for links and for
facts this file does not have.

**Every link in it is dead. Checked 2026-08-26; do not re-add them.**

| Link                                                          | What happens now                            |
| ------------------------------------------------------------- | ------------------------------------------- |
| `fb.gg/play/chain-cube`                                       | Facebook login wall                         |
| `fb.gg/play/hidden_brainteaser`                               | Facebook login wall                         |
| `fb.gg/play/blockpuzz`                                        | redirects to a generic `/gaming/play/`      |
| `facebook.com/instantgames/play/240904760151482/` (Color.io)  | same generic page                           |
| `facebook.com/instantgames/play/187363445262289/` (Fireballs) | same generic page                           |
| `gc.gaming.skywindgroup.com/blackjack/130/`                   | page loads, game does not                   |
| `gc.gaming.skywindgroup.com/legendarydragons/latest/`         | page loads, `wrapper/games/sw_ld.json` 404s |

The two Skywind ones are also a former employer's own game-client host, not a
portfolio of Alexander's to link from a personal page.

**Facts in that CV that this file does not carry.** All are Alexander's own
words from 2021; none are on the page yet because they are his call:

- **Melesta** — "port of the most popular game (Farm Frenzy) onto social
  platforms". The current entry says only "Flash games for social networks".
- **Exadel** — the video player was for "a few famous vendors of Shows and
  Movies broadcasting (ABC, Disney, etc)", and he was "handling all the process
  of transition from Flash to HTML experience". The page currently says "part of
  the move off legacy Flash", which was hedged for lack of a source. This is the
  source.
- **Skywind** — "at least 4 successfully finished games: 3 slots + blackjack",
  localized into "12 languages at least, support of Chinese browsers and
  devices".
- **Diesel Puppet 2013** — collaboration with a server-side developer on Erlang.
- **Diesel Puppet 2020** — a "Nine blocks" (blockpuzz) title, not in `projects`.
- **Gismart** — the game listed here as "Color Galaxy" was "Color.io" there.

**Two dates disagree and only Alexander can settle them:**

- **BSUIR.** The 2021 CV says "2008-2009 (not finished)"; LinkedIn says
  2008–2012, and the page follows LinkedIn.
- **Flamap.** The 2021 CV has it under "Self-employed (freelance), 2005–2008";
  LinkedIn has it as employment 2007-07 to 2010-02, and the page follows
  LinkedIn.

## Settled

- **Skills are grouped from the job descriptions, and that is the best source
  there is.** The live `/details/skills/` page is an endorsement list, not a
  skill list: Gaming Analytics, Video Game Production, MobX, Cocos Creator
  Engine, Easystar, Maven, Defold, Lua, Bitbucket, Mocha. Waiting on the CSV
  archive for something better would be waiting for nothing.
- **The BSUIR note is real** — "Dropped and started to work in a startup." is on
  the live profile, and is now in `education`.
- **Certificate issuers and dates confirmed** on the live profile: CSS for
  JavaScript Developers (Josh Comeau) and NestJS Zero to Hero (Udemy), both
  March 2024.
- **Two tech lines the PDF export dropped** are restored from the live profile:
  Cocos Creator at BrainRocket, TypeScript and Babylon.js at Gismart.
- **The FRVR description was truncated in the PDF export** and has been restored
  in full from the profile itself, including the parenthetical after "SDK
  integration", the long-term goals sentence, the 436-releases clause and
  GameAnalytics in the tech line.
