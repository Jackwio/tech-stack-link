export type IssueState = 'OPEN' | 'CLOSED';

export interface ProjectLink {
	label: string;
	url: string;
}

export interface ProjectInput {
	id: string;
	name: string;
	description: string;
	repo: string;
	stacks: string[];
	topics: string[];
	tags: string[];
	links: ProjectLink[];
}

export interface RepoMeta {
	stars: number;
	forks: number;
	updatedAt: string;
}

export interface CatalogIssue {
	number: number;
	title: string;
	state: IssueState;
	labels: string[];
	updatedAt: string;
	url: string;
}

export interface CatalogProject extends ProjectInput {
	repoUrl: string;
	repoMeta: RepoMeta;
	issues: CatalogIssue[];
}

export interface GistCard {
	name: string;
	url: string;
}

export interface GistGroup {
	label: string;
	items: GistCard[];
}

export interface TopicIssueCard {
	title: string;
	url: string;
}

export interface TopicRepoCard {
	name: string;
	url: string;
	issues: TopicIssueCard[];
}

export interface TopicGroup {
	label: string;
	items: TopicRepoCard[];
}

export interface CatalogSnapshot {
	projects: CatalogProject[];
	gistGroups: GistGroup[];
	topicGroups: TopicGroup[];
	syncedAt: string;
}

export interface FilterState {
	selectedStacks: string[];
	keyword: string;
}
