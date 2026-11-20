"""Build content/ from the scraped JSON of slalumpardeshana.co.il.

Usage: python3 scrape_build.py <dir with store.json + storecats.json> <output content dir>
store.json = /wp-json/wc/store/products?per_page=100, storecats.json = /wp-json/wc/store/products/categories
"""
import json, os, re, sys, urllib.parse, urllib.request
from bs4 import BeautifulSoup

SRC = sys.argv[1]          # scratchpad/site
OUT = sys.argv[2]          # repo/content
BASE = "https://slalumpardeshana.co.il"
os.makedirs(f"{OUT}/images/site", exist_ok=True)
os.makedirs(f"{OUT}/images/products", exist_ok=True)

store = json.load(open(f"{SRC}/store.json"))
cats = json.load(open(f"{SRC}/storecats.json"))
byid = {p["id"]: p for p in store}

def text(h):
    t = BeautifulSoup(h or "", "lxml").get_text("\n")
    t = re.sub(r"[ \t]*\n[ \t]*", "\n", t)
    t = re.sub(r"\n{2,}", "\n", t).strip()
    return t

def unquote(u):
    return urllib.parse.unquote(u)

def download(url, dest):
    if os.path.exists(dest):
        return
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
        f.write(r.read())

SPEC_KEYS = {
    "שלדה": "frame", "שילדה": "frame", "בולם קדמי": "fork", "מזלג קדמי": "fork",
    "בולם אחורי": "rear_shock", "מערכת הילוכים": "drivetrain", "הילוכים": "drivetrain",
    "ברקסים": "brakes", "בלמים": "brakes", "מוט כסא": "seatpost", "גלגלים": "wheels",
    "קראנק": "crank", "מידת גלגל": "wheel_size", "גודל גלגל": "wheel_size",
}

def specs(t):
    out = {}
    for line in t.split("\n"):
        m = re.match(r"^\s*([^:]{2,20}):\s*(.+)$", line)
        if m and m.group(1).strip() in SPEC_KEYS:
            out[SPEC_KEYS[m.group(1).strip()]] = m.group(2).strip()
    return out

BRANDS = ["IBIS", "PINEWOOD", "Bianchi", "CLEARY", "RAINBOW", "JDBUG", "JAMIS", "XDS",
          "MARIN", "DAINESE", "KONA", "GIANT", "PIVOT", "MOUSTACHE", "POLYGON", "POLIGON",
          "REID", "BLACK GOAT", "VISION", "GT"]

def brand(name):
    for b in BRANDS:
        if re.search(rf"(^|\s){re.escape(b)}(\s|$)", name, re.I):
            return "POLYGON" if b.upper() == "POLIGON" else b.upper()
    return None

def price(p):
    pr = p["prices"]
    reg = int(pr["regular_price"]) / 100
    cur = int(pr["price"]) / 100
    return {"currency": "ILS", "regular": reg, "sale": cur if p["on_sale"] else None}

# ---- category tree ----
cat_by_id = {c["id"]: c for c in cats}
def cat_path(cid):
    parts = []
    while cid:
        c = cat_by_id[cid]; parts.insert(0, c["name"]); cid = c["parent"]
    return parts

EN = {"אופניים": "Bikes", "אופני הרים": "Mountain bikes", "אופני שיכוך מלא": "Full suspension",
      "אופני זנב קשיח": "Hardtail", "חשמלי": "Electric (e-MTB)", "אופני ילדים": "Kids",
      "בי אם אקס": "BMX", "דחיפה": "Balance bikes", "אופני עיר": "City", "נוחות": "Comfort",
      "אופני נשים": "Women's", "אביזרים": "Accessories", "מיגון": "Protection",
      "יד שניה": "Used / second hand"}

# representative product per category (leaf or category with direct products)
REPS = [
    (40, 1294), (41, 1462), (23, 1186), (22, 1720), (28, 1449), (29, 1391),
    (24, 1682), (26, 1557), (49, 1693), (48, 1620), (34, 1702),
]
rep_for = dict(REPS)

