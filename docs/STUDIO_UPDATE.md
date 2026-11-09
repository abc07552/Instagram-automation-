# Bloom Studio update and deployment

## Included

- Premium forest/sage dashboard in the existing `index.html`, `style.css`, and
  `script.js`—no framework, remote image/font dependencies, subscription, or paid hosting.
- Responsive navigation and layouts, local draft/saved-idea counts on desktop,
  content planning, accessible connection dialog, and retained legal-page links.
- Backend-derived status: owner locked, setup needed, ready for sign-in,
  account selection pending, Instagram authorization saved, reconnect required,
  and connection service unavailable. A locked session intentionally does not
  disclose whether a private connection exists.
- Manual retry for an unavailable/waking backend, without losing local drafts.
- Troubleshooting for app activation, missing portfolio assets, and Meta’s own
  Instagram OpenID Connect code error. No account transfers or ownership changes
  are automated.
- App/configuration identifiers shown only in unlocked connection settings.
  These are public OAuth identifiers, never the app secret or access token.

## OAuth compatibility adjustment

The app now opens `https://www.facebook.com/dialog/oauth`, matching the entry
point visibly used by Meta’s generated Login URL. The extra forced `prompt=login`
and `display=page` options have been removed. `client_id`, `config_id`,
`redirect_uri`, `response_type=code`, `override_default_response_type=true`, and
Bloom’s single-use owner-session-bound `state` are retained. Graph requests and
the server-side code exchange still use `META_API_VERSION`.

This is a tested URL-construction change, **not a confirmed root-cause fix** for
“App not active.” Meta’s generated URL reached asset selection in the user’s
browser; the prior Bloom URL did not. No complete copy of Meta’s generated URL
was collected, and no real authorization was performed in this development
sandbox. Do not disable state verification or complete authorization using a
manually copied dashboard link.

The user’s Abc portfolio was shown without Instagram assets. Adding an asset
then failed on Meta’s own site with “The provided code is invalid for Instagram
OpenID Connect.” Bloom cannot repair that provider-side account-linking step.
Do not remove an account from another portfolio or transfer ownership blindly.

## Deploy to the existing Free Render service

The blueprint has automatic deployment **off**, so a Git push alone does not
update `https://bloom-instagram-backend.onrender.com`.

1. In Render, open the existing Bloom backend service.
2. Confirm it deploys branch `arena/d3fb70ad-instagram-automation`.
3. Choose **Manual Deploy → Deploy latest commit**. Keep the Free service;
   no new service, disk, datastore, or payment is required by this code change.
4. Wait for **Live**, then reload the service URL. The dashboard heading is
   **Your creative command center.** and the sidebar is dark green.
5. Open **Connect Instagram**, unlock owner settings privately, and check the
   app/configuration IDs against Meta’s selected Unified Login configuration.
6. Start login from Bloom, not a saved Meta callback URL. Confirm whether it now
   reaches the same asset-selection screen as Meta’s generated link.
7. Only complete authorization if Meta offers the correct account and permissions.
   A real connection requires the callback and explicit account selection in Bloom.

Free storage is temporary: redeployment can remove sessions and stored
connections. Owner passwords and Meta secrets stay in Render Environment; never
send them in chat or enter Instagram credentials into Bloom.

## Verification

```sh
npm run test:backend
npm run test:dashboard-ui
npm run test:connection-ui
npm run test:standalone
npm run test:legal-ui
```

Browser tests require an installed Playwright Chromium or `CHROMIUM_PATH`.
Dashboard checks cover 320/390/768/1440px, no horizontal overflow, local images,
planner navigation and draft counts, dialog keyboard dismissal, escaped account
names, distinct connection statuses, and unavailable-service retry. The
connection test mocks Meta beyond the real local 302 redirect boundary; it does
not prove live Meta access. Automatic publishing, live insights, external AI,
and Meta app approval remain unavailable and are labelled accordingly.
