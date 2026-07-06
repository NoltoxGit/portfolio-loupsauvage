#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const versionPath = path.join(projectRoot, "VERSION");
const version = readFileSync(versionPath, "utf8").trim();
const checkOnly = process.argv.includes("--check");
const printVersion = process.argv.includes("--print");

if (!/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(
    `Invalid VERSION "${version}". Use SemVer-compatible CalVer, for example 2026.7.6 or 2026.7.6-1.`,
  );
  process.exit(1);
}

const changedFiles = [];

function writeIfChanged(filePath, nextContent) {
  const currentContent = readFileSync(filePath, "utf8");

  if (currentContent === nextContent) {
    return;
  }

  if (checkOnly) {
    changedFiles.push(path.relative(projectRoot, filePath));
    return;
  }

  writeFileSync(filePath, nextContent);
}

function updateJson(relativePath, update) {
  const filePath = path.join(projectRoot, relativePath);
  const data = JSON.parse(readFileSync(filePath, "utf8"));
  update(data);
  writeIfChanged(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function updateText(relativePath, update) {
  const filePath = path.join(projectRoot, relativePath);
  const currentContent = readFileSync(filePath, "utf8");
  writeIfChanged(filePath, update(currentContent));
}

function replaceRequired(content, pattern, replacement, relativePath) {
  if (!pattern.test(content)) {
    console.error(`Unable to synchronize version in ${relativePath}: expected pattern was not found.`);
    process.exit(1);
  }

  return content.replace(pattern, replacement);
}

updateJson("frontend/package.json", (data) => {
  data.version = version;
});

updateJson("frontend/package-lock.json", (data) => {
  data.version = version;

  if (data.packages?.[""]) {
    data.packages[""].version = version;
  }
});

updateJson("blockbench-plugin/package.json", (data) => {
  data.version = version;
});

updateText("blockbench-plugin/loupsauvage_uploader.js", (content) =>
  replaceRequired(
    content,
    /const PLUGIN_VERSION = "[^"]+";/,
    `const PLUGIN_VERSION = "${version}";`,
    "blockbench-plugin/loupsauvage_uploader.js",
  ),
);

updateText("blockbench-plugin/README.md", (content) =>
  replaceRequired(
    content,
    /Version (?:synchronisee depuis `\.\.\/VERSION` : `[^`]+`|initiale `[^`]+`)\./,
    `Version synchronisee depuis \`../VERSION\` : \`${version}\`.`,
    "blockbench-plugin/README.md",
  ),
);

if (changedFiles.length > 0) {
  console.error(`Project version is not synchronized with VERSION (${version}):`);
  changedFiles.forEach((file) => console.error(`- ${file}`));
  console.error("Run: node tools/sync-project-version.mjs");
  process.exit(1);
}

if (printVersion) {
  process.stdout.write(version);
}
