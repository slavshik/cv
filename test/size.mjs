/*
 * Weight budget. A CV is text; the moment it costs more than a photograph,
 * something has gone in that should not have.
 *
 * Measures what a visitor actually downloads to read the page: index.html (the
 * CV is baked into it) plus every built asset, gzipped. `node test/size.mjs`
 * checks, and the limit below is deliberately a hard number rather than a
 * ratchet — this page has no reason to grow.
 *
 * The portrait is outside this number by decision, not by accident — see
 * docs/adr/0005. It is fetched at low priority after the text and the page is
 * complete without it, so it is not part of what it costs to read the CV. Files
 * served straight from public/ land in dist/ root rather than dist/assets, so
 * they fall outside the walk below on their own; that is convenient here and
 * would be a hole if anything load-bearing were ever put there.
 */

import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const LIMIT = 12 * 1024;

const gz = (file) => gzipSync(readFileSync(file), { level: 9 }).length;
const kb = (n) => `${(n / 1024).toFixed(2)} kB`;

const files = ['index.html'];
try {
	for (const name of readdirSync(join(DIST, 'assets'))) files.push(join('assets', name));
} catch {
	console.error('dist/assets is missing — did the build run?');
	process.exit(1);
}

let total = 0;
for (const file of files) {
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
