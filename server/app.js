import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { Store, hash } from "./store.js";
import { createMeta, ProviderError } from "./meta.js";

export function readConfig(env = process.env) {
  const production = env.NODE_ENV === "production";
  const base = new URL(
    env.PUBLIC_BASE_URL || env.RENDER_EXTERNAL_URL || "http://localhost:3000",
  );
  if (
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    base.pathname !== "/"
  )
    throw new Error("PUBLIC_BASE_URL must be an origin without a path");
  if (production && base.protocol !== "https:")
    throw new Error("Production requires an HTTPS PUBLIC_BASE_URL");
  if (!["https:", "http:"].includes(base.protocol))
    throw new Error("Invalid PUBLIC_BASE_URL");
  const config = {
    baseUrl: base.origin,
    callbackUrl: `${base.origin}/auth/instagram/callback`,
    production,
    appId: env.META_APP_ID || "",
    appSecret: env.META_APP_SECRET || "",
    configId: env.META_LOGIN_CONFIG_ID || "",
    adminPassword: env.ADMIN_PASSWORD || "",
    encryptionKey: env.TOKEN_ENCRYPTION_KEY || "",
    apiVersion: env.META_API_VERSION || "v26.0",
    dbPath: env.DATABASE_PATH || "./data/bloom.sqlite",
  };
  if (!/^v\d+\.\d+$/.test(config.apiVersion))
    throw new Error("Invalid META_API_VERSION");
  config.missing = [];
  for (const [key, value] of [
    ["META_APP_ID", config.appId],
    ["META_APP_SECRET", config.appSecret],
    ["META_LOGIN_CONFIG_ID", config.configId],
  ]) {
    if (!value || (key !== "META_APP_SECRET" && !/^\d+$/.test(value)))
      config.missing.push(key);
  }
  if (config.adminPassword.length < 16)
    config.missing.push("ADMIN_PASSWORD (at least 16 characters)");
  if (config.encryptionKey.length < 32)
    config.missing.push("TOKEN_ENCRYPTION_KEY (at least 32 random characters)");
  config.ready = config.missing.length === 0;
  return config;
}

