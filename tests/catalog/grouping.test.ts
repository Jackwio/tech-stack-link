import { describe, expect, it } from 'vitest';
import {
	buildGistGroups,
	buildTopicGroups,
	type DiscoveredGist,
} from '../../src/lib/catalog/discovery';
import type { CatalogProject } from '../../src/lib/catalog/types';

describe('buildGistGroups', () => {
	it('splits gist descriptions by comma and groups gist cards by token', () => {
		const gists: DiscoveredGist[] = [
			{
				name: 'astro-snippet',
				description: 'astro, tooling',
				url: 'https://gist.github.com/acme/1',
			},
			{
				name: 'issue-helper',
				description: 'tooling',
				url: 'https://gist.github.com/acme/2',
			},
		];

		expect(buildGistGroups(gists)).toEqual([
			{
				label: 'astro',
				items: [{ name: 'astro-snippet', url: 'https://gist.github.com/acme/1' }],
			},
			{
				label: 'tooling',
				items: [
					{ name: 'astro-snippet', url: 'https://gist.github.com/acme/1' },
					{ name: 'issue-helper', url: 'https://gist.github.com/acme/2' },
				],
			},
		]);
	});
});

describe('buildTopicGroups', () => {
	it('groups repositories by topic and keeps only issues whose title contains that topic', () => {
		const projects: CatalogProject[] = [
			{
				id: 'alpha',
				name: 'Alpha',
				description: 'Alpha repo',
				repo: 'acme/alpha',
				stacks: ['astro'],
				topics: ['astro'],
				tags: [],
				links: [],
				repoUrl: 'https://github.com/acme/alpha',
				repoMeta: { stars: 1, forks: 0, updatedAt: '2026-03-07T00:00:00.000Z' },
				issues: [
					{
						number: 1,
						title: 'astro docs update',
						state: 'OPEN',
						labels: [],
						updatedAt: '2026-03-07T00:00:00.000Z',
						url: 'https://github.com/acme/alpha/issues/1',
					},
					{
						number: 2,
						title: 'refresh homepage copy',
						state: 'OPEN',
						labels: [],
						updatedAt: '2026-03-07T00:00:00.000Z',
						url: 'https://github.com/acme/alpha/issues/2',
					},
				],
			},
		];

		expect(buildTopicGroups(projects)).toEqual([
			{
				label: 'astro',
				items: [
					{
						name: 'Alpha',
						url: 'https://github.com/acme/alpha',
						issues: [{ title: 'astro docs update', url: 'https://github.com/acme/alpha/issues/1' }],
					},
				],
			},
		]);
	});
});
