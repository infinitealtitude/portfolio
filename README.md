# Anand Elangovan · Portfolio

Astro builds this portfolio into static HTML, CSS and JavaScript in `dist/`. The homepage, three Lab case studies, links and native disclosures are rendered at build time. Vanilla JavaScript adds the compact menu, sky explorer and motion controls, advisory stages, photo gallery and screenshot previews.

## Local preview

Use Node.js from `.nvmrc` (`nvm use` if you use nvm).

```sh
npm ci
npm run dev
```

Open [the local portfolio](http://localhost:4321/interactive-resume/). To preview the built site, run `npm run build` and `npm run preview`.

## Verification

```sh
npm run check:astro
npm run check:js
npx playwright install --only-shell chromium
npm test
```

`npm test` builds and validates the output, then runs Playwright against Astro's static preview under the repository subpath. It covers navigation, keyboard controls, project images, the CV, responsive layouts from 320px to 1440px, no-JavaScript navigation and motion preferences. Use `npm run check:build` to check only the static output, including local assets, anchors and ARIA references. The Verify portfolio workflow runs on pushes and pull requests.

## Edit

| Location | Content |
| --- | --- |
| `src/pages/index.astro` and `src/components/` | Home sections, shared markup and SVG artwork |
| `src/pages/projects/[slug].astro` | Template for the three `projects/<slug>.html` pages |
| `src/layouts/SiteLayout.astro` | Shared HTML head, social metadata, indexing metadata and screenshot script |
| `content/portfolio.json` | Selected Work, capabilities, career timeline, advisory, Lab, perspectives, writing and sky themes |
| `content/case-studies.json` | Lab case studies keyed by the matching Lab project ID |
| `src/lib/content.ts` | JSON schemas and content validation for the build |
| `src/styles/global.css` | Palette, layout, responsive behaviour and motion preferences |
| `src/scripts/` | Browser interactions, screenshot dialog and shared meteor scheduler |
| `public/assets/` | Published photos, screenshots, CV, monogram, social image and self-hosted font |
| `drafts/` | Source drafts outside the published site |

Keep existing anchors and project URLs when editing. Use the helpers in `src/lib/site.ts` for links and assets that need the configured site base. A new Lab project needs a portfolio entry, a matching case study and a screenshot in `public/assets/`.

## Hero portrait

The current photo is a circular crop of the original supplied portrait. For the cut-out composition, add a transparent `anand-portrait-cutout.webp` or `anand-portrait-cutout.png` to `public/assets/`. Use a square canvas with the face and shoulders positioned centrally and transparent space around the subject. The build selects WebP first, then PNG, then the original crop.

## GitHub Pages

The expected project URL is `https://infinitealtitude.github.io/interactive-resume/`. The deployment workflow uses GitHub Pages' configured URL, including the repository path or a custom domain, for its build.

1. Enable **GitHub Actions** as the source under **Settings → Pages**. [GitHub Pages publishing settings](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow)
2. After the editorial release review below, run **Deploy portfolio to GitHub Pages** from `main` in the **Actions** tab. It builds and validates the site, then deploys `dist/`.
3. Enable **Allow search indexing and include a sitemap** only when the release is ready for search. The default build emits `noindex,nofollow`. Anyone with access to the published site can still open it and download its public assets.

To reproduce a release build locally, use the actual HTTPS homepage URL.

```sh
PORTFOLIO_SITE_URL=https://infinitealtitude.github.io/interactive-resume/ PORTFOLIO_INDEX=1 npm run check:build
```

`PORTFOLIO_SITE_URL` sets the base path, homepage canonical URL and Open Graph URLs. With `PORTFOLIO_INDEX=1`, the build also emits the homepage sitemap and its `robots.txt` reference.

## Editorial approvals

| Item | Current treatment | Needed for release or inclusion |
| --- | --- | --- |
| CV and contact | Supplied 2026 CV. Contact uses LinkedIn. | Confirm the phone number and commercial figures in the supplied PDF are intended for public release. |
| Commercial figures | Pipeline, portfolio value, conversion and revenue figures omitted. | Confirm permission and context for each figure before use. The source figures for pipeline and portfolio are in USD. |
| Customer and project information | Anonymised project summaries and conceptual workflow diagrams. | Approve any customer names, internal screenshots, code, detailed architecture or proprietary references. |
| Speaking | Uses CV-backed event names at a general level. | Confirm UCISA, DTX and Liverpool details, including role, session title, location and date. |
| Advisory | Describes capabilities and proposed engagement models. | Verify and approve any client references, completed engagements or outcomes. |
| Infinite Altitude | Two supplied Margate aerial photographs with captions and alt text. | Confirm the photo selection at public release. |
| Perspectives | Undated editorial drafts. | Review the first-person positioning and observations. |

Before public release, review the 14+ and 8+ year figures for currency, the downloadable CV and the advisory wording. The case studies use anonymised contexts and qualify prototypes, internal tools and guided trials explicitly.

## Sky illustration

The build renders `content/sky.json` directly into SVG. That file contains only selected Hipparcos identifiers, apparent visual magnitudes and rounded illustration coordinates. The professional theme labels, anchor coordinates and destinations live separately in `content/portfolio.json`. Numbered markers and dashed lines belong to the professional layer. The solid Orion trace is an editorial stick figure connecting its actual plotted stars.

- Catalogue: David Nash / Astronexus, [HYG Star Database v4.1, archived revision](https://github.com/astronexus/HYG-Database/tree/3bf37f4b2d5460e1278286320d1d62fab9b493c1/hyg). The adapted catalogue data and astronomical layer are shared under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Calculation: [Astronomy Engine 2.1.19](https://www.npmjs.com/package/astronomy-engine/v/2.1.19). `tools/project-sky.cjs` accepts the absolute path to the library's CommonJS module and reads JSON on stdin with `observation: { utc, latitude, longitude }` and `stars: [{ hip, ra, dec, mag }]`. Use UTC ISO timestamps, east-positive decimal degrees, J2000 right ascension in hours, declination in degrees and apparent visual magnitude. The current subset includes stars of magnitude 3.35 or brighter with Hipparcos identifiers.
- Projection: J2000 equatorial coordinates are rotated into the observer's horizontal frame using the observation time and location. The program checks altitude and azimuth against the spherical equations using equatorial-of-date coordinates and local sidereal time. It keeps stars strictly above the geometric horizon, then applies a zenith-centred azimuthal equidistant projection, a fixed artwork rotation and pixel rounding.
- Limits: The observing location is approximate to 0.01 degrees. The map assumes a level geometric horizon and omits atmospheric refraction, obstructions, weather, proper-motion corrections and variable visibility due to twilight or moonlight. A star above the geometric horizon is a candidate for observation, with actual visibility dependent on conditions.
- Privacy: Full observation parameters belong in private local input. The generator, derived artwork, HTML metadata and downloadable CV contain no exact observation timestamp or geographical coordinates. The optional site disclosure explains the calculation and credits the sources. Ambient points and meteor streaks are explicitly decorative and never change the chart geometry.

Review the Lab screenshots before publication. The calculator shows illustrative demo data, the dashboard shows seeded demonstration records and the inventory screenshot redacts the API-key field. The enterprise-selling article is a source draft under `drafts/` and is excluded from `dist/`.
