import type { APIRoute } from 'astro';
import { getSiteConfig } from '../lib/site-config.mjs';

export const GET: APIRoute = () => {
  const { homepage, indexable } = getSiteConfig();
  const rules = indexable ? `Allow: /\nSitemap: ${homepage}sitemap.xml\n` : '';
  return new Response(`User-agent: *\n${rules}`, { headers: { 'Content-Type': 'text/plain' } });
};
