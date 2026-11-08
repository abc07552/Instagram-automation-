import { cp, mkdir, rm } from "node:fs/promises";

await rm(new URL("../dist/", import.meta.url), {
  recursive: true,
  force: true,
});
await mkdir(new URL("../dist/", import.meta.url), { recursive: true });
for (const file of [
  "index.html",
  "style.css",
  "script.js",
  "privacy.html",
  "data-deletion.html",
  "legal.css",
  "public",
  ".nojekyll",
]) {
  await cp(
    new URL(`../${file}`, import.meta.url),
    new URL(`../dist/${file}`, import.meta.url),
    { recursive: true },
  );
}
console.log("Built standalone Bloom interface in dist/");
