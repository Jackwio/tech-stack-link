import YAML from 'yaml';
import { z } from 'zod';
import type { CatalogProject, ProjectInput } from './types';

const repoPattern = /^[^/\s]+\/[^/\s]+$/;

export const projectLinkSchema = z.object({
	label: z.string().min(1),
	url: z.url(),
});

export const projectInputSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	description: z.string().min(1),
	repo: z.string().regex(repoPattern, 'repo must be owner/name format'),
	stacks: z.array(z.string().min(1)).min(1),
	tags: z.array(z.string().min(1)).default([]),
	links: z.array(projectLinkSchema).default([]),
});

export const projectsYamlSchema = z.array(projectInputSchema);

export const catalogIssueSchema = z.object({
	number: z.number().int().nonnegative(),
	title: z.string().min(1),
	state: z.enum(['OPEN', 'CLOSED']),
	labels: z.array(z.string()),
	updatedAt: z.iso.datetime(),
	url: z.url(),
});

export const catalogProjectSchema = projectInputSchema.extend({
	repoUrl: z.url(),
	repoMeta: z.object({
		stars: z.number().int().nonnegative(),
		forks: z.number().int().nonnegative(),
		updatedAt: z.iso.datetime(),
	}),
	issues: z.array(catalogIssueSchema),
});

export const catalogSchema = z.array(catalogProjectSchema);

function formatZodError(error: z.ZodError): string {
	return error.issues
		.map((issue) => {
			const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
			return `${path}: ${issue.message}`;
		})
		.join('; ');
}

export function parseProjectsYaml(input: string): ProjectInput[] {
	const parsed = YAML.parse(input);
	const result = projectsYamlSchema.safeParse(parsed);
	if (!result.success) {
		throw new Error(`Invalid projects YAML: ${formatZodError(result.error)}`);
	}
	return result.data;
}

export function parseCatalogJson(input: string): CatalogProject[] {
	const parsed = JSON.parse(input);
	const result = catalogSchema.safeParse(parsed);
	if (!result.success) {
		throw new Error(`Invalid catalog JSON: ${formatZodError(result.error)}`);
	}
	return result.data;
}
