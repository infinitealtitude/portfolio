import type { APIRoute, GetStaticPaths } from 'astro';
import { getSiteConfig } from '../lib/site-config.mjs';

export const getStaticPaths: GetStaticPaths = () =>
  getSiteConfig().indexable ? [{ params: { sitemap: 'sitemap' } }] : [];

export const GET: APIRoute = () => {
  const { homepage } = getSiteConfig();
  const location = homepage!.replaceAll('&', '&amp;');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${location}</loc></url></urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
