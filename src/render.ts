/*
 * resume.json → HTML. A pure function: no DOM, no fetch, no clock. It runs at
 * build time inside vite.config.ts, and its output is baked into index.html —
 * which is why the page needs no JavaScript to show a single word of the CV.
 *
 * Every section is the same two-column row: a narrow gutter on the left (dates,
 * or a label) and the body on the right. One shape for experience, skills,
 * education, languages and certificates keeps the page quiet and makes the
 * print stylesheet a handful of lines instead of a per-section special case.
 */

import type { Certificate, Education, Language, Project, Resume, Skill, Work } from './resume.ts';

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

const briefRow = (job: Work): string =>
	row(
		escape(yearSpan(job.startDate, job.endDate)),
		`<h3>${escape(job.position)}</h3><p class="org">${escape(joined([job.name, job.location]))}</p>`,
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

const certificateRow = (certificate: Certificate): string =>
	row(
		escape(monthYear(certificate.date)),
		`<h3>${escape(certificate.name)}</h3><p class="org">${escape(certificate.issuer)}</p>`,
		'brief',
	);

const languageRow = (language: Language): string =>
	row(escape(language.language), `<p>${escape(language.fluency)}</p>`);

const head = (resume: Resume, pdfVersion: string): string => {
	const { basics, meta } = resume;
	const place = joined([basics.location.city, COUNTRIES[basics.location.countryCode]]);
	const contacts = [
		`<li>${escape(place)}</li>`,
		// Filled in only while rendering the PDF — see scripts/pdf.mjs. Empty on
		// the web page, where `:empty` keeps it out of the layout. It sits here
		// rather than last so that the separators land correctly either way.
		`<li class="phone"></li>`,
		`<li><a href="mailto:${escape(basics.email)}">${escape(basics.email)}</a></li>`,
		...basics.profiles.map(
			(p) =>
				`<li><a href="${escape(p.url)}" rel="me">${escape(p.url.replace(/^https?:\/\/(www\.)?/, ''))}</a></li>`,
		),
	].join('');

	return (
		`<header class="head">` +
		`<h1>${escape(basics.name)}</h1>` +
		`<p class="label">${escape(basics.label)}</p>` +
		(meta?.openToWork ? `<p class="status">Open to work</p>` : '') +
		`<ul class="contacts">${contacts}</ul>` +
		`<a class="download" href="${escape(pdfHref(resume, pdfVersion))}" download>Download PDF</a>` +
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
		(resume.certificates.length > 0
			? section('Certificates', resume.certificates.map(certificateRow).join(''))
			: '') +
		`</main>`
	);
}

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
