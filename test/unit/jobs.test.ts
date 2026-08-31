import { describe, expect, it } from 'vitest';
import { parseJobDay, renderJobs, type JobDay, type Posting } from '../../src/jobs.ts';

/* Fixtures rather than content/jobs/*.json: the real files are rewritten by
   every sweep, so a test that read them would pass or fail by the weather. */
const posting = (over: Partial<Posting> = {}): Posting => ({
	title: 'Senior Frontend Engineer',
	company: 'Acme',
	loc: 'Warsaw, Mazowieckie, Poland',
	posted: '2026-08-28',
	url: 'https://www.linkedin.com/jobs/view/1',
	score: 9,
	new: true,
	firstSeen: '2026-08-31',
	...over,
});

const day = (over: Partial<JobDay> = {}): JobDay => ({
	date: '2026-08-31',
	swept: 200,
	jobs: [posting()],
	...over,
});

describe('renderJobs', () => {
	it('links a row at the posting', () => {
		const html = renderJobs([day()]);
		expect(html).toContain('href="https://www.linkedin.com/jobs/view/1"');
		expect(html).toContain('Senior Frontend Engineer');
	});

	it('badges what the sweep had not seen before, and scores the rest', () => {
		const html = renderJobs([
			day({ jobs: [posting(), posting({ new: false, url: 'https://x.test/2', score: 6 })] }),
		]);
		expect(html).toContain('<span class="mark">new</span>');
		expect(html).toContain('<span class="mark">6</span>');
	});

	/* The age of a posting is measured against the sweep that found it. A
	   rebuild on a quiet Sunday must not make every row three days older. */
	it('ages a posting against its own sweep, never against the clock', () => {
		const html = renderJobs([day()]);
		expect(html).toContain('28 Aug · 3d');
	});

	it('dates a posting the sweep first saw earlier', () => {
		const html = renderJobs([
			day({ jobs: [posting({ new: false, firstSeen: '2026-08-24' })] }),
		]);
		expect(html).toContain('seen 24 Aug');
	});

	/*
	 * The archive is the point of keeping the files. A posting still open turns
	 * up in every run until it closes, so an earlier day that reprinted its
	 * whole list would bury the four rows that actually appeared that morning.
	 */
	it('shows earlier days as only what was new on them', () => {
		const html = renderJobs([
			day(),
			day({
				date: '2026-08-30',
				jobs: [
					posting({ title: 'Appeared on Saturday', url: 'https://x.test/3' }),
					posting({ title: 'Carried over', url: 'https://x.test/4', new: false }),
				],
			}),
		]);
		expect(html).toContain('Appeared on Saturday');
		expect(html).not.toContain('Carried over');
		expect(html).toContain('1 new');
	});

	it('puts the newest sweep first whatever order the files arrive in', () => {
		const html = renderJobs([day({ date: '2026-08-29' }), day({ date: '2026-08-31' })]);
		expect(html.indexOf('31 Aug')).toBeLessThan(html.indexOf('29 Aug'));
	});

	it('says what it threw away, so a thin day is not read as a broken sweep', () => {
		const html = renderJobs([day({ swept: 200, dropped: { Angular: 7, 'too junior': 1 } })]);
		expect(html).toContain('200 swept, 199 dropped');
		expect(html).toContain('Angular 7');
	});

	it('builds before the first sweep has ever run', () => {
		expect(renderJobs([])).toContain('No sweep has run yet');
	});

	/* Every string on this page came off somebody else's site. */
	it('escapes a scraped title', () => {
		const html = renderJobs([
			day({ jobs: [posting({ title: 'Dev <script>alert(1)</script>' })] }),
		]);
		expect(html).not.toContain('<script>alert(1)</script>');
		expect(html).toContain('&lt;script&gt;');
	});
});

describe('parseJobDay', () => {
	it('accepts what jobsweep publish writes', () => {
		expect(parseJobDay(day(), 'fixture.json').jobs).toHaveLength(1);
	});

	it('refuses a row whose link is not a web address', () => {
		const bad = day({ jobs: [posting({ url: 'javascript:alert(1)' })] });
		expect(() => parseJobDay(bad, 'fixture.json')).toThrow(/must be an http\(s\) URL/);
	});

	it('names the file and the field it choked on', () => {
		const bad = day({ jobs: [posting({ posted: 'yesterday' })] });
		expect(() => parseJobDay(bad, '2026-08-31.json')).toThrow(
			/2026-08-31\.json\.jobs\[0\]\.posted must be YYYY-MM-DD/,
		);
	});
});
