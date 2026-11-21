"""
Build public/logo.svg (סלאלום פרדס חנה) from the high-quality Kfar Saba logo.

  python3 scripts/build-logo.py .cache/logo/source.svg public/logo.svg

- Drops the two trees (the first two paths).
- Replaces "כפר סבא" with "פרדס חנה". פ, ר and ס are the source's own letters;
  ד, ח, ה and נ are built from the source's ר (same stroke widths and corner).
- Widens the white pill under the plate to fit the longer name and crops the
  view box to the logo.
"""
import re, sys

src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding="utf-8").read()

TOP, BASE = 483.7, 538.3          # letter top / baseline in the source
STEM, BAR = 17.2, 14.2            # vertical / horizontal stroke widths

def resh(L, R):
    """ר from x=L to x=R: top bar, rounded outer corner, stem on the right."""
    return (f"M{R-STEM:.1f},{BASE}v-34c0-2.2-.6-3.8-1.7-4.8-1.1-1.1-2.6-1.6-4.5-1.6"
            f"h-{R-23.4-L:.1f}v-{BAR}h{R-22.6-L:.1f}"
            f"c7.5,0,13.1,1.7,16.9,5.1,3.8,3.4,5.7,8.5,5.7,15.3v34.3h-{STEM}Z")

def dalet(L, R, over=6):
    """ד: square top bar with a short overhang past the stem."""
    st = R - over - STEM
    y = TOP + BAR
    return (f"M{L:.1f},{TOP}H{R:.1f}V{y:.1f}H{st+STEM:.1f}V{BASE}H{st:.1f}V{y:.1f}H{L:.1f}Z")

def het(L, R):
    """ח: ר with a full-height left leg (one outline)."""
    return (f"M{R-STEM:.1f},{BASE}v-34c0-2.2-.6-3.8-1.7-4.8-1.1-1.1-2.6-1.6-4.5-1.6"
            f"h-{R-23.4-(L+STEM):.1f}V{BASE}h-{STEM}V{TOP}h{R-22.6-L:.1f}"
            f"c7.5,0,13.1,1.7,16.9,5.1,3.8,3.4,5.7,8.5,5.7,15.3v34.3h-{STEM}Z")

def he(L, R, gap=8):
    """ה: ר plus a shorter, detached left leg."""
    y = TOP + BAR + gap
    return resh(L, R) + f"M{L:.1f},{y:.1f}h{STEM}V{BASE}h-{STEM}Z"

def nun(L, R):
    """נ: ר flipped upside down (bottom bar, stem on the right)."""
    return resh(L, R)

# Source letters (from the "כפר סבא" group): ס and פ, with their own x ranges.
letters = re.findall(r'<path class="cls-2" d="([^"]+)"></path>', s[s.rindex("<g>"):])
kaf, pe, resh_src, samekh = letters[5], letters[4], letters[3], letters[2]
SAMEKH_X, PE_X = (435.6, 498.2), (569.4, 625.0)

# Layout, left to right as drawn: ה נ ח · ס ד ר פ
GAP, SPACE = 6, 26
seq = [("he", 46), ("nun", 32), ("het", 46), (" ", SPACE), ("samekh", SAMEKH_X[1] - SAMEKH_X[0]),
       ("dalet", 44), ("resh", 49), ("pe", PE_X[1] - PE_X[0])]
total = sum(w for _, w in seq) + GAP * (len(seq) - 2)  # no extra gap around the space
CX = (291.7 + 695.6) / 2
x = CX - total / 2
paths = []
prev_space = True
for name, w in seq:
    if name == " ":
        x += w; prev_space = True; continue
    if not prev_space:
        x += GAP
    prev_space = False
    L, R = x, x + w
    if name == "he":       d = he(L, R)
    elif name == "nun":    paths.append(f'<path class="cls-2" transform="matrix(1 0 0 -1 0 {TOP+BASE:.1f})" d="{nun(L, R)}"/>'); x = R; continue
    elif name == "het":    d = het(L, R)
    elif name == "dalet":  d = dalet(L, R)
    elif name == "resh":   d = resh(L, R)
    elif name == "samekh": paths.append(f'<path class="cls-2" transform="translate({L-SAMEKH_X[0]:.1f} 0)" d="{samekh}"/>'); x = R; continue
    elif name == "pe":     paths.append(f'<path class="cls-2" transform="translate({L-PE_X[0]:.1f} 0)" d="{pe}"/>'); x = R; continue
    paths.append(f'<path class="cls-2" d="{d}"/>')
    x = R
text_group = "<g>" + "".join(paths) + "</g>"

# Pill: straight edges from a to b, inner radius 19.9, outer 28.3 (as in the source).
pad = 25
a, b = CX - total / 2 - pad + 19.9, CX + total / 2 + pad - 19.9
L = b - a
ring = (f'<path class="cls-2" d="M{b:.1f},470.3c11,0,19.9,9,19.9,19.9v38.4c0,11-9,19.9-19.9,19.9h-{L:.1f}'
        f'c-11,0-19.9-9-19.9-19.9v-38.4c0-11,9-19.9,19.9-19.9h{L:.1f}'
        f'M{b:.1f},462h-{L:.1f}c-15.6,0-28.3,12.7-28.3,28.3v38.4c0,15.6,12.7,28.3,28.3,28.3h{L:.1f}'
        f'c15.6,0,28.3-12.7,28.3-28.3v-38.4c0-15.6-12.7-28.3-28.3-28.3h0Z"/>')
rect = f'<rect class="cls-3" x="{a-19.9:.1f}" y="470.3" width="{L+39.8:.1f}" height="78.3" rx="12" ry="12"/>'

# Assemble: drop the two tree paths, swap the pill and the text.
head, body = s.split("</defs>", 1)
body_paths = re.findall(r"<path[^>]*></path>|<rect[^>]*></rect>|<polygon[^>]*></polygon>", body.split("<g>", 1)[0])
kept = body_paths[2:]                      # [0], [1] are the trees
head = re.sub(r'viewBox="[^"]+"', 'viewBox="4 172 976 390"', head)
head = re.sub(r'\s(id|data-name)="[^"]*"', "", head)
svg = head + "</defs>" + "".join(kept) + "<g>" + rect + ring + "</g>" + text_group + "</svg>\n"
open(out, "w", encoding="utf-8").write(svg)
print(f"wrote {out}: {len(svg)/1024:.1f} KB, text width {total:.1f}, pill {a-28.3:.1f}–{b+28.3:.1f}")
