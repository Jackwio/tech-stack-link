import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('project card content visibility', () => {
	it('uses card title as repo link and removes separate Repo anchor text', () => {
		const page = readFileSync(resolve(process.cwd(), 'src/pages/index.astro'), 'utf8');

		expect(page).toMatch(
			/<h2>\s*<a href="\$\{escapeHtml\(repoHref\)\}" target="_blank" rel="noreferrer">\$\{escapeHtml\(project\.name\)\}<\/a>\s*<\/h2>/,
		);
		expect(page).not.toContain('>Repo</a>');
	});

	it('hides description and repo stats rows in project card markup', () => {
		const page = readFileSync(resolve(process.cwd(), 'src/pages/index.astro'), 'utf8');

		expect(page).not.toContain('<p class="project-desc">');
		expect(page).not.toContain('<p class="repo-meta">');
	});

	it('removes hero stats chips from header', () => {
		const page = readFileSync(resolve(process.cwd(), 'src/pages/index.astro'), 'utf8');

		expect(page).not.toContain('class="hero-stats"');
		expect(page).not.toContain('Snapshot Issues');
	});

	it('filters out hidden tag tokens from card chips and stack filter options', () => {
		const page = readFileSync(resolve(process.cwd(), 'src/pages/index.astro'), 'utf8');

		expect(page).toContain("const hiddenTagTokens = new Set(['public', 'private', 'github-sync', 'unknown']);");
		expect(page).toContain('.filter((value) => isVisibleTag(value))');
	});
});
