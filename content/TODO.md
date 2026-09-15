# Open questions in resume.json

Most of this came from the LinkedIn profile exported as PDF (`More → Save to
PDF`) on 2026-08-25. That export is lossy. On 2026-08-26 the gaps were checked
against the live profile itself — the signed-in page and its `/details/`
sections — which settled most of them. Nothing below was invented to fill a
gap: a gap is left as a gap.

## For Alexander to decide

- **AI positioning, as it stands after 2026-09-15.** Agentic workflows are
  mainly personal, with use at Evolution: routine Jira, wiki and GitLab
  automation through Alexander's own skills, using Claude, Codex, DeepSeek and
  Ollama (confirmed 2026-09-07). The headline still says Agentic Workflows and
  the Evolution entry still carries the detail.

    **The summary is Alexander's own and is no longer two paragraphs.** He
    rewrote it on 2026-09-15; the second paragraph — the aside about LLM agents,
    the home cloud and the dotfiles repo — is gone with it, and that is his
    call, asked and closed. Do not offer to restore it. Two things follow that
    are worth knowing rather than acting on: the CV is a page shorter in print
    for it, and `.summary + .summary` in `src/styles.css` now styles nothing,
    because there is no second paragraph to mute. Leave the rule; it costs
    nothing and it is what makes a second paragraph work if one ever returns.

- **BrainRocket is back on the page, as `BrainRocket (Elagames)`.** Senior Game
  Developer, Valencia, 2025-09 to 2026-07, slot games on Cocos Creator 2 and
  Spine. It was taken off on 2026-09-01 at Alexander's request (`dd4ea33`) and
  put back on 2026-09-15, also at his request — restored verbatim from that
  commit, so nothing about the entry was re-derived or re-worded. The
  parenthetical follows the `Gismart (Flime)` precedent already in the data.
  **Confirm with him that `Elagames` is the spelling he wants**; it came from
  the sentence in which he asked for the entry back and from no other source.
- **Overlapping dates, carried over as-is.** Evolution runs to 2026-05 while
  BrainRocket starts 2025-09. This note existed before, was retired when
  BrainRocket left the page, and is live again because both entries are.
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

    All four are now in the highlights instead, and they stay there.

    **Reopened on 2026-09-15, deliberately and narrowly.** Alexander asked for a
    showcase, and `projects` is where it goes — but the sentence above still
    holds and is the thing to check any new entry against. What was rejected was
    a name and a date. What is allowed is a name with an address, a line of what
    it is, and its stack; `src/resume.ts` now carries `url`, `entity`,
    `highlights` and `keywords` for exactly that, and `startDate` is optional.
    An entry that cannot manage the sentence does not belong in the array. See
    `docs/adr/0007`.

    **Still waiting on Alexander: the links themselves.** Until they land,
    `projects` is absent, the Showcase section does not render, and /cv/work/
    says "Nothing here yet." The block-fit puzzle, the word game and the
    strategy engine are still unnamed; only he can name them.

- **Language levels are CEFR, and they are Alexander's own claim.** English
  B2, Russian C2, Polish A2, given in conversation on 2026-09-15 and replacing
  the LinkedIn wording ("Professional working", "Native or bilingual",
  "Elementary"). LinkedIn has no CEFR field, so there is no second source for
  them and none of the three can be checked against anything written down.
- **The four BrainRocket slot games are Alexander's own links**, given on
  2026-09-15: Flame Fruits Frenzy, Golden Bunny, Golden Till and Tea Party of
  Fortune, on `expo.elaapi.com/demo/`. Two things about them are checked rather
  than assumed, and two are not:
    - **Checked.** Every one of those bundles serves
      `<title>Cocos Creator | SlotClient</title>` from
      `preprod.elaapi.com/games/<slug>/<version>/index.html`, which is
      independent corroboration of "slot games on Cocos Creator 2" and of the
      BrainRocket entry's tech line.
    - **The display names are title-cased from the slugs, and that is settled.**
      The pages render their titles in the client, so the names could not be
      read off them. `ela_flame_fruits_frenzy_hw` is the one whose canonical
      path disagrees — the game itself is `flame-fruits-hw`, with no "Frenzy" —
      and Alexander was asked twice about that and about what `hw` stands for.
      On 2026-09-15 he closed the question. **Do not raise it again**; the names
      on the page are the ones he is happy with.
    - **Not decided: dates.** No per-game dates were given, and the BrainRocket
      spell (2025-09 → 2026-07) is not one of them — putting it on all four
      would claim each ran the whole spell. The entries carry no dates.
    - **Worth knowing:** `content/TODO.md` argues further down that a former
      employer's own game host is "not a portfolio of Alexander's to link from
      a personal page" — that was about Skywind. These are public demo URLs on
      an expo host and Alexander asked for them by name, which is a different
      call, but it is the same shape of link and the precedent is here on
      purpose.
