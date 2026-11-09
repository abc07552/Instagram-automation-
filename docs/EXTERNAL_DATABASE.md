# External PostgreSQL on Free Render compute

## Status and what persists

The application now supports `STORAGE_MODE=external` with a private
`DATABASE_URL`. This is implemented, tested locally, and opt-in. It does **not**
create a hosted database or change the running Render service by itself.

External mode stores hashed owner sessions, hashed OAuth state, and encrypted
pending authorizations/Instagram connections in PostgreSQL. App redeployments
can retain the same data because it is no longer in Render's temporary SQLite
file. Browser-local drafts, uploads, and ideas remain in that browser; this is
not a cloud draft-sync feature. Meta authorization and provider retention limits
still apply. No service offers an indefinite data-retention guarantee.

## 1. Create a separate database

A suggested provider is **Neon**: https://console.neon.tech/.

1. Sign up or sign in directly with the provider. Choose its **Free** plan if
   available for your account. Stop if asked to approve charges or a paid plan.
2. Create a project such as `bloom-storage` and a PostgreSQL database. Use a
   region near your existing Render service where practical.
3. Use a dedicated project/database and database owner role for Bloom, not a
   database already used by another application. The role must be able to
   create and own a private schema and its tables.
4. Open **Connect** and choose the database and role. Enable **connection
   pooling** and select the standard PostgreSQL connection string. A Neon
   pooled host has `-pooler` in its hostname.
5. Copy that string **privately**. It contains the database password. Do not
   paste it in chat, a screenshot, GitHub, the Bloom form, or a browser URL bar.
   The app expects a PostgreSQL URL, not a dashboard link, API key, or HTTP URL.

The provider controls plan availability, quotas, idle suspension, backups, and
retention. Review its current terms before storing account data. Choose no paid
resources unless you separately approve them.

## 2. Configure your EXISTING Render service

Open `bloom-instagram-backend` → **Environment**. Add/update these together:

| Setting        | Private value                                             |
| -------------- | --------------------------------------------------------- |
| `STORAGE_MODE` | `external`                                                |
| `DATABASE_URL` | The pooled PostgreSQL connection string, pasted privately |

Keep these existing settings unchanged:

- `TOKEN_ENCRYPTION_KEY` — must stay the same across deployments. Changing it
  makes existing encrypted database records unreadable.
- `ADMIN_PASSWORD`, Meta App ID/secret/configuration ID, and the existing HTTPS
  service address/callback URL.

`DATABASE_PATH` is ignored in external mode. No Render disk, paid database, or
compute upgrade is needed by this integration. Do not create a duplicate Render
service or deploy the paid `render.persistent.yaml` for this option.

The optional `render.external.yaml` represents Free compute plus these external
settings for future Blueprint-managed setups. The default `render.yaml` remains
an explicit temporary-storage alternative. If your existing service is managed
by that default Blueprint, ensure a later Blueprint sync does **not** overwrite
`STORAGE_MODE` back to `ephemeral`: use the external Blueprint definition for
future managed configuration, or keep these environment overrides maintained.
Never put the real URL into any YAML file.

Then choose **Manual Deploy → Deploy latest commit** on branch
`arena/d3fb70ad-instagram-automation`. Automatic deployment is off. The app
creates its schema/tables itself; no SQL or browser API key is required.

**This switch starts with a new external store. It does not copy old SQLite
sessions or connections.** You will need to unlock once and reconnect any
previously saved Instagram connection. If existing records matter, arrange a
private, encrypted migration before switching—do not export tokens into chat or
Git. Changing storage does not repair Meta's account-linking errors.

## 3. Confirm it is really active

1. Wait for Render **Live**.
2. Open `https://bloom-instagram-backend.onrender.com/healthz`. It should report
   `"ok": true` and `"storageMode": "external"`. Health checks actually query
   PostgreSQL, not just an environment label. No credentials are returned.
3. Open Bloom → **Connect Instagram**. Look for **External PostgreSQL storage**,
   not the temporary-storage warning.
4. Select **Remember this device for 30 days** and unlock once, using your Bloom
   owner password privately. Never use your Instagram password in Bloom.
5. Close/reopen the same browser at the same HTTPS origin. Connection settings
   should remain unlocked while its cookie and unexpired session remain valid.
6. After a later app deployment, check the same browser again. With the same
   database, key, and cookie, it should retain that session. **Lock owner
   settings**, clearing cookies, private browsing, changing databases, or expiry
   requires login again. Expiry is fixed at 30 days; visits do not extend it.

An Instagram connection requires Meta's real authorization callback and explicit
account selection in Bloom. This setup does not enable posting, live analytics,
or Meta approval. The screenshot's separate “Invalid code for Instagram OpenID
Connect” in Meta Business Settings remains a provider-side linking issue.

## Security and outage behavior

- The app uses server-side `pg`, a small bounded pool, connection/query timeouts,
  certificate-verified TLS, and parameterized SQL. It never disables certificate
  verification or puts database credentials in browser JavaScript.
- The standard URL can include `sslmode=require` or `verify-full` and
  `channel_binding=require`; the app explicitly enforces verified TLS rather
  than allowing URL parameters to weaken it. It sends no unsupported
  `statement_timeout` startup option to a pooled endpoint.
- Tables live in `bloom_private`, with public schema/table privileges revoked.
  Use a dedicated database role and retain access controls. Do not expose this
  schema through a browser Data API.
- Encryption uses the same AES-256-GCM design as SQLite. Owner sessions are
  opaque cookies with hashed IDs at rest. OAuth state is consumed by a single
  conditional database update to reject concurrent replay.
- Invalid configuration or initialization failure stops startup. Runtime database
  failures return redacted `503 storage_unavailable`; **there is no local
  fallback that silently loses records**. Static/legal pages remain independent
  of database reads if the already-running database becomes unavailable.
- If the provider is sleeping, allow time for it to wake and retry. If startup
  keeps failing, check the private connection string, database availability,
  role permissions, and unchanged encryption key. Do not disable TLS/state
  verification, delete records, or reveal connection strings to troubleshoot.

## Backups, deletion, and limits

Use the provider's private backup/export controls as appropriate. Keep backups
and the encryption key in access-controlled storage—not this repository.
Disconnect deletes the live encrypted connection and pending authorizations;
locking deletes the current device's owner session. Other sessions expire after
8 hours/30 days and are cleaned on the next owner login. Provider backups,
logs, and retained copies need separate handling. See `privacy.html` and
`data-deletion.html` for public instructions, and keep the operator/provider
information accurate for your actual deployment.

## Tests and limits of verification

```sh
npm run test:backend
npm run test:postgres
npm run test:connection-ui
npm run test:dashboard-ui
```

Tests use PGlite's local PostgreSQL engine for SQL/storage semantics, restart
persistence, the HTTP owner/OAuth lifecycle, concurrent state replay rejection,
redaction, deletion, and database-outage behavior. TLS/pool configuration is
unit-tested. They do not establish a real network/TLS connection to Neon or
provision resources. The owner must still perform the live checks above.

Provider references:

- https://neon.com/docs/reference/cli-connection-string
- https://neon.com/docs/connect/connection-errors
- https://neon.com/faqs/postgres-databases-vector-embeddings-scale-to-zero
