/*
 * The shape of content/resume.json.
 *
 * The file follows JSON Resume v1.0.0 — a published standard, so the data
 * outlives this particular page and other tools can read it. There are two
 * extensions to the standard, both under `meta`, which is where the schema
 * itself puts "any other tooling configuration": `openToWork`, because the
 * schema has no field for "currently looking", and `pdfRole`, the role the
 * downloadable file is named after. `additionalProperties` is true throughout,
 * so neither costs the file its conformance — see docs/adr/0002.
 *
 * `parseResume` is deliberately narrow: it checks the shape the renderer
 * actually relies on and nothing more. Conformance to the full published schema
 * is a separate concern and is tested in test/unit/resume.test.ts. The point of
 * checking here is that a typo in the data file fails the build loudly instead
 * of printing "undefined" into somebody's CV.
 */

export interface Profile {
	network: string;
	username: string;
	url: string;
}

export interface Basics {
	name: string;
	/* Optional. The other spellings of the same person — the passport
	   transliteration and the handle every profile is under. They stay off the
	   page and out of the PDF: a CV header carries one name, or a parser reads
	   "Alexander (Aliaksandr)" as a first name. JSON-LD is where they belong,
	   so a search for either form resolves to the same Person. */
	alternateNames?: string[];
	label: string;
	email: string;
	url: string;
	summary: string;
	/* Optional, and relative like every other path on this page. Absent is the
	   normal state: the header simply has no second column. */
	image?: string;
	location: { city: string; region?: string; countryCode: string };
	profiles: Profile[];
}

export interface Work {
	name: string;
	position: string;
	location?: string;
	startDate: string;
	endDate?: string;
	summary?: string;
	highlights?: string[];
	keywords?: string[];
}

/* Showcase entries — the things that were built, as opposed to the places
   they were built at. Every field but the name is optional, including the
   dates: a personal project that is still running often has no start worth
   printing, and one that is no longer online still has a name. Each of these
   is a standard JSON Resume field; the showcase needed no extension. */
export interface Project {
	name: string;
	startDate?: string;
	endDate?: string;
	description?: string;
	url?: string;
	/* The company or the site it belongs to, when that is not obvious. */
	entity?: string;
	/* What kind of thing it is — "Slot game", "Engine", "Agent". It sits beside
	   the entity on one mono line, and it is what stops four games from the
	   same studio needing four copies of the same sentence under them. */
	type?: string;
	/* What he was on it. Only where a source says so — a studio title with no
	   role beside it is a gap, not a claim of having built it alone. */
	roles?: string[];
	/* A thumbnail, shown on /cv/work/ and nowhere else — not on the CV, which is
	   a document, and never in the PDF. Relative to that page, so the files live
	   in `public/work/` and this is a bare filename. Optional, and absent is the
	   normal state: the row simply has no picture and nothing shifts.

	   Not a JSON Resume field. `additionalProperties` is true on projects, so it
	   costs the file nothing — see docs/adr/0002 and 0007. */
	image?: string;
	highlights?: string[];
	keywords?: string[];
}

export interface Skill {
	name: string;
	keywords: string[];
}

export interface Education {
	institution: string;
	area: string;
	studyType?: string;
	startDate: string;
	endDate: string;
	note?: string;
}

export interface Language {
	language: string;
	fluency: string;
}

export interface Resume {
	basics: Basics;
	work: Work[];
	/* Optional. Absent is a decision, not an oversight: a project list of bare
	   titles said nothing the work entries above did not already say. See
	   content/TODO.md. */
	projects?: Project[];
	skills: Skill[];
	education: Education[];
	/* Optional, and absent by decision since 2026-09-15 — see content/TODO.md.
	   The renderer drops the section on its own when it is not there. */
	languages?: Language[];
	meta?: { canonical?: string; version?: string; openToWork?: boolean; pdfRole?: string };
}

/* A year, or a year and a month. The renderer prints these; anything else in
   the file is a typo that would reach the page as garbage. */
const DATE = /^\d{4}(-\d{2})?$/;

/* A function declaration, not an arrow: TypeScript only narrows past a
   never-returning call when the callee is declared this way, and the checks
   below lean on `if (!isObject(x)) fail(...)` doing exactly that. */
function fail(where: string, what: string): never {
	throw new Error(`resume.json: ${where} ${what}`);
}

const isObject = (v: unknown): v is Record<string, unknown> =>
	typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (v: unknown, where: string): void => {
	if (typeof v !== 'string' || v.trim() === '') fail(where, 'must be a non-empty string');
};

const optStr = (v: unknown, where: string): void => {
	if (v !== undefined) str(v, where);
};

const date = (v: unknown, where: string): void => {
	str(v, where);
	if (!DATE.test(v as string)) fail(where, 'must be YYYY or YYYY-MM');
};

