# Portfolio repository

- Use the Node version in `.nvmrc`. Run `npm ci` once and `npm run dev` to preview at `http://localhost:4321/interactive-resume/`.
- Use the [portfolio-site skill](.agents/skills/portfolio-site/SKILL.md) for site changes. The [README](README.md) has the file map, deployment steps and editorial release notes.
- Keep the site a static Astro build with progressive enhancement. Preserve existing section anchors and `projects/<slug>.html` URLs.
- Run `npm run check:build` for content or link changes and `npm run check:astro` for template changes. Run `npm run check:js` and `npm test` for browser behaviour or layout changes.
