import type { ProjectInput } from './types';

export interface DiscoveredRepository {
	name: string;
	nameWithOwner: string;
	description: string | null;
	isPrivate: boolean;
	isFork: boolean;
	isArchived: boolean;
	primaryLanguage: { name: string } | null;
	repositoryTopics: {
		nodes: Array<{ topic: { name: string } }>;
	};
}

function normalizeToken(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-');
}

function uniq(values: string[]): string[] {
	return [...new Set(values)];
}

export function parseBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
	if (value === undefined) {
		return defaultValue;
	}

	const normalized = value.trim().toLowerCase();
	if (['1', 'true', 'yes', 'on'].includes(normalized)) {
		return true;
	}
	if (['0', 'false', 'no', 'off'].includes(normalized)) {
		return false;
	}
	return defaultValue;
}

function buildProjectId(nameWithOwner: string): string {
	return normalizeToken(nameWithOwner).replace(/[^a-z0-9-]/g, '-');
}

function buildStacks(repository: DiscoveredRepository): string[] {
	const fromTopics = repository.repositoryTopics.nodes.map((node) => normalizeToken(node.topic.name)).filter(Boolean);
	if (fromTopics.length > 0) {
		return uniq(fromTopics);
	}

	if (repository.primaryLanguage?.name) {
		return [normalizeToken(repository.primaryLanguage.name)];
	}

	return ['unknown'];
}

function buildTags(repository: DiscoveredRepository): string[] {
	const tags = [repository.isPrivate ? 'private' : 'public', 'github-sync'];
	if (repository.isFork) {
		tags.push('fork');
	}
	if (repository.isArchived) {
		tags.push('archived');
	}
	return tags;
}

export function buildProjectFromRepository(repository: DiscoveredRepository): ProjectInput {
	return {
		id: buildProjectId(repository.nameWithOwner),
		name: repository.name,
		description: repository.description?.trim() || `Repository ${repository.name}`,
		repo: repository.nameWithOwner,
		stacks: buildStacks(repository),
		tags: buildTags(repository),
		links: [],
	};
}
