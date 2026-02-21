import { describe, expect, it } from 'vitest';
import { filterProjects } from '../../src/lib/catalog/filter';
import type { CatalogProject } from '../../src/lib/catalog/types';

const projects: CatalogProject[] = [
	{
		id: 'a',
		name: 'Astro Toolkit',
		description: 'Searchable stack catalog',
		repo: 'acme/astro-toolkit',
		stacks: ['astro', 'typescript'],
		tags: ['tooling'],
		links: [],
		repoUrl: 'https://github.com/acme/astro-toolkit',
		repoMeta: { stars: 1, forks: 0, updatedAt: '2026-02-21T00:00:00.000Z' },
		issues: [],
	},
	{
		id: 'b',
		name: 'React Commerce',
		description: 'Storefront for products',
		repo: 'acme/react-commerce',
		stacks: ['react', 'typescript'],
		tags: ['commerce'],
		links: [],
		repoUrl: 'https://github.com/acme/react-commerce',
		repoMeta: { stars: 1, forks: 0, updatedAt: '2026-02-21T00:00:00.000Z' },
		issues: [],
	},
	{
		id: 'c',
		name: 'Astro Content Hub',
		description: 'Markdown aggregation',
		repo: 'acme/astro-content',
		stacks: ['astro', 'markdown'],
		tags: ['content'],
		links: [],
		repoUrl: 'https://github.com/acme/astro-content',
		repoMeta: { stars: 1, forks: 0, updatedAt: '2026-02-21T00:00:00.000Z' },
		issues: [],
	},
];

describe('filterProjects', () => {
	it('matches selected stacks with AND logic', () => {
		const filtered = filterProjects(projects, {
			selectedStacks: ['astro', 'typescript'],
			keyword: '',
		});

		expect(filtered.map((item) => item.id)).toEqual(['a']);
	});

	it('matches keyword in name or description case-insensitively', () => {
		const filtered = filterProjects(projects, {
			selectedStacks: [],
			keyword: 'storeFRONT',
		});

		expect(filtered.map((item) => item.id)).toEqual(['b']);
	});
});
