/*
 * The one escape both renderers use.
 *
 * It is here rather than in render.ts because there are now two pages built
 * from data — the CV from a file this repository owns, the jobs list from
 * titles and company names scraped off somebody else's site. The second is the
 * reason this must never be duplicated or "simplified": every string that
 * reaches either page goes through this function first.
 */

export const escape = (s: string): string =>
	s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
