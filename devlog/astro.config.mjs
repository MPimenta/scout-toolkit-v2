// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://ctw03345.github.io',
	base: '/scout-toolkit-v2',
	integrations: [mdx(), sitemap()],
	output: 'static',
	build: {
		assets: '_astro'
	}
});
