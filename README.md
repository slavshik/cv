# cv

My CV, at **[slavshik.me/cv](https://slavshik.me/cv/)**.

One page, and a PDF of the same page behind the download button. The content is
a single data file; the page is generated from it at build time and ships with
no client-side JavaScript at all beyond a theme switch.

```
content/resume.json   the CV — the only place content lives
src/render.ts         resume.json → HTML, a pure function
src/styles.css        the design, screen and print
scripts/pdf.mjs       the built page → dist/Alexander-Slavschik-CV.pdf
```

## Working here

Node 22 (see `.nvmrc`), then:

```sh
make install
make dev        # http://localhost:5173/cv/ — editing resume.json reloads the page
make pdf        # build, then render the PDF into dist/
make check      # types, linter, formatting
make test       # the above plus unit, screenshot and weight checks
```

`make help` lists the rest.

### Testing on an iPad over Tailscale

Connect the Mac and iPad to the same Tailscale network, then run `make tailscale`
on the Mac. Open the printed `http://<tailscale-ip>:5173/cv/` URL in Safari on
the iPad. Edits reload the page, just as with `make dev`; keep the Mac awake and
the command running. Ctrl-C stops the server.

The target uses the [Tailscale CLI](https://tailscale.com/docs/reference/tailscale-cli)
to find the Mac's IPv4 address and binds Vite to that address. It uses the
installed `tailscale` command by default; override it with
`make tailscale TAILSCALE=/path/to/tailscale-cli` if needed. To use another port,
run `make tailscale PORT=9000`. Tailnet access rules must allow the iPad to reach
that port on the Mac.

## Editing the CV

Change `content/resume.json`. Nothing else needs touching: the page, the
JSON-LD, the PDF and its filename all follow from it.

The file is [JSON Resume](https://jsonresume.org) v1.0.0, so it is not tied to
this page — other tools read the same format. Everything in it is public.
`content/TODO.md` tracks what is still missing from it and why.

## Publishing

Pushing to `main` builds the site, renders the PDF, runs the checks and
publishes to GitHub Pages. There is no manual step and `dist/` is never
committed — the repository holds sources only.

The domain comes from the account's user site, `slavshik/slavshik.github.io`:
a project site inherits it and is served at `slavshik.me/<repo>`. This
repository is named `cv`, which is the whole reason the URL reads the way it
does. **It must not contain a `CNAME` file** — that would claim the apex domain
and take the main site down with it.