const optDate = (v: unknown, where: string): void => {
	if (v !== undefined) date(v, where);
};

/* A link in the data becomes an attribute on the page. Anything but an
   http(s) URL there is either a typo or a javascript: scheme, and both should
   fail the build rather than the reader — the same check src/jobs.ts makes of
   the sweep's output. */
const httpUrl = (v: unknown, where: string): void => {
	str(v, where);
	if (!/^https?:\/\//.test(v as string)) fail(where, 'must be an http(s) URL');
};

const list = (v: unknown, where: string): unknown[] => {
	if (!Array.isArray(v) || v.length === 0) fail(where, 'must be a non-empty array');
	return v as unknown[];
};

const strList = (v: unknown, where: string): void => {
	for (const [i, item] of list(v, where).entries()) str(item, `${where}[${i}]`);
};

const each = (
	v: unknown,
	where: string,
	check: (item: Record<string, unknown>, at: string) => void,
): void => {
	for (const [i, item] of list(v, where).entries()) {
		const at = `${where}[${i}]`;
		if (!isObject(item)) fail(at, 'must be an object');
		check(item as Record<string, unknown>, at);
	}
};

function assertResume(raw: unknown): asserts raw is Resume {
	if (!isObject(raw)) fail('root', 'must be an object');

	const basics = raw['basics'];
	if (!isObject(basics)) fail('basics', 'must be an object');
	for (const key of ['name', 'label', 'email', 'url', 'summary'] as const) {
		str(basics[key], `basics.${key}`);
	}
	optStr(basics['image'], 'basics.image');
	if (basics['alternateNames'] !== undefined)
		strList(basics['alternateNames'], 'basics.alternateNames');
	const location = basics['location'];
	if (!isObject(location)) fail('basics.location', 'must be an object');
	str(location['city'], 'basics.location.city');
	str(location['countryCode'], 'basics.location.countryCode');
	optStr(location['region'], 'basics.location.region');
	each(basics['profiles'], 'basics.profiles', (p, at) => {
		str(p['network'], `${at}.network`);
		str(p['username'], `${at}.username`);
		str(p['url'], `${at}.url`);
	});

	each(raw['work'], 'work', (w, at) => {
		str(w['name'], `${at}.name`);
		str(w['position'], `${at}.position`);
		date(w['startDate'], `${at}.startDate`);
		optDate(w['endDate'], `${at}.endDate`);
		optStr(w['location'], `${at}.location`);
		optStr(w['summary'], `${at}.summary`);
		if (w['highlights'] !== undefined) strList(w['highlights'], `${at}.highlights`);
		if (w['keywords'] !== undefined) strList(w['keywords'], `${at}.keywords`);
	});

	if (raw['projects'] !== undefined)
		each(raw['projects'], 'projects', (p, at) => {
			str(p['name'], `${at}.name`);
			optDate(p['startDate'], `${at}.startDate`);
			optDate(p['endDate'], `${at}.endDate`);
			optStr(p['description'], `${at}.description`);
			optStr(p['entity'], `${at}.entity`);
			optStr(p['type'], `${at}.type`);
			if (p['roles'] !== undefined) strList(p['roles'], `${at}.roles`);
			optStr(p['image'], `${at}.image`);
			if (p['url'] !== undefined) httpUrl(p['url'], `${at}.url`);
			if (p['highlights'] !== undefined) strList(p['highlights'], `${at}.highlights`);
			if (p['keywords'] !== undefined) strList(p['keywords'], `${at}.keywords`);
		});

	each(raw['skills'], 'skills', (s, at) => {
		str(s['name'], `${at}.name`);
		strList(s['keywords'], `${at}.keywords`);
	});

	each(raw['education'], 'education', (e, at) => {
		str(e['institution'], `${at}.institution`);
		str(e['area'], `${at}.area`);
		optStr(e['studyType'], `${at}.studyType`);
		optStr(e['note'], `${at}.note`);
		date(e['startDate'], `${at}.startDate`);
		date(e['endDate'], `${at}.endDate`);
	});

	if (raw['languages'] !== undefined)
		each(raw['languages'], 'languages', (l, at) => {
			str(l['language'], `${at}.language`);
			str(l['fluency'], `${at}.fluency`);
		});

	/* The only part of `meta` the page depends on: pdfRole ends up in the name
	   of a downloaded file, so an empty string there would publish a CV called
	   "Alexander-Slavschik--CV.pdf". */
	const meta = raw['meta'];
	if (meta !== undefined) {
		if (!isObject(meta)) fail('meta', 'must be an object');
		optStr(meta['pdfRole'], 'meta.pdfRole');
	}
}

export function parseResume(raw: unknown): Resume {
	assertResume(raw);
	return raw;
}
