import { describe, expect, it } from 'vitest';
import { hitQuery, optedOut } from '../../src/hit.ts';

const base = {
	path: '/cv/',
	search: '',
	referrer: '',
	viewport: '1440x900',
	dpr: 2,
	theme: 'auto',
	nonce: 'abcd1234',
	origin: 'https://slavshik.me',
};

const params = (q: string): URLSearchParams => new URLSearchParams(q);

describe('hitQuery', () => {
	it('names the page every time', () => {
		expect(params(hitQuery(base)).get('p')).toBe('/cv/');
		expect(params(hitQuery({ ...base, path: '/cv/jobs/' })).get('p')).toBe('/cv/jobs/');
	});

	/* A visit from the site's own front page is a step inside the site, not a
	   source, and reporting it as one would invent traffic that never arrived. */
	it('drops a referrer from our own origin', () => {
		const q = params(hitQuery({ ...base, referrer: 'https://slavshik.me/' }));
		expect(q.get('r')).toBeNull();
	});

	/* Query strings carry tokens and mail addresses. Where from needs the host. */
	it('keeps origin and path of a foreign referrer and nothing else', () => {
		const q = params(
			hitQuery({ ...base, referrer: 'https://www.linkedin.com/in/x?token=secret' }),
		);
		expect(q.get('r')).toBe('https://www.linkedin.com/in/x');
	});

	it('shortens the utm keys of a marked link', () => {
		const q = params(hitQuery({ ...base, search: '?utm_source=linkedin&utm_medium=profile' }));
		expect(q.get('u')).toBe('linkedin');
		expect(q.get('m')).toBe('profile');
		expect(q.get('c')).toBeNull();
	});

	/* Most screens are 1, and the parameter would then say nothing at all. */
	it('sends the pixel ratio only when it is not one', () => {
		expect(params(hitQuery(base)).get('d')).toBe('2');
		expect(params(hitQuery({ ...base, dpr: 1 })).get('d')).toBeNull();
	});

	it('truncates anything absurdly long', () => {
		const q = params(hitQuery({ ...base, path: '/cv/' + 'x'.repeat(400) }));
		expect(q.get('p')).toHaveLength(128);
	});
});

describe('optedOut', () => {
	it('honours Do-Not-Track and Global Privacy Control', () => {
		expect(optedOut({ doNotTrack: '1' } as Navigator)).toBe(true);
		expect(optedOut({ globalPrivacyControl: true } as unknown as Navigator)).toBe(true);
		expect(optedOut({ doNotTrack: null } as unknown as Navigator)).toBe(false);
	});
});
