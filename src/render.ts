/*
 * resume.json → HTML. A pure function: no DOM, no fetch, no clock. It runs at
 * build time inside vite.config.ts, and its output is baked into index.html —
 * which is why the page needs no JavaScript to show a single word of the CV.
 *
 * Every section is the same two-column row: a narrow gutter on the left (dates,
 * or a label) and the body on the right. One shape for experience, skills,
 * education and languages keeps the page quiet and makes the
 * print stylesheet a handful of lines instead of a per-section special case.
 */

import type { Education, Language, Project, Resume, Skill, Work } from './resume.ts';

/* Positions that started before this are listed as one line each, under
   "Earlier". Eighteen years of history is worth showing; eighteen years of
   descriptions is not, and nobody reads the third page. */
const DETAILED_SINCE = '2016-01';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* Only the countries this CV actually names. A lookup table beats pulling in
   Intl.DisplayNames for one string. */
const COUNTRIES: Record<string, string> = { PL: 'Poland' };

const escape = (s: string): string =>
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
 * are switched off — see the print rules in src/styles.css.
 *
 * Escaping runs first and the markers survive it untouched, so no text in the
 * data file can open a tag of its own.
 */
const prose = (text: string): string =>
	escape(text)
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/__(.+?)__/g, '<span class="term">$1</span>')
		.replace(/==(.+?)==/g, '<mark>$1</mark>');

/** `2025-09` → `Sep 2025`; `2012` → `2012`. */
const monthYear = (d: string): string => {
	const [year, month] = d.split('-');
	if (!year) return d;
	if (!month) return year;
	return `${MONTHS[Number(month) - 1] ?? month} ${year}`;
};

const yearOnly = (d: string): string => d.slice(0, 4);

/** Years only, and a single year when a spell begins and ends inside one:
    "2013 — 2013" reads like a typo. */
const yearSpan = (start: string, end: string | undefined): string => {
	const from = yearOnly(start);
	const to = end ? yearOnly(end) : 'Present';
	return from === to ? from : `${from} — ${to}`;
};

const span = (start: string, end: string | undefined, format: (d: string) => string): string =>
	`${format(start)} — ${end ? format(end) : 'Present'}`;

/** A URL as it should be read rather than clicked: no scheme, no www, no
    trailing slash. The contact line and the closing line both want this. */
const bareHost = (url: string): string =>
	url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

const joined = (parts: (string | undefined)[]): string =>
	parts.filter((p): p is string => !!p).join(' · ');

const row = (side: string, body: string, cls = ''): string =>
	`<div class="row${cls ? ` ${cls}` : ''}">` +
	`<p class="side">${side}</p>` +
	`<div class="body">${body}</div>` +
	`</div>`;

const section = (title: string, body: string): string =>
	`<section><h2>${escape(title)}</h2>${body}</section>`;

const paragraph = (text: string | undefined): string => (text ? `<p>${prose(text)}</p>` : '');

const highlights = (items: string[] | undefined): string =>
	items && items.length > 0
		? `<ul class="highlights">${items.map((h) => `<li>${prose(h)}</li>`).join('')}</ul>`
		: '';

const tech = (keywords: string[] | undefined): string =>
	keywords && keywords.length > 0
		? `<p class="tech">${keywords.map(escape).join(' <span aria-hidden="true">·</span> ')}</p>`
		: '';

const detail = (job: Work): string =>
	paragraph(job.summary) + highlights(job.highlights) + tech(job.keywords);

const jobRow = (job: Work): string =>
	row(
		escape(span(job.startDate, job.endDate, monthYear)),
		`<h3>${escape(job.position)}</h3>` +
			`<p class="org">${escape(joined([job.name, job.location]))}</p>` +
			detail(job),
		'entry',
	);

/*
 * Earlier work: years rather than months, and one line of what it was. The
 * line used to be dropped on the floor — every one of these entries carried a
 * summary in the data that the page never rendered, which is also why a mark
 * left in one of them showed up in no diff and on no screen.
 */
