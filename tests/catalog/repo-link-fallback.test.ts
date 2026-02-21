import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('project card repo link', () => {
	it('builds repo link from project.repo slug', () => {
		const page = readFileSync(resolve(process.cwd(), 'src/pages/index.astro'), 'utf8');
		expect(page).toContain('https://github.com/${project.repo}');
	});
});
