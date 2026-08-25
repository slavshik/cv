import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['dist', 'node_modules', 'test-results', 'playwright-report', '.claude'],
	},
	js.configs.recommended,
	tseslint.configs.recommended,
	{
		// Everything in src ships to the browser: no node globals here.
		files: ['src/**/*.ts'],
		languageOptions: {
			globals: { ...globals.browser },
		},
	},
	{
		// Tests, build scripts and configs live in node, but page.evaluate()
		// runs in the browser and is written right here — both sets are needed.
		files: ['test/**/*.{ts,mjs}', 'scripts/**/*.mjs', '*.config.{ts,js}'],
		languageOptions: {
			globals: { ...globals.node, ...globals.browser },
		},
	},
);
