import { describe, expect, it } from 'vitest';
import { buildProjectFromRepository, parseBooleanFlag } from '../../src/lib/catalog/discovery';

describe('buildProjectFromRepository', () => {
	it('uses repository topics as stacks and does not emit visibility/sync tags', () => {
		const project = buildProjectFromRepository({
			name: 'awesome-tool',
			nameWithOwner: 'jackwio/awesome-tool',
			description: 'Tooling project',
			isPrivate: true,
			isFork: false,
			isArchived: false,
			primaryLanguage: { name: 'TypeScript' },
			repositoryTopics: {
				nodes: [{ topic: { name: 'astro' } }, { topic: { name: 'cli-tool' } }],
			},
		});

		expect(project.repo).toBe('jackwio/awesome-tool');
		expect(project.stacks).toEqual(['astro', 'cli-tool']);
		expect(project.tags).toEqual([]);
		expect(project.tags).not.toContain('private');
		expect(project.tags).not.toContain('public');
		expect(project.tags).not.toContain('github-sync');
	});

	it('keeps meaningful repo status tags only', () => {
		const project = buildProjectFromRepository({
			name: 'legacy-worker',
			nameWithOwner: 'jackwio/legacy-worker',
			description: 'Legacy worker',
			isPrivate: true,
			isFork: true,
			isArchived: true,
			primaryLanguage: { name: 'Go' },
			repositoryTopics: { nodes: [] },
		});

		expect(project.tags).toEqual(['fork', 'archived']);
	});

	it('falls back to primary language then unknown when topics are empty', () => {
		const langFallback = buildProjectFromRepository({
			name: 'worker',
			nameWithOwner: 'jackwio/worker',
			description: null,
			isPrivate: false,
			isFork: false,
			isArchived: false,
			primaryLanguage: { name: 'Go' },
			repositoryTopics: { nodes: [] },
		});

		expect(langFallback.stacks).toEqual(['go']);

		const unknownFallback = buildProjectFromRepository({
			name: 'mystery',
			nameWithOwner: 'jackwio/mystery',
			description: null,
			isPrivate: false,
			isFork: false,
			isArchived: false,
			primaryLanguage: null,
			repositoryTopics: { nodes: [] },
		});

		expect(unknownFallback.stacks).toEqual(['unknown']);
	});
});

describe('parseBooleanFlag', () => {
	it('parses true/false with default fallback', () => {
		expect(parseBooleanFlag('true', false)).toBe(true);
		expect(parseBooleanFlag('1', false)).toBe(true);
		expect(parseBooleanFlag('false', true)).toBe(false);
		expect(parseBooleanFlag(undefined, true)).toBe(true);
		expect(parseBooleanFlag(undefined, false)).toBe(false);
	});
});
