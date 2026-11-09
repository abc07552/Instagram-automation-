# Storage and staying signed in

## What changed

Bloom's owner-login form now offers **Remember this device for 30 days**.
It is an explicit, unchecked opt-in for a private, trusted device. Without it,
sessions remain limited to eight hours. With it, both the server session and
browser cookie expire after the same fixed 30 days. Opening the website does
not extend the deadline.

- Passwords are never saved in browser storage or cookies.
- The browser cookie contains an opaque session identifier. The server stores
  only its SHA-256 hash. Production cookies remain Secure, HttpOnly, and
  SameSite=Lax.
- **Lock owner settings** immediately invalidates the current device's session.
- Instagram access tokens remain AES-GCM encrypted on the server, not in the
  browser. The owner session lifetime does not extend Meta token validity.
- OAuth security state and pending account selection still expire after ten
  minutes. Remembering a device never bypasses state or origin validation.
- The dashboard/planner is available without unlocking. Private connection
  management remains owner-protected because the website is publicly reachable.

After deploying the update, unlock once with the checkbox selected. Old
sessions are not extended automatically. Use the same HTTPS address and browser;
private/incognito windows, deleted cookies, or a different origin require login.

## Why this is not permanent storage

The current default is a Free Render service using `/tmp/bloom/bloom.sqlite`.
A deployment, instance replacement, or other temporary-storage loss removes
server sessions and stored Instagram credentials. A 30-day browser cookie
cannot authenticate against a session record that no longer exists.

**No durable service was provisioned by this change.** The existing default
blueprint remains Free; changing `STORAGE_MODE` to `persistent` alone does not
create persistence. Keeping a process awake or storing Meta tokens in
localStorage is not a safe substitute.

## Durable options requiring an owner choice

1. **Keep Free Render compute; add an external durable database.** This requires
   selecting a provider/account, adding and testing a compatible database
   adapter (the current store is SQLite), setting its credentials privately in
   Render, and updating privacy/deletion documentation. A provider's free plan
   can have quotas, suspension or retention limits; it is not an indefinite
   storage guarantee. This option is not implemented or configured yet.
2. **Use a Render persistent disk.** The optional `render.persistent.yaml`
   already describes a paid service with a disk at `/var/data/bloom`, keeping the
   existing SQLite implementation. Only proceed with explicit billing approval;
   follow `BACKEND_SETUP.md`. Keep the encryption key stable, back up the private
   database securely, and test recovery. A disk does not make Meta access
   permanent or replace backups.

Do not approve paid resources or transfer Instagram account ownership merely to
stop a password prompt. Never paste passwords, database URLs, encryption keys,
Meta app secrets, or tokens in chat.

## Tests

Backend tests verify the default eight-hour expiry, strict boolean opt-in,
30-day fixed expiry matching the cookie, Secure/HttpOnly/SameSite flags, logout
revocation, hashed sessions, and reopening the same durable SQLite file. A new
empty database deliberately rejects a remembered session. Browser tests verify
the checkbox, persisted cookie, reopening a browser context without reentering
the owner password, and locking the device afterward.
