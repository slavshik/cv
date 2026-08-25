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
