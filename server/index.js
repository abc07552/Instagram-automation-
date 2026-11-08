import { createApp, readConfig } from "./app.js";

process.umask(0o077);
const config = readConfig();
const { app, store } = createApp({ config });
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
    server.close(() => {
      store.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
