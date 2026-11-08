# Publish the privacy and deletion instructions pages

Privacy contact supplied by the workspace owner: **abc075528@gmail.com**. This address is intentionally public. No mailbox access or email-sending integration has been configured; the owner must monitor and handle requests manually.

## What was added

- `privacy.html` — information collected, purposes, provider sharing, security, retention, user choices, and contact details for the current implementation.
- `data-deletion.html` — owner disconnect, Meta revocation, browser-data clearing, and manually verified email requests.
- `legal.css` — local styles and fonts for readable, mobile-friendly pages.
- Links from the workspace footer and account dialog.
- Static build inclusion; the server exposes both HTML pages without owner authentication.

Review the statements against actual operations before publishing. Update them whenever data handling changes. No legal compliance certification or Meta review approval is implied. The current app does not implement automatic posting, live insights, or external AI. Free backend storage is temporary; email messages and host-managed data have separate handling. The pages do not promise immediate secure erasure or automatic email processing.

## Deploy from your existing Render service

The configured Blueprint has `autoDeployTrigger: "off"`. Pushing code to GitHub does **not** automatically deploy it.

1. Open Render → **bloom-instagram-backend**.
2. Keep the **Free** instance. Do not switch plans or add a disk for these static pages.
3. Choose **Manual Deploy → Deploy latest commit** for branch `arena/d3fb70ad-instagram-automation`.
4. Wait for the new deployment to show **Live**.
5. Open each page below in a normal/private browser tab. They should open without entering the Bloom owner password.

Based on the service hostname shown by the owner, the expected URLs **after this revision is deployed** are:

- Privacy: `https://bloom-instagram-backend.onrender.com/privacy.html`
- Deletion instructions: `https://bloom-instagram-backend.onrender.com/data-deletion.html`

These are expected deployment addresses, not proof that the latest files are already live. The sandbox cannot fetch the Render host, so the owner needs to verify the real URLs after deployment. If the service hostname changes, use its actual address instead.

A free instance can be slow to wake and a redeploy may erase its saved account connection/session. Sign in and reconnect if necessary. Publishing these pages does not enable a scheduler.

## Enter the URLs in Meta

1. Open your Meta app → **App settings → Basic** (or **Go to app settings** on the Publish checklist).
2. Enter the verified public privacy URL in **Privacy Policy URL** and save.
3. If Meta offers **User Data Deletion → Data deletion instructions URL**, choose that instructions option and enter the verified deletion-page URL.
4. **Do not enter this HTML page as a Data Deletion Callback URL or a Deauthorization Callback URL.** Signed-request endpoints are not implemented in this version.
5. Return to **Publish** and review remaining use-case, testing, permission, and review requirements. Do not assume the app is approved or that this alone fixes “App not active.”

Do not paste a homepage, unrelated policy, localhost address, or temporary sandbox preview into the policy field. Do not expose secrets in screenshots. The email contact is public by design; app secrets, owner passwords, and tokens are not.

## GitHub Pages

These are plain HTML/CSS pages and can also be published on GitHub Pages once the corresponding revision is in its publishing source. Do not assume pushing this working branch updates a Pages site configured for `main`. For the current flow, use the backend-hosted pages after the manual deployment above.

## Tests

`npm run test:backend` includes checks for public access, contact/link accuracy, and inclusion of the legal assets in the static build. Browser checks can be run with `npm run test:legal-ui` and a Playwright Chromium installation (or `CHROMIUM_PATH`). They verify both source and built pages on mobile and desktop, local assets, working navigation, and no external network requests. No real provider or account credentials are used.
