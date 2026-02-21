import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('base-path safe asset references', () => {
	it('avoids root-absolute font URLs in global css', () => {
		const css = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8');
		expect(css).not.toContain("url('/fonts/atkinson-regular.woff')");
		expect(css).not.toContain("url('/fonts/atkinson-bold.woff')");
	});

	it('avoids root-absolute favicon/font preload URLs in BaseHead', () => {
		const head = readFileSync(resolve(process.cwd(), 'src/components/BaseHead.astro'), 'utf8');
		expect(head).not.toContain('href="/favicon.svg"');
		expect(head).not.toContain('href="/favicon.ico"');
		expect(head).not.toContain('href="/sitemap-index.xml"');
		expect(head).not.toContain('href="/fonts/atkinson-regular.woff"');
		expect(head).not.toContain('href="/fonts/atkinson-bold.woff"');
	});
});