const briefRow = (job: Work): string =>
	row(
		escape(yearSpan(job.startDate, job.endDate)),
		`<h3>${escape(job.position)}</h3>` +
			`<p class="org">${escape(joined([job.name, job.location]))}</p>` +
			paragraph(job.summary),
		'brief',
	);

const skillRow = (skill: Skill): string =>
	row(escape(skill.name), `<p>${skill.keywords.map(escape).join(', ')}</p>`);

const projectRow = (project: Project): string =>
	row(
		escape(yearSpan(project.startDate, project.endDate)),
		`<h3>${escape(project.name)}</h3>${paragraph(project.description)}`,
		'brief',
	);

const educationRow = (school: Education): string =>
	row(
		escape(yearSpan(school.startDate, school.endDate)),
		`<h3>${escape(school.institution)}</h3>` +
			`<p class="org">${escape(joined([school.studyType, school.area]))}</p>` +
			paragraph(school.note),
		'brief',
	);

const languageRow = (language: Language): string =>
	row(escape(language.language), `<p>${escape(language.fluency)}</p>`);

/*
 * Inline, like everything else the page draws: the CV makes no network request
 * of its own, and an icon font or a sprite from a CDN would be the first.
 *
 * They mark the contact line on screen only. On paper the print rules take them
 * off and the dot separators come back — a printed CV wants plain text, and the
 * phone number injected at print time (scripts/pdf.mjs) has no icon to match.
 */
const ICONS: Record<string, string> = {
	place: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
	mail: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="M3.5 6.5 12 13l8.5-6.5"/></svg>',
	github: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.73.5.75 5.48.75 11.75c0 5.02 3.26 9.28 7.78 10.78.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.11-3.17.69-3.83-1.34-3.83-1.34-.52-1.31-1.26-1.66-1.26-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.73 2.65 1.23 3.3.94.1-.73.4-1.23.72-1.51-2.53-.29-5.19-1.27-5.19-5.63 0-1.24.44-2.26 1.17-3.06-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.14 1.17.91-.25 1.89-.38 2.86-.39.97.01 1.95.14 2.86.39 2.18-1.48 3.14-1.17 3.14-1.17.62 1.57.23 2.73.11 3.02.73.8 1.17 1.82 1.17 3.06 0 4.37-2.66 5.34-5.2 5.62.41.36.77 1.06.77 2.14 0 1.55-.01 2.79-.01 3.17 0 .3.2.66.79.55A11.26 11.26 0 0 0 23.25 11.75C23.25 5.48 18.27.5 12 .5Z"/></svg>',
	linkedin:
		'<svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.34 3C4.05 3 3 4.02 3 5.28c0 1.25 1.05 2.27 2.34 2.27 1.3 0 2.35-1.02 2.35-2.27C7.69 4.02 6.64 3 5.34 3ZM3.28 9.15h4.12V21H3.28V9.15Zm6.98 0h3.95v1.62h.06c.55-1.02 1.9-2.1 3.9-2.1 4.17 0 4.94 2.66 4.94 6.12V21h-4.11v-5.42c0-1.29-.03-2.96-1.85-2.96-1.85 0-2.13 1.42-2.13 2.87V21h-4.1V9.15Z"/></svg>',
	download:
		'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3v12"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4 19h16"/></svg>',
	back: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M19 12H5"/><path d="m11 6-6 6 6 6"/></svg>',
};

/** An unknown network simply gets no icon — the text still says what it is. */
const icon = (name: string): string => ICONS[name.toLowerCase()] ?? '';

