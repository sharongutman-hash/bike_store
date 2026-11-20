/**
 * Typed access to the scraped content in /content.
 * All pages read data from here; nothing else imports the JSON directly.
 */
import type { ImageMetadata } from "astro";
import siteJson from "../../content/site.json";
import productsJson from "../../content/products.json";
import categoriesJson from "../../content/categories.json";
import taxonomyJson from "../../content/sources/taxonomy.json";

/** `from`: the product has variants at higher prices; the price shown is the lowest. */
export type Price = { currency: "ILS"; regular: number; sale: number | null; from?: boolean };

export type Product = {
  id: number;
  name: string;
  brand: string | null;
  url: string;
  sku: string | null;
  price: Price;
  in_stock: boolean;
  categories_he: string[];
  tags_he: string[];
  specs: Record<string, string>;
  description_he: string;
  images: { src: string; local: string; alt: string }[];
  representing_category: { id: number; name_he: string; name_en: string; path_he: string[] };
  /** Which catalog the product came from: "slalom" (the original site) or an imported source. */
  source: string;
  /** The product's category and all its ancestors (ids from content/sources/taxonomy.json). */
  category_ids: number[];
  /** Variant choices, e.g. { "מידה": ["S", "M"], "צבע": ["שחור"] }. */
  options?: Record<string, string[]>;
  /** The source shows no price; the site asks the visitor to contact the shop. */
  price_on_request?: boolean;
};

export type Category = {
  id: number;
  name_he: string;
  name_en: string;
  url: string;
  product_count: number;
  representative_product_id: number | null;
  children: Category[];
};

export const site = siteJson;

/** Site-internal link. Adds the base path when the site is served from a sub-folder
 *  (GitHub Pages: /bike_store/); on the real domain the base is "/" and this is a no-op. */
export function path(p: string): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "") + p;
}

/* ---------- category tree (shared by every source) ---------- */
type TaxonomyEntry = { id: number; parent: number | null; name_he: string; name_en: string };
const taxonomy = (taxonomyJson as { categories: TaxonomyEntry[] }).categories;
const taxonomyByName = new Map(taxonomy.map((c) => [c.name_he, c]));

/* ---------- products ---------- */
/** The original site's products. The home page features these. */
export const siteProducts: Product[] = (productsJson as unknown as Omit<Product, "source" | "category_ids">[]).map((p) => ({
  ...p,
  source: "slalom",
  category_ids: p.categories_he.map((n) => taxonomyByName.get(n)?.id).filter((id): id is number => id !== undefined),
}));

/** Imported catalogs: content/sources/<name>/products.json, made by scripts/import-<name>.mjs.
 *  They are git-ignored; without them the site builds with the original products only. */
const importedModules = import.meta.glob<{ default: Product[] }>("../../content/sources/*/products.json", { eager: true });
const importedProducts = Object.values(importedModules).flatMap((m) => m.default);

/** Every product from every source: the shop and product pages use this. */
export const products: Product[] = [...siteProducts, ...importedProducts];

/* ---------- categories ---------- */
const legacyCategories = categoriesJson as unknown as Category[];
const legacyRep = new Map<number, number | null>();
(function walk(list: Category[]) {
  for (const c of list) { legacyRep.set(c.id, c.representative_product_id); walk(c.children); }
})(legacyCategories);

function buildTree(parent: number | null): Category[] {
  return taxonomy
    .filter((c) => c.parent === parent)
    .map((c) => ({
      id: c.id,
      name_he: c.name_he,
      name_en: c.name_en,
      url: path(`/shop/?cat=${c.id}`),
      product_count: products.filter((p) => p.category_ids.includes(c.id)).length,
      representative_product_id: legacyRep.get(c.id) ?? null,
      children: buildTree(c.id),
    }));
}
export const categories: Category[] = buildTree(null);

/* ---------- images ---------- */
const imageModules = import.meta.glob<{ default: ImageMetadata }>(
  "../../content/images/**/*.{jpg,jpeg,png,webp}",
  { eager: true },
);

/** Resolve a path relative to /content (e.g. "images/products/1294-0.jpg"). */
export function contentImage(local: string): ImageMetadata {
  const mod = imageModules[`../../content/${local}`];
  if (!mod) throw new Error(`Missing content image: ${local}`);
  return mod.default;
}

/** Transparent cut-out (studio shots only), made by scripts/make_cutouts.py. */
export function cutout(product: Product): ImageMetadata | null {
  return imageModules[`../../content/images/cutouts/${product.id}.webp`]?.default ?? null;
}

