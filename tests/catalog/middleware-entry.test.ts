import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('astro middleware entry', () => {
	it('provides an explicit middleware module for static builds', () => {
		const middlewarePath = resolve(process.cwd(), 'src/middleware.ts');
		expect(existsSync(middlewarePath)).toBe(true);

		const content = readFileSync(middlewarePath, 'utf8');
		expect(content).toContain('export const onRequest');
	});
});
