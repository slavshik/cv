import { defineConfig, devices } from '@playwright/test';

/*
 * Screenshot tests run against the built site, not the dev server: what is
 * checked has to be what ships.
 *
 * Baselines are taken inside the pinned Playwright container and compared
 * there — see `make e2e`. macOS and CI Linux render type differently, and a
 * baseline taken somewhere other than where it is compared means nothing.
 */

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;

export default defineConfig({
	testDir: 'test/e2e',
	snapshotPathTemplate: 'test/e2e/__screenshots__/{projectName}/{arg}{ext}',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: 0,
	reporter: process.env.CI ? [['github'], ['list']] : [['list']],

	use: {
		baseURL: BASE,
	},

	expect: {
		toHaveScreenshot: {
			// The page has no animation and no randomness; ?aqa=1 pins the one
			// thing that moves, the accent. A diff here is a real change.
			maxDiffPixels: 0,
			animations: 'disabled',
		},
	},

	projects: [
		{
			name: 'desktop',
			use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
		},
		{
			name: 'tablet',
			use: { ...devices['Desktop Chrome'], viewport: { width: 834, height: 1112 } },
		},
		{
			name: 'mobile',
			use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
		},
	],

	webServer: {
		// --host is required: without it vite listens on localhost, which inside
		// the container resolves to ::1 first and the 127.0.0.1 poll never lands.
		command: `npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
		url: `${BASE}/cv/`,
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
	},
});
