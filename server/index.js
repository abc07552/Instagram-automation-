import { createApp, readConfig } from "./app.js";
import { openStore } from "./storage.js";

process.umask(0o077);
let config, store;
try {
  config = readConfig();
  store = await openStore(config);
} catch {
  console.error(
    "Bloom startup failed. Check private storage/environment settings and database availability (details redacted).",
  );
  process.exit(1);
}
const { app } = createApp({ config, store });
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, "0.0.0.0", () => {
  console.log(
    `Bloom backend listening on port ${port}. Meta setup ${config.ready ? "configured" : "incomplete"}.`,
  );
});
server.requestTimeout = 20000;
server.headersTimeout = 10000;
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    server.close(async () => {
      try {
        await store.close();
      } catch {
        console.error("Bloom database shutdown failed (details redacted).");
      }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
