import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCatalogJson, parseProjectsYaml } from '../src/lib/catalog/schema';
import type { CatalogIssue, CatalogProject, ProjectInput } from '../src/lib/catalog/types';

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

interface GraphQLResponse<T> {
	data?: T;
	errors?: Array<{ message: string }>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const projectsPath = path.join(rootDir, 'data', 'projects.yaml');
const catalogPath = path.join(rootDir, 'src', 'data', 'catalog.json');
const githubApiGraphql = 'https://api.github.com/graphql';

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

async function loadProjects(): Promise<ProjectInput[]> {
	const yaml = await fs.readFile(projectsPath, 'utf8');
	return parseProjectsYaml(yaml);
}

async function loadFallbackCatalog(): Promise<Map<string, CatalogProject>> {
	try {
		const raw = await fs.readFile(catalogPath, 'utf8');
		const projects = parseCatalogJson(raw);
		return new Map(projects.map((project) => [project.id, project]));
	} catch {
		return new Map();
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

async function writeCatalog(projects: CatalogProject[]): Promise<void> {
	const content = `${JSON.stringify(projects, null, 2)}\n`;
	await fs.writeFile(catalogPath, content, 'utf8');
}

async function main(): Promise<void> {
	const token = process.env.GITHUB_TOKEN;
	const projects = await loadProjects();
	const fallback = await loadFallbackCatalog();

	if (!token) {
		console.warn('GITHUB_TOKEN is required for sync (GraphQL issue pagination). Keeping existing catalog snapshot.');
		process.exitCode = 1;
		return;
	}

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
			nextCatalog.push(mergeWithFallback(project, fallback.get(project.id)));
		}
	}

	await writeCatalog(nextCatalog);

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
