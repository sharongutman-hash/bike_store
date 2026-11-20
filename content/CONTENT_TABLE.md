# Content inventory: slalumpardeshana.co.il

Scanned 2026-11-20 from the live site (WordPress 5.7 + WooCommerce 6.1).
This is the starting content for the new site. For the template, each category has **one** representative product (11 in all). The complete list of 44 products is in `catalog-index.json`.

| File | What it holds |
|---|---|
| `site.json` | Business info, contact details, opening hours, navigation, homepage sections, pages, site images |
| `categories.json` | Category tree with product counts and the representative product for each category |
| `products.json` | The 11 template products, with prices, specs, the full Hebrew description and images |
| `catalog-index.json` | All 44 live products in short form (name, brand, price, categories, main image) |
| `images/site/` | Logo, icons, homepage tiles, slider banners, promo banner (13 files) |
| `images/products/` | All gallery images of the 11 template products, named `<productId>-<n>.jpg` |

---

## 1. Business info

| Field | Value |
|---|---|
| Name | סלאלום פרדס חנה (Slalom Pardes Hanna) |
| Tagline | הכל לאופניים במקום אחד |
| Slogans | אופניים, אביזרים, חברים · סלאלום - הבית של האופניים שלך בפרדס חנה |
| Address | רחוב השקמה 8, פרדס חנה כרכור |
| Phone | 04-6288992 |
| Mobile / WhatsApp | 052-5660619 · https://wa.me/972525660619 |
| Email | slalumph@gmail.com |
| Facebook | https://www.facebook.com/slalom.pardes.hanna |
| Hours | Sun, Mon, Wed, Thu 10:00-17:00 · Tue 10:00-13:00 · Fri 09:00-13:00 · Sat closed ("רוכבים") |
| Logo | `images/site/logo.png` |

## 2. Navigation (current)

- דף הבית
- אופניים
  - שיכוך מלא
  - אופני זנב קשיח
  - אופני הרים חשמליים
  - אופני ילדים
  - אופני עיר
- אביזרים
- סדנת תיקונים
- אופנים יד 2

Footer: quick links (אופניים, אביזרים, סדנת תיקונים, הצהרת נגישות), opening hours, contact details, Facebook and WhatsApp.

## 3. Pages

| Page | Content | Status |
|---|---|---|
| Home | Hero slider → "Did you miss us?" block (Almog and the team) → 3 tiles (Bikes / Accessories / Repair workshop) → WhatsApp contact strip → "Our bikes" (4 products) → footer | Live |
| אופניים (Bikes) | Intro text plus a product grid | Live |
| אביזרים (Accessories) | Intro text only ("מגוון רחב של ציוד ואביזרים...") | Live, little content |
| סדנת תיקונים (Repair workshop) | About the workshop: certified mechanics, advanced equipment, all types of bikes | Live, no price list or booking |
| אופנים יד 2 (Used bikes) | Intro text plus 2 used bikes | Live |
| הצהרת נגישות (Accessibility statement) | IS 5568 AA statement | Live |
| Cash-Back Slalom | 7% cashback promotion, valid until 30.6.22 | **Expired** |
| סלאלום פרדס חנה ישן | Old homepage with a slider | Old, not in use |
| Blog | Only the default "Hello world" post | Empty |

## 4. Categories and the template product for each

| Category (HE) | Category (EN) | Parent | # products | Template product | Price ₪ | Images |
|---|---|---|---|---|---|---|
| אופניים | Bikes | — | 39 | *(parent category)* | | |
| אופני הרים | Mountain bikes | אופניים | 19 | *(parent category)* | | |
| אופני שיכוך מלא | Full suspension | אופני הרים | 12 | **IBIS RIPLEY AF SRAM 2022** | 18,900 | 8 |
| אופני זנב קשיח | Hardtail | אופני הרים | 7 | **PINEWOOD ROGUE TRAIL 3** | ~~3,250~~ 2,800 | 5 |
| חשמלי | Electric (e-MTB) | אופניים | 5 | **Bianchi E-Omnia FX XT** | ~~25,990~~ 22,990 | 6 |
| אופני ילדים | Kids | אופניים | 11 | **CLEARY MEERKAT 24** | 1,890 | 4 |
| בי אם אקס | BMX | אופני ילדים | 2 | **RAINBOW BAZZ 18 R-1.0** | 910 | 5 |
| דחיפה | Balance bikes | אופני ילדים | 1 | **אופני איזון JDBUG TC04** | 419 | 2 |
| אופני עיר | City | אופניים | 5 | **JAMIS HUDSON 2022-23** | 2,400 | 5 |
| נוחות | Comfort | אופני עיר | 2 | **אופני עיר קלאסיות XDS SUNRISE** | ~~2,100~~ 1,890 | 5 |
| אופני נשים | Women's | — | 3 | **MARIN 2023 SAN ANSELMO DS1** | 2,200 | 1 |
| אביזרים | Accessories | — | 2 | *(parent category)* | | |
| מיגון | Protection | אביזרים | 2 | **DAINESE RIVAL PRO VEST** | 1,500 | 5 |
| יד שניה | Used | — | 2 | **KONA TANUKI DL** | 2,500 | 4 |

