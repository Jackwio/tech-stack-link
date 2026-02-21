import type { CatalogIssue, IssueState } from './types';

type GitHubLabel = { name?: string } | string;

export interface GitHubIssuePayload {
	number: number;
	title: string;
	state: string;
	labels?: GitHubLabel[];
	updated_at: string;
	html_url: string;
	pull_request?: unknown;
}

function normalizeIssueState(value: string): IssueState {
	return value.toUpperCase() === 'CLOSED' ? 'CLOSED' : 'OPEN';
}

function normalizeLabel(label: GitHubLabel): string {
	if (typeof label === 'string') {
		return label;
	}
	return label.name ?? '';
}

export function isPullRequestIssue(issue: Pick<GitHubIssuePayload, 'pull_request'>): boolean {
	return Boolean(issue.pull_request);
}

export function normalizeIssue(issue: GitHubIssuePayload): CatalogIssue {
	return {
		number: issue.number,
		title: issue.title,
		state: normalizeIssueState(issue.state),
		labels: (issue.labels ?? []).map(normalizeLabel).filter(Boolean),
		updatedAt: issue.updated_at,
		url: issue.html_url,
	};
}
