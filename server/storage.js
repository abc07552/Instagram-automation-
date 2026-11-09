import { Store } from "./store.js";
import { openPostgres } from "./postgres-store.js";

export function localStore(config) {
  if (config.storageMode === "external") {
    throw new Error(
      "External storage requires an initialized PostgreSQL store; local fallback is disabled",
    );
  }
  return new Store(config.dbPath, config.encryptionKey);
}

export async function openStore(config) {
  return config.storageMode === "external"
    ? openPostgres(config)
    : localStore(config);
}
