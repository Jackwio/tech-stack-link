import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('project card title link style', () => {
	it('uses accent color so users can recognize title as a hyperlink', () => {
		const css = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');
		expect(css).toMatch(/\.project-head h2 a\s*\{[^}]*color:\s*var\(--accent\);/s);
	});
});
