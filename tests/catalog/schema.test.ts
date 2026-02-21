import { describe, expect, it } from 'vitest';
import { parseProjectsYaml } from '../../src/lib/catalog/schema';

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
});
