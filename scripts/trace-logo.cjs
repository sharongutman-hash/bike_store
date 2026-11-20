/**
 * Trace a small flat-colour logo into an SVG: upscale smoothly, split it into
 * colour layers (silhouette/black, orange, white), follow each layer's outline,
 * simplify the outlines and stack the layers.
 *
 * Usage: node scripts/trace-logo.cjs content/images/site/logo.png public/logo.svg [scale]
 * Works best from the largest logo file available.
 */
const fs = require("node:fs");
const sharp = require("sharp");
const [, , inFile, outFile, scaleArg] = process.argv;
if (!inFile || !outFile) throw new Error("Usage: node scripts/trace-logo.cjs <in.png> <out.svg> [scale]");
const S = Number(scaleArg || 8);

(async () => {
  const meta = await sharp(inFile).metadata();
  const W = meta.width * S, H = meta.height * S;
  const data = await sharp(inFile).resize(W, H, { kernel: "lanczos3" }).blur(S * 0.5).ensureAlpha().raw().toBuffer();

  const sil = new Uint8Array(W * H), org = new Uint8Array(W * H), wht = new Uint8Array(W * H);
  const acc = { o: [0, 0, 0, 0], k: [0, 0, 0, 0] };
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
    if (a < 128) continue;
    sil[i] = 1;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (r - b > 90 && r > 150) { org[i] = 1; acc.o[0] += r; acc.o[1] += g; acc.o[2] += b; acc.o[3]++; }
    else if (lum > 170) wht[i] = 1;
    else if (lum < 80) { acc.k[0] += r; acc.k[1] += g; acc.k[2] += b; acc.k[3]++; }
  }
  const hex = (c) => "#" + [0, 1, 2].map((j) => Math.round(c[j] / c[3]).toString(16).padStart(2, "0")).join("");

  /** Closed outlines of a mask, following pixel edges with the inside on the left. */
  function loops(mask) {
    const out = new Map();
    const add = (x1, y1, x2, y2) => { const k = x1 + "," + y1; (out.get(k) || out.set(k, []).get(k)).push([x2, y2]); };
    const m = (x, y) => x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!m(x, y)) continue;
      if (!m(x, y - 1)) add(x + 1, y, x, y);
      if (!m(x - 1, y)) add(x, y, x, y + 1);
      if (!m(x, y + 1)) add(x, y + 1, x + 1, y + 1);
      if (!m(x + 1, y)) add(x + 1, y + 1, x + 1, y);
    }
    const res = [];
    for (const [start, list] of out) {
      while (list.length) {
        const [sx, sy] = start.split(",").map(Number);
        const pts = [[sx, sy]];
        let [cx, cy] = list.pop();
        let px = sx, py = sy;
        while (!(cx === sx && cy === sy)) {
          pts.push([cx, cy]);
          const nl = out.get(cx + "," + cy);
          let pick = 0;
          if (nl.length > 1) {
            const dx = cx - px, dy = cy - py;
            pick = Math.max(0, nl.findIndex(([nx, ny]) => nx - cx === dy && ny - cy === -dx));
          }
          const [nx, ny] = nl.splice(pick, 1)[0];
          px = cx; py = cy; cx = nx; cy = ny;
        }
        if (pts.length >= 8) res.push(pts);
      }
    }
    return res;
  }

  function rdp(pts, eps) {
    if (pts.length < 3) return pts;
    const a = pts[0], b = pts[pts.length - 1];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let idx = 0, dmax = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const d = Math.abs((b[0] - a[0]) * (a[1] - pts[i][1]) - (a[0] - pts[i][0]) * (b[1] - a[1])) / L;
      if (d > dmax) { dmax = d; idx = i; }
    }
    if (dmax <= eps) return [a, b];
    return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)];
  }
  function closedRdp(pts, eps) {
    let far = 0, best = 0;
    pts.forEach((p, i) => { const d = Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]); if (d > best) { best = d; far = i; } });
    const a = rdp(pts.slice(0, far + 1), eps), b = rdp([...pts.slice(far), pts[0]], eps);
    return [...a.slice(0, -1), ...b.slice(0, -1)];
  }
  const area = (p) => p.reduce((s, q, i) => { const r = p[(i + 1) % p.length]; return s + q[0] * r[1] - r[0] * q[1]; }, 0) / 2;
  const n = (v) => +(v / S).toFixed(2);
  const toPath = (mask) => loops(mask)
    .map((l) => closedRdp(l, S * 0.2))
    .filter((p) => p.length >= 3 && Math.abs(area(p)) > S * S * 0.6)
    .map((p) => "M" + p.map(([x, y]) => `${n(x)} ${n(y)}`).join("L") + "Z")
    .join("");

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${meta.width} ${meta.height}">` +
    `<path fill="${hex(acc.k)}" fill-rule="evenodd" d="${toPath(sil)}"/>` +
    `<path fill="${hex(acc.o)}" fill-rule="evenodd" d="${toPath(org)}"/>` +
    `<path fill="#fff" fill-rule="evenodd" d="${toPath(wht)}"/>` +
    `</svg>\n`;
  fs.writeFileSync(outFile, svg);
  console.log(`wrote ${outFile} (${(svg.length / 1024).toFixed(1)} KB) · black ${hex(acc.k)} · orange ${hex(acc.o)}`);
})();
