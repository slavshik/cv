/*
 * Renders the built page to dist/<Name>-CV.pdf with Chromium.
 *
 * The PDF is not a second document: it is this page under its own print
 * stylesheet, so the two cannot drift apart. Text stays selectable, links stay
 * clickable, and an ATS gets real text rather than an image.
 *
 * The file is never committed. It is produced next to dist/ and uploaded with
 * it, on the same principle as the build output itself.
 *
 * The phone number lives here and nowhere else. It is not in resume.json,
 * because that file is public, and not in the served HTML, because that is
 * public too — it is injected into the page only for the moment of printing,
 * from CV_PHONE (a repository secret in CI, .env.local on this machine).
 */

import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const DIST = resolve('dist');
const BASE = '/cv/';
const PORT = 4174;

const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.xml': 'application/xml',
	'.txt': 'text/plain; charset=utf-8',
	'.png': 'image/png',
	'.json': 'application/json',
};

if (!existsSync(join(DIST, 'index.html'))) {
	console.error('dist/index.html is missing — run `npm run build` first');
	process.exit(1);
}

/* The built page asks for /cv/assets/…, so the server has to answer under that
   prefix rather than at the root. Small enough to keep in-process: no child
   process to reap and no port handshake to get wrong. */
const server = createServer((req, res) => {
	const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`);
	const path = url.pathname.startsWith(BASE) ? url.pathname.slice(BASE.length) : url.pathname;
	const file = join(DIST, path === '' || path.endsWith('/') ? `${path}index.html` : path);

	if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory()) {
		res.writeHead(404).end('not found');
		return;
	}
	res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
	createReadStream(file).pipe(res);
});

/** CV_PHONE from the environment, or from .env.local when working locally. */
function phoneNumber() {
	if (process.env.CV_PHONE) return process.env.CV_PHONE.trim();
	if (!existsSync('.env.local')) return '';
	const line = readFileSync('.env.local', 'utf8')
		.split('\n')
		.find((l) => l.startsWith('CV_PHONE='));
	return line
		? line
				.slice('CV_PHONE='.length)
				.trim()
				.replace(/^["']|["']$/g, '')
		: '';
}

await new Promise((done) => server.listen(PORT, '127.0.0.1', done));

const browser = await chromium.launch();
try {
	const page = await browser.newPage();

	// ?aqa=1 pins the accent to its daytime value. Without it the colour of the
	// PDF would depend on what time the build ran.
	await page.goto(`http://127.0.0.1:${PORT}${BASE}?aqa=1`, { waitUntil: 'load' });

	const phone = phoneNumber();
	if (phone) {
		await page.evaluate((number) => {
			const slot = document.querySelector('.contacts .phone');
			if (slot) slot.textContent = number;
		}, phone);
	} else {
		console.warn('CV_PHONE is not set — the PDF will carry no phone number');
	}

	const name = await page.evaluate(() => document.querySelector('h1')?.textContent ?? 'CV');
	const file = join(DIST, `${name.trim().replace(/\s+/g, '-')}-CV.pdf`);

	await page.emulateMedia({ media: 'print' });
	await page.pdf({
		path: file,
		printBackground: true,
		// The size and the margins are declared by @page in src/styles.css, so
		// screen print and this file cannot disagree about the paper.
		preferCSSPageSize: true,
		format: 'A4',
	});

	// A PDF that exists but is empty is worse than one that failed loudly.
	const bytes = readFileSync(file);
	if (bytes.subarray(0, 4).toString() !== '%PDF') throw new Error(`${file} is not a PDF`);
	if (bytes.length < 15_000) throw new Error(`${file} is only ${bytes.length} bytes — too small`);

	const pages = (bytes.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
	console.log(`${file} — ${(bytes.length / 1024).toFixed(1)} kB, ${pages} pages`);
} finally {
	await browser.close();
	server.close();
}
