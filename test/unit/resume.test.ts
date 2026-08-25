import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import jsonResume from '@jsonresume/schema';
import { parseResume } from '../../src/resume.ts';

const raw: unknown = JSON.parse(readFileSync('content/resume.json', 'utf8'));

describe('content/resume.json', () => {
	it('has the shape the renderer relies on', () => {
		expect(() => parseResume(raw)).not.toThrow();
	});

	/* The point of using a published schema is that other tools can read this
	   file. That only holds while it actually validates. */
	it('conforms to the published JSON Resume schema', async () => {
		const errors = await new Promise<unknown[] | null>((done) => {
			jsonResume.validate(raw, (errs) => {
				done(errs);
			});
		});
		expect(errors).toBeNull();
	});
});

describe('parseResume', () => {
	const good = parseResume(raw);

	it('names the field that is wrong', () => {
		const broken = structuredClone(good) as { work: { startDate: string }[] };
		const job = broken.work[0];
		if (job) job.startDate = 'September 2025';
		expect(() => parseResume(broken)).toThrow(/work\[0\]\.startDate must be YYYY or YYYY-MM/);
	});

	it('rejects an empty string where text is required', () => {
		const broken = structuredClone(good) as { basics: { name: string } };
		broken.basics.name = '   ';
		expect(() => parseResume(broken)).toThrow(/basics\.name/);
	});
});
