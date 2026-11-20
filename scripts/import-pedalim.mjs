/**
 * Import the pedalim.co.il catalog into the site's product format.
 *
 * Usage:
 *   ditto -x -k pedalim_catalog.zip .cache/pedalim     # once, after downloading a new zip
 *   node scripts/import-pedalim.mjs
 *
 * Reads   .cache/pedalim/pedalim/catalog.json (+ images/)
 * Uses    content/sources/taxonomy.json and content/sources/pedalim/category-map.json
 * Writes  content/sources/pedalim/products.json
 *         content/images/sources/pedalim/<productId>-<n>.webp  (up to MAX_IMAGES per product, resized)
 *
 * Both outputs are git-ignored; the zip is the source of truth. Without them the site
 * builds with the original products only.
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SRC = path.join(ROOT, ".cache/pedalim/pedalim");
const OUT_JSON = path.join(ROOT, "content/sources/pedalim/products.json");
const OUT_IMG = path.join(ROOT, "content/images/sources/pedalim");
const MAX_IMAGES = 3;
const MAX_SIDE = 1200;
const ID_OFFSET = 1_000_000; // keeps ids clear of the original site's product ids

const catalog = JSON.parse(await fs.readFile(path.join(SRC, "catalog.json"), "utf8"));
const taxonomy = JSON.parse(await fs.readFile(path.join(ROOT, "content/sources/taxonomy.json"), "utf8"));
const map = JSON.parse(await fs.readFile(path.join(ROOT, "content/sources/pedalim/category-map.json"), "utf8"));

const byId = new Map(taxonomy.categories.map((c) => [c.id, c]));
const ancestry = (id) => {
  const out = [];
  for (let c = byId.get(id); c; c = c.parent ? byId.get(c.parent) : null) out.unshift(c);
  return out;
};

function placeCategory(p) {
  const fromPath = map.paths[p.categories[0]];
  if (fromPath) return fromPath;
  const name = p.name.toLowerCase();
  for (const [kw, id] of map.name_rules) if (name.includes(kw.toLowerCase())) return id;
  return null;
}

/** Store id when the source has one; products without one (the "no price" pages) get a
 *  stable id from their URL, in a range of their own. */
function productId(p) {
  if (/^\d+$/.test(String(p.product_id ?? ""))) return ID_OFFSET + Number(p.product_id);
  const h = crypto.createHash("sha1").update(p.url).digest().readUInt32BE(0);
  return 2 * ID_OFFSET + (h % ID_OFFSET);
}

const SKIP_SPECS = new Set(["הערות מוצר"]);

function optionValues(p) {
  const out = {};
  for (const axis of p.option_axes ?? []) {
    const vals = [...new Set(p.variants.map((v) => v.options?.[axis]).filter(Boolean))];
    if (vals.length) out[axis] = vals;
  }
  return out;
}

async function convertImages(p, id) {
  const out = [];
  for (const img of p.images.slice(0, MAX_IMAGES)) {
    const src = path.join(SRC, img.file);
    const n = out.length;
    const local = `images/sources/pedalim/${id}-${n}.webp`;
    const dest = path.join(ROOT, "content", local);
    try {
      await fs.access(dest).catch(async () => {
        await sharp(src, { failOn: "none" })
          .rotate()
          .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true })
          .flatten({ background: "#ffffff" })
          .webp({ quality: 80 })
          .toFile(dest);
      });
      out.push({ src: img.url, local, alt: "" });
    } catch (err) {
      console.warn(`  image skipped (${p.product_id}): ${img.file}: ${err.message}`);
    }
  }
  return out;
}

await fs.mkdir(OUT_IMG, { recursive: true });

const products = [];
const skipped = [];
// The same product is sometimes listed on two pages; keep the first listing.
const seen = new Set();
let done = 0;
const queue = [...catalog.products];
async function worker() {
  for (let p = queue.shift(); p; p = queue.shift()) {
    const catId = placeCategory(p);
    if (!catId) { skipped.push(`${p.name} (no category)`); continue; }
    const id = productId(p);
    if (seen.has(id)) { skipped.push(`${p.name} (listed twice: ${p.url})`); continue; }
    seen.add(id);
    const images = await convertImages(p, id);
    if (!images.length) { skipped.push(`${p.name} (no usable image)`); continue; }

    const chain = ancestry(catId);
    const leaf = chain.at(-1);
    const hasPrice = typeof p.price === "number";
    const onSale = hasPrice && p.regular_price && p.regular_price > p.price;
    products.push({
      id,
      source: "pedalim",
      name: p.name.replace(/\s+/g, " ").trim(),
      brand: p.brand ?? null,
      url: p.url,
      sku: p.product_code ?? null,
      price: {
        currency: "ILS",
        regular: hasPrice ? (onSale ? p.regular_price : p.price) : 0,
        sale: onSale ? p.price : null,
        from: hasPrice && p.price_max && p.price_max > p.price ? true : undefined,
      },
      price_on_request: !hasPrice || undefined,
      in_stock: Boolean(p.in_stock),
      categories_he: chain.map((c) => c.name_he),
      category_ids: chain.map((c) => c.id),
      tags_he: p.label ? [p.label] : [],
      specs: Object.fromEntries(
        (p.specs ?? []).filter((s) => s.name && s.value && !SKIP_SPECS.has(s.name)).map((s) => [s.name, s.value]),
      ),
      options: optionValues(p),
      description_he: [p.short_description, p.description]
        .filter(Boolean)
        .join("\n")
        .replace(/^\s*•\s*/gm, "")
        .trim(),
      images,
      representing_category: {
        id: leaf.id,
        name_he: leaf.name_he,
        name_en: leaf.name_en,
        path_he: chain.map((c) => c.name_he),
      },
    });
    done++;
    if (done % 100 === 0) console.log(`  ${done} products…`);
  }
}
await Promise.all(Array.from({ length: 8 }, worker));

products.sort((a, b) => a.id - b.id);
await fs.writeFile(OUT_JSON, JSON.stringify(products, null, 1));
console.log(`Imported ${products.length} of ${catalog.products.length} products → ${path.relative(ROOT, OUT_JSON)}`);
if (skipped.length) console.log(`Skipped ${skipped.length}:\n  ${skipped.join("\n  ")}`);
