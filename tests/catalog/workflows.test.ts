import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('workflow separation', () => {
	it('keeps daily sync focused on syncing data changes', () => {
		const workflow = readFileSync(
			resolve(process.cwd(), '.github/workflows/daily-catalog-sync.yml'),
			'utf8',
		);

		expect(workflow).toContain('name: Daily Catalog Sync');
		expect(workflow).toContain('run: npm run sync');
		expect(workflow).not.toContain('uses: actions/deploy-pages@v4');
	});

	it('makes pages deployment manual-only and does not resync catalog data', () => {
		const workflow = readFileSync(
			resolve(process.cwd(), '.github/workflows/pages-manual-sync-deploy.yml'),
			'utf8',
		);

		expect(workflow).toContain('workflow_dispatch:');
		expect(workflow).not.toContain('push:');
		expect(workflow).not.toContain('run: npm run sync');
	});
});
