/*
 * Weight budget. A CV is text; the moment it costs more than a photograph,
 * something has gone in that should not have.
 *
 * Measures what a visitor actually downloads to read the page: index.html (the
 * CV is baked into it) plus every asset that page references, gzipped. `node
 * test/size.mjs` checks, and the limit below is deliberately a hard number
 * rather than a ratchet — this page has no reason to grow.
 *
 * The assets are read out of the markup rather than off the assets directory,
 * because dist/ now holds a second page as well: /cv/jobs/ is a list built from
 * content/jobs/, it has its own stylesheet, and none of its weight is weight the
 * CV costs anybody. Counting the directory would have quietly charged this
 * budget for a page no visitor loads.
 *
 * The portrait is outside this number by decision, not by accident — see
 * docs/adr/0005. It is fetched at low priority after the text and the page is
 * complete without it, so it is not part of what it costs to read the CV. What
 * keeps it out is the shape of the match below: only /cv/assets/ is counted, and
 * files served straight from public/ are referenced from dist/ root. That is
 * convenient here and would be a hole if anything load-bearing were ever served
 * that way.
 */

import { gzipSync } from 'node:zlib';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const PAGE = 'index.html';
const LIMIT = 12 * 1024;

const gz = (file) => gzipSync(readFileSync(file), { level: 9 }).length;
const kb = (n) => `${(n / 1024).toFixed(2)} kB`;

let html;
try {
	html = readFileSync(join(DIST, PAGE), 'utf8');
} catch {
	console.error(`${join(DIST, PAGE)} is missing — did the build run?`);
	process.exit(1);
}

/* Every src= and href= Vite rewrote to a built asset. base is '/cv/', so the
   prefix comes off to get a path inside dist/. */
const assets = [...html.matchAll(/(?:src|href)="\/cv\/(assets\/[^"]+)"/g)].map((m) => m[1]);
if (assets.length === 0) {
	console.error('no built assets are referenced from index.html — did the build run?');
	process.exit(1);
}

let total = 0;
for (const file of [PAGE, ...new Set(assets)]) {
	const size = gz(join(DIST, file));
	total += size;
	console.log(
		`  ${file.padEnd(28)} ${kb(size).padStart(10)}  (${kb(statSync(join(DIST, file)).size)} raw)`,
	);
}

console.log(`  ${'total, gzip'.padEnd(28)} ${kb(total).padStart(10)}  of ${kb(LIMIT)}`);

if (total > LIMIT) {
	console.error(`\nover budget by ${kb(total - LIMIT)}`);
	process.exit(1);
}