# specs written as prose on the site, extracted by hand from the same text
MANUAL_SPECS = {
    1186: {"suspension": "Full suspension, 150mm travel", "wheel_size": '29"',
           "motor": "Bosch Performance Line CX (Gen 4), 250W, 85Nm", "battery": "625Wh",
           "extras": "Integrated lights, internal cable routing"},
    1449: {"frame": "Aluminum", "brakes": "V-brakes", "drivetrain": "Single speed", "wheel_size": '18"'},
    1391: {"frame": "Aluminum", "weight": "3.35 kg", "wheel_size": '12" pneumatic',
           "brakes": "Rear brake", "age": "2.5-4", "max_rider_weight": "30 kg"},
    1682: {"frame": "Aluminum, step-through", "wheel_size": '27.5" wide city tyres, double-wall rims'},
    1557: {"riding_position": "Upright"},
    1693: {"frame": "Aluminum Series 2 (lifetime warranty), women's geometry",
           "fork": "Suspension, 63mm", "brakes": "Disc"},
    1702: {"suspension": "Full suspension", "wheel_size": '26"', "frame_size": '18"', "condition": "Used"},
}

def build_tree(parent):
    nodes = []
    for c in sorted(cats, key=lambda c: c["id"]):
        if c["parent"] != parent:
            continue
        nodes.append({
            "id": c["id"], "name_he": c["name"], "name_en": EN.get(c["name"]),
            "url": unquote(c["permalink"]), "product_count": c["count"],
            "representative_product_id": rep_for.get(c["id"]),
            "children": build_tree(c["id"]),
        })
    return nodes

categories = build_tree(0)

# ---- representative products ----
products = []
for cid, pid in REPS:
    p = byid[pid]
    full = text(p["short_description"]) + ("\n" + text(p["description"]) if p["description"] else "")
    imgs = []
    for i, im in enumerate(p["images"]):
        ext = os.path.splitext(urllib.parse.urlparse(im["src"]).path)[1] or ".jpg"
        local = f"images/products/{pid}-{i}{ext}"
        download(im["src"], f"{OUT}/{local}")
        imgs.append({"src": im["src"], "local": local, "alt": im["alt"]})
    products.append({
        "id": pid,
        "representing_category": {"id": cid, "name_he": cat_by_id[cid]["name"], "name_en": EN.get(cat_by_id[cid]["name"]),
                                  "path_he": cat_path(cid)},
        "name": p["name"].strip(),
        "brand": brand(p["name"]),
        "url": unquote(p["permalink"]),
        "sku": p["sku"] or None,
        "price": price(p),
        "in_stock": p["is_in_stock"],
        "categories_he": [c["name"] for c in p["categories"]],
        "tags_he": [t["name"] for t in p["tags"]],
        "specs": {**specs(full), **MANUAL_SPECS.get(pid, {})},
        "description_he": full,
        "images": imgs,
    })

# ---- full catalog index (all 44, compact, for inventory reference) ----
catalog = [{
    "id": p["id"], "name": p["name"].strip(), "brand": brand(p["name"]),
    "url": unquote(p["permalink"]), "price": price(p),
    "categories_he": [c["name"] for c in p["categories"]],
    "tags_he": [t["name"] for t in p["tags"]],
    "image_count": len(p["images"]), "main_image": p["images"][0]["src"] if p["images"] else None,
} for p in store]

