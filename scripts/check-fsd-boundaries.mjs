import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const sourceRoot = path.resolve("src");
const layerRank = new Map([
  ["shared", 0],
  ["entities", 1],
  ["features", 2],
  ["widgets", 3],
  ["pages", 4],
  ["app", 5],
]);

// Typed Redux hooks expose app store types. Keeping this single integration seam explicit is
// preferable to scattering untyped hooks across slices.
const upwardImportExceptions = new Set(["app/store", "app/store/hooks"]);

// These API modules share the current RTK Query base API. They are intentionally listed so new
// same-layer coupling cannot be introduced silently; extracting a shared API client is the next
// migration step.
const deepCrossSliceExceptions = new Set([
  "features/articles/api/articles-api.ts->features/topology/api/topology-api",
  "features/business/api/business-api.ts->features/topology/api/topology-api",
  "features/conversion/api/conversion-api.ts->features/auth/api/auth-base-query",
  "features/files/api/files-api.ts->features/topology/api/topology-api",
  "features/topology/api/topology-api.ts->features/auth/api/auth-base-query",
]);

const sourceExtensions = new Set([".ts", ".tsx"]);
const importPattern = /(?:import|export)\s+(?:[^"'`;]*?\sfrom\s*)?["']([^"']+)["']/gs;

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
    }),
  );
  return files.flat().filter((file) => sourceExtensions.has(path.extname(file)));
}

function sourceRelative(file) {
  return path.relative(sourceRoot, file).split(path.sep).join("/");
}

function resolveInternalImport(importer, specifier) {
  if (specifier.startsWith("@/")) return specifier.slice(2);

  const alias = specifier.match(/^@(app|pages|widgets|features|entities|shared)(?:\/(.*))?$/);
  if (alias) return [alias[1], alias[2]].filter(Boolean).join("/");

  if (!specifier.startsWith(".")) return null;
  const absolute = path.resolve(path.dirname(importer), specifier);
  return sourceRelative(absolute).replace(/\.(?:ts|tsx)$/, "");
}

function importLayer(relativePath) {
  return relativePath.split("/")[0];
}

function isTest(relativePath) {
  return /\.(?:test|spec)\.[jt]sx?$/.test(relativePath);
}

const files = await collectFiles(sourceRoot);
const violations = [];

for (const file of files) {
  const importer = sourceRelative(file);
  const [sourceLayer, sourceSlice] = importer.split("/");
  const sourceRank = layerRank.get(sourceLayer);
  if (sourceRank === undefined) continue;

  const content = await readFile(file, "utf8");
  for (const match of content.matchAll(importPattern)) {
    const specifier = match[1];
    const imported = resolveInternalImport(file, specifier);
    if (!imported) continue;

    const targetLayer = importLayer(imported);
    const targetRank = layerRank.get(targetLayer);
    if (targetRank === undefined) continue;

    if (targetRank > sourceRank && !upwardImportExceptions.has(imported)) {
      violations.push(`${importer}: ${specifier} imports upward into ${targetLayer}`);
      continue;
    }

    if (
      sourceLayer === "app" ||
      sourceLayer === "shared" ||
      sourceLayer !== targetLayer ||
      isTest(importer)
    )
      continue;

    const [, targetSlice, ...targetSegments] = imported.split("/");
    if (!sourceSlice || !targetSlice || sourceSlice === targetSlice || targetSegments.length === 0)
      continue;

    const exception = `${importer}->${imported}`;
    if (!deepCrossSliceExceptions.has(exception)) {
      violations.push(
        `${importer}: ${specifier} bypasses the ${targetLayer}/${targetSlice} public API`,
      );
    }
  }
}

if (violations.length > 0) {
  console.error("FSD boundary violations:\n");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log(`FSD boundaries OK (${files.length} source files checked).`);
}
