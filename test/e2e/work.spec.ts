import { expect, test } from '@playwright/test';

/*
 * No screenshot here, for the same reason the jobs list has none: the page is
 * whatever `projects` currently says, and a baseline would be a picture of
 * today's showcase rather than of the design. What is worth pinning are the
 * properties that do not depend on the data — see docs/adr/0007.
 */

test('the showcase page is meant to be found', async ({ page }) => {
	await page.goto('/cv/work/');
	// The opposite of /cv/jobs/, and the one thing that most easily gets
	// copied across when a page is scaffolded from another one.
	await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
		'href',
		'https://slavshik.me/cv/work/',
	);
});

test('the two pages lead to each other', async ({ page }) => {
	await page.goto('/cv/work/');
	await expect(page.getByRole('link', { name: 'Back to the CV' })).toBeVisible();
});

test.describe('without javascript', () => {
	test.use({ javaScriptEnabled: false });

	test('the showcase is still all there', async ({ page }) => {
		await page.goto('/cv/work/');
		await expect(page.locator('h1')).toHaveText('Work');
		// Whether there are entries depends on the data; that the page is
		// served whole rather than assembled in the browser does not.
		await expect(page.locator('.work')).toBeVisible();
	});
});
