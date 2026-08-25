/*
 * The shape of content/resume.json.
 *
 * The file follows JSON Resume v1.0.0 — a published standard, so the data
 * outlives this particular page and other tools can read it. There is exactly
 * one extension to the standard, `meta.openToWork`, because the schema has no
 * field for "currently looking" and the page needs one.
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
	label: string;
	email: string;
	url: string;
	summary: string;
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

export interface Project {
	name: string;
	startDate: string;
	endDate?: string;
	description?: string;
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

export interface Certificate {
	name: string;
	issuer: string;
	date: string;
}

export interface Language {
	language: string;
	fluency: string;
}

export interface Resume {
	basics: Basics;
	work: Work[];
	projects: Project[];
	skills: Skill[];
	education: Education[];
	certificates: Certificate[];
	languages: Language[];
	meta?: { canonical?: string; version?: string; openToWork?: boolean };
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

	each(raw['projects'], 'projects', (p, at) => {
		str(p['name'], `${at}.name`);
		date(p['startDate'], `${at}.startDate`);
		optDate(p['endDate'], `${at}.endDate`);
		optStr(p['description'], `${at}.description`);
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

	each(raw['certificates'], 'certificates', (c, at) => {
		str(c['name'], `${at}.name`);
		str(c['issuer'], `${at}.issuer`);
		date(c['date'], `${at}.date`);
	});

	each(raw['languages'], 'languages', (l, at) => {
		str(l['language'], `${at}.language`);
		str(l['fluency'], `${at}.fluency`);
	});
}

export function parseResume(raw: unknown): Resume {
	assertResume(raw);
	return raw;
}
