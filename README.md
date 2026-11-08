# Bloom — Instagram creative workspace

A responsive, dependency-free web interface built with **HTML, CSS, and vanilla JavaScript**. The static demo needs no React, CDN scripts, or API keys. An optional Node.js backend now supports secure Instagram Unified Login.

## Connect your Instagram account

See **[the step-by-step backend deployment guide](docs/BACKEND_SETUP.md)**. The included `render.yaml` prepares a paid, persistent Render deployment; review hosting costs before approving. Enter Meta secrets only in your hosting dashboard. Nothing is deployed or connected just by saving this code.

The backend serves its own copy of Bloom, supports owner login and account selection, and stores credentials encrypted on a private disk. Automatic publishing, live insights, and model-powered AI are **not enabled** by this connection milestone.

## Main files

- `index.html` — accessible page structure, navigation, and dialog containers
- `style.css` — responsive layouts, components, and local font definitions
- `script.js` — planner, content templates, SVG charts, reports, and browser storage
- `public/` — local sample images, fonts, and font licenses
- `server/` — owner sessions, Unified Login callback, account selection, encrypted credential storage
- `render.yaml` and `.env.example` — hosting blueprint and private configuration reference

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

The build copies the standalone interface and assets into `dist/`. Deploy that directory to any static hosting service. The browser interface itself has no npm dependencies. The optional backend uses Express, Helmet, express-rate-limit, and Node’s built-in SQLite. Vite and Playwright are development tools only.

## GitHub Pages deployment

The public website is https://abc07552.github.io/Instagram-automation-/.

Pages must publish the branch that contains `index.html`, not a README-only branch. The previous static deployment used `arena/cae72015-instagram-automation`; the repository’s **Settings → Pages → Build and deployment** should use **Deploy from a branch**, that branch, and **/ (root)**.

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

- The backend implements **single-owner connection and verification only**. It must be deployed and configured with your Meta App ID, App Secret, and Unified Login Configuration ID before real sign-in can work.
- No real account has been connected or tested in this workspace. Tests mock Meta, because credentials are private and the sandbox cannot reach Meta API hosts.
- **Scheduling is still local only.** No publishing jobs run, even after an account is connected.
- Analytics and reports remain clearly labeled demo data. Live insights ingestion is not implemented.
- Assistant responses remain local templates, not calls to an AI model.
- Reels/stories can be planned, but uploads are image previews only; video processing and publishing are not implemented.
- The existing static GitHub Pages site cannot run this backend. Use the backend-hosted copy for authentication; the static site can navigate to your public backend URL.
- Account eligibility, assigned business assets, permissions, access level, and Meta app review requirements still apply. Public multi-user use additionally needs appropriate compliance callbacks, privacy/deletion policies, and user authentication.
- Drafts and ideas remain browser-local and origin-specific. Moving from GitHub Pages to the hosted backend does not automatically migrate existing drafts.

Never put tokens, passwords, encryption keys, or app secrets in frontend code, Git, screenshots, or chat. See [backend setup and security details](docs/BACKEND_SETUP.md).

## Tests

With the development server running and Playwright Chromium installed:

```sh
npx playwright install chromium
npm test
npm run test:standalone
npm run test:backend
```

Alternatively, set `CHROMIUM_PATH` to an installed Chromium executable.

The standalone test also verifies both source and built pages directly over `file://`, local asset loading without external requests, escaped user input, and Escape dismissal.

The browser smoke test covers content creation, persistence, search, deletion, assistant responses, idea generation/saving, report download, mobile navigation, layout overflow, and runtime errors. Screenshots are written to `/tmp`, not the repository.

## Asset credits

DM Sans and Manrope are locally hosted under the SIL Open Font License; their license texts are in `public/fonts/`.

Sample imagery was sourced via image search: café images from Pexels and a coastal image from Condé Nast Traveler. They are demo assets, not the user’s own media.
