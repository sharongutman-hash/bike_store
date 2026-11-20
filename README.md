# Slalom Pardes Hanna — new site template

Hebrew (RTL) storefront template for סלאלום פרדס חנה. It is built with Astro, GSAP and Lenis. The pages read the content scraped from the current site (`content/`, see `content/CONTENT_TABLE.md`). The visual direction follows the "More Nutrition" reference, adapted to the Slalom brand: orange, black and cream.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
npm run cutouts   # re-make transparent product cut-outs after adding products
```

## Pages

| Route | File | Notes |
|---|---|---|
| `/` | `src/pages/index.astro` | Hero → wave → intro → category stage → bikes slider → compare → workshop + reviews → visit |
| `/shop/` | `src/pages/shop/index.astro` | Filter chips and sort, synced to `?cat=<id>&sort=` |
| `/product/<slug>/` | `src/pages/product/[slug].astro` | One page per product in `content/products.json`. Includes the gallery, WhatsApp ordering, the spec table and JSON-LD |

## Structure

```
content/                  scraped data + images (source of truth)
scripts/make_cutouts.py   removes the white background from studio product shots → content/images/cutouts/
src/styles/tokens.css     design tokens (colour, fluid scale, type, radius, shadow, motion)
src/styles/global.css     base, type classes, motion-gate states
src/lib/content.ts        typed access to content/*.json, image resolution, price/slug helpers
src/data/copy.ts          page copy; every item is marked "site" or "placeholder"
src/components/ui/        Button, CircleButton, Icon, StatBubble, Scribble, WheelBadge, ProductImage, Price
src/components/layout/    Header, Footer
src/components/home/      Hero, WaveMarquee, Intro, CategoryStage, BikesSlider, Compare, Workshop, Visit
src/components/shop/      ProductCard
src/scripts/motion/       one module per behaviour; index.ts runs them all
```

## Design tokens

All colours, sizes, radii, shadows, easings and durations are CSS variables in `src/styles/tokens.css`. The GSAP versions of the same values are in `src/scripts/motion/tokens.ts`.

- **Colour:** `--color-brand` #F77C14 is the orange from the logo. Alongside it: `--color-ink` (black), `--color-bg` (cream), `--color-surface` (white) and `--color-brand-soft` (card orange). `--color-brand-text` is a darker orange that only appears on display-size text.
- **Fluid scale:** this is the reference's scaling system. `1em` = 16px at the 1440 / 834 / 550 / 390 design widths, and it scales between them. Every size is in `em`.
- **Type:** Karantina is the condensed Hebrew display face. Heebo is used for body text and Amatic SC for the hand-written notes. All three are self-hosted through `@fontsource`.

## Motion

Motion uses GSAP 3.15 (ScrollTrigger, SplitText, DrawSVG, Inertia, Flip and CustomEase) with Lenis smooth scrolling (`lerp: 0.18`). The curves and timings come from the reference site's own code.

| Where | Trigger | What | Timing |
|---|---|---|---|
| Hero | load | Wordmark travels to its place, then the nav, CTA, ring draw, fact pops, note, product fly-in, statement lines and body lines follow | see `hero.ts` header; 0.25–1.4s, elastic / smooth |
| Hero product | loop while visible | float y −1→2%, tilt, rotateX/Y | 1.38s sine yoyo |
| Hero product | pointer | 3D tilt ±8° / ±5° | 0.6s smooth quickTo |
| Wave band | scroll | text slides along the path, startOffset −60%→−30% (RTL) | scrubbed |
| Wave band | scroll speed | amplitude swells (damped spring) | per frame |
| Wave band | pointer near band | Gaussian bulge follows the cursor | per frame, eased |
| Headings `[data-highlight-text]` | enters viewport (96%) | words spring in from the side | 1s elasticSoft, stagger 0.039s |
| `[data-reveal]` | enters (85%) | fade + rise 60px | 0.5s smooth |
| `[data-reveal="pop"]`, bubbles, fact bubbles | enters (95%) | y100 x−40 rot−35 s.6 → rest | 0.8s elastic, stagger 0.048s |
| Wheel badges `[data-pop]` | enters (95%) | scale .5 rot 80° → rest | 0.95s elastic |
| Category stage (desktop) | scroll (sticky) | cards and products swap per step; white line draws | card 0.8s elastic, visual 0.95s elasticSoft, line scrubbed |
| Bikes slider | click / swipe / ← → | creative prev/next transforms | 0.6s smooth, elastic scale |
| Compare rules / checks | enters / crosses middle | rules grow; checks squash-bounce | 0.85s, stagger 0.076s / elastic.out(1,.4) |
| Intro cards, brand bubbles | cursor enters | inertia throw + spin, settles back | InertiaPlugin, resistance 180 |
| Buttons, cards | hover | icon circle springs across, card lifts and tilts | 0.725s elastic |
| Shop grid | filter / sort | Flip re-layout, new cards pop | 0.6s smooth |
| Footer wordmark | scroll | rises out of the bottom edge | scrubbed |

Motion follows these rules:
- Motion animates only transform, opacity and SVG stroke.
- Every entrance runs once.
- `prefers-reduced-motion` turns off all entrances, the smooth scrolling and the wave. The durations in `tokens.css` drop to 0.01s.
- Content is visible without JS. Elements are hidden before their entrance only when `html.motion-ok` is set, and a 3s safety timer removes that class if the motion script never starts.
- Without JS, the category stage falls back to a grid and the sliders to scroll-snap rows. The shop shows every product.

## Placeholders to replace

- **Reviews** (`reviews` in `src/data/copy.ts`): the current site has none. Use real Google or Facebook reviews.
- **Copy marked `placeholder`** in `src/data/copy.ts`:
  - stage title
  - category pitches
  - comparison rows
  - visit headline
  - hand-written notes
- **Product range:** there is only one product per category for now. Add the rest by extending `content/products.json` and running `npm run cutouts`.
- **Photos:** the workshop and intro photos are the low-resolution tiles from the current site, and some product photos were taken on the shop floor. Studio shots on white get automatic cut-outs; replace the rest with studio shots where possible.
- **Accessibility statement:** the footer links to the current site's statement page until it is migrated.
- **Checkout:** ordering goes through WhatsApp and phone. There is no cart or checkout yet.
