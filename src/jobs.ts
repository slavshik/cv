/*
 * content/jobs/*.json → HTML, for the list at /cv/jobs/.
 *
 * The same contract as render.ts: a pure function, no DOM, no fetch, no clock,
 * run at build time inside vite.config.ts. No clock matters more here than on
 * the CV — every "3 days old" on this page is measured against the date of the
 * sweep that found the posting, not against the moment the page is built. A
 * rebuild on a quiet Sunday must not age a row.
 *
 * The files are written by `jobsweep publish` (.claude/skills/job-sweep). This
 * side of the boundary assumes nothing about how they were produced beyond the
 * shape parseJobDay checks: the sweep is a scraper, its output is somebody
 * else's text, and none of it is trusted enough to skip escaping.
 */

import { escape } from './html.ts';

/** One posting, as published. Descriptions are deliberately not part of this. */
export interface Posting {
	title: string;
	company: string;
	loc: string;
	/** When LinkedIn says the posting went up. */
	posted: string;
	url: string;
	score: number;
	/** Not seen by any earlier sweep — this is what earns the badge. */
	new: boolean;
	firstSeen: string;
}

/** One day's sweep. */
export interface JobDay {
	date: string;
	/** Postings the sweep saw, before the drop rules — a thin day and a broken
	    sweep look identical without it. */
	swept: number;
	dropped?: Record<string, number>;
	jobs: Posting[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* Days of archive kept on the page. The JSON files are all still in the
   repository; this is only about how much HTML one request pays for. */
const ARCHIVE_DAYS = 21;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function fail(where: string, what: string): never {
	throw new Error(`jobs: ${where} ${what}`);
}

const isObject = (v: unknown): v is Record<string, unknown> =>
	typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (v: unknown, where: string): void => {
	if (typeof v !== 'string' || v.trim() === '') fail(where, 'must be a non-empty string');
};

const day = (v: unknown, where: string): void => {
	str(v, where);
	if (!DATE.test(v as string)) fail(where, 'must be YYYY-MM-DD');
};

/* A published row links out. Anything but an http(s) URL on this page would be
   a scraper's string turned into an attribute, so it fails the build. */
const httpUrl = (v: unknown, where: string): void => {
	str(v, where);
	if (!/^https?:\/\//.test(v as string)) fail(where, 'must be an http(s) URL');
};

function assertJobDay(raw: unknown, file: string): asserts raw is JobDay {
	if (!isObject(raw)) fail(file, 'must be an object');
	day(raw['date'], `${file}.date`);
	if (typeof raw['swept'] !== 'number') fail(`${file}.swept`, 'must be a number');
	if (!Array.isArray(raw['jobs'])) fail(`${file}.jobs`, 'must be an array');

	for (const [i, item] of (raw['jobs'] as unknown[]).entries()) {
		const at = `${file}.jobs[${i}]`;
		if (!isObject(item)) fail(at, 'must be an object');
		str(item['title'], `${at}.title`);
		str(item['company'], `${at}.company`);
		str(item['loc'], `${at}.loc`);
		day(item['posted'], `${at}.posted`);
		day(item['firstSeen'], `${at}.firstSeen`);
		httpUrl(item['url'], `${at}.url`);
		if (typeof item['score'] !== 'number') fail(`${at}.score`, 'must be a number');
		if (typeof item['new'] !== 'boolean') fail(`${at}.new`, 'must be a boolean');
	}
}

export function parseJobDay(raw: unknown, file: string): JobDay {
	assertJobDay(raw, file);
	return raw;
}

/** `2026-08-28` → `28 Aug`. */
const dayMonth = (iso: string): string => {
	const [, month, date] = iso.split('-');
	return `${Number(date)} ${MONTHS[Number(month) - 1] ?? month}`;
};

/** Whole days between two ISO dates. Both are midday UTC, so no timezone or
    daylight-saving edge can turn 7 into 6. */
const daysBetween = (from: string, to: string): number => {
	const at = (iso: string): number => Date.parse(`${iso}T12:00:00Z`);
	return Math.round((at(to) - at(from)) / 86_400_000);
};

/** `posted 28 Aug`, plus its age when the posting is not from that same day. */
const age = (posting: Posting, on: string): string => {
	const days = daysBetween(posting.posted, on);
	if (days <= 0) return dayMonth(posting.posted);
	return `${dayMonth(posting.posted)} · ${days}d`;
};

const row = (j: Posting, on: string): string => `
			<li class="row${j.new ? ' is-new' : ''}">
				<span class="mark">${j.new ? 'new' : escape(String(j.score))}</span>
				<span class="body">
					<a class="title" href="${escape(j.url)}" rel="nofollow noopener">${escape(j.title)}</a>
					<span class="meta">${escape(j.company)} · ${escape(j.loc)} · ${age(j, on)}${
						j.new ? '' : ` · seen ${dayMonth(j.firstSeen)}`
					}</span>
				</span>
			</li>`;

const list = (jobs: Posting[], on: string): string =>
	jobs.length === 0
		? '<p class="empty">Nothing.</p>'
		: `<ol class="list">${jobs.map((j) => row(j, on)).join('')}
		</ol>`;

/* What was thrown away, largest pile first. It is the line that says whether a
   short list means a quiet week or a query that stopped matching. */
const dropped = (d: JobDay): string => {
	const piles = Object.entries(d.dropped ?? {}).sort((a, b) => b[1] - a[1]);
	if (piles.length === 0) return '';
	const text = piles.map(([reason, n]) => `${escape(reason)} ${n}`).join(', ');
	return `\n		<p class="dropped">${d.swept} swept, ${d.swept - d.jobs.length} dropped — ${text}.</p>`;
};

/*
 * The newest day in full, every earlier day as only what was new that morning.
 *
 * A sweep repeats itself: a posting that is still open turns up in all of the
 * next ten runs. Printing each day whole would make the archive ten copies of
 * one list, and the question the archive answers — what appeared on Thursday —
 * would be the one thing you could not read off it.
 */
export function renderJobs(days: JobDay[]): string {
	const sorted = [...days].sort((a, b) => (a.date < b.date ? 1 : -1));
	const [latest, ...earlier] = sorted;
	if (!latest) return '<main class="jobs"><p class="empty">No sweep has run yet.</p></main>';

	const archive = earlier
		.slice(0, ARCHIVE_DAYS)
		.map((d) => {
			const fresh = d.jobs.filter((j) => j.new);
			return `
		<details class="day">
			<summary><span class="when">${dayMonth(d.date)}</span> <span class="what">${
				fresh.length === 0 ? 'nothing new' : `${fresh.length} new`
			}</span></summary>
			${list(fresh, d.date)}
		</details>`;
		})
		.join('');

	return `<main class="jobs">

	<header class="head">
		<h1>Jobs</h1>
		<p class="label">A LinkedIn sweep against the CV, once a day. Titles and links only — open a row to read the posting.</p>
	</header>

	<section class="today">
		<h2>${dayMonth(latest.date)}<span class="count">${latest.jobs.length} open · ${
			latest.jobs.filter((j) => j.new).length
		} new</span></h2>
		${list(latest.jobs, latest.date)}${dropped(latest)}
	</section>
${
	archive === ''
		? ''
		: `
	<section class="archive">
		<h2>Earlier</h2>${archive}
	</section>
`
}
	<footer class="foot">
		<a href="../">Back to the CV</a>
	</footer>

</main>`;
}
