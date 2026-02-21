import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('index page client script', () => {
	it('does not import internal TS modules directly from inline browser script', () => {
		const page = readFileSync(resolve(process.cwd(), 'src/pages/index.astro'), 'utf8');

		expect(page).not.toMatch(/import\s+\{\s*filterProjects\s*\}\s+from\s+['"]\.\.\/lib\/catalog\/filter['"]/);
		expect(page).not.toMatch(
			/import\s+\{\s*parseFilterState\s*,\s*toSearchParams\s*\}\s+from\s+['"]\.\.\/lib\/catalog\/query['"]/,
		);
	});
});