- **Color Galaxy is in the showcase, and the link is a video, not the game.**
  `youtube.com/watch?v=j92y8b9mPBQ` — checked on 2026-09-15: it is **Gismart's
  own channel**, titled "Color Galaxy on Snapchat. Promo", 28 seconds, uploaded
  2020-02-13. That date is after Alexander left (2019-06), so the promo is for
  the Snapchat release of the reworked game. Alexander sent it labelled
  "Galaxy.io"; the entry is named **Color Galaxy** instead, because that is the
  version he built and the one the settled note below says he may claim. The
  description says in so many words that the video is the later release.
- **The two Skywind games work, and both are in `projects`.** Loaded in
  headless Chromium on 2026-09-15 and screenshotted: `legendarydragons/latest/`
  draws its full splash with a PLAY GAME button, `blackjack/latest/` draws the
  table with the bet-limit dialog and a $10,000 demo balance.
    - **The 404s are real and harmless.** `wrapper/games/sw_ld.json` and
      `modules/versions/sw_ld.json` both 404 and the game starts anyway; the
      same pair 404s for `sw_bjc`. Judging these dead from a `curl` of a
      guessed config path is what produced the "page loads, game does not" note
      dated 2026-08-26, and a second wrong call on 2026-09-15. **Open the page
      in a browser** before writing either game off again.
    - **No HTTPS on that host at all** — `https://gc.gaming.skywindgroup.com`
      does not connect, so both links are plain `http` and have to stay that
      way. A link is a navigation, not a subresource, so nothing blocks them;
      they simply show no padlock.
    - **Alexander asked for them twice, explicitly.** The note further down —
      that a former employer's own game host is "not a portfolio of Alexander's
      to link from a personal page" — was written before he did, and stands
      there as the argument he overruled, not as a live objection.
- **The five Evolution links are live**, checked 2026-09-15, with the names
  taken from those pages' own `<title>`: Red Door Roulette, Lightning Sic Bo,
  Marble Race, Crazy Time, MONOPOLY Roll 'em. All carry
  `type: "Live casino title"` — the section of the site they sit under and
  nothing more. **Evolution's own paths are not a taxonomy to copy**: Lightning
  Sic Bo lives under `/live-baccarat/`, and Crazy Time is the only one of the
  five whose title says "Game Shows".
- **Settled: the five Evolution titles are team work, not maintenance.**
  Alexander on 2026-09-15 — he was on the teams that built them and took part in
  the development. That answers the build-or-maintain question, including for
  Crazy Time, which shipped years before he started (2023-02); being on the team
  of a live title says nothing about when it first went out.

    The five therefore carry `roles: ["Game team"]`, so the mono line reads
    "Live casino title · Evolution · Game team" and a reader cannot mistake a
    studio title for a solo project. The two Skywind entries carry it too — the
    work entry there already says "in a group of front-end developers", so it is
    sourced. **BrainRocket and Color Galaxy deliberately do not.** There is no
    source either way for the four slot games, and Color Galaxy already states
    what he personally built in its own description. A missing role is a gap,
    not a claim of having built something alone; do not fill these in to make
    the column look even.

- **Languages are off the page by decision.** Alexander, 2026-09-15: "они
  только занимают место". The block had just been changed to CEFR — English B2,
  Russian C2, Polish A2 — and those levels exist nowhere else, so if they are
  ever wanted back they come from git or from him, not from LinkedIn, which has
  no CEFR field. `languages` is optional in `src/resume.ts` and absent from the
  data; `languageRow` and the `Language` type stay, so putting the array back is
  the whole of the work. Same shape as the `projects` decision above.
- **Chain Cube 3D has a picture and no link.** Alexander sent the screenshot on
  2026-09-15; the game itself is behind the Facebook login wall the table below
  records, so the entry carries `image` and no `url` and renders as an unlinked
  card. Three screenshots came in that evening; the third is the one in use.
  **The crop fits the whole board, it does not frame the cubes.** Alexander's
  words: a crop of the field crops the game. The board is portrait and the box
  on the page is 1.6, so the width is made up with the game's own brown
  backdrop either side rather than by cutting the field — padding that reads as
  part of the picture, because it is. Its kind — "3D physics puzzle" — is the
  Diesel Puppet work entry's own words, not a new claim.
- **Color Galaxy's picture is the Snapchat build, and the entry says so.** A
  press triptych of three phone screens, sent 2026-09-15, cropped to 1.6 with
  all three panels kept. The Bitmoji avatars and the "Leave" button date it:
  this is the reworked release, the same one the video shows. The description
  was widened from "the link is" to "the picture and the link are both from"
  when the image went in — the settled note below says Color Galaxy is what he
  may claim and the rework is not, and that holds for pictures too.
