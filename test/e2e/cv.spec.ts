import { expect, test } from '@playwright/test';

/*
 * One screenshot per viewport, plus the two things that must survive a redesign:
 * the page reads without JavaScript, and the phone number is not on it.
 *
 * ?aqa=1 pins the accent to its daytime value. Without it the same commit would
 * produce four different pictures over a day.
 */

test('page', async ({ page }) => {
	await page.goto('/cv/?aqa=1');
	await expect(page.locator('h1')).toHaveText('Alexander Slavschik');
	await expect(page).toHaveScreenshot('page.png', { fullPage: true });
});

test('no phone number reaches the web page', async ({ page }) => {
	await page.goto('/cv/');
	expect(await page.content()).not.toMatch(/\+?48\s?\d{3}\s?\d{3}\s?\d{3}/);
});

/*
 * The marks are a reading aid for the screen. The PDF is rendered from this
 * same page under `@media print`, so the only thing keeping them out of a CV
 * somebody receives is the print stylesheet.
 */
test('the marks come off in print', async ({ page }) => {
	await page.goto('/cv/?aqa=1');
	await page.emulateMedia({ media: 'print' });

	// Every one of them, not the first. The rules that undo the marks are scoped
	// to the containers the prose was in when they were written, and a new
	// container is exactly how one gets missed: a marked summary printed in bold
	// for a while because the rule said `.body strong` and the summary is not
	// inside `.body`.
	const computed = async (selector: string, property: string): Promise<string[]> => {
		const values = await page
			.locator(selector)
			.evaluateAll(
				(nodes, prop) => nodes.map((n) => getComputedStyle(n).getPropertyValue(prop)),
				property,
			);
		expect(values.length, `nothing matched ${selector}`).toBeGreaterThan(0);
		return [...new Set(values)];
	};

	expect(await computed('strong', 'font-weight')).toEqual(['400']);
	expect(await computed('.term', 'text-decoration-line')).toEqual(['none']);
	expect(await computed('mark', 'background-color')).toEqual(['rgba(0, 0, 0, 0)']);
});

test.describe('without javascript', () => {
	test.use({ javaScriptEnabled: false });

	test('the CV is still all there', async ({ page }) => {
		await page.goto('/cv/');
		await expect(page.locator('h1')).toHaveText('Alexander Slavschik');
		await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Download PDF' })).toBeVisible();
		// The theme button reveals itself from JavaScript and must stay hidden.
		await expect(page.locator('#theme')).toBeHidden();
	});
});
