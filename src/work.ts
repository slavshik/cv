/*
 * content/resume.json → HTML, for the showcase at /cv/work/.
 *
 * The same contract as render.ts and jobs.ts: a pure function, no DOM, no
 * fetch, no clock, run at build time inside vite.config.ts.
 *
 * It renders the same `projects` array the CV's Showcase section renders — one
 * dataset, two surfaces, see docs/adr/0007 — and it is the only surface that
 * shows every one of them, since none reach the PDF.
 *
 * Grouped by employer, not listed flat. Twelve entries in a column repeat their
 * studio twelve times and say "Slot game on Cocos Creator 2" four times running;
 * grouped, that is one heading and one line above the four titles it belongs to,
 * and the page is a list of names you can read in one screen. Anything the whole
 * group agrees on is hoisted onto the group; anything it does not stays on the
 * row it belongs to.
 */

import { escape, prose } from './html.ts';
import type { Project, Resume } from './resume.ts';

const yearOnly = (d: string): string => d.slice(0, 4);

/** Years only, and a single year when a project begins and ends inside one:
    "2020 — 2020" reads like a typo. Same rule the CV uses. */
const yearSpan = (start: string, end: string | undefined): string => {
	const from = yearOnly(start);
	const to = end ? yearOnly(end) : 'Present';
	return from === to ? from : `${from} — ${to}`;
};

const joined = (parts: (string | undefined)[]): string =>
	parts.filter((p): p is string => !!p && p !== '').join(' · ');

/** The value every project in the group agrees on, or nothing. What they all
    share belongs above them; what they do not belongs on the row. */
const shared = (group: Project[], of: (p: Project) => string | undefined): string | undefined => {
	const first = of(group[0] as Project);
	return first !== undefined && group.every((p) => of(p) === first) ? first : undefined;
};

const roles = (p: Project): string | undefined => p.roles?.join(', ');

/*
 * One title. The name is a link when there is somewhere to go and plain text
 * when there is not — half the links in the 2021 CV are dead (content/TODO.md),
 * and a game that is no longer online still has a name.
 *
 * Beside it, only what the group could not hoist: at Skywind one of the two is
 * a slot and the other is blackjack, so the kind travels with the row rather
 * than with the studio. Most rows have nothing there at all.
 *
 * No addresses anywhere on this page. The name is the link — printing the URL
 * beside it is what a document does because it cannot be clicked, and this is
 * not a document. The CV's own showcase carries no addresses either; the only
 * one that survives is in the PDF, pointing here.
 */
/*
 * The picture, if there is one. A fixed box with object-fit, because these are
 * screenshots of a dozen different games at a dozen different aspect ratios and
 * a ragged column of them would be worse than none.
 *
 * A row with no picture in a group that has them gets the empty box rather than
 * nothing, so the names stay in one column. Half a group having thumbnails is
 * the normal state while they are being added, and it is the state that looks
 * broken if the column moves.
 *
 * width/height reserve the box so the list cannot reflow as the files land, and
 * the alt is empty on purpose: the name is one element away and making a screen
 * reader read it twice is noise, not access. Same argument as the portrait,
 * docs/adr/0005.
 */
const thumb = (src: string | undefined, reserve: boolean): string => {
	if (src)
		return (
			`<img class="thumb" src="${escape(src)}" alt="" width="224" height="140" ` +
			`loading="lazy" decoding="async">`
		);
	return reserve ? '<span class="thumb is-empty" aria-hidden="true"></span>' : '';
};

interface Hoisted {
	type: boolean;
	roles: boolean;
	/* True when something in this group has a picture, so every row in it keeps
	   a slot for one. */
	thumbs: boolean;
}

const item = (p: Project, hoisted: Hoisted): string => {
	const name = escape(p.name);
	const meta = joined([
		hoisted.type ? undefined : p.type,
		hoisted.roles ? undefined : roles(p),
		p.startDate ? yearSpan(p.startDate, p.endDate) : undefined,
	]);

	return (
		`<li>` +
		thumb(p.image, hoisted.thumbs) +
		`<span class="name">${p.url ? `<a href="${escape(p.url)}" rel="noopener">${name}</a>` : name}</span>` +
		(meta ? `<span class="where">${escape(meta)}</span>` : '') +
		(p.description ? `<p class="note">${prose(p.description)}</p>` : '') +
		(p.highlights && p.highlights.length > 0
			? `<ul class="highlights">${p.highlights.map((h) => `<li>${prose(h)}</li>`).join('')}</ul>`
			: '') +
		`</li>`
	);
};

const group = (name: string, projects: Project[]): string => {
	const type = shared(projects, (p) => p.type);
	const role = shared(projects, roles);
	const thumbs = projects.some((p) => p.image !== undefined);
	const what = joined([type, role]);

	return (
		`<section class="group">` +
		`<div class="who">${name ? `<h2>${escape(name)}</h2>` : ''}` +
		(what ? `<p class="what">${escape(what)}</p>` : '') +
		`</div>` +
		`<ul class="items${thumbs ? ' with-thumbs' : ''}">` +
		projects
			.map((p) =>
				item(p, {
					type: type !== undefined,
					roles: role !== undefined,
					thumbs,
				}),
			)
			.join('') +
		`</ul>` +
		`</section>`
	);
};

/** By employer, in the order they first appear — which is the order of the work
    history, newest first, because that is how `projects` is written. */
const byEntity = (projects: Project[]): [string, Project[]][] => {
	const groups = new Map<string, Project[]>();
	for (const p of projects) {
		const key = p.entity ?? '';
		const found = groups.get(key);
		if (found) found.push(p);
		else groups.set(key, [p]);
	}
	return [...groups];
};

export function renderWork(resume: Resume): string {
	const projects = resume.projects ?? [];

	return `<main class="work">

	<header class="head">
		<h1>Work</h1>
		<p class="label">Titles I worked on, by the studio I worked on them at. The CV is at the other end of the link below.</p>
	</header>

	${
		projects.length === 0
			? '<p class="empty">Nothing here yet.</p>'
			: byEntity(projects)
					.map(([name, ps]) => group(name, ps))
					.join('')
	}

	<footer class="foot">
		<a href="../">Back to the CV</a>
	</footer>

</main>`;
}
