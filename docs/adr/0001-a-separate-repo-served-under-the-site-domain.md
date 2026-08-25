# A separate repository, served under the site's domain

Status: accepted

The CV needed to live at `slavshik.me/cv` without disturbing slavshik.me, which
is a hand-tuned one-page site with a WebGL television on it, a weight budget and
pixel-exact screenshot baselines. Adding a long document with its own layout,
its own print stylesheet and a Playwright PDF step into that repository would
have meant sharing a build, a budget and a set of baselines between two things
that have nothing in common but a domain.

GitHub Pages makes the separation free: a project site with no custom domain of
its own inherits the account's user-site domain and is served at
`<domain>/<repo>`. The repository is therefore named `cv`, and nothing about DNS
or Cloudflare had to change.

## Consequences

- **The repository name is the URL.** Renaming it moves the page.
- **No `CNAME` file may exist here.** It would claim the apex domain and take
  slavshik.me down; the inheritance only applies to a project site that has no
  custom domain configured.
- `base` is `/cv/` in `vite.config.ts`, and every asset URL carries that prefix.
  The download link is deliberately relative so it survives any base.
- The two repositories share conventions by copying, not by importing. When the
  design language of slavshik.me changes, this repo has to be told.
