import type { FilterState } from './types';

function normalizeStack(value: string): string {
	return value.trim().toLowerCase();
}

export function parseFilterState(search: string): FilterState {
	const raw = search.startsWith('?') ? search.slice(1) : search;
	const params = new URLSearchParams(raw);
	const stacksParam = params.get('stacks');

	const selectedStacks = stacksParam
		? stacksParam
				.split(',')
				.map(normalizeStack)
				.filter(Boolean)
		: [];

	return {
		selectedStacks,
		keyword: params.get('q')?.trim() ?? '',
	};
}

export function toSearchParams(state: FilterState): URLSearchParams {
	const params = new URLSearchParams();

	const stacks = [...new Set(state.selectedStacks.map(normalizeStack).filter(Boolean))].sort();
	if (stacks.length > 0) {
		params.set('stacks', stacks.join(','));
	}

	const keyword = state.keyword.trim();
	if (keyword) {
		params.set('q', keyword);
	}

	return params;
}
