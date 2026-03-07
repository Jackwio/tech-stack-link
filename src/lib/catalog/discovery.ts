import type { CatalogProject, GistGroup, ProjectInput, TopicGroup } from './types';

export interface DiscoveredGist {
	name: string;
	description: string | null;
	url: string;
}

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
	const tags: string[] = [];
	if (repository.isFork) {
		tags.push('fork');
	}
	if (repository.isArchived) {
		tags.push('archived');
	}
	return tags;
}

export function buildProjectFromRepository(repository: DiscoveredRepository): ProjectInput {
	const topics = uniq(
		repository.repositoryTopics.nodes.map((node) => normalizeToken(node.topic.name)).filter(Boolean),
	);

	return {
		id: buildProjectId(repository.nameWithOwner),
		name: repository.name,
		description: repository.description?.trim() || `Repository ${repository.name}`,
		repo: repository.nameWithOwner,
		stacks: buildStacks(repository),
		topics,
		tags: buildTags(repository),
		links: [],
	};
}

function splitCommaTokens(value: string | null | undefined): string[] {
	return String(value ?? '')
		.split(',')
		.map((item) => normalizeToken(item))
		.filter(Boolean);
}

export function buildGistGroups(gists: DiscoveredGist[]): GistGroup[] {
	const groups = new Map<string, GistGroup['items']>();

	for (const gist of gists) {
		for (const token of splitCommaTokens(gist.description)) {
			const items = groups.get(token) ?? [];
			items.push({ name: gist.name, url: gist.url });
			groups.set(token, items);
		}
	}

	return [...groups.entries()]
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([label, items]) => ({ label, items }));
}

export function buildTopicGroups(projects: CatalogProject[]): TopicGroup[] {
	const groups = new Map<string, TopicGroup['items']>();

	for (const project of projects) {
		for (const topic of project.topics) {
			const matchingIssues = project.issues
				.filter((issue) => issue.title.toLowerCase().includes(topic.toLowerCase()))
				.map((issue) => ({ title: issue.title, url: issue.url }));
			const items = groups.get(topic) ?? [];
			items.push({
				name: project.name,
				url: project.repoUrl,
				issues: matchingIssues,
			});
			groups.set(topic, items);
		}
	}

	return [...groups.entries()]
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([label, items]) => ({ label, items }));
}
