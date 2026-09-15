import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseResume, type Resume } from '../../src/resume.ts';
import { renderWork } from '../../src/work.ts';

const resume = parseResume(JSON.parse(readFileSync('content/resume.json', 'utf8')));

const render = (projects: Resume['projects']): string =>
	renderWork({ ...resume, ...(projects ? { projects } : {}) });

const game = (name: string, extra: Partial<NonNullable<Resume['projects']>[number]> = {}) => ({
	name,
	type: 'Slot game',
	entity: 'A Studio',
	url: `https://games.example.com/${name.toLowerCase()}`,
	...extra,
});

describe('renderWork', () => {
	/* `projects` is optional. An empty page has to say so rather than render a
	   heading over nothing. */
	it('says so when there is nothing to show', () => {
		const bare = { ...resume };
		delete bare.projects;
		expect(renderWork(bare)).toContain('Nothing here yet');
	});

	/*
	 * The whole point of the page: one heading per studio, not one per title.
	 * Flat, twelve entries name their studio twelve times over.
	 */
	it('groups titles under the studio they were built at', () => {
		const out = render([
			game('Alpha'),
			game('Beta'),
			game('Gamma', { entity: 'Another Studio' }),
		]);
		expect(out.match(/<h2>A Studio<\/h2>/g)).toHaveLength(1);
		expect(out.match(/<h2>Another Studio<\/h2>/g)).toHaveLength(1);
		expect(out).toContain('<a href="https://games.example.com/alpha" rel="noopener">Alpha</a>');
	});

	/* Groups appear in the order their studio first does, which is the order
	   `projects` is written in — the work history, newest first. */
	it('keeps the studios in the order they first appear', () => {
		const out = render([
			game('Alpha', { entity: 'First' }),
			game('Beta', { entity: 'Second' }),
		]);
		expect(out.indexOf('First')).toBeLessThan(out.indexOf('Second'));
	});

	/*
	 * Anything the whole group agrees on is written once, above the titles. That
	 * is what stops "Slot game on Cocos Creator 2" appearing four times running.
	 */
	describe('what the group shares', () => {
		it('hoists the kind and the role', () => {
			const out = render([
				game('Alpha', { roles: ['Game team'] }),
				game('Beta', { roles: ['Game team'] }),
			]);
			expect(out).toContain('<p class="what">Slot game · Game team</p>');
			// Written once above, so it is off the rows entirely.
			expect(out).not.toContain('<span class="where">');
		});

		it('leaves what the group disagrees about on the row', () => {
			const out = render([game('Alpha'), game('Beta', { type: 'Card game' })]);
			expect(out).not.toContain('class="what"');
			expect(out).toContain('<span class="where">Slot game</span>');
			expect(out).toContain('<span class="where">Card game</span>');
		});
	});

	/*
	 * Thumbnails are coming and will arrive a few at a time. A group halfway
	 * through gaining them must not end up with two different name columns.
	 */
	describe('thumbnails', () => {
		it('reserves the slot for every row once one has a picture', () => {
			const out = render([game('Alpha', { image: 'alpha.webp' }), game('Beta')]);
			expect(out).toContain('class="items with-thumbs"');
			expect(out).toContain('<img class="thumb" src="alpha.webp"');
			expect(out).toContain('<span class="thumb is-empty" aria-hidden="true"></span>');
		});

		it('reserves nothing when no row has one', () => {
			const out = render([game('Alpha'), game('Beta')]);
			expect(out).not.toContain('with-thumbs');
			expect(out).not.toContain('is-empty');
		});

		/* The box is held open before the file lands, and the name beside it is
		   what a screen reader should read — once. */
		it('reserves the box and says nothing to a screen reader', () => {
			const out = render([game('Alpha', { image: 'alpha.webp' })]);
			expect(out).toContain('alt="" width="224" height="140"');
			expect(out).toContain('loading="lazy"');
		});
	});

	/*
	 * The name is the link and nothing else on the page is an address. Printing
	 * the URL beside it is what a document does because it cannot be clicked;
	 * this is a page.
	 */
	it('prints no address anywhere, only links', () => {
		const out = render([game('Alpha'), game('Beta', { entity: 'Another Studio' })]);
		expect(out).toContain('href="https://games.example.com/alpha"');
		// The href is the only place the address may appear.
		expect(out.replace(/href="[^"]*"/g, '')).not.toContain('games.example.com');
	});

	it('leaves a title with no URL as plain text', () => {
		const out = render([{ name: 'Unpublished' }]);
		expect(out).toContain('<span class="name">Unpublished</span>');
	});

	/* A spell that begins and ends inside one year reads like a typo as
	   "2020 — 2020", the same rule the CV uses. */
	it('collapses a span inside a single year', () => {
		const out = render([{ name: 'A', startDate: '2020-01', endDate: '2020-11' }]);
		expect(out).toContain('>2020<');
	});

	/* The marks are the CV's, and this page renders the same prose. */
	it('renders the marks and escapes before it does', () => {
		const out = render([
			{ name: 'X', description: '**Built** it', highlights: ['<img src=x> and __a thing__'] },
		]);
		expect(out).toContain('<strong>Built</strong> it');
		expect(out).toContain('<span class="term">a thing</span>');
		expect(out).not.toContain('<img src=x');
	});

	it('escapes a name that would otherwise be markup', () => {
		expect(render([{ name: '<script>alert(1)</script>' }])).not.toContain('<script>alert');
	});
});
