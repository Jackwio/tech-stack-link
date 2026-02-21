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

export interface FilterState {
	selectedStacks: string[];
	keyword: string;
}
