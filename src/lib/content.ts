/**
 * Typed access to the scraped content in /content.
 * All pages read data from here; nothing else imports the JSON directly.
 */
import type { ImageMetadata } from "astro";
import siteJson from "../../content/site.json";
import productsJson from "../../content/products.json";
import categoriesJson from "../../content/categories.json";

export type Price = { currency: "ILS"; regular: number; sale: number | null };

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
export const products = productsJson as unknown as Product[];
export const categories = categoriesJson as unknown as Category[];

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

/* ---------- products ---------- */
export function slugify(product: Product): string {
  const latin = product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return latin || String(product.id);
}

export function productHref(product: Product): string {
  return `/product/${slugify(product)}/`;
}

/** Product name without a Hebrew type prefix ("אופני איזון JDBUG TC04" → "JDBUG TC04"). */
export function displayName(product: Product): string {
  const latin = product.name.replace(/^[֐-׿\s]+/, "").trim();
  return latin || product.name;
}

/** Hebrew type prefix, if the scraped name has one ("אופני איזון"). */
export function typePrefix(product: Product): string | null {
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

export function productsInCategory(name: string): Product[] {
  return products.filter((p) => p.categories_he.includes(name));
}

/* ---------- contact ---------- */
export function whatsappHref(text?: string): string {
  const base = site.contact.whatsapp;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function telHref(number: string): string {
  return `tel:${number.replace(/[^0-9+]/g, "")}`;
}
