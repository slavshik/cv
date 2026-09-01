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
- **Settled: the Projects section is gone and the titles moved into the work.**
  It was four names and their dates — Chain Cube 3D, Hidden Object: Brain
  Teaser, Color Galaxy, Fireballs and Friends — with no descriptions, because
  `/details/projects/` on LinkedIn carries names, dates and the associated
  company and nothing else. A bare title says nothing a reader can use, and the
  work entries already described the same games without naming them. Alexander
  confirmed the mapping on 2026-09-01:
    - **Chain Cube 3D** is the 3D physics puzzle (Babylon.js/cannon.js) at Diesel
      Puppet;
    - **Hidden Object: Brain Teaser** is the hidden-object title there;
    - **Fireballs and Friends** is one of the 2D games at Gismart;
    - **Color Galaxy** was already named in the Gismart entry.

    All four are now in the highlights instead. `projects` is optional in
    `src/resume.ts` and absent from the data; the renderer drops the section on
    its own. Do not restore the list — a name with its context beats a name in a
    column of dates. The block-fit puzzle, the word game and the strategy engine
    are still unnamed; only Alexander can name them.

- **Gap 2015-06 → 2016-01** between Playtika and Exadel.
- **Settled: the Gismart game and its three names.** `Color.io` / `Color Galaxy`
  is the game Alexander built the core gameplay for, on Facebook Instant. It was
  substantially reworked afterwards, renamed `Galaxy.io`, and released on
  Snapchat Games — **after he had left Gismart**. The CV names Color Galaxy as
  his work and mentions the rework as something that happened later, which is
  the whole of what he can claim. Snapchat Games has since shut down and taken
  the game with it, so there is nothing to link and nothing to measure: he does
  not have the numbers and does not want the line played up.

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
