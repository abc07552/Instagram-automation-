# Connect Bloom to your Instagram Creator account

## What is ready, and what is not

The repository now includes a **single-owner Node.js backend** for the Unified Login configuration shown in your Meta dashboard. It serves the Bloom website and handles owner authentication, OAuth, assigned-account discovery, explicit account selection, token storage, verification, and disconnect.

**Code is not a deployment.** You still need a hosting account, a running service, and your Meta settings. Nobody is connected automatically. This release does **not** implement publishing jobs, media uploads to Meta, or live insights. The planner remains browser-local, analytics remain labeled sample data, and assistant replies remain templates.

The current sandbox cannot reach Meta's API hosts, and no real credentials were supplied. Tests use a mocked provider. A real OAuth round trip must be validated after deployment; Meta access levels, app roles, business assets, configuration eligibility, and permissions may require additional setup or App Review.

## Free testing hosting (default)

The default `render.yaml` now requests **one Free web service, with no disk, database, or background worker**. It stores encrypted test credentials in `/tmp/bloom/bloom.sqlite` on an ephemeral filesystem and labels the connection panel **Free testing mode**. This is suitable for trying the login flow, not for dependable posting or durable account connections.

- The service can sleep when idle and take time to wake up. If sign-in fails during a wake-up/restart, open the hosted app, sign in as owner, and restart the login flow.
- Sessions and saved Instagram connections may disappear on sleep, restart, or redeploy. Afterward, use the same owner password from the hosting environment and reconnect Instagram. Environment secrets are managed separately by the host; they are not saved in the SQLite file.
- Losing a local token is **not** the same as revoking Meta access. Remove the app in Meta’s connected-app settings if you want to revoke the grant, even if the local connection has disappeared.
- A restart during OAuth invalidates the session/state. The server must reject that callback; do not bypass the state check to make testing easier.
- Browser-local drafts remain in the browser for that origin; the backend does not back them up. No scheduled publishing or live analytics is enabled.
- Free hosting still has account, usage, and verification conditions. Render may ask some users for payment-card verification even for a Free instance. **Free compute is not a guarantee that no card will be requested.** If verification is required and you do not want to provide a card, stop rather than choosing a paid plan. Do not share card details in chat.

For the phone-friendly steps, see **[Free testing quick start](FREE_TESTING.md)**. Provider references: https://render.com/docs/free and https://community.render.com/t/free-web-service-issue/18026.

### Optional paid persistent deployment (not the default)

The old paid configuration is preserved as **`render.persistent.yaml`**, for an explicit future choice only. It requests a paid Starter service plus a disk. Do not select that file for free testing. A paid disk preserves encrypted credentials across service restarts, but this code still does not implement publishing jobs. Review all displayed costs before approving any paid resource.

Switching a YAML file does not cancel an already-created paid resource. If you previously deployed a paid service or disk, review the Render dashboard and billing and remove unwanted resources there after saving anything needed. Do not assume a declined/unfinished payment screen created a service; check the resource list.

### 1. Make this branch available on GitHub

Use branch `arena/d3fb70ad-instagram-automation`. It must include `server/` and `render.yaml`. Do not deploy a previous README-only revision. This backend does not run on GitHub Pages.

### 2. Create the service

1. Sign in at https://dashboard.render.com/.
2. Choose **New → Blueprint** and connect your GitHub repository `abc07552/Instagram-automation-`.
3. Select branch **arena/d3fb70ad-instagram-automation** and the root `render.yaml`.
4. Confirm the preview shows **Free** compute, **no disk**, and no other paid resources. Stop if it shows Starter or requests payment you do not want.
5. Enter these values privately in Render when asked:
   - **META_APP_ID**: the Meta App ID from **App settings → Basic**.
   - **META_APP_SECRET**: the app secret from that same page. Do not use an Instagram password.
   - **META_LOGIN_CONFIG_ID**: the Configuration ID on **API setup with Unified login**, under the selected configuration.
6. Deploy only the Free service once the configuration is correct. Render generates two independent private values:
   - **ADMIN_PASSWORD**: the Bloom owner password; use it only on your hosted Bloom login form.
   - **TOKEN_ENCRYPTION_KEY**: encrypts the database tokens. Keep it unchanged across deployments. Changing it makes existing encrypted credentials unreadable.

Do not paste any secret, password, or access token into chat, source code, GitHub issues, or public screenshots. Configuration ID and App ID are identifiers, not passwords, but you can set all three through Render.

If Blueprint cannot be used, create a Node web service manually with this branch, build command `npm ci --omit=dev && npm run build`, start command `npm start`, health path `/healthz`, **Free** compute, **no disk**, `STORAGE_MODE=ephemeral`, `DATABASE_PATH=/tmp/bloom/bloom.sqlite`, and the other settings listed in `render.yaml`. Set two independent, long random values for `ADMIN_PASSWORD` and `TOKEN_ENCRYPTION_KEY` through the private hosting settings.

### 3. Get the actual callback URL

