import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseResume, type Resume } from '../../src/resume.ts';
import { pdfFileName, renderJsonLd, renderResume } from '../../src/render.ts';

const resume = parseResume(JSON.parse(readFileSync('content/resume.json', 'utf8')));
const html = renderResume(resume);

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
