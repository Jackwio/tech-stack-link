// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isCi = process.env.GITHUB_ACTIONS === 'true';

// https://astro.build/config
export default defineConfig({
	site: process.env.SITE_URL ?? 'https://example.github.io',
	base: process.env.SITE_BASE ?? (isCi && repository ? `/${repository}/` : '/'),
	integrations: [mdx(), sitemap()],
});
