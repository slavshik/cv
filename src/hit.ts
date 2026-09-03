/*
 * One request per visit, to /api/hit.
 *
 * That endpoint is a Worker of mine, and the CV sits on the same zone as the
 * site it belongs to — so this is a same-origin request to my own domain. No
 * second DNS name, no CORS, no third party, and nothing a blocker recognises
 * as a tracker. The Worker writes one row into D1 and answers with a pixel;
 * the reading end is `make stats` in the slavshik.github.io repository.
 *
 * Sent from here is only what the request headers do not already carry: which
 * page, where the visitor came from, the viewport, the theme. Country, network
 * and browser are read at the edge, where they are the truth rather than a
 * claim from the page.
 *
 * Nothing is kept on the device — no cookie, no storage — and the visitor is
 * known to the Worker as a hash re-salted at midnight, so two days cannot be
 * joined even by me. There is nothing here to ask consent for.
 *
 * hitQuery is pure and touches no DOM, which is the part the unit test drives.
 */

/** The endpoint, on this very origin. */
const HIT_URL = '/api/hit';

/**
 * The only host the Worker is routed on. A dev server, `make preview` and the
 * bare github.io address would all answer /api/hit with a 404, so they do not
 * ask.
 */
const LIVE_HOST = 'slavshik.me';

export interface HitInput {
	/** location.pathname — '/cv/' or '/cv/jobs/' */
	path: string;
	/** location.search, for the utm_* of a marked link */
	search: string;
	/** document.referrer, empty string when the visit is direct */
	referrer: string;
	/** Viewport in CSS pixels, width×height */
	viewport: string;
	/** devicePixelRatio */
	dpr: number;
	/** The theme the visitor is looking at */
	theme: string;
	/** Key of this visit. Not stored anywhere and gone on reload */
	nonce: string;
	/** Our own origin: a referrer from it is a step inside the site, not a source */
	origin: string;
}

/** Nothing longer than a meaningful value leaves the page. */
const cut = (s: string, n = 128): string => (s.length > n ? s.slice(0, n) : s);

/**
 * Referrer down to origin + path. The query string is dropped on purpose:
 * tokens and mail addresses live there, and 'where from' needs the host.
 */
function referrerOf(referrer: string, origin: string): string {
	if (!referrer) return '';
	try {
		const u = new URL(referrer);
		if (u.origin === origin) return '';
		return cut(u.origin + (u.pathname === '/' ? '' : u.pathname));
	} catch {
		return '';
	}
}

/** Build the query for /api/hit. Starts with '?'. */
export function hitQuery(i: HitInput): string {
	const q = new URLSearchParams();
	q.set('n', i.nonce);
	q.set('p', cut(i.path));

	const ref = referrerOf(i.referrer, i.origin);
	if (ref) q.set('r', ref);

	// utm_* arrive on our own address, so this is how a link of mine was
	// marked, not somebody else's data. The keys are short: they ride along
	// with every visit.
	const utm = new URLSearchParams(i.search);
	const pairs: [string, string][] = [
		['u', utm.get('utm_source') ?? ''],
		['m', utm.get('utm_medium') ?? ''],
		['c', utm.get('utm_campaign') ?? ''],
	];
	for (const [k, v] of pairs) if (v) q.set(k, cut(v, 64));

	q.set('w', i.viewport);
	if (i.dpr !== 1) q.set('d', String(Math.round(i.dpr * 100) / 100));
	q.set('t', i.theme);

	return `?${q.toString()}`;
}

/**
 * The visitor asked not to be counted. Do-Not-Track is gone from most
 * browsers, Global Privacy Control is alive and legally meaningful in a couple
 * of jurisdictions — both are honoured.
 */
export function optedOut(nav: Navigator): boolean {
	const n = nav as Navigator & { globalPrivacyControl?: boolean };
	return n.doNotTrack === '1' || n.globalPrivacyControl === true;
}

/** Key of the visit. Random, unstored, and gone when the page is. */
export function nonce(): string {
	return Math.random().toString(36).slice(2, 10);
}

/**
 * Send it. sendBeacon does not hold the page up and survives its unload; where
 * there is none, an image does the same thing slightly less reliably. Failures
 * are swallowed: a counter is no reason to break a CV.
 */
function send(query: string): void {
	const url = HIT_URL + query;
	try {
		if (navigator.sendBeacon?.(url)) return;
	} catch {
		/* fall through to the image */
	}
	try {
		new Image().src = url;
	} catch {
		/* not this time, then */
	}
}

/**
 * Count this page view, unless it is not a visitor: ?aqa=1 is the screenshot
 * run and the PDF render, and neither is a person reading the CV.
 */
export function recordVisit(): void {
	if (location.hostname !== LIVE_HOST) return;
	if (new URLSearchParams(location.search).get('aqa') === '1') return;
	if (optedOut(navigator)) return;

	send(
		hitQuery({
			path: location.pathname,
			search: location.search,
			referrer: document.referrer,
			viewport: `${innerWidth}x${innerHeight}`,
			dpr: devicePixelRatio || 1,
			theme: document.documentElement.dataset['theme'] ?? 'auto',
			nonce: nonce(),
			origin: location.origin,
		}),
	);
}
