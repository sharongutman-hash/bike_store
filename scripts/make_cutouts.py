"""Make transparent cut-outs of product photos shot on a plain white background.

Usage: python3 scripts/make_cutouts.py content

For every product in content/products.json whose main image has white corners,
the white area connected to the image border is made transparent and saved to
content/images/cutouts/<productId>.webp. Photos taken in the shop (non-white
background) are skipped; the site shows those as framed photo cards instead.
"""
import json
import os
import sys
from collections import deque

from PIL import Image, ImageFilter

ROOT = sys.argv[1] if len(sys.argv) > 1 else "content"
OUT = os.path.join(ROOT, "images", "cutouts")
THRESHOLD = 238  # a pixel counts as background if R, G and B are all above this

os.makedirs(OUT, exist_ok=True)
products = json.load(open(os.path.join(ROOT, "products.json"), encoding="utf-8"))


def is_bg(px):
    return px[0] >= THRESHOLD and px[1] >= THRESHOLD and px[2] >= THRESHOLD


for p in products:
    src = os.path.join(ROOT, p["images"][0]["local"])
    im = Image.open(src).convert("RGB")
    w, h = im.size
    corners = [im.getpixel(c) for c in [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)]]
    if not all(min(c) >= 250 for c in corners):
        print(f"skip {p['id']} (not a studio shot)")
        continue

    px = im.load()
    mask = Image.new("L", (w, h), 255)
    m = mask.load()
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        if not is_bg(px[x, y]):
            continue
        m[x, y] = 0
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))

    # soften the edge by one pixel so it does not look jagged
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    rgba = im.convert("RGBA")
    rgba.putalpha(mask)
    bbox = rgba.getbbox()
    if bbox:
        rgba = rgba.crop(bbox)
    dest = os.path.join(OUT, f"{p['id']}.webp")
    rgba.save(dest, "WEBP", quality=90, method=6)
    print(f"cutout {p['id']} -> {dest} {rgba.size}")