Product tags in use: שנתון 2021, שנתון 2022, שנתון 2023 (model year).

## 5. Template product details

| Product | Brand | Key specs |
|---|---|---|
| IBIS RIPLEY AF SRAM 2022 | IBIS | Aluminium dw-link frame · Fox Float 34 130mm fork · Fox Float DPS shock · SRAM NX/GX 1x12 · SRAM G2 R brakes · KS Rage-i dropper seatpost · 29" |
| PINEWOOD ROGUE TRAIL 3 | PINEWOOD | 29" alloy frame · SR XCM lock-out fork · Shimano Deore 1x12 · Shimano MT-200 brakes |
| Bianchi E-Omnia FX XT | BIANCHI | Full suspension, 150mm travel · 29" · Bosch Performance Line CX Gen 4 motor (250W / 85Nm) · 625Wh battery · integrated lights |
| CLEARY MEERKAT 24 | CLEARY | 1020 steel frame and fork · Tektro V-brakes · Sturmey Archer RX-RK5 internal gear hub · 24" |
| RAINBOW BAZZ 18 R-1.0 | RAINBOW | BMX · aluminium frame · V-brakes · single speed · 18" |
| JDBUG TC04 | JDBUG | Balance bike · aluminium · 3.35 kg · 12" pneumatic tyres · ages 2.5-4 · max rider 30 kg |
| JAMIS HUDSON 2022-23 | JAMIS | City bike · aluminium step-through frame · 27.5" wide tyres · upright ergonomic position |
| XDS SUNRISE | XDS | Classic comfort city bike · upright riding position |
| MARIN SAN ANSELMO DS1 | MARIN | Women's dual-sport bike · Series 2 aluminium frame (lifetime warranty) · 63mm suspension fork · disc brakes |
| DAINESE RIVAL PRO VEST | DAINESE | Enduro/trail protection vest · Pro-Shape 2.0 · Crash Absorb memory foam · removable back and shoulder protectors · HumpBack hydration |
| KONA TANUKI DL | KONA | Used · full suspension · 26" · frame size 18" |

The full Hebrew descriptions and all image paths are in `products.json`.

## 6. Brands carried (from the full catalog)

GIANT / LIV, IBIS, PIVOT, MOUSTACHE, BIANCHI, GT, POLYGON, MARIN, JAMIS, KONA, XDS, PINEWOOD, BLACK GOAT, REID, CLEARY, RAINBOW, VISION, JDBUG, DAINESE.

## 7. Gaps and problems to fix in the new site

**Content gaps**
- Accessories has only 2 products, although the homepage promises locks, clothing, helmets and tyres. Helmets, locks, lights, tyres, clothing, tools and parts all need categories.
- There is no road / gravel bike category and no "about us" page.
- The repair workshop page has no service list, no prices and no booking or contact form.
- The blog is empty. The only promotion page expired in 2022.
- There are no customer reviews or testimonials.

**Data quality**
- No product has a SKU, and the WooCommerce attributes (size, colour, wheel size) are empty. Specs exist only as free text. The new site should use structured attributes, which allow filters.
- 14 products have only one image.
- There is no size or colour data, and sizes matter for bikes.
- REID SCOUT 24 2022 appears twice (IDs 1399 and 1406). "REID VIPER 20 2022" uses the slug `reid-scout-20-2022`.
- CLEARY MEERKAT 26, a kids' bike, is also filed under Hardtail.
- The slug says "poligon" but the brand is POLYGON.
- Most bikes are 2021-2022 models, so stock and prices are probably out of date.
- Typos: "התעגעתם" should be "התגעגעתם", "אופנים" should be "אופניים" in the menu, and the repair page shows the wrong phone number "052-56606619".

**Technical**
- The site runs WordPress 5.7 and WooCommerce 6.1, which are outdated.
- Two slider plugins are installed.
- Menu links use http instead of https.
