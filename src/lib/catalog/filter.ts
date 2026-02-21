import type { CatalogProject, FilterState } from './types';

function normalizeToken(value: string): string {
	return value.trim().toLowerCase();
}

export function filterProjects(projects: CatalogProject[], state: FilterState): CatalogProject[] {
	const selected = state.selectedStacks.map(normalizeToken).filter(Boolean);
	const keyword = normalizeToken(state.keyword);

	return projects.filter((project) => {
		const projectStacks = project.stacks.map(normalizeToken);
		const matchesStacks = selected.every((stack) => projectStacks.includes(stack));

		if (!matchesStacks) {
			return false;
		}

		if (!keyword) {
			return true;
		}

		const haystack = `${project.name} ${project.description}`.toLowerCase();
		return haystack.includes(keyword);
	});
}