const head = (resume: Resume, pdfVersion: string): string => {
	const { basics, meta } = resume;
	const place = joined([basics.location.city, COUNTRIES[basics.location.countryCode]]);
	const contacts = [
		`<li>${icon('place')}${escape(place)}</li>`,
		// Filled in only while rendering the PDF — see scripts/pdf.mjs. Empty on
		// the web page, where `:empty` keeps it out of the layout. It sits here
		// rather than last so that the separators land correctly either way.
		`<li class="phone"></li>`,
		`<li><a href="mailto:${escape(basics.email)}">${icon('mail')}${escape(basics.email)}</a></li>`,
		...basics.profiles.map(
			(p) =>
				`<li><a href="${escape(p.url)}" rel="me">${icon(p.network)}${escape(bareHost(p.url))}</a></li>`,
		),
	].join('');

	return (
		`<header class="head">` +
		`<h1>${escape(basics.name)}</h1>` +
		`<p class="label">${escape(basics.label)}</p>` +
		(meta?.openToWork ? `<p class="status">Open to work</p>` : '') +
		`<ul class="contacts">${contacts}</ul>` +
		`<a class="download" href="${escape(pdfHref(resume, pdfVersion))}" download aria-label="Download PDF">${icon('download')}<span>Download PDF</span></a>` +
		`</header>`
	);
};

/** The name of the downloadable file, derived from the name on the CV so the
    link and the artefact cannot drift apart. Used by scripts/pdf.mjs too. */
export function pdfFileName(resume: Resume): string {
	return `${resume.basics.name.replace(/\s+/g, '-')}-CV.pdf`;
}

/*
 * The link carries a version of the document it points at.
 *
 * The PDF sits at a fixed path and the CDN in front of Pages caches it for four
 * hours, so without this a freshly published CV keeps handing out the previous
 * one for the rest of the afternoon. The page itself expires in ten minutes,
 * and once it does the new link is a cache miss and fetches the new file.
 *
 * The version is a hash of what the document is made of, not a timestamp: one
 * commit still produces exactly one page. `download` ignores the query, so the
 * saved file is named the same either way.
 */
function pdfHref(resume: Resume, version: string): string {
	const name = pdfFileName(resume);
	return version ? `${name}?v=${version}` : name;
}

export interface RenderOptions {
	/** Cache-busting stamp for the PDF link; see pdfHref. */
	pdfVersion?: string;
}

export function renderResume(resume: Resume, options: RenderOptions = {}): string {
	const detailed = resume.work.filter((job) => job.startDate >= DETAILED_SINCE);
	const earlier = resume.work.filter((job) => job.startDate < DETAILED_SINCE);

	return (
		`<main>` +
		head(resume, options.pdfVersion ?? '') +
		`<p class="summary">${prose(resume.basics.summary)}</p>` +
		section('Experience', detailed.map(jobRow).join('')) +
		(earlier.length > 0 ? section('Earlier', earlier.map(briefRow).join('')) : '') +
		(resume.projects.length > 0
			? section('Projects', resume.projects.map(projectRow).join(''))
			: '') +
		section('Skills', resume.skills.map(skillRow).join('')) +
		section('Education', resume.education.map(educationRow).join('')) +
		section('Languages', resume.languages.map(languageRow).join('')) +
		tail(resume.basics.url) +
		`</main>`
	);
}

/*
 * The way off this page, and the only one. `basics.url` is otherwise unused:
 * the contact line carries the profiles, not the site those profiles are also
 * listed on — and the site is where they actually live.
 *
 * Centred and clear of the body column, so it reads as leaving the document
 * rather than as one more row in it. Same pill as the two fixed controls, which
 * is what makes it look like a control and not a footnote.
 *
 * It stays on paper. A printed CV with the address of the site on it costs one
 * muted line and saves somebody typing a name into a search box.
 */
const tail = (url: string): string =>
	`<footer class="tail">` +
	`<a href="${escape(url)}">${icon('back')}${escape(bareHost(url))}</a>` +
	`</footer>`;

/** Machine-readable business card. Claims nothing the page does not say. */
export function renderJsonLd(resume: Resume): string {
	const { basics } = resume;
	return JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: basics.name,
		alternateName: 'slavshik',
		url: basics.url,
		email: `mailto:${basics.email}`,
		jobTitle: basics.label,
		address: {
			'@type': 'PostalAddress',
			addressLocality: basics.location.city,
			addressCountry: basics.location.countryCode,
		},
		sameAs: basics.profiles.map((p) => p.url),
		worksFor: resume.work
			.filter((job) => !job.endDate)
			.map((job) => ({ '@type': 'Organization', name: job.name })),
	});
}
