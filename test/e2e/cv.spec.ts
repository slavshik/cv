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

	await expect(page.locator('mark').first()).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
	await expect(page.locator('.term').first()).toHaveCSS('text-decoration-line', 'none');
	await expect(page.locator('.body strong').first()).toHaveCSS('font-weight', '400');
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
