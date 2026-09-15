/*
 * The two text functions every renderer in this repository uses.
 *
 * They are here rather than in render.ts because there are now three pages
 * built from data — the CV and the showcase from files this repository owns,
 * the jobs list from titles and company names scraped off somebody else's
 * site. That last one is the reason `escape` must never be duplicated or
 * "simplified": every string that reaches any of the three goes through it
 * first.
 */

export const escape = (s: string): string =>
	s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

/*
 * Prose, with the three marks of progressive summarisation — the layer you read
 * when you are not going to read the whole thing.
 *
 *   **…**  what was done and owned      → strong
 *   __…__  the technical substance      → underlined
 *   ==…==  how much of it there was     → marked
 *
 * They are levels of meaning, not three ways of shouting: bold is the action,
 * the underline is the architecture, the mark is the number. On paper all three
 * are switched off — see the print rules in src/styles.css, and docs/adr/0004.
 *
 * Escaping runs first and the markers survive it untouched, so no text in a
 * data file can open a tag of its own.
 */
export const prose = (text: string): string =>
	escape(text)
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/__(.+?)__/g, '<span class="term">$1</span>')
		.replace(/==(.+?)==/g, '<mark>$1</mark>');
