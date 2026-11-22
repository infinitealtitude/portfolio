---
name: portfolio-site
description: Edit, verify, or prepare the interactive-resume Astro portfolio for GitHub Pages. Use for homepage, Lab cases, content, visual, browser behaviour, or deployment changes in this repository.
---

# Portfolio site

- Read the [README](../../../README.md) for the file map, local commands and release steps.
- Edit editorial records in `content/`, render them with Astro in `src/pages/` and `src/components/`, and keep interactions in `src/scripts/`. Preserve the static links and disclosures used before browser scripts run.
- Preserve homepage IDs used by navigation, evidence links and the sky explorer. Use `localHref`, `projectHref` and `asset` from `src/lib/site.ts` when a URL needs the Pages base path. Keep Lab IDs aligned across both content files and their `projects/<slug>.html` routes.
- Treat `public/` as publication input. Keep source drafts and private material outside it. For publication, use the GitHub Pages workflow and the existing editorial review notes in the README.
- Use `npm run check:build` for a quick static check. For navigation, layout and interaction changes, run `npm test` to exercise the built site under the default Pages subpath.
