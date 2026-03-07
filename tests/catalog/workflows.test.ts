import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('workflow separation', () => {
	it('runs daily sync without embedding pages deployment steps directly', () => {
		const workflow = readFileSync(
			resolve(process.cwd(), '.github/workflows/daily-catalog-sync.yml'),
			'utf8',
		);

		expect(workflow).toContain('name: Daily Catalog Sync');
		expect(workflow).toContain('run: npm run sync');
		expect(workflow).not.toContain('uses: actions/deploy-pages@v4');
	});

	it('dispatches pages deployment only when catalog data changed', () => {
		const workflow = readFileSync(
			resolve(process.cwd(), '.github/workflows/daily-catalog-sync.yml'),
			'utf8',
		);

		expect(workflow).toContain("if: steps.changes.outputs.changed == 'true'");
		expect(workflow).toContain('peter-evans/repository-dispatch@v3');
		expect(workflow).toContain('event-type: pages-manual-sync-deploy');
	});

	it('allows pages deployment from manual trigger or repository_dispatch and does not resync catalog data', () => {
		const workflow = readFileSync(
			resolve(process.cwd(), '.github/workflows/pages-manual-sync-deploy.yml'),
			'utf8',
		);

		expect(workflow).toContain('workflow_dispatch:');
		expect(workflow).toContain('repository_dispatch:');
		expect(workflow).toContain('- pages-manual-sync-deploy');
		expect(workflow).not.toContain('push:');
		expect(workflow).not.toContain('run: npm run sync');
	});
});
