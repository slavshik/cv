import { defineConfig } from 'vitest/config';

/*
 * Unit tests only. test/e2e belongs to Playwright, and without this scope
 * vitest would happily pick those files up and fail on the first `test.use`.
 */
export default defineConfig({
	test: {
		include: ['test/unit/**/*.test.ts'],
	},
});
