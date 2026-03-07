import { describe, expect, it } from 'vitest';
import { parseCatalogJson, parseProjectsYaml } from '../../src/lib/catalog/schema';

describe('parseProjectsYaml', () => {
	it('parses valid project YAML records', () => {
		const yaml = `
- id: alpha
  name: Alpha Project
  description: Core service
  repo: acme/alpha
  stacks: [astro, typescript]
  tags: [tooling]
  links:
    - label: Demo
      url: https://example.com/demo
`;

		const projects = parseProjectsYaml(yaml);
		expect(projects).toHaveLength(1);
		expect(projects[0].id).toBe('alpha');
		expect(projects[0].stacks).toEqual(['astro', 'typescript']);
		expect(projects[0].links).toEqual([{ label: 'Demo', url: 'https://example.com/demo' }]);
	});

	it('throws when repo is not owner/name format', () => {
		const yaml = `
- id: alpha
  name: Alpha Project
  description: Core service
  repo: invalid_repo_name
  stacks: [astro]
  tags: [tooling]
`;

		expect(() => parseProjectsYaml(yaml)).toThrow(/repo/i);
	});

	it('parses homepage snapshot JSON with project, gist, and topic groups', () => {
		const json = JSON.stringify({
			projects: [
				{
					id: 'alpha',
					name: 'Alpha Project',
					description: 'Core service',
					repo: 'acme/alpha',
					stacks: ['astro'],
					topics: ['astro'],
					tags: ['tooling'],
					links: [],
					repoUrl: 'https://github.com/acme/alpha',
					repoMeta: { stars: 1, forks: 0, updatedAt: '2026-03-07T00:00:00.000Z' },
					issues: [],
				},
			],
			gistGroups: [
				{
					label: 'tooling',
					items: [{ name: 'alpha-snippet', url: 'https://gist.github.com/acme/1' }],
				},
			],
			topicGroups: [
				{
					label: 'astro',
					items: [
						{
							name: 'alpha',
							url: 'https://github.com/acme/alpha',
							issues: [{ title: 'astro docs update', url: 'https://github.com/acme/alpha/issues/1' }],
						},
					],
				},
			],
			syncedAt: '2026-03-07T00:00:00.000Z',
		});

		const snapshot = parseCatalogJson(json);
		expect(snapshot.projects).toHaveLength(1);
		expect(snapshot.gistGroups[0].items[0].name).toBe('alpha-snippet');
		expect(snapshot.topicGroups[0].items[0].issues[0].title).toBe('astro docs update');
	});
});
