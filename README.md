# Anand Elangovan · Portfolio

The site is built with semantic HTML, CSS and vanilla JavaScript. Python 3.9+ renders the editorial content into static HTML so the major sections and native disclosure controls work without JavaScript.

## Local preview

From this directory:

```sh
python3 build.py
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
```

Open [localhost:8765](http://127.0.0.1:8765/). If the preview server is already serving the source directory on that port, use [localhost:8765/dist/](http://127.0.0.1:8765/dist/).

## Verification

`python3 build.py` validates the JSON before rendering. Fix any reported file and field path in `content/`. The build requires Python 3.9 or later and has no third-party Python dependencies.

For the complete developer checks, install Node.js 22 and run:

```sh
npm ci
npx playwright install --only-shell chromium
npm run check:js
npm test
```

`npm test` rebuilds and validates the output before serving it at a loopback address under `/dist/`, exercising repository-subpath URLs. To run only the build and local reference checks, use `npm run check:build`. The GitHub Actions verification workflow runs the type check and browser suite on pushes and pull requests.

The browser suite checks navigation, keyboard controls, project images, the CV download, responsive widths from 320px to 1440px, static navigation without JavaScript and motion settings. Motion tests use a simulated clock to exercise scheduling and cleanup. JSDoc and the TypeScript checker verify the celestial module as plain JavaScript. There is no compilation step, and the npm packages are development-only.

## Edit

- `page.html` contains the section layout and editorial copy.
- `content/portfolio.json` holds Selected Work, the career timeline, advisory stages, Lab cards and perspectives. `content/case-studies.json` holds the detailed Lab case studies. Each case-study key must match a Lab project ID.
- `style.css` defines the palette, editorial grid, responsive layouts and motion preferences.
- `resume.js` previews the sky themes, adds the compact menu, switches advisory stages and rotates the photo gallery.
- `celestial-motion.js` shares the decorative meteor scheduler across the chart and accent zones. It uses intersection and visibility events to suspend work and exposes cleanup for timers, observers and listeners.
- `assets/` contains the AE monogram, Open Graph image and supplied 2026 CV, supplied photographs and self-hosted Instrument Serif files with their licence.

## Hero portrait

The current photo is a circular crop of the original supplied portrait. To enable the cut-out composition, add a genuine transparent portrait as `assets/anand-portrait-cutout.webp` or `assets/anand-portrait-cutout.png` and rebuild. Use a square canvas with the face and shoulders positioned centrally and transparent space around the subject. WebP takes precedence when both are present. Removing the cut-out restores the circular crop on the next build.

## Release

The default build uses noindex metadata. Serve only `dist/` and configure access controls at the hosting layer for an approved private preview. A noindex directive provides no access control.

After public release approval, build with the actual HTTPS homepage:

```sh
python3 build.py --url https://example.com/portfolio/ --index
```

That build adds the canonical and Open Graph URLs, the sitemap and its robots.txt reference. Asset paths are relative and work under a repository subpath. GitHub hosting and public release are pending.

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
