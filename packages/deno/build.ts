/**
 * Build script that vendors @given3/core source into this package
 * so it can be published to JSR as a self-contained TypeScript module.
 *
 * Copies core .mts files into _core/, renames to .ts, and rewrites
 * internal imports from .mjs to .ts for Deno compatibility.
 */

const CORE_SRC = new URL("../core/src/", import.meta.url);
const VENDOR_DIR = new URL("./_core/", import.meta.url);

// Clean and recreate vendor directory
try {
  await Deno.remove(VENDOR_DIR, { recursive: true });
} catch {
  // ignore if doesn't exist
}
await Deno.mkdir(VENDOR_DIR, { recursive: true });

// Copy and transform core source files
for await (const entry of Deno.readDir(CORE_SRC)) {
  if (!entry.isFile || !entry.name.endsWith(".mts")) continue;
  // Skip test files
  if (entry.name.includes(".test.")) continue;

  const src = new URL(entry.name, CORE_SRC);
  const destName = entry.name.replace(/\.mts$/, ".ts");
  const dest = new URL(destName, VENDOR_DIR);

  let content = await Deno.readTextFile(src);

  // Rewrite internal .mjs imports to .ts for Deno
  content = content.replace(
    /from\s+["'](\.[^"']+)\.mjs["']/g,
    'from "$1.ts"',
  );

  await Deno.writeTextFile(dest, content);
}

console.log("Vendored @given3/core into _core/");