# ---- site assets ----
SITE_IMAGES = {
    "logo": "/wp-content/uploads/2021/07/5-2-לוגו.png",
    "home_almog_miss_me": "/wp-content/uploads/2022/05/miss-me-almog.jpg",
    "icon_bikes": "/wp-content/uploads/2021/11/bikes.png",
    "icon_gear": "/wp-content/uploads/2021/11/gear.png",
    "icon_service": "/wp-content/uploads/2021/11/service.png",
    "tile_bikes": "/wp-content/uploads/2021/11/page1oleg-large-1.jpg",
    "tile_gear": "/wp-content/uploads/2021/11/gear-temp.jpg",
    "tile_service": "/wp-content/uploads/2021/11/service-temp.jpg",
    "page_header": "/wp-content/uploads/2021/08/slalum-test-slider-image-3-1024x705.jpg",
    "slider_1": "/wp-content/uploads/2022/11/סליידר-סלאלום-3.jpg",
    "slider_main_banner": "/wp-content/uploads/2022/11/באנר-ראשי.jpg",
    "slider_2": "/wp-content/uploads/2022/11/סליידר-סלאלום-2.jpg",
    "promo_cashback": "/wp-content/uploads/2022/05/cash-back-7-percent-image-with-slalom-name.jpg",
}
site_images = {}
for key, path in SITE_IMAGES.items():
    url = BASE + urllib.parse.quote(path)
    ext = os.path.splitext(path)[1]
    local = f"images/site/{key}{ext}"
    try:
        download(url, f"{OUT}/{local}")
        site_images[key] = {"src": BASE + path, "local": local}
    except Exception as e:
        site_images[key] = {"src": BASE + path, "local": None, "error": str(e)}

