/**
 * Make a version of an imported catalog that can be committed and published:
 * no product photos (every product gets the placeholder image) and no
 * description text. Names, brands, categories, prices, specs and options stay.
 *
 * Usage:  node scripts/export-public.mjs pedalim
 * Reads   content/sources/<name>/products.json        (git-ignored, from import-<name>.mjs)
 * Writes  content/sources/<name>/catalog.public.json  (committed; used by the GitHub Pages preview)
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const name = process.argv[2];
if (!name) throw new Error("Usage: node scripts/export-public.mjs <source>");
const dir = path.join(ROOT, "content/sources", name);
const products = JSON.parse(await fs.readFile(path.join(dir, "products.json"), "utf8"));

const PLACEHOLDER = { src: "", local: "images/site/placeholder.webp", alt: "", placeholder: true };
const out = products.map(({ description_he, images, url, ...p }) => ({
  ...p,
  url: null,
  description_he: "",
  images: [PLACEHOLDER],
}));
await fs.writeFile(path.join(dir, "catalog.public.json"), JSON.stringify(out, null, 1));
console.log(`Wrote ${out.length} products → content/sources/${name}/catalog.public.json`);
