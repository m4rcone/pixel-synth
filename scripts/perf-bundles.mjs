import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";
import vm from "node:vm";

const projectRoot = process.cwd();
const nextDir = join(projectRoot, ".next");
const appServerDir = join(nextDir, "server", "app");
const staticDir = join(nextDir, "static");

if (!existsSync(appServerDir)) {
  console.error(
    "No .next/server/app directory found. Run `npm run build` first.",
  );
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function routeFromManifestKey(key) {
  if (key === "/page") return "/";

  return (
    key
      .replace(/\/page$/, "")
      .replace(/\/\([^/]+?\)/g, "")
      .replace(/\/+/g, "/") || "/"
  );
}

function loadManifest(file) {
  const context = { globalThis: {} };
  vm.createContext(context);
  vm.runInContext(readFileSync(file, "utf8"), context, {
    filename: relative(projectRoot, file),
  });

  return context.globalThis.__RSC_MANIFEST ?? {};
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

const manifestFiles = walk(appServerDir).filter((file) =>
  file.endsWith("page_client-reference-manifest.js"),
);

const rows = manifestFiles
  .flatMap((file) => {
    const manifestByRoute = loadManifest(file);

    return Object.entries(manifestByRoute).map(([key, manifest]) => {
      const chunks = new Set(
        Object.values(manifest.entryJSFiles ?? {}).flatMap((files) => files),
      );

      const sizes = [...chunks].reduce(
        (totals, chunk) => {
          const path = join(staticDir, chunk.replace(/^static\//, ""));
          if (!existsSync(path)) return totals;

          const source = readFileSync(path);
          totals.raw += source.byteLength;
          totals.gzip += gzipSync(source).byteLength;
          return totals;
        },
        { raw: 0, gzip: 0 },
      );

      return {
        route: routeFromManifestKey(key),
        chunks: chunks.size,
        raw: sizes.raw,
        gzip: sizes.gzip,
      };
    });
  })
  .filter((row) => !row.route.startsWith("/_"))
  .sort((a, b) => a.route.localeCompare(b.route));

console.log("| Route | JS chunks | Raw | Gzip |");
console.log("| --- | ---: | ---: | ---: |");
for (const row of rows) {
  console.log(
    `| ${row.route} | ${row.chunks} | ${formatBytes(row.raw)} | ${formatBytes(row.gzip)} |`,
  );
}
