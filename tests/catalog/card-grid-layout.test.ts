import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('catalog card grid layout', () => {
	it('pins cards to top to avoid row stretching when one card expands', () => {
		const css = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');
		expect(css).toMatch(/\.catalog-grid\s*\{[^}]*align-items:\s*start;/s);
	});
});
