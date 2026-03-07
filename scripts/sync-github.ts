import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	buildGistGroups,
	buildProjectFromRepository,
	buildTopicGroups,
	parseBooleanFlag,
	type DiscoveredGist,
	type DiscoveredRepository,
} from '../src/lib/catalog/discovery';
import { parseCatalogJson } from '../src/lib/catalog/schema';
import type { CatalogIssue, CatalogProject, CatalogSnapshot, ProjectInput } from '../src/lib/catalog/types';

interface GraphQLIssueNode {
	number: number;
	title: string;
	state: 'OPEN' | 'CLOSED';
	updatedAt: string;
	url: string;
	labels: {
		nodes: Array<{ name: string }>;
	} | null;
}

interface RepositoryIssuesPage {
	repository: {
		url: string;
		stargazerCount: number;
		forkCount: number;
		updatedAt: string;
		issues: {
			nodes: GraphQLIssueNode[];
			pageInfo: {
				hasNextPage: boolean;
				endCursor: string | null;
			};
		};
	} | null;
}

interface OwnerRepositoriesPage {
	repositoryOwner: {
		__typename: 'User' | 'Organization';
		repositories: {
			nodes: DiscoveredRepository[];
			pageInfo: {
				hasNextPage: boolean;
				endCursor: string | null;
			};
		};
	} | null;
}

interface GraphQLResponse<T> {
	data?: T;
	errors?: Array<{ message: string }>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const catalogPath = path.join(rootDir, 'src', 'data', 'catalog.json');
const githubApiGraphql = 'https://api.github.com/graphql';
const githubApiRest = 'https://api.github.com';

const ownerRepositoriesQuery = `
query OwnerRepositories($owner: String!, $after: String, $privacy: RepositoryPrivacy) {
  repositoryOwner(login: $owner) {
    __typename
    ... on User {
      repositories(first: 100, after: $after, ownerAffiliations: OWNER, orderBy: { field: UPDATED_AT, direction: DESC }, privacy: $privacy) {
        nodes {
          name
          nameWithOwner
          description
          isPrivate
          isFork
          isArchived
          primaryLanguage {
            name
          }
          repositoryTopics(first: 20) {
            nodes {
              topic {
                name
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
    ... on Organization {
      repositories(first: 100, after: $after, orderBy: { field: UPDATED_AT, direction: DESC }, privacy: $privacy) {
        nodes {
          name
          nameWithOwner
          description
          isPrivate
          isFork
          isArchived
          primaryLanguage {
            name
          }
          repositoryTopics(first: 20) {
            nodes {
              topic {
                name
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
}
`;

const repositoryIssuesQuery = `
query RepositoryIssues($owner: String!, $name: String!, $after: String) {
  repository(owner: $owner, name: $name) {
    url
    stargazerCount
    forkCount
    updatedAt
    issues(first: 100, after: $after, states: [OPEN, CLOSED], orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes {
        number
        title
        state
        updatedAt
        url
        labels(first: 50) {
          nodes {
            name
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
`;

function splitRepoSlug(repoSlug: string): [owner: string, name: string] {
	const [owner, repo] = repoSlug.split('/');
	if (!owner || !repo) {
		throw new Error(`Invalid repo slug: ${repoSlug}`);
	}
	return [owner, repo];
}

async function fetchGraphQL<T>(
	query: string,
	variables: Record<string, unknown>,
	token: string,
): Promise<{ data: T; remaining: number | null }> {
	const response = await fetch(githubApiGraphql, {
		method: 'POST',
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ query, variables }),
	});

	const remainingHeader = response.headers.get('x-ratelimit-remaining');
	const remaining = remainingHeader ? Number(remainingHeader) : null;

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`GitHub GraphQL ${response.status}: ${body.slice(0, 200)}`);
	}

	const payload = (await response.json()) as GraphQLResponse<T>;
	if (payload.errors && payload.errors.length > 0) {
		throw new Error(`GitHub GraphQL error: ${payload.errors.map((item) => item.message).join('; ')}`);
	}
	if (!payload.data) {
		throw new Error('GitHub GraphQL returned no data.');
	}

	return {
		data: payload.data,
		remaining,
	};
}

