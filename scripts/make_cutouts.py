"""Make transparent cut-outs of product photos shot on a plain white background.

Usage: python3 scripts/make_cutouts.py content

For every product in content/products.json whose main image has white corners,
the white background is made transparent and saved to
content/images/cutouts/<productId>.webp. Photos taken in the shop (non-white
background) are skipped; the site shows those as framed photo cards instead.

Background is:
  1. near-white area connected to the image border, and
  2. enclosed near-white "holes" (inside frame triangles, between spokes) that
     are flat white and big enough not to be a logo or a highlight.
Edge pixels next to the background get a soft alpha and are "un-whitened",
so thin parts such as spokes keep no white halo.
"""
import json
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

ROOT = sys.argv[1] if len(sys.argv) > 1 else "content"
OUT = os.path.join(ROOT, "images", "cutouts")
BG_MIN = 252        # a pixel is "near white" if R, G and B are all at least this
HOLE_MIN = 252      # enclosed holes must be flatter / whiter than this ...
HOLE_SAT = 8        # ... with max-min channel spread at most this
HOLE_AREA = 60      # ... and at least this many pixels (skips logos, highlights)
HOLE_FLAT = 0.9     # share of a hole's pixels that must pass HOLE_MIN
# second pass for small JPEG-greyed gaps where spokes meet the hub
GAP_MIN = 232       # pixels at least this white ...
GAP_AREA = 6        # ... in an enclosed patch of at least this many pixels, next to background
GAP_MEAN = 244      # ... whose average whiteness is at least this
GAP_SAT = 10        # ... and average channel spread at most this
EDGE_LO = 200       # edge alpha ramp: min channel >= 255 -> clear, <= EDGE_LO -> solid

# Cut-outs made by hand (or with an AI tool) because the product itself is white
# and touches the white background; the colour method cannot separate them.
# 1391: made with rembg (birefnet-general model). The script leaves these alone.
MANUAL = {"1391"}

os.makedirs(OUT, exist_ok=True)
products = json.load(open(os.path.join(ROOT, "products.json"), encoding="utf-8"))


def components(mask):
    """Label 4-connected components of a boolean mask. Yields index arrays."""
    h, w = mask.shape
    seen = np.zeros_like(mask)
    flat = mask.ravel()
    seen_f = seen.ravel()
    for start in np.flatnonzero(flat):
        if seen_f[start]:
            continue
        seen_f[start] = True
        q = deque([start])
        comp = []
        while q:
            i = q.popleft()
            comp.append(i)
            y, x = divmod(i, w)
            for j, ok in ((i - 1, x > 0), (i + 1, x < w - 1), (i - w, y > 0), (i + w, y < h - 1)):
                if ok and flat[j] and not seen_f[j]:
                    seen_f[j] = True
                    q.append(j)
        yield np.array(comp)


def dilate(mask, r):
    out = mask.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            out |= np.roll(np.roll(mask, dy, 0), dx, 1)
    return out


for p in products:
    if str(p["id"]) in MANUAL:
        print(f"keep {p['id']} (manual cut-out)")
        continue
    src = os.path.join(ROOT, p["images"][0]["local"])
    im = Image.open(src).convert("RGB")
    a = np.asarray(im).astype(np.int16)
    h, w, _ = a.shape
    corners = [a[2, 2], a[2, w - 3], a[h - 3, 2], a[h - 3, w - 3]]
    if not all(c.min() >= 250 for c in corners):
        print(f"skip {p['id']} (not a studio shot)")
        continue

    lo = a.min(axis=2)
    spread = a.max(axis=2) - lo
    near_white = lo >= BG_MIN
    flat_white = (lo >= HOLE_MIN) & (spread <= HOLE_SAT)

    bg = np.zeros((h, w), bool)
    holes = 0
    for comp in components(near_white):
        ys, xs = np.divmod(comp, w)
        touches = ys.min() == 0 or xs.min() == 0 or ys.max() == h - 1 or xs.max() == w - 1
        if touches:
            bg.ravel()[comp] = True
        elif len(comp) >= HOLE_AREA and flat_white.ravel()[comp].mean() >= HOLE_FLAT:
            bg.ravel()[comp] = True
            holes += 1

    gap_mask = (lo >= GAP_MIN) & ~bg
    near_bg = dilate(bg, 3).ravel()  # real gaps sit right next to removed background;
                                     # white tyre lettering is walled in by black rubber
    lo_f, sp_f = lo.ravel(), spread.ravel()
    for comp in components(gap_mask):
        ys, xs = np.divmod(comp, w)
        if ys.min() == 0 or xs.min() == 0 or ys.max() == h - 1 or xs.max() == w - 1:
            continue
        if not near_bg[comp].any():
            continue
        if len(comp) >= GAP_AREA and lo_f[comp].mean() >= GAP_MEAN and sp_f[comp].mean() <= GAP_SAT:
            bg.ravel()[comp] = True
            holes += 1

    # alpha: 0 on background, soft ramp on pixels bordering it, 1 inside the product
    alpha = np.ones((h, w), float)
    alpha[bg] = 0.0
    edge = dilate(bg, 2) & ~bg
    ramp = np.clip((255 - lo) / (255 - EDGE_LO), 0, 1)
    alpha[edge] = np.minimum(alpha[edge], ramp[edge])

    # un-whiten edge colours: c = a*fg + (1-a)*255  ->  fg = (c - (1-a)*255) / a
    rgb = a.astype(float)
    m = edge & (alpha > 0.02)
    am = alpha[m][:, None]
    rgb[m] = np.clip((rgb[m] - (1 - am) * 255) / am, 0, 255)

    rgba = np.dstack([rgb, alpha * 255]).round().astype(np.uint8)
    out = Image.fromarray(rgba, "RGBA")
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    dest = os.path.join(OUT, f"{p['id']}.webp")
    out.save(dest, "WEBP", quality=90, method=6, exact=True)
    print(f"cutout {p['id']} -> {dest} {out.size} ({holes} enclosed holes removed)")
