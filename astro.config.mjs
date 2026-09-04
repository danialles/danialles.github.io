// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import site from './site.config.mjs';

export default defineConfig({
  site: site.site,
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