1. Open the **HTTPS service URL displayed by Render**. Open the hosted backend's copy of Bloom, not the GitHub Pages copy, to avoid cross-site-cookie issues.
2. Open the account menu (top-right avatar) or **Connect account** in Content planner.
3. Enter your **ADMIN_PASSWORD** from Render. This password is unrelated to Instagram.
4. Bloom shows **Paste this exact Redirect URL into Meta**. Copy it.
5. In your Meta dashboard, under **API setup with Unified login → Redirect URL**, paste that exact URL and tap **Save**.

The path is `/auth/instagram/callback`, but the hostname must come from your actual deployment. **Do not paste an example URL, your GitHub Pages homepage, localhost, or a temporary Arena preview URL into production settings.** Render supplies its public URL automatically. If you use a custom domain, set `PUBLIC_BASE_URL` to that HTTPS origin (no path, query, or trailing path segments), redeploy, and register the new exact callback in Meta.

### 4. Connect and confirm your account

1. Ensure the appropriate Instagram account is assigned to your business portfolio/configuration and that you have the required Meta app/tester roles. Follow Meta's dashboard prompts; do not grant access to unrelated accounts.
2. Back in hosted Bloom, click **Continue with Meta**.
3. Review the consent screen. The selected Meta template may include messaging, comments, advertising, and publishing permissions. Those permissions are not all used by this connection-only backend. Use Meta's configuration controls to minimize permissions where supported; do not grant permissions you do not want.
4. Sign in **only on Meta's official login window**. If you decline, no connection is created.
5. On returning to Bloom, explicitly select the Instagram account to connect. Authorizing Meta alone does not finish the account-selection step.
6. Use **Verify access** to confirm that Meta still assigns the selected account to the credential.

A connected badge means the backend has a saved credential for the selected profile. It does **not** mean posts are running or analytics are live. Some tokens may expire; even non-expiring system-user credentials can be revoked. Reconnect if verification fails. This release does not automatically refresh Unified Login tokens using the legacy Instagram Login endpoints.

### 5. Disconnect and lock

- **Disconnect** attempts to revoke Meta access and always deletes the locally saved credential. If Meta cannot revoke access, Bloom explicitly tells you to also remove the integration in Meta's connected-app settings. A saved OAuth pending selection is also cleared.
- **Lock owner settings** signs out this browser; it does not disconnect the Instagram account.
- Owner sessions expire after eight hours. Pending OAuth/account-selection steps expire after ten minutes.

## How it works

- Unified Login uses `facebook.com/.../dialog/oauth` with the Meta App ID and Configuration ID. The configuration supplies permissions; this flow is not the legacy Instagram Login flow.
- The server exchanges the code on `graph.facebook.com`, enumerates `/me/assigned_instagram_accounts` (because `/me` is the system user), and requires explicit account selection. If no accounts are assigned, the callback fails safely; it does not guess an account or fall back to an unrelated one.
- Access tokens are encrypted using AES-256-GCM on the server, including in free testing mode. Encryption keys and app secrets come from environment variables. The browser receives account names and IDs, never tokens.
- Owner session cookies are HttpOnly, SameSite=Lax, and Secure in production. OAuth state is random, bound to the owner session, expires after ten minutes, and is consumed once. Session IDs are hashed at rest.
- Authenticated mutations require JSON and an exact same-origin Origin header. There is no permissive CORS or cross-origin token endpoint.
- Rate limiting, request-size limits, provider timeouts, redacted errors, CSP, and no-store/no-referrer headers are included. Production denies framing. Proxy trust assumes one trusted reverse proxy, as on Render.
- Only `dist/` is exposed by the web server, not the repository, server files, database, environment files, or Git directory.
- Keep the encryption key secure. In the optional persistent deployment, keep the private disk secure and back up the database and key under appropriate access controls. The default free-testing database is ephemeral, not a backup. This SQLite deployment is single-instance; do not horizontally scale it or share one disk between multiple instances.
- The owner/password authentication is intentionally for one person's workspace, not a multi-user product. Additional owners need proper user authentication, tenancy, authorization, recovery, and auditing before launch.

## Local development

```sh
npm install
cp .env.example .env
# Fill in .env privately. Generate independent random owner password and encryption key.
npm run build
npm start
```

Open `http://localhost:3000`. `.env` and `data/` are ignored by Git. Meta generally needs a registered public HTTPS callback for a real production flow; local development alone is not a deployed integration. Do not publish a tunnel without reviewing its security and lifetime.

For frontend-only development, `npm run dev` still runs the static Vite frontend. Connect from the backend-served copy when testing auth. The GitHub Pages copy can accept a public backend URL in its account panel and navigate to the secure service; it never stores credentials or calls cross-origin private APIs.

## Tests

```sh
npm run test:backend
npm run build
```

Backend tests cover owner login, CSRF/origin checks, OAuth session/state binding, one-time/expired states, provider denial/failure, account discovery and selection, encrypted persistent storage, credential non-disclosure, verification, logout, disconnect, and static-serving restrictions. Real Meta authorization and deployment must still be tested by the owner.

Public privacy and manual data-deletion instructions are now included; see [privacy setup](PRIVACY_SETUP.md) for deployment and the correct Meta fields. For a public app, also implement any required signed deletion/deauthorization callbacks, business verification, and App Review materials as required by Meta. Automated compliance callbacks and review approval are not part of this connection milestone. Do not mark the app production-ready for other people's accounts based only on local tests.
