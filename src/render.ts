/*
 * resume.json → HTML. A pure function: no DOM, no fetch, no clock. It runs at
 * build time inside vite.config.ts, and its output is baked into index.html —
 * which is why the page needs no JavaScript to show a single word of the CV.
 *
 * Every section is the same two-column row: a narrow gutter on the left (dates,
 * or a label) and the body on the right. One shape for experience, skills,
 * education and the showcase keeps the page quiet and makes the print
 * stylesheet a handful of lines instead of a per-section special case.
 */

import { escape, prose } from './html.ts';
import type { Education, Language, Project, Resume, Skill, Work } from './resume.ts';

/* Positions that started before this are listed as one line each, under
   "Earlier". Eighteen years of history is worth showing; eighteen years of
   descriptions is not, and nobody reads the third page. */
const DETAILED_SINCE = '2016-01';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* Only the countries this CV actually names. A lookup table beats pulling in
   Intl.DisplayNames for one string. */
const COUNTRIES: Record<string, string> = { PL: 'Poland' };

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

/* The side is omitted when it is empty rather than left as a bare tag to
   float: only the dated rows can be missing one, and they are blocks, so
   nothing shifts. A .facts row always has its label. */
const row = (side: string, body: string, cls = ''): string =>
	`<div class="row${cls ? ` ${cls}` : ''}">` +
	(side ? `<p class="side">${side}</p>` : '') +
	`<div class="body">${body}</div>` +
	`</div>`;

const section = (title: string, body: string, cls = ''): string =>
	`<section${cls ? ` class="${cls}"` : ''}><h2>${escape(title)}</h2>${body}</section>`;

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

/*
 * A showcase entry: the thing that was built, rather than the employer it was
 * built at. The name is a link when there is somewhere to send the reader and
 * plain text when there is not — a project with no live URL is still worth
 * naming, and half the links in the 2021 CV are dead (see content/TODO.md).
 *
 * A full 'entry' row rather than a 'brief' one: these carry a stack line, and
 * 'brief' mutes everything in the body down to the size the Earlier section
 * uses. The date is optional here alone — a personal project that is still
 * running often has no start worth printing.
 */
/*
 * The picture on a card. The files live in public/work/ and are named relative
 * to /cv/work/, which is the page that shows them in full — from the CV they
 * need the directory in front. Relative either way, so neither page has to know
 * where the site is deployed.
 *
 * Only entries that have one reach this footer — see showcase() — so there is
 * no empty-frame case to handle here. width/height reserve the box so the
 * gallery cannot reflow as the files land, and the alt is empty because the
 * name is the next element along; docs/adr/0005 makes the same argument about
 * the portrait.
 */
const thumb = (src: string): string =>
	`<img class="thumb" src="${escape(WORK + src)}" alt="" width="224" height="140" ` +
	`loading="lazy" decoding="async">`;

/*
 * A showcase entry, as a card in the footer rather than a row in the document.
 *
 * The sections above it are the CV; this is the gallery underneath, and it is
 * shaped like one — a picture, a name, and the one mono line saying what it is
 * and whose. Everything the row form carried and a card has no room for (the
 * dates, the highlights, the description) lives on /cv/work/, which is where
 * the link at the foot of the block goes.
 *
 * The whole card is the link when there is a URL, so the picture is clickable
 * too. Nothing here reaches paper: the print rules hide the grid entire.
 */
const projectCard = (project: Pictured): string => {
	const inner =
		thumb(project.image) +
		`<span class="name">${escape(project.name)}</span>` +
		((about) => (about ? `<span class="org">${escape(about)}</span>` : ''))(
			joined([project.type, project.entity, project.roles?.join(', ')]),
		);
	return project.url
		? `<a class="card" href="${escape(project.url)}" rel="noopener">${inner}</a>`
		: `<div class="card">${inner}</div>`;
};

/** Where the long version of the showcase lives. Relative, like the PDF
    link, so it resolves under any base the site is served from. */
const WORK = 'work/';

/*
 * The showcase, and the way to the longer version of it.
 *
 * One `projects` array feeds both this section and the page at /cv/work/ — see
 * docs/adr/0007. What is here is the CV's share: a name, a line, a stack. The
 * long form is on the other page, and this link is how a reader gets there.
 *
 * The address is spelled out inside the link and hidden on screen, because on
 * paper "All projects" is a dead end. The renderer still does not know where
 * the site is deployed; it reads that off meta.canonical, the one field that
 * does.
 */
/** A project with a picture. The footer gallery takes nothing else. */
type Pictured = Project & { image: string };

const showcase = (projects: Project[], canonical: string | undefined): string => {
	/*
	 * Only the entries that have a picture. This is a gallery: a card with an
	 * empty frame is a placeholder, and a row of placeholders makes the page
	 * look unfinished rather than honest. The ones without are not hidden —
	 * they are on /cv/work/ in full, which is where the link underneath goes,
	 * and that page is built to show a title with no picture properly.
	 */
	const shown = projects.filter((p): p is Pictured => p.image !== undefined);

	return section(
		'Showcase',
		`<div class="cards">${shown.map(projectCard).join('')}</div>` +
			`<p class="more"><a href="${WORK}">All projects` +
			(canonical ? `<span class="at">${escape(bareHost(canonical + WORK))}</span>` : '') +
			`</a></p>`,
		'showcase',
	);
};

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

