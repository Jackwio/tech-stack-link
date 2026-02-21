import { describe, expect, it } from 'vitest';
import { isPullRequestIssue, normalizeIssue } from '../../src/lib/catalog/normalize';

describe('normalizeIssue', () => {
	it('maps GitHub issue payload to catalog issue shape', () => {
		const normalized = normalizeIssue({
			number: 42,
			title: 'Fix runtime crash',
			state: 'open',
			labels: [{ name: 'bug' }, { name: 'high-priority' }],
			updated_at: '2026-02-20T14:20:00.000Z',
			html_url: 'https://github.com/acme/repo/issues/42',
		});

		expect(normalized).toEqual({
			number: 42,
			title: 'Fix runtime crash',
			state: 'OPEN',
			labels: ['bug', 'high-priority'],
			updatedAt: '2026-02-20T14:20:00.000Z',
			url: 'https://github.com/acme/repo/issues/42',
		});
	});
});

describe('isPullRequestIssue', () => {
	it('returns true when payload represents a pull request', () => {
		expect(
			isPullRequestIssue({
				pull_request: { url: 'https://api.github.com/repos/acme/repo/pulls/2' },
			}),
		).toBe(true);
	});
});
