import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { readConfig } from "../server/app.js";

const blueprint = async (name) =>
  parse(await readFile(new URL(`../${name}`, import.meta.url), "utf8"));
const envOf = (service) =>
  Object.fromEntries(
    service.envVars
      .filter((item) => "value" in item)
      .map((item) => [item.key, String(item.value)]),
  );

test("default Blueprint requests only Free compute, without disks or paid datastores", async () => {
  const data = await blueprint("render.yaml");
  assert.equal(data.services.length, 1);
  assert.equal(data.databases, undefined);
  const service = data.services[0];
  assert.equal(service.type, "web");
  assert.equal(service.runtime, "node");
  assert.equal(service.plan, "free");
  assert.equal(service.disk, undefined);
  assert.equal(service.branch, "arena/d3fb70ad-instagram-automation");
  assert.equal(service.startCommand, "npm start");
  assert.equal(service.buildCommand, "npm ci --omit=dev && npm run build");
  assert.equal(service.autoDeployTrigger, "off");
  const env = envOf(service);
  assert.equal(
    env.NODE_ENV,
    "production",
    "Free testing must not disable production cookie protections",
  );
  assert.equal(env.STORAGE_MODE, "ephemeral");
  assert.equal(env.DATABASE_PATH, "/tmp/bloom/bloom.sqlite");
  const config = readConfig({
    ...env,
    RENDER_EXTERNAL_URL: "https://free-test.example",
  });
  assert.equal(config.storageMode, "ephemeral");
  assert.equal(config.production, true);
  assert.equal(
    config.callbackUrl,
    "https://free-test.example/auth/instagram/callback",
  );
});

test("both deployment choices keep real credentials out of source and generate independent secrets", async () => {
  for (const file of ["render.yaml", "render.persistent.yaml"]) {
    const {
      services: [service],
    } = await blueprint(file);
    for (const key of [
      "META_APP_ID",
      "META_APP_SECRET",
      "META_LOGIN_CONFIG_ID",
    ]) {
      const entry = service.envVars.find((entry) => entry.key === key);
      assert.equal(entry.sync, false);
      assert.equal(entry.value, undefined);
    }
    for (const key of ["ADMIN_PASSWORD", "TOKEN_ENCRYPTION_KEY"]) {
      const entry = service.envVars.find((entry) => entry.key === key);
      assert.equal(entry.generateValue, true);
      assert.equal(entry.value, undefined);
    }
  }
});

test("paid persistence is opt-in and cannot be mistaken for the default Blueprint", async () => {
  const {
    services: [service],
  } = await blueprint("render.persistent.yaml");
  assert.equal(service.plan, "starter");
  assert.equal(service.disk.mountPath, "/var/data/bloom");
  assert.equal(envOf(service).STORAGE_MODE, "persistent");
  assert.equal(envOf(service).DATABASE_PATH, "/var/data/bloom/bloom.sqlite");
});

test("storage labels fail closed on typos", () => {
  assert.throws(
    () => readConfig({ STORAGE_MODE: "unrecognised" }),
    /Invalid STORAGE_MODE/,
  );
});

test("static build includes the exact reviewed public legal pages and styles", async () => {
  for (const file of ["privacy.html", "data-deletion.html", "legal.css"]) {
    const source = await readFile(
      new URL(`../${file}`, import.meta.url),
      "utf8",
    );
    const built = await readFile(
      new URL(`../dist/${file}`, import.meta.url),
      "utf8",
    );
    assert.equal(built, source, file);
  }
  const privacy = await readFile(
    new URL("../privacy.html", import.meta.url),
    "utf8",
  );
  assert.match(privacy, /href="\.\/data-deletion\.html"/);
  assert.match(privacy, /abc075528@gmail\.com/);
  const deletion = await readFile(
    new URL("../data-deletion.html", import.meta.url),
    "utf8",
  );
  assert.match(deletion, /not an automatic deletion\s+callback/);
  assert.match(deletion, /href="\.\/privacy\.html"/);
});

test("external database Blueprint keeps compute Free and requires a private PostgreSQL URL without a disk", async () => {
  const {
    services: [service],
    databases,
  } = await blueprint("render.external.yaml");
  assert.equal(service.plan, "free");
  assert.equal(service.disk, undefined);
  assert.equal(databases, undefined);
  assert.equal(service.branch, "arena/d3fb70ad-instagram-automation");
  assert.equal(service.autoDeployTrigger, "off");
  assert.equal(envOf(service).STORAGE_MODE, "external");
  assert.equal(
    service.envVars.find((entry) => entry.key === "DATABASE_URL").sync,
    false,
  );
  assert.equal(
    service.envVars.find((entry) => entry.key === "DATABASE_URL").value,
    undefined,
  );
  assert.equal(
    service.envVars.some((entry) => entry.key === "DATABASE_PATH"),
    false,
  );
});
