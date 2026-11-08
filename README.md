# Bloom — Instagram creative workspace

A responsive, dependency-free web interface built with **HTML, CSS, and vanilla JavaScript**. No React, frontend libraries, CDN scripts, or API keys are needed.

## Main files

- `index.html` — accessible page structure, navigation, and dialog containers
- `style.css` — responsive layouts, components, and local font definitions
- `script.js` — planner, content templates, SVG charts, reports, and browser storage
- `public/` — local sample images, fonts, and font licenses

## Open the interface

Open `index.html` directly in your browser. Keep `style.css`, `script.js`, and `public/` alongside it. Browser-local storage support for `file://` pages varies, so a local web server is recommended for reliable draft persistence.

For a development server:

```sh
npm install
npm run dev
```

Or, without Node dependencies:

```sh
python3 -m http.server 5173 --bind 0.0.0.0
```

Visit `http://localhost:5173`. All interface assets are local; it does not need an internet connection after download.

## Build

```sh
npm run build
npm run preview
```

The build copies the standalone interface and assets into `dist/`. Deploy that directory to any static hosting service. The browser interface itself has no npm dependencies. Vite and Playwright are development tools only.

## GitHub Pages deployment

The public website is https://abc07552.github.io/Instagram-automation-/.

Pages must publish the branch that contains `index.html`, not a README-only branch. This workspace uses `arena/cae72015-instagram-automation`; the repository’s **Settings → Pages → Build and deployment** should use **Deploy from a branch**, that branch, and **/ (root)**.

No build step is required for branch-based Pages publishing. Keep `index.html`, `style.css`, `script.js`, `.nojekyll`, and `public/` together at the repository root. All asset paths are relative, so they also work under the `/Instagram-automation-/` project path. After pushing, allow the Pages deployment to finish and refresh the site. If you later merge these files into `main`, you can switch Pages back to `main` and **/ (root)**.

## Features

- Overview with clearly labeled sample metrics and responsive SVG trend charts
- Planner for reels, posts, and stories: create, edit, delete, draft, filter, and search
- Image previews, image uploads, caption templates, and local scheduling
- Topic-based idea templates, conversational planning templates, and saved ideas
- Analytics, illustrative deeper recommendations, and JSON report export
- Browser-local persistence with storage error handling
- Mobile navigation, keyboard-accessible dialogs, Escape dismissal, focus trapping, and a skip link
- Hash-based navigation and deep links to each workspace page

## Integration boundaries

This is a frontend prototype, **not a live Instagram automation service**:

- **No Instagram account is connected.** The profile and analytics are demo data.
- **Scheduling is local only.** No background jobs run and nothing is published.
- **Assistant responses are local templates**, not calls to a connected AI model.
- Reels/stories can be planned, but uploads are image previews only; video upload, processing, and publishing are not implemented.
- Drafts, schedules, and saved ideas are specific to your browser and origin. Storage has size limits and is not a backup service.

Production automation needs a secure backend, eligible Instagram account, Meta OAuth with approved permissions, token management, media storage/processing, a durable publishing queue, and real insights ingestion. Publishing capabilities depend on Meta’s current APIs and account eligibility. Model-powered assistance also needs a server-side AI provider integration. Never put account tokens, passwords, or API keys in `script.js`.

## Tests

With the development server running and Playwright Chromium installed:

```sh
npx playwright install chromium
npm test
npm run test:standalone
```

Alternatively, set `CHROMIUM_PATH` to an installed Chromium executable.

The standalone test also verifies both source and built pages directly over `file://`, local asset loading without external requests, escaped user input, and Escape dismissal.

The browser smoke test covers content creation, persistence, search, deletion, assistant responses, idea generation/saving, report download, mobile navigation, layout overflow, and runtime errors. Screenshots are written to `/tmp`, not the repository.

## Asset credits

DM Sans and Manrope are locally hosted under the SIL Open Font License; their license texts are in `public/fonts/`.

Sample imagery was sourced via image search: café images from Pexels and a coastal image from Condé Nast Traveler. They are demo assets, not the user’s own media.
