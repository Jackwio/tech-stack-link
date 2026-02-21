import { describe, expect, it } from 'vitest';
import { parseFilterState, toSearchParams } from '../../src/lib/catalog/query';
import { filterProjects } from '../../src/lib/catalog/filter';
import type { CatalogProject } from '../../src/lib/catalog/types';

describe('filter query state', () => {
	it('parses query string into selected stacks and keyword', () => {
		const state = parseFilterState('?stacks=astro,typescript&q=issue');

		expect(state.selectedStacks).toEqual(['astro', 'typescript']);
		expect(state.keyword).toBe('issue');
	});

	it('serializes state to URLSearchParams and strips empty values', () => {
		const params = toSearchParams({
			selectedStacks: ['typescript', 'astro'],
			keyword: 'catalog',
		});

		expect(params.toString()).toBe('stacks=astro%2Ctypescript&q=catalog');

		const emptyParams = toSearchParams({ selectedStacks: [], keyword: '' });
		expect(emptyParams.toString()).toBe('');
	});

	it('covers homepage filter flow: parse query -> filter -> keep shareable query', () => {
		const projects: CatalogProject[] = [
			{
				id: 'tool-a',
				name: 'Catalog Studio',
				description: 'Astro based explorer',
				repo: 'acme/tool-a',
				stacks: ['astro', 'typescript'],
				tags: ['dashboard'],
				links: [],
				repoUrl: 'https://github.com/acme/tool-a',
				repoMeta: { stars: 0, forks: 0, updatedAt: '2026-02-21T00:00:00.000Z' },
				issues: [],
			},
			{
				id: 'tool-b',
				name: 'React Board',
				description: 'Issue board',
				repo: 'acme/tool-b',
				stacks: ['react'],
				tags: ['dashboard'],
				links: [],
				repoUrl: 'https://github.com/acme/tool-b',
				repoMeta: { stars: 0, forks: 0, updatedAt: '2026-02-21T00:00:00.000Z' },
				issues: [],
			},
		];

		const state = parseFilterState('?stacks=astro&q=catalog');
		const filtered = filterProjects(projects, state);

		expect(filtered.map((project) => project.id)).toEqual(['tool-a']);
		expect(toSearchParams(state).toString()).toBe('stacks=astro&q=catalog');
	});
});