- **Nine thumbnails exist; four do not.** `public/work/*.jpg` holds the four
  BrainRocket games and the two Skywind ones, captured on 2026-09-15 with
  Playwright against the live clients and referenced from `projects[].image`
  (a bare filename, resolved against /cv/work/). Shown there and nowhere else —
  not on the CV, which is a document, and never in the PDF.
    - **They are gameplay, not the splash.** The PLAY button is drawn on the
      canvas, centred and low, so it is clicked by coordinate rather than by
      selector: `mouse.click(W / 2, H * 0.833)` for the four BrainRocket games,
      `H * 0.715` for Legendary Dragons, `H * 0.684` for the Blackjack
      bet-limit dialog.
    - **Debug furniture has to come off, and it is not all the same.** The
      BrainRocket demos draw a **dat.GUI "Custom stops / Cheats"** panel that
      `cheat=1` in the launcher URL turns on; it is in the main document (there
      is no iframe — `frames()` is 1) and is removed from the DOM before the
      shot. Skywind's **FPS meter** is not in the DOM and survives removal, so
      it has to come off with the frame. Reopening a game without `cheat=1`
      does not work — the launcher's inner URL on the site root lands in the
      lobby.
    - **Blackjack is Alexander's own screenshot, cropped**, not an automated
      capture: he played a hand and sent the frame, because an automated shot
      reaches an empty table and a dealt hand is the picture worth having. The
      crop takes the browser chrome off the top, the wrapper's balance bar off
      the foot and the window edge off the right, at exactly 1.6 — the ratio of
      the box on the page. It was done with the same trick as the resize: no
      canvas (a `file://` image taints it and `toDataURL` then throws), just a
      page holding the picture at a negative offset, the viewport as the window,
      and a fractional `deviceScaleFactor`.
    - **How they were made**, so the rest can match: `chromium`, viewport
      1000×640, `deviceScaleFactor: 0.36` (Playwright has no resize; a
      fractional scale factor is the whole of one), ~20s to load, click, ~13s
      more, JPEG quality 82. 10–33 kB each. The clip also drops the wrapper
      furniture along the edges — BrainRocket's game-name label at the top,
      Skywind's balance-and-clock bar at the foot.
    - **Evolution cannot be captured here, but Alexander can send frames.**
      `games.evolution.com` puts every game page behind an **18+ age
      attestation** and a cookie-consent banner; both are consents and neither
      is mine to give on his behalf, so nothing on that host gets shot from
      this side. The Evolution pictures come from him instead, out of the live
      client.
    - **Three crops of those are his, not mine, and they should stay his.** I
      framed Crazy Time and Red Door twice and got both wrong: in these games
      the betting layout sits near the foot of the screen — Red Door's table
      centres at 81% of the height, Crazy Time's bet row at 91% — so there is
      almost nothing below it to balance against. Centring the layout means
      cropping away the wheel, the door and the host, which is the game's whole
      identity; four attempts are in the history and none worked. On 2026-09-15
      Alexander re-cropped both himself and the files are his framing verbatim:
      the only things done here are the downscale to 640px and the JPEG encode.
      **Do not re-crop them.** His frames keep the title bar and the balance
      strip, which I had been cutting — at 112×70 neither is legible, and it is
      his call either way.
    - Live studio video is a photograph and does not compress like the rendered
      games, so the three Evolution thumbnails are encoded at JPEG quality 74
      rather than 84. At 84 they ran to 70 kB against 10–38 kB for the rest.
    - **Whose art this is.** These are BrainRocket's and Skywind's screens.
      Screenshots of titles one worked on are ordinary in a games portfolio, and
      Alexander asked for them; it is still a former employer's artwork on a
      personal site, and worth him knowing that is the trade.
- **The two FRVR titles are live, and one of them is new to the page.**
  Alexander sent both on 2026-09-15; the links were checked the same day and the
  names taken from the pages' own `<title>`: **Basketball FRVR**
  (basketball.frvr.com) and **Field Goal FRVR** (fieldgoal.frvr.com).
    - **Basketball FRVR is already in the work entry**, which says he owned the
      long-term goals and progression system on it — so the card carries that as
      its role, in the entry's own words. **Field Goal is named nowhere else**:
      it is on the page because he said he worked on it, which is the top of the
      evidence rule, and it carries no role because nothing says what he did
      there. Do not invent one to make the column look even.
    - **He labelled the two screenshots the other way round** — the file he
      attached to basketball.frvr.com is the Field Goal goalpost and vice versa.
      They are filed by what is in them, not by what the message said.
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
- **Two tech lines the PDF export dropped** were restored from the live profile:
  Cocos Creator at BrainRocket, TypeScript and Babylon.js at Gismart. Both are
  on the page again as of 2026-09-15.
- **The FRVR description was truncated in the PDF export** and has been restored
  in full from the profile itself, including the parenthetical after "SDK
  integration", the long-term goals sentence, the 436-releases clause and
  GameAnalytics in the tech line.