/*
 * The face, if there is one. Optional in the data and deliberately outside the
 * weight budget — see docs/adr/0005.
 *
 * Everything on the tag says the same thing: this is an addition, not part of
 * the document. `width`/`height` reserve the box so the header cannot jump when
 * the file arrives, and `fetchpriority="low"` puts it behind every byte of the
 * CV itself. `loading="lazy"` is honest about the intent but does no work here —
 * the header is in the first screen, and browsers fetch in-viewport images
 * whatever it says.
 *
 * The alt is empty on purpose. The name is two lines away in the h1; making a
 * screen reader announce it twice is noise, not access.
 */
const portrait = (src: string | undefined): string =>
	src
		? `<img class="portrait" src="${escape(src)}" alt="" width="264" height="264" ` +
			`loading="lazy" decoding="async" fetchpriority="low">`
		: '';

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

	/* The written half of the header is wrapped so it can become a column
	   beside the portrait. Without one it is a plain block and nothing moves. */
	return (
		`<header class="head">` +
		`<div class="who">` +
		`<h1>${escape(basics.name)}</h1>` +
		`<p class="label">${escape(basics.label)}</p>` +
		(meta?.openToWork ? `<p class="status">Open to work</p>` : '') +
		`</div>` +
		`<ul class="contacts">${contacts}</ul>` +
		portrait(basics.image) +
		`<a class="download" href="${escape(pdfHref(resume, pdfVersion))}" download="${escape(pdfFileName(resume))}" aria-label="Download PDF">${icon('download')}<span>Download PDF</span></a>` +
		`</header>`
	);
};

/*
 * The name of the downloadable file: the person, the role they are applying
 * for, and what the document is — "Alexander-Slavschik-Senior-Frontend-CV.pdf".
 * A file called CV.pdf in a recruiter's downloads folder is anonymous, and the
 * role is what tells them which of the three CVs in that folder this is.
 *
 * Every part comes out of the data, and the anchor in the header carries the
 * result in its `download` attribute. scripts/pdf.mjs reads it from there
 * rather than working it out again — the link and the artefact used to be
 * derived separately, which is exactly how they would come to disagree.
 */
export function pdfFileName(resume: Resume): string {
	const slug = (part: string): string => part.trim().replace(/\s+/g, '-');
	const role = resume.meta?.pdfRole;
	return [slug(resume.basics.name), ...(role ? [slug(role)] : []), 'CV.pdf'].join('-');
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
		summary(resume.basics.summary) +
		// Skills before the history on purpose: it is what a reader scans to
		// decide whether the history is worth reading, and what a keyword filter
		// looks for. It also has to be on the first sheet of the PDF, which is
		// what 'facts' is for — that class is how the print rules find the
		// label-and-list sections and squeeze them. Languages sat here too until
		// 2026-09-15 and is gone from the data; the renderer still draws it if
		// it comes back. Everything below is chronological.
		section('Skills', resume.skills.map(skillRow).join(''), 'facts') +
		(resume.languages
			? section('Languages', resume.languages.map(languageRow).join(''), 'facts')
			: '') +
		section('Experience', detailed.map(jobRow).join('')) +
		(earlier.length > 0 ? section('Earlier', earlier.map(briefRow).join('')) : '') +
		section('Education', resume.education.map(educationRow).join('')) +
		// Last, and on paper its own sheet — see the print rules. The reader has
		// to get through the history first; this is what they look at once they
		// have decided to be interested.
		(resume.projects ? showcase(resume.projects, resume.meta?.canonical) : '') +
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
 * rather than as one more row in it. The label is its own span because the
 * underline on hover belongs to the words — run it on the anchor and it goes
 * under the arrow too.
 *
 * It stays on paper. A printed CV with the address of the site on it costs one
 * muted line and saves somebody typing a name into a search box.
 */
/*
 * The one field on the page allowed more than one paragraph. A blank line in
 * the data splits it, because the summary covers two things — the work behind
 * and the work now — and ten unbroken lines at the top of a CV is a wall.
 */
const summary = (text: string): string =>
	text
		.split(/\n{2,}/)
		.map((part) => `<p class="summary">${prose(part.trim())}</p>`)
		.join('');

const tail = (url: string): string =>
	`<footer class="tail">` +
	`<a href="${escape(url)}">${icon('back')}<span>${escape(bareHost(url))}</span></a>` +
	`</footer>`;

/*
 * Machine-readable business card. It claims no experience the page does not
 * claim; the one thing here that is not printed anywhere is `alternateName`,
 * which is identity rather than a claim — see basics.alternateNames.
 */
export function renderJsonLd(resume: Resume): string {
	const { basics } = resume;
	return JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: basics.name,
		...(basics.alternateNames ? { alternateName: basics.alternateNames } : {}),
		url: basics.url,
		email: `mailto:${basics.email}`,
		jobTitle: basics.label,
		/* Left relative like the tag it mirrors. JSON-LD resolves a relative
		   IRI against the page it is embedded in, so this needs no origin —
		   and the renderer stays ignorant of where the site is deployed. */
		...(basics.image ? { image: basics.image } : {}),
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
