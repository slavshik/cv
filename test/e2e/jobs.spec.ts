import { expect, test } from '@playwright/test';

/*
 * No screenshot here on purpose: the list is rewritten by every morning's
 * sweep, so a baseline would be red by breakfast and would say nothing when it
 * was. What is worth pinning is the two properties that keep a public page
 * out of the way — see docs/adr/0006 — and they do not depend on the data.
 */

test('the jobs page keeps itself out of search', async ({ page }) => {
	await page.goto('/cv/jobs/');
	const robots = page.locator('meta[name="robots"]');
	await expect(robots).toHaveAttribute('content', /noindex/);
});

test('nothing on the CV points at it', async ({ page }) => {
	await page.goto('/cv/');
	await expect(page.locator('a[href*="jobs"]')).toHaveCount(0);
});

test.describe('without javascript', () => {
	test.use({ javaScriptEnabled: false });

	test('the list is still all there', async ({ page }) => {
		await page.goto('/cv/jobs/');
		await expect(page.locator('h1')).toHaveText('Jobs');
		// Whether there are rows depends on whether a sweep has run; that the
		// page is served whole rather than assembled in the browser does not.
		await expect(page.locator('.jobs')).toBeVisible();
	});
});
