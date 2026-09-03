import './styles.css';
import { recordVisit } from './hit.ts';

/* ── Accent ─────────────────────────────────────────────────────────────
 * Follows the visitor's local clock through four phases: dawn, day, sunset,
 * night. The same behaviour as slavshik.me, and the only thing on this page
 * that changes on its own. Without JavaScript the page keeps the daytime
 * accent and loses nothing else.
 */
{
	// ?aqa=1 — screenshot runs and PDF rendering. Time of day would make one
	// commit produce four different documents over a day, so it is pinned to
	// midday for both.
	const hour =
		new URLSearchParams(location.search).get('aqa') === '1' ? 12 : new Date().getHours();
	const accent =
		hour >= 5 && hour < 9
			? '#c2643f' // dawn — terracotta
			: hour >= 9 && hour < 17
				? '#2f6b57' // day — deep green
				: hour >= 17 && hour < 21
					? '#b07d2b' // sunset — ochre
					: '#6f86c9'; // night — indigo
	document.documentElement.style.setProperty('--accent', accent);
}

/* ── Theme switch ───────────────────────────────────────────────────────
 * The theme is the system one by default and the button only overrides it. If
 * the chosen value matches what the system already reports, the override is
 * dropped rather than pinned — otherwise the page would stop following the
 * system forever, which nobody asked for.
 */
{
	const button = document.getElementById('theme');
	if (button) {
		const root = document.documentElement;
		const systemDark = matchMedia('(prefers-color-scheme: dark)');

		// The mobile address-bar colour is declared by two meta tags behind
		// media queries. While the theme is the system one, let each keep its
		// own; once the choice is made by hand, both get the same value —
		// the media queries must stop deciding, because the visitor did.
		const paintMeta = (forced: string | null): void => {
			for (const meta of document.querySelectorAll<HTMLMetaElement>(
				'meta[name="theme-color"]',
			)) {
				meta.setAttribute(
					'content',
					forced
						? forced === 'dark'
							? '#101014'
							: '#f4f1ec'
						: /dark/.test(meta.media)
							? '#101014'
							: '#f4f1ec',
				);
			}
		};

		const effective = (): string =>
			root.dataset['theme'] || (systemDark.matches ? 'dark' : 'light');

		const apply = (mode: string): void => {
			if (mode === (systemDark.matches ? 'dark' : 'light')) {
				delete root.dataset['theme'];
				try {
					localStorage.removeItem('theme');
				} catch {
					/* private mode — just do not remember */
				}
			} else {
				root.dataset['theme'] = mode;
				try {
					localStorage.setItem('theme', mode);
				} catch {
					/* private mode — just do not remember */
				}
			}
			paintMeta(root.dataset['theme'] || null);
		};

		paintMeta(root.dataset['theme'] || null);
		(button as HTMLButtonElement).hidden = false;
		button.addEventListener('click', () => {
			apply(effective() === 'dark' ? 'light' : 'dark');
		});
	}
}

/* ── Visit ─────────────────────────────────────────────────────────────
 * One request to /api/hit — my own Worker, on this same origin. It is the
 * only request this page makes that is not part of reading it, and the page
 * is complete without it: see src/hit.ts for what goes and what does not.
 */
recordVisit();
