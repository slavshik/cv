import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { parseJobDay, renderJobs, type JobDay } from './src/jobs.ts';
import { parseResume } from './src/resume.ts';
import { renderJsonLd, renderResume } from './src/render.ts';
import { renderWork } from './src/work.ts';

/*
 * The CV is baked into index.html at build time. Nothing about the content
 * arrives over the network and nothing is assembled in the browser: the page
 * a visitor downloads already contains every word, which is what lets it work
 * with JavaScript switched off and lets Playwright print it straight to PDF.
 *
 * base is '/cv/' because this repository is a project site under the account's
 * custom domain — GitHub serves it at slavshik.me/cv/ and every asset URL has
 * to carry that prefix. The one link that does not is the PDF itself: it is
 * written relative, so it resolves under any base.
 *
 * The other two pages are built the same way. /cv/jobs/ comes from
 * content/jobs/*.json; /cv/work/ comes from the `projects` array of the very
 * same resume.json the CV is built from — one dataset, two surfaces, see
 * docs/adr/0007. Both share the palette and little else: no PDF, no JSON-LD,
 * no screenshot baseline, and both sit outside the CV's weight budget — see
 * test/size.mjs.
 */

const RESUME = fileURLToPath(new URL('content/resume.json', import.meta.url));
const STYLES = fileURLToPath(new URL('src/styles.css', import.meta.url));
const JOBS = fileURLToPath(new URL('content/jobs', import.meta.url));

/* Stamps the PDF link so a new build is not served the previous PDF out of the
   CDN's cache — see pdfHref in src/render.ts. Hashing the two files the printed
   document is made of keeps it deterministic: same commit, same page. */
const documentVersion = (): string =>
	createHash('sha256')
		.update(readFileSync(RESUME))
		.update(readFileSync(STYLES))
		.digest('hex')
		.slice(0, 8);

const readResume = (): ReturnType<typeof parseResume> =>
	parseResume(JSON.parse(readFileSync(RESUME, 'utf8')));

/* Every day the sweep has ever published. Missing directory is not an error:
   a fresh clone has not run `make sweep` yet and still has to build. */
const readJobs = (): JobDay[] => {
	let files: string[];
	try {
		files = readdirSync(JOBS).filter((f) => f.endsWith('.json'));
	} catch {
		return [];
	}
	return files.map((f) => parseJobDay(JSON.parse(readFileSync(`${JOBS}/${f}`, 'utf8')), f));
};

const bakePages = (): Plugin => ({
	name: 'bake-pages',

	// The data file is not imported by anything the dev server watches, so tell
	// it to watch, and reload the page when the CV changes.
	configureServer(server) {
		server.watcher.add(RESUME);
		server.watcher.add(JOBS);
		server.watcher.on('change', (file) => {
			if (file === RESUME || file.startsWith(JOBS)) server.ws.send({ type: 'full-reload' });
		});

		/*
		 * The PDF is a build artefact, and the dev server has never heard of
		 * it: a request for one falls through to the HTML fallback, which
		 * answers 200 with the page itself. The download attribute then saves
		 * that HTML under a .pdf name, and the first you hear of it is a
		 * viewer calling the file damaged — which is a terrible way to find
		 * out you were on the dev server. Serve the real file when a build
		 * has left one, and say so plainly when it has not.
		 *
		 * The name is a basename, so there is no path to traverse out of.
		 */
		server.middlewares.use((req, res, next) => {
			const name = (req.url ?? '').split('?')[0]?.split('/').pop() ?? '';
			if (!name.endsWith('.pdf')) return next();

			const file = fileURLToPath(new URL(`dist/${name}`, import.meta.url));
			if (!existsSync(file)) {
				res.statusCode = 404;
				res.setHeader('content-type', 'text/plain; charset=utf-8');
				res.end(`${name} has not been rendered yet — run \`make pdf\`.\n`);
				return;
			}
			res.setHeader('content-type', 'application/pdf');
			createReadStream(file).pipe(res);
		});
	},

	transformIndexHtml: {
		order: 'pre',
		handler(html) {
			// Which page this is, is decided by the placeholder it contains
			// rather than by its path — that way the marker in the markup and
			// the data it is filled from are named the same thing in one place.
			if (html.includes('<!--jobs-->')) {
				return html.replace('<!--jobs-->', renderJobs(readJobs()));
			}

			// Re-read on every request: in dev this is how an edit to the CV
			// shows up, and a build only ever asks once.
			const resume = readResume();

			// The showcase is built from that same object, so it reloads on
			// the same watcher and cannot describe a different CV.
			if (html.includes('<!--work-->')) {
				return html.replace('<!--work-->', renderWork(resume));
			}

			return html
				.replace('<!--resume-->', renderResume(resume, { pdfVersion: documentVersion() }))
				.replace(
					'<!--jsonld-->',
					`<script type="application/ld+json">${renderJsonLd(resume)}</script>`,
				);
		},
	},
});

export default defineConfig({
	base: '/cv/',
	plugins: [bakePages()],
	build: {
		target: 'es2022',
		assetsInlineLimit: 0,
		rollupOptions: {
			input: {
				cv: fileURLToPath(new URL('index.html', import.meta.url)),
				jobs: fileURLToPath(new URL('jobs/index.html', import.meta.url)),
				work: fileURLToPath(new URL('work/index.html', import.meta.url)),
			},
		},
	},
});