export function createApp({
  config = readConfig(),
  fetcher = fetch,
  now = Date.now,
  store = new Store(config.dbPath, config.encryptionKey),
  staticDir = fileURLToPath(new URL("../dist/", import.meta.url)),
} = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1); // Render's single reverse proxy; do not expose the Node port directly.
  app.use(
    helmet({
      frameguard: config.production ? { action: "deny" } : false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: config.production ? ["'none'"] : null,
          formAction: ["'self'"],
          upgradeInsecureRequests: config.production ? [] : null,
        },
      },
      referrerPolicy: { policy: "no-referrer" },
      strictTransportSecurity: config.production ? undefined : false,
    }),
  );
  app.use(["/api", "/auth"], (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use(
    ["/api", "/auth"],
    rateLimit({
      windowMs: 60000,
      limit: 100,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  );
  app.use(express.json({ limit: "8kb", type: "application/json" }));
  const meta = createMeta(config, fetcher, now);
  const cookieName = config.production
    ? "__Host-bloom_session"
    : "bloom_session";
  const cookieOptions = {
    httpOnly: true,
    secure: config.production,
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60 * 1000,
  };
  const rawSession = (req) => {
    const cookies = (req.headers.cookie || "")
      .split(";")
      .map((value) => value.trim());
    return cookies
      .find((value) => value.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);
  };
  app.use((req, res, next) => {
    req.session = store.session(rawSession(req), now());
    next();
  });
  function requireOwner(req, res, next) {
    if (!req.session)
      return res.status(401).json({ error: "owner_login_required" });
    next();
  }
  function sameOrigin(req, res, next) {
    if (req.headers.origin !== config.baseUrl || !req.is("application/json"))
      return res.status(403).json({ error: "invalid_request_origin" });
    next();
  }
  const asyncRoute = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res)).catch(next);

  app.get("/healthz", (req, res) =>
    res.json({ ok: true, configured: config.ready }),
  );
  app.get("/api/connection", (req, res) => {
    if (!req.session)
      return res.json({
        backend: true,
        configured: config.ready,
        authenticated: false,
        connected: false,
      });
    const connection = store.connection();
    const expired = connection?.expiresAt && connection.expiresAt <= now();
    res.json({
      backend: true,
      configured: config.ready,
      authenticated: true,
      connected: Boolean(connection && !expired),
      reconnectRequired: Boolean(expired),
      account: connection ? connection.account : null,
      connectedAt: connection?.connectedAt || null,
      expiresAt: connection?.expiresAt || null,
      callbackUrl: config.callbackUrl,
      missing: config.missing,
      pending: Boolean(
        req.session.pending && req.session.pending_expires > now(),
      ),
      capabilities: { publishing: false, insights: false },
    });
  });
  const loginLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 8,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "too_many_login_attempts" },
  });
  app.post("/api/session", sameOrigin, loginLimit, (req, res) => {
    if (config.adminPassword.length < 16)
      return res.status(503).json({ error: "owner_password_not_configured" });
    const supplied =
      typeof req.body?.password === "string" ? req.body.password : "";
    if (
      !timingSafeEqual(
        Buffer.from(hash(supplied)),
        Buffer.from(hash(config.adminPassword)),
      )
    )
      return res.status(401).json({ error: "incorrect_owner_password" });
    store.deleteSession(rawSession(req));
    const session = randomBytes(32).toString("hex");
    store.newSession(session, now());
    res.cookie(cookieName, session, cookieOptions).json({ ok: true });
  });
  app.post("/api/logout", sameOrigin, requireOwner, (req, res) => {
    store.deleteSession(rawSession(req));
    res
      .clearCookie(cookieName, { ...cookieOptions, maxAge: undefined })
      .json({ ok: true });
  });
  app.get("/auth/instagram/start", requireOwner, (req, res) => {
    if (!config.ready)
      return res.status(503).json({ error: "backend_not_configured" });
    const state = randomBytes(32).toString("hex");
    store.startOAuth(req.session.id, state, now());
    res.redirect(302, meta.authorize(state));
  });
  app.get(
    "/auth/instagram/callback",
    asyncRoute(async (req, res) => {
      const state = typeof req.query.state === "string" ? req.query.state : "";
      if (
        !config.ready ||
        !req.session ||
        !req.session.oauth_state ||
        req.session.oauth_expires <= now() ||
        !timingSafeEqual(
          Buffer.from(hash(state)),
          Buffer.from(req.session.oauth_state),
        )
      ) {
        return res
          .status(400)
          .type("text")
          .send(
            "Sign-in could not be verified. Open Bloom, sign in as owner, and start again.",
          );
      }
      // Consume BEFORE exchanging. A rejected, expired, or replayed callback cannot bind an account.
      store.consumeOAuth(req.session.id);
      const finish = (outcome) =>
        res.redirect(303, `${config.baseUrl}/?connection=${outcome}#overview`);
      if (req.query.error) return finish("denied");
      if (
        typeof req.query.code !== "string" ||
        !req.query.code ||
        req.query.code.length > 4096
      )
        return finish("failed");
      try {
        const credential = await meta.exchange(req.query.code);
        const accounts = await meta.accounts(credential.token);
        if (!accounts.length) return finish("no_accounts");
        store.pending(req.session.id, { ...credential, accounts }, now());
        return finish("choose");
      } catch (error) {
        if (error instanceof ProviderError)
          return finish(
            error.kind === "reconnect_required" ? "expired" : "failed",
          );
        throw error;
      }
    }),
  );
  app.get("/api/instagram/accounts", requireOwner, (req, res) => {
    if (!req.session.pending || req.session.pending_expires <= now())
      return res.status(409).json({ error: "start_connection_again" });
    const pending = store.decrypt(req.session.pending);
    res.json({ accounts: pending.accounts });
  });
  app.post("/api/instagram/connect", sameOrigin, requireOwner, (req, res) => {
    if (!req.session.pending || req.session.pending_expires <= now())
      return res.status(409).json({ error: "start_connection_again" });
    const pending = store.decrypt(req.session.pending);
    const account = pending.accounts.find(
      (account) => account.id === req.body?.accountId,
    );
    if (!account)
      return res.status(400).json({ error: "invalid_account_selection" });
    store.connect({
      token: pending.token,
      expiresAt: pending.expiresAt,
      account,
      connectedAt: new Date(now()).toISOString(),
    });
    store.clearPending(req.session.id);
    res.json({ connected: true, account });
  });
  app.post(
    "/api/instagram/disconnect",
    sameOrigin,
    requireOwner,
    asyncRoute(async (req, res) => {
      const connection = store.connection();
      let revoked = false;
      try {
        if (connection) {
          await meta.revoke(connection.token);
          revoked = true;
        }
      } catch {
        /* Always permit deleting a locally stored credential even if Meta is unavailable. */
      }
      store.disconnect();
      res.json({ connected: false, revoked });
    }),
  );
  app.get(
    "/api/instagram/verify",
    requireOwner,
    asyncRoute(async (req, res) => {
      const connection = store.connection();
      if (!connection) return res.status(409).json({ error: "not_connected" });
      const accounts = await meta.accounts(connection.token);
      const account = accounts.find(
        (account) => account.id === connection.account.id,
      );
      if (!account)
        return res.status(409).json({ error: "reconnect_required" });
      store.connect({ ...connection, account });
      res.json({ ok: true, account });
    }),
  );
  // Fail closed: never let a missing API endpoint return the SPA or expose source files.
  app.use(["/api", "/auth"], (req, res) =>
    res.status(404).json({ error: "not_found" }),
  );
  app.use(
    express.static(resolve(staticDir), {
      dotfiles: "deny",
      index: "index.html",
    }),
  );
  app.use((req, res) => res.status(404).type("text").send("Not found"));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof ProviderError)
      return res.status(502).json({ error: error.kind });
    if (error.type === "entity.too.large")
      return res.status(413).json({ error: "request_too_large" });
    if (error.type === "entity.parse.failed")
      return res.status(400).json({ error: "invalid_json" });
    // Do not log request URLs/bodies: OAuth callbacks and provider failures can contain secrets.
    console.error("Bloom request failed (details redacted).");
    res.status(500).json({ error: "internal_error" });
  });
  return { app, store };
}