site = {
    "source": BASE + "/",
    "scraped_on": "2026-11-20",
    "business": {
        "name_he": "סלאלום פרדס חנה", "name_en": "Slalom Pardes Hanna",
        "tagline_he": "הכל לאופניים במקום אחד",
        "slogans_he": ["אופניים, אביזרים, חברים", "סלאלום - הבית של האופניים שלך בפרדס חנה",
                       "אופניים, שרות, אביזרים וחברים — אלו לא רק מילים אלא תפיסת עולם."],
        "owner_mention_he": "אלמוג והצוות חזרו ואיתם תחושת הבית החם.",
    },
    "contact": {
        "phone": "04-6288992", "mobile": "052-5660619",
        "whatsapp": "https://wa.me/972525660619",
        "email": "slalumph@gmail.com",
        "address_he": "רחוב השקמה 8, פרדס חנה כרכור",
        "facebook": "https://www.facebook.com/slalom.pardes.hanna",
        "map_query_he": "אפניי סלאלום פרדס חנה",
    },
    "opening_hours_he": [
        {"days": "א, ב, ד, ה", "hours": "10:00-17:00"},
        {"days": "ג", "hours": "10:00-13:00"},
        {"days": "ו", "hours": "09:00-13:00"},
        {"days": "שבת", "hours": "סגור (\"רוכבים\")"},
    ],
    "navigation": [
        {"label_he": "דף הבית", "url": BASE + "/"},
        {"label_he": "אופניים", "url": BASE + "/אופניים/", "children": [
            {"label_he": "שיכוך מלא", "url": BASE + "/product-category/אופניים/הרים/שיכוך-מלא/"},
            {"label_he": "אופני זנב קשיח", "url": BASE + "/product-category/אופניים/הרים/זנב-קשיח/"},
            {"label_he": "אופני הרים חשמליים", "url": BASE + "/product-category/אופניים/חשמלי/"},
            {"label_he": "אופני ילדים", "url": BASE + "/product-category/אופניים/ילדים/"},
            {"label_he": "אופני עיר", "url": BASE + "/product-category/אופניים/עיר/"},
        ]},
        {"label_he": "אביזרים", "url": BASE + "/אביזרים/"},
        {"label_he": "סדנת תיקונים", "url": BASE + "/סדנת-תיקונים/"},
        {"label_he": "אופנים יד 2", "url": BASE + "/אופנים-יד-2/"},
    ],
    "footer_quick_links_he": ["אופניים", "אביזרים", "סדנת תיקונים", "הצהרת נגישות"],
    "homepage_sections": [
        {"section": "hero_slider", "text_he": ["אופניים, אביזרים, חברים", "סלאלום - הבית של האופניים שלך בפרדס חנה"]},
        {"section": "welcome_back", "text_he": "התגעגעתם? גם אנחנו — אופניים, שרות, אביזרים וחברים. אלמוג והצוות חזרו ואיתם תחושת הבית החם. צרו קשר, או פשוט בואו לבקר.",
         "ctas_he": ["התקשרו: 052-5660619", "איפה אנחנו / איך להגיע"], "image": "home_almog_miss_me"},
        {"section": "three_pillars", "items": [
            {"title_he": "אופניים", "text_he": "האופניים שלנו יגרמו לכם לחייך, גם בעליות וגם בירידות", "image": "tile_bikes", "icon": "icon_bikes"},
            {"title_he": "אביזרים", "text_he": "אביזרי רכיבה מכל הסוגים, מנעולים, ביגוד, קסדות וצמיגים", "image": "tile_gear", "icon": "icon_gear"},
            {"title_he": "סדנת תיקונים", "text_he": "לרכב בראש שקט. שירות תיקונים אמין כאן בשבילכם.", "image": "tile_service", "icon": "icon_service"},
        ]},
        {"section": "contact_strip", "text_he": "אנחנו זמינים לכל שאלה, גם בווטסאפ."},
        {"section": "featured_products", "title_he": "האופניים שלנו", "product_ids": [1727, 1720, 1710, 1702], "cta_he": "לכל האופניים בחנות"},
        {"section": "footer", "blocks": ["opening_hours", "contact", "quick_links", "social"]},
    ],
    "pages": [
        {"title_he": "אופניים", "url": BASE + "/אופניים/", "summary_he": "מגוון רחב של אופניים מהמותגים המובילים בעולם — אופני הרים ושטח, אופני נשים, אופני ילדים, אופניים לרכיבה בעיר ועוד."},
        {"title_he": "אביזרים", "url": BASE + "/אביזרים/", "summary_he": "מגוון רחב של ציוד ואביזרים מהמותגים המובילים בעולם, תחת קורת גג אחת ובמחירים משתלמים."},
        {"title_he": "סדנת תיקונים", "url": BASE + "/סדנת-תיקונים/", "summary_he": "סדנת תיקונים מקצועית: תיקון, בנייה ושיפוץ של כל סוגי האופניים, ע\"י מכונאים מוסמכים, עם ציוד ומכשור מתקדם.", "image": "tile_bikes"},
        {"title_he": "אופנים יד 2", "url": BASE + "/אופנים-יד-2/", "summary_he": "אופניים יד שניה שעוברים טיפול, בדיקה והחלפת חלקים במידת הצורך."},
        {"title_he": "הצהרת נגישות", "url": BASE + "/הצהרת-נגישות/", "summary_he": "הצהרת נגישות לפי ת\"י 5568 ברמה AA, תוסף נגישות באתר."},
        {"title_he": "Cash-Back Slalom (מבצע שפג)", "url": BASE + "/cashback_slalom/", "summary_he": "מבצע קיץ: זיכוי קאש-בק של 7% באביזרים וציוד, עד 30.6.22. פג תוקף.", "image": "promo_cashback"},
        {"title_he": "סלאלום פרדס חנה ישן (דף בית ישן)", "url": BASE + "/סלאלום-פרדס-חנה/", "summary_he": "גרסה ישנה של דף הבית עם סליידר תמונות. לא בשימוש.", "images": ["slider_1", "slider_main_banner", "slider_2"]},
    ],
    "tech_stack": ["WordPress 5.7", "WooCommerce 6.1", "WPBakery Page Builder", "Slider Revolution 6.5", "LayerSlider 6.11"],
    "images": site_images,
}

for name, data in [("site.json", site), ("categories.json", categories),
                   ("products.json", products), ("catalog-index.json", catalog)]:
    with open(f"{OUT}/{name}", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
print("products", len(products), "catalog", len(catalog))
print({k: v["local"] for k, v in site_images.items()})