export function siteImage(key: keyof typeof site.images): ImageMetadata {
  const entry = site.images[key];
  return contentImage(entry.local as string);
}

/* ---------- product helpers ---------- */
function baseSlug(product: Product): string {
  const latin = product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return latin || String(product.id);
}

/** Unique URL slug per product. Original products keep their slugs; a later product
 *  whose slug is taken gets its id appended. */
const slugs = new Map<number, string>();
{
  const taken = new Set<string>();
  for (const p of products) {
    let slug = baseSlug(p);
    if (taken.has(slug)) slug = `${slug}-${p.id}`;
    taken.add(slug);
    slugs.set(p.id, slug);
  }
}
export function slugify(product: Product): string {
  return slugs.get(product.id) ?? baseSlug(product);
}

export function productHref(product: Product): string {
  return path(`/product/${slugify(product)}/`);
}

/** Latin part after a Hebrew type prefix, when it names the product well enough on its own
 *  (two or more words, not just the brand). Otherwise null and the full name is used. */
function latinName(product: Product): string | null {
  const latin = product.name.replace(/^[֐-׿\s]+/, "").trim();
  if (!latin || latin === product.name) return null;
  const words = latin.split(/\s+/);
  if (words.length < 2) return null;
  if (product.brand && latin.toLowerCase() === product.brand.toLowerCase()) return null;
  return latin;
}

/** Product name without a Hebrew type prefix ("אופני איזון JDBUG TC04" → "JDBUG TC04"),
 *  unless that would leave too little ("קסדה לאופניים לילדים ROCKET" stays whole). */
export function displayName(product: Product): string {
  return latinName(product) ?? product.name;
}

/** Hebrew type prefix, shown above the short name ("אופני איזון"). Null when the full name is shown. */
export function typePrefix(product: Product): string | null {
  if (!latinName(product)) return null;
  const m = product.name.match(/^([֐-׿][֐-׿\s]*?)\s+[A-Za-z]/);
  return m ? m[1] : null;
}

export function getProduct(id: number): Product {
  const p = products.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown product ${id}`);
  return p;
}

const ils = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 });
export function formatPrice(value: number): string {
  return `₪${ils.format(value)}`;
}

/** Lowest current price; 0 when the price is on request. */
export function currentPrice(p: Product): number {
  return p.price.sale ?? p.price.regular;
}

export function discountPercent(p: Product): number | null {
  if (!p.price.sale) return null;
  return Math.round((1 - p.price.sale / p.price.regular) * 100);
}

/** Short plain-text teaser from the scraped description. */
export function teaser(p: Product, max = 140): string {
  const first = p.description_he
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.includes(":") && !/^מפרט/.test(l))
    .join(" ")
    .replace(/\s+/g, " ");
  if (!first) return "";
  return first.length > max ? `${first.slice(0, max).replace(/\s\S*$/, "")}…` : first;
}

export const specLabels: Record<string, string> = {
  frame: "שלדה",
  fork: "בולם קדמי",
  rear_shock: "בולם אחורי",
  suspension: "מתלים",
  drivetrain: "הילוכים",
  brakes: "בלמים",
  seatpost: "מוט כיסא",
  wheels: "גלגלים",
  wheel_size: "מידת גלגל",
  frame_size: "מידת שלדה",
  crank: "קראנק",
  motor: "מנוע",
  battery: "סוללה",
  weight: "משקל",
  age: "גילאים",
  max_rider_weight: "משקל רוכב מקסימלי",
  riding_position: "תנוחת רכיבה",
  extras: "תוספות",
  condition: "מצב",
};

/* ---------- categories ---------- */
export type FlatCategory = Category & { parent: Category | null; depth: number };

export function flatCategories(): FlatCategory[] {
  const out: FlatCategory[] = [];
  const walk = (list: Category[], parent: Category | null, depth: number) => {
    for (const c of list) {
      out.push({ ...c, parent, depth });
      walk(c.children, c, depth + 1);
    }
  };
  walk(categories, null, 0);
  return out;
}

/** Categories that have a template product, in menu order. */
export function templateCategories(): FlatCategory[] {
  const order = [40, 41, 23, 22, 28, 29, 24, 26, 49, 48, 34];
  const flat = flatCategories();
  return order.map((id) => flat.find((c) => c.id === id)!).filter(Boolean);
}

export function productsInCategory(id: number): Product[] {
  return products.filter((p) => p.category_ids.includes(id));
}

/* ---------- contact ---------- */
export function whatsappHref(text?: string): string {
  const base = site.contact.whatsapp;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function telHref(number: string): string {
  return `tel:${number.replace(/[^0-9+]/g, "")}`;
}
