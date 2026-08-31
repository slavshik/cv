import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseResume, type Resume } from '../../src/resume.ts';
import { pdfFileName, renderJsonLd, renderResume } from '../../src/render.ts';

const resume = parseResume(JSON.parse(readFileSync('content/resume.json', 'utf8')));
const html = renderResume(resume);

/* `exactOptionalPropertyTypes` is on, so an optional field has to be taken off
   the object rather than set to undefined. */
const withoutImage = (r: Resume): Resume => {
	const basics = { ...r.basics };
	delete basics.image;
	return { ...r, basics };
};

describe('renderResume', () => {
	it('puts the name and the headline in the head', () => {
		expect(html).toContain('<h1>Alexander Slavschik</h1>');
		expect(html).toContain('Senior Frontend Engineer');
	});

	it('shows the open-to-work line only while the flag is set', () => {
		expect(html).toContain('Open to work');
		const quiet = { ...resume, meta: { ...resume.meta, openToWork: false } };
		expect(renderResume(quiet)).not.toContain('Open to work');
	});

	/* The link and the file the CI produces are both derived from the name on
	   the CV. If that ever stops being true, the download button 404s. */
	it('links the download button at the file the build writes', () => {
		expect(pdfFileName(resume)).toBe('Alexander-Slavschik-CV.pdf');
		expect(html).toContain('href="Alexander-Slavschik-CV.pdf" download');
	});

	/* The CDN caches the PDF for four hours at a fixed path, so a new build has
	   to ask for it under a new URL or it hands out the previous document. */
	it('stamps the download link when given a version', () => {
		const stamped = renderResume(resume, { pdfVersion: 'a1b2c3d4' });
		expect(stamped).toContain('href="Alexander-Slavschik-CV.pdf?v=a1b2c3d4" download');
	});

	it('dates an entry from its own span', () => {
		expect(html).toContain('Mar 2020 — Feb 2023');
	});

	it('leaves an unfinished job open-ended', () => {
		const ongoing: Resume = {
			...resume,
			work: [{ name: 'Somewhere', position: 'Engineer', startDate: '2026-01' }],
		};
		expect(renderResume(ongoing)).toContain('Jan 2026 — Present');
	});

	it('lists pre-2016 roles as one line each, without their descriptions', () => {
		expect(html).toContain('Game Developer (ActionScript)');
		expect(html).toContain('Playtika');
		expect(html).not.toContain('Team of 16–20 developers');
	});

	/* Progressive summarisation: three levels of meaning over the prose. */
	describe('marks', () => {
		/* The portrait is dropped here so the escaping test below can keep
		   asserting that no `<img` survives anywhere in the output — the
		   strongest form of that check, and the portrait is the only tag that
		   would otherwise make it pass for the wrong reason. */
		const withProse = (summary: string): string =>
			renderResume({
				...withoutImage(resume),
				work: [{ name: 'Somewhere', position: 'Engineer', startDate: '2026-01', summary }],
			});

		it('turns the three markers into their elements', () => {
			expect(withProse('**owned it**')).toContain('<strong>owned it</strong>');
			expect(withProse('__a NestJS backend__')).toContain(
				'<span class="term">a NestJS backend</span>',
			);
			expect(withProse('==436 releases==')).toContain('<mark>436 releases</mark>');
		});

		it('marks highlights as well as summaries', () => {
			const out = renderResume({
				...resume,
				work: [
					{
						name: 'Somewhere',
						position: 'Engineer',
						startDate: '2026-01',
						highlights: ['**Built** it'],
					},
				],
			});
			expect(out).toContain('<li><strong>Built</strong> it</li>');
		});

		it('escapes before it marks, so the data file cannot open a tag', () => {
			const out = withProse('**<img src=x onerror=1>**');
			expect(out).toContain('<strong>&lt;img src=x onerror=1&gt;</strong>');
			expect(out).not.toContain('<img');
		});

		it('leaves a lone marker alone', () => {
			expect(withProse('2 ** 8 is 256')).toContain('2 ** 8 is 256');
		});

		/* The labels above the fold are not prose and must not be parsed. */
		it('does not mark headings or dates', () => {
			expect(html).not.toContain('<h3><strong>');
			expect(html).not.toContain('<p class="side"><strong>');
		});
	});

	it('escapes text that would otherwise be markup', () => {
		const nasty: Resume = {
			...resume,
			work: [
				{
					name: '<script>alert(1)</script>',
					position: 'Engineer',
					startDate: '2026-01',
				},
			],
		};
		const out = renderResume(nasty);
		expect(out).not.toContain('<script>alert(1)</script>');
		expect(out).toContain('&lt;script&gt;');
	});

	/* The photograph is an addition to the page, not part of it — docs/adr/0005.
	   Absent has to stay a working state, and when it is there the tag has to
	   carry the attributes that keep it out of the way of the text. */
	describe('the portrait', () => {
		it('is absent unless the data names one', () => {
			expect(renderResume(withoutImage(resume))).not.toContain('class="portrait"');
		});

		it('is there when it does name one', () => {
			expect(html).toContain('class="portrait"');
		});

		it('reserves its box and asks to be fetched last', () => {
			expect(html).toContain('src="portrait.webp"');
			expect(html).toContain('width="264" height="264"');
			expect(html).toContain('fetchpriority="low"');
			expect(html).toContain('decoding="async"');
		});

		/* The name is in the h1 directly beside it; announcing it twice is
		   noise, so the image is explicitly nothing to a screen reader. */
		it('carries an empty alt rather than repeating the name', () => {
			expect(html).toContain('class="portrait" src="portrait.webp" alt=""');
		});
	});
});

describe('renderJsonLd', () => {
	it('claims only what the page shows', () => {
		const data = JSON.parse(renderJsonLd(resume)) as Record<string, unknown>;
		expect(data['name']).toBe('Alexander Slavschik');
		expect(data['sameAs']).toEqual([
			'https://github.com/slavshik',
			'https://www.linkedin.com/in/slavshik',
		]);
		// Every position on this CV has an end date, so there is no current
		// employer to claim.
		expect(data['worksFor']).toEqual([]);
	});
});
