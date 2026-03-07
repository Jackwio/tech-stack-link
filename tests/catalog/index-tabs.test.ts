import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('index page tabs', () => {
	it('renders three tab buttons for projects, gists, and repo topics', () => {
		const page = readFileSync(resolve(process.cwd(), 'src/pages/index.astro'), 'utf8');

		expect(page).toContain('data-tab="projects"');
		expect(page).toContain('data-tab="gists"');
		expect(page).toContain('data-tab="topics"');
	});

	it('contains dedicated panels for gist groups and topic groups', () => {
		const page = readFileSync(resolve(process.cwd(), 'src/pages/index.astro'), 'utf8');

		expect(page).toContain('id="gist-groups"');
		expect(page).toContain('id="topic-groups"');
	});
});
