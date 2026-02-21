import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('sync owner query shape', () => {
	it('uses repositoryOwner lookup instead of querying user + organization in parallel', () => {
		const script = readFileSync(resolve(process.cwd(), 'scripts/sync-github.ts'), 'utf8');

		expect(script).toContain('repositoryOwner(login: $owner)');
		expect(script).not.toContain('user(login: $owner)');
		expect(script).not.toContain('organization(login: $owner)');
	});
});
