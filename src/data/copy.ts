/**
 * Page copy.
 * - "site" = taken from the current site (content/site.json or its pages).
 * - "placeholder" = written for the template; replace before launch.
 */
import catalogJson from "../../content/catalog-index.json";
import { products } from "../lib/content";

type Entry<T> = T & { source: "site" | "placeholder" };

export const hero = {
  wordmark: "סלאלום",
  eyebrow: "אופניים, אביזרים, חברים", // site
  title: ["הבית של", "האופניים", "שלך"], // site: "סלאלום - הבית של האופניים שלך בפרדס חנה"
  body: "אופניים, שירות, אביזרים וחברים — אלו לא רק מילים אלא תפיסת עולם. בפרדס חנה, ברחוב השקמה 8.", // site
  note: "הכל לאופניים\nבמקום אחד", // site tagline
};

/** Facts shown in the hero bubbles. The bike count is the new shop's; brands come from the scraped catalog. */
const catalog = catalogJson as { brand: string | null; categories_he: string[] }[];
/** Bikes in the new site's shop (every source), i.e. the "אופניים" category (id 21). */
const bikeCount = products.filter((p) => p.category_ids.includes(21)).length;
const brandCount = new Set(catalog.map((p) => p.brand).filter(Boolean)).size;

export const heroFacts: Entry<{ value: string; unit: string; label: string }>[] = [
  { value: String(bikeCount), unit: "", label: "דגמי אופניים", source: "site" },
  { value: String(brandCount), unit: "", label: "מותגים מובילים", source: "site" },
  { value: "6", unit: "", label: "ימי פעילות בשבוע", source: "site" },
];

export const brands: string[] = [...new Set(catalog.map((p) => p.brand).filter(Boolean) as string[])];

export const marquee = "סלאלום פרדס חנה · אופניים · אביזרים · חברים · סדנת תיקונים · "; // site slogans

export const intro = {
  title: ["התגעגעתם?", "גם אנחנו."], // site (typo fixed: התעגעתם → התגעגעתם)
  body: "אלמוג והצוות חזרו, ואיתם תחושת הבית החם. אופניים, שירות, אביזרים וחברים — צרו קשר, או פשוט בואו לבקר.", // site
  note: "בואו להגיד שלום", // placeholder
};

export const stage = {
  title: ["בחרו את", "הרכיבה שלכם."], // placeholder
  note: "גוללים ומגלים", // placeholder
};

/** Short category pitches for the stage cards (placeholder copy). */
export const categoryPitch: Record<number, string> = {
  40: "שיכוך מלא לשבילים הטכניים — שליטה וביטחון גם בירידות.",
  41: "זנב קשיח, קל וזריז. הדרך הכי טובה להתחיל לרכוב בשטח.",
  23: "עליות נראות כמו ירידות. מנועים חזקים וסוללות לכל היום.",
  22: "מהצעד הראשון ועד הרכיבה הראשונה בשביל.",
  28: "קפיצות, טריקים והרבה חיוכים.",
  29: "הדרך הקלה ללמוד שיווי משקל, מגיל שנתיים וחצי.",
  24: "תנוחה זקופה ונוחה לסידורים, לעבודה ולטיול.",
  26: "אוכף מפנק וכידון גבוה — נוחות לכל הדרך.",
  49: "גיאומטריה נשית לעיר ולדרכי עפר.",
  48: "אפודים, חולצות מגן וציוד לרכיבה בראש שקט.",
  34: "אופניים יד 2 שעברו טיפול, בדיקה והחלפת חלקים.",
};

export const bikes = {
  title: "האופניים שלנו", // site ("האופניים שלנו")
  sub: "יגרמו לכם לחייך, גם בעליות וגם בירידות", // site
  note: "דגם אחד מכל\nקטגוריה, בינתיים", // placeholder
};

export const compare: Entry<{ title: string[]; rows: { label: string; us: boolean; online: boolean }[] }> = {
  title: ["יותר מחנות.", "רואים את ההבדל."],
  rows: [
    { label: "הרכבה וכיוונון מקצועי לפני המסירה", us: true, online: false },
    { label: "ייעוץ והתאמת מידה אישית", us: true, online: false },
    { label: "סדנת תיקונים מקצועית במקום", us: true, online: false },
    { label: "אחריות ושירות מקומי", us: true, online: false },
    { label: "אופני יד 2 שעברו טיפול ובדיקה", us: true, online: false },
    { label: "זמינים לכל שאלה, גם בווטסאפ", us: true, online: false },
  ],
  source: "placeholder",
};

export const workshop = {
  eyebrow: "סדנת תיקונים", // site
  title: ["לרכב", "בראש שקט."], // site ("לרכב בראש שקט.")
  body: "תיקון, בנייה ושיפוץ של כל סוגי האופניים, מהפשוטים ועד המקצועיים — על ידי מכונאים מוסמכים, עם הציוד המתקדם בעולם.", // site
  reviewsTitle: "אל תסמכו רק עלינו", // placeholder
};

/** PLACEHOLDER reviews — the current site has none. Replace with real Google / Facebook reviews. */
export const reviews: Entry<{ title: string; text: string; name: string }>[] = [
  { title: "שירות של פעם", text: "הגעתי עם אופניים שלא זזו, יצאתי עם אופניים חדשים. הסבירו לי כל מה שעשו.", name: "שם לקוח", source: "placeholder" },
  { title: "התאמה מושלמת", text: "עזרו לנו לבחור אופניים לבת, כולל מידה וקסדה. סבלנות אין סופית.", name: "שם לקוח", source: "placeholder" },
  { title: "כמו בבית", text: "החנות הכי חמה בשרון. תמיד יש קפה ותמיד יש עצה טובה.", name: "שם לקוח", source: "placeholder" },
  { title: "מהיר ומקצועי", text: "פנצ'ר בבוקר, אופניים מוכנים בצהריים. ממליץ בחום.", name: "שם לקוח", source: "placeholder" },
  { title: "יד 2 במצב מעולה", text: "קניתי אופני שטח יד 2 שעברו טיפול מלא. רוכבים כמו חדשים.", name: "שם לקוח", source: "placeholder" },
];

export const visit = {
  title: ["אל תחלמו על זה.", "בואו לרכוב."], // placeholder
  note: "מותגים שתמצאו\nאצלנו בחנות", // placeholder
};