async function fetchRest<T>(pathname: string, token: string): Promise<T> {
	const response = await fetch(`${githubApiRest}${pathname}`, {
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${token}`,
		},
	});

	if (response.status === 404) {
		throw new Error(`GitHub REST 404: ${pathname}`);
	}

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`GitHub REST ${response.status}: ${body.slice(0, 200)}`);
	}

	return (await response.json()) as T;
}

function assertRateLimit(remaining: number | null): void {
	if (remaining !== null && Number.isFinite(remaining) && remaining <= 1) {
		throw new Error('GitHub API rate limit is nearly exhausted. Aborting to avoid partial catalog output.');
	}
}

async function fetchRepoSnapshot(project: ProjectInput, token: string): Promise<{
	repoUrl: string;
	repoMeta: CatalogProject['repoMeta'];
	issues: CatalogIssue[];
}> {
	const [owner, name] = splitRepoSlug(project.repo);
	let cursor: string | null = null;
	let repoUrl = `https://github.com/${project.repo}`;
	let repoMeta: CatalogProject['repoMeta'] = {
		stars: 0,
		forks: 0,
		updatedAt: new Date(0).toISOString(),
	};
	const issues: CatalogIssue[] = [];

	do {
		const { data, remaining } = await fetchGraphQL<RepositoryIssuesPage>(
			repositoryIssuesQuery,
			{ owner, name, after: cursor },
			token,
		);
		assertRateLimit(remaining);

		const repository = data.repository;
		if (!repository) {
			throw new Error(`Repository not found: ${project.repo}`);
		}

		repoUrl = repository.url;
		repoMeta = {
			stars: repository.stargazerCount,
			forks: repository.forkCount,
			updatedAt: repository.updatedAt,
		};

		for (const issue of repository.issues.nodes) {
			issues.push({
				number: issue.number,
				title: issue.title,
				state: issue.state,
				labels: issue.labels?.nodes.map((node) => node.name) ?? [],
				updatedAt: issue.updatedAt,
				url: issue.url,
			});
		}

		cursor = repository.issues.pageInfo.hasNextPage ? repository.issues.pageInfo.endCursor : null;
	} while (cursor);

	return { repoUrl, repoMeta, issues };
}

interface SyncSettings {
	owner: string;
	includePrivate: boolean;
	includeForks: boolean;
	includeArchived: boolean;
}

function resolveSyncSettings(): SyncSettings {
	const ownerFromRepo = process.env.GITHUB_REPOSITORY?.split('/')[0];
	const owner = process.env.SYNC_OWNER?.trim() || ownerFromRepo;
	if (!owner) {
		throw new Error('SYNC_OWNER is required (or provide GITHUB_REPOSITORY in CI context).');
	}

	return {
		owner: owner.toLowerCase(),
		includePrivate: parseBooleanFlag(process.env.SYNC_INCLUDE_PRIVATE, true),
		includeForks: parseBooleanFlag(process.env.SYNC_INCLUDE_FORKS, false),
		includeArchived: parseBooleanFlag(process.env.SYNC_INCLUDE_ARCHIVED, false),
	};
}

function getRepositoryConnection(
	page: OwnerRepositoriesPage,
): { nodes: DiscoveredRepository[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } {
	if (page.repositoryOwner) {
		return page.repositoryOwner.repositories;
	}
	throw new Error('SYNC_OWNER not found as user or organization.');
}

async function discoverProjects(settings: SyncSettings, token: string): Promise<ProjectInput[]> {
	let after: string | null = null;
	const discovered: DiscoveredRepository[] = [];

	do {
		const { data, remaining } = await fetchGraphQL<OwnerRepositoriesPage>(
			ownerRepositoriesQuery,
			{
				owner: settings.owner,
				after,
				privacy: settings.includePrivate ? null : 'PUBLIC',
			},
			token,
		);
		assertRateLimit(remaining);

		const repositories = getRepositoryConnection(data);
		discovered.push(...repositories.nodes);
		after = repositories.pageInfo.hasNextPage ? repositories.pageInfo.endCursor : null;
	} while (after);

	const filtered = discovered.filter((repo) => {
		if (!settings.includePrivate && repo.isPrivate) {
			return false;
		}
		if (!settings.includeForks && repo.isFork) {
			return false;
		}
		if (!settings.includeArchived && repo.isArchived) {
			return false;
		}
		return true;
	});

	return filtered.map(buildProjectFromRepository);
}

async function discoverGists(settings: SyncSettings, token: string): Promise<DiscoveredGist[]> {
	const gists: DiscoveredGist[] = [];

	for (let page = 1; page <= 10; page += 1) {
		try {
			const response = await fetchRest<
				Array<{ description: string | null; html_url: string; files: Record<string, { filename: string }> }>
			>(`/users/${settings.owner}/gists?per_page=100&page=${page}`, token);
			if (response.length === 0) {
				break;
			}

			for (const gist of response) {
				const firstFile = Object.values(gist.files ?? {})[0];
				gists.push({
					name: firstFile?.filename || 'Untitled Gist',
					description: gist.description,
					url: gist.html_url,
				});
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			if (message.includes('404')) {
				return [];
			}
			throw error;
		}
	}

	return gists;
}

async function loadFallbackCatalog(): Promise<CatalogSnapshot | null> {
	try {
		const raw = await fs.readFile(catalogPath, 'utf8');
		return parseCatalogJson(raw);
	} catch {
		return null;
	}
}

function mergeWithFallback(project: ProjectInput, fallback: CatalogProject | undefined): CatalogProject {
	if (fallback) {
		return {
			...fallback,
			id: project.id,
			name: project.name,
			description: project.description,
			repo: project.repo,
			stacks: project.stacks,
			tags: project.tags,
			links: project.links,
		};
	}

	return {
		...project,
		repoUrl: `https://github.com/${project.repo}`,
		repoMeta: {
			stars: 0,
			forks: 0,
			updatedAt: new Date(0).toISOString(),
		},
		issues: [],
	};
}

async function writeCatalog(snapshot: CatalogSnapshot): Promise<void> {
	const content = `${JSON.stringify(snapshot, null, 2)}\n`;
	await fs.writeFile(catalogPath, content, 'utf8');
}

async function main(): Promise<void> {
	const token = process.env.GITHUB_TOKEN;

	if (!token) {
		console.warn('GITHUB_TOKEN is required for sync (repo discovery + issue pagination). Keeping existing catalog snapshot.');
		process.exitCode = 1;
		return;
	}

	const settings = resolveSyncSettings();
	const projects = await discoverProjects(settings, token);
	const fallback = await loadFallbackCatalog();
	const fallbackProjects = new Map((fallback?.projects ?? []).map((project) => [project.id, project]));

	const nextCatalog: CatalogProject[] = [];
	const errors: string[] = [];

	for (const project of projects) {
		try {
			const repo = await fetchRepoSnapshot(project, token);
			nextCatalog.push({
				...project,
				repoUrl: repo.repoUrl,
				repoMeta: repo.repoMeta,
				issues: repo.issues,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			errors.push(`${project.repo}: ${message}`);
			nextCatalog.push(mergeWithFallback(project, fallbackProjects.get(project.id)));
		}
	}

	let gistGroups = fallback?.gistGroups ?? [];
	try {
		const gists = await discoverGists(settings, token);
		gistGroups = buildGistGroups(gists);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		errors.push(`gists: ${message}`);
	}

	const snapshot: CatalogSnapshot = {
		projects: nextCatalog,
		gistGroups,
		topicGroups: buildTopicGroups(nextCatalog),
		syncedAt: new Date().toISOString(),
	};

	await writeCatalog(snapshot);

	if (errors.length > 0) {
		console.warn('Sync completed with warnings:');
		for (const warning of errors) {
			console.warn(`- ${warning}`);
		}
		process.exitCode = 1;
		return;
	}

	console.log(`Synced ${nextCatalog.length} projects into src/data/catalog.json`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
});
