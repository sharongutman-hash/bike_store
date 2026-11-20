/**
 * Interactive wave band.
 *
 * - Scroll position scrubs the text along the path: startOffset -30% → -60% (reference values).
 * - Scroll speed swells the wave: amplitude follows |velocity| through a damped spring.
 * - The pointer bends it: a Gaussian bulge follows the cursor while it is near the band.
 * - At rest it breathes slowly (phase drift). Runs only while on screen.
 * With reduced motion the path is drawn once at rest and the text stays put.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motionOK } from "./tokens";

gsap.registerPlugin(ScrollTrigger);

type WaveState = {
  amp: number; // current extra amplitude from velocity
  ampV: number; // spring velocity
  bump: number; // current pointer bulge height
  bumpX: number; // bulge centre (svg units)
  bumpTarget: number;
  bumpXTarget: number;
  phase: number;
};

export function initWave() {
  document.querySelectorAll<HTMLElement>("[data-wave]").forEach(setup);
}

function setup(root: HTMLElement) {
  const svg = root.querySelector<SVGSVGElement>("[data-wave-svg]")!;
  const path = root.querySelector<SVGPathElement>("[data-wave-path]")!;
  const band = root.querySelector<SVGUseElement>("[data-wave-band]")!;
  const textPath = root.querySelector<SVGTextPathElement>("[data-wave-text]")!;
  const text = textPath.parentElement as unknown as SVGTextElement;
  const animate = motionOK();

  let W = 1440;
  let H = 420;
  let base = 0;
  let fontSize = 84;
  const s: WaveState = { amp: 0, ampV: 0, bump: 0, bumpX: 0, bumpTarget: 0, bumpXTarget: 0, phase: 0 };

  const layout = () => {
    const r = root.getBoundingClientRect();
    W = Math.max(320, r.width);
    H = Math.max(160, r.height);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("preserveAspectRatio", "none");
    fontSize = Math.min(110, Math.max(34, W * 0.058));
    base = H * 0.2;
    text.style.fontSize = `${fontSize}px`;
    band.style.strokeWidth = `${fontSize * 1.42}px`;
    draw();
  };

  const N = 56;
  const pts: [number, number][] = Array.from({ length: N + 1 }, () => [0, 0]);
  const draw = () => {
    const x0 = -0.15 * W;
    const span = 1.3 * W;
    const sigma = W * 0.13;
    const amp = base + s.amp;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = x0 + span * t;
      const wave = Math.sin(t * Math.PI * 2.1 + 0.6 + s.phase) * amp;
      const bulge = s.bump * Math.exp(-((x - s.bumpX) ** 2) / (2 * sigma * sigma));
      pts[i][0] = x;
      pts[i][1] = H / 2 + wave + bulge;
    }
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < N; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2;
      const my = (pts[i][1] + pts[i + 1][1]) / 2;
      d += ` Q ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    }
    d += ` L ${pts[N][0].toFixed(1)} ${pts[N][1].toFixed(1)}`;
    path.setAttribute("d", d);
  };

  layout();
  new ResizeObserver(() => layout()).observe(root);

  if (!animate) return;

  // Scroll position → text offset along the path (reference: -30% → -60%, scrubbed).
  // Reversed for RTL so new words arrive from the left, the reading direction's end.
  const rtl = document.documentElement.dir === "rtl";
  gsap.fromTo(
    textPath,
    { attr: { startOffset: rtl ? "-60%" : "-30%" } },
    {
      attr: { startOffset: rtl ? "-30%" : "-60%" },
      ease: "none",
      scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true },
    },
  );

  // Scroll velocity → amplitude target.
  let velocity = 0;
  const lenis = window.__lenis;
  if (lenis) lenis.on("scroll", (l: { velocity: number }) => (velocity = l.velocity));
  else
    ScrollTrigger.create({
      trigger: root,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => (velocity = self.getVelocity() / 60),
    });

  // Pointer → bulge. The band does not catch pointer events, so read the window.
  const onPointer = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    const near = e.clientY > r.top - 80 && e.clientY < r.bottom + 80;
    if (!near) {
      s.bumpTarget = 0;
      return;
    }
    s.bumpXTarget = ((e.clientX - r.left) / r.width) * W;
    const dy = e.clientY - (r.top + r.height / 2);
    s.bumpTarget = gsap.utils.clamp(-H * 0.32, H * 0.32, dy * 0.75);
  };

  let running = false;
  const tick = (_t: number, dt: number) => {
    const step = Math.min(dt, 50) / 16.67;
    // damped spring toward the velocity-driven target
    const target = Math.min(Math.abs(velocity) * 6, H * 0.22);
    const k = 0.06;
    const damp = 0.82;
    s.ampV = (s.ampV + (target - s.amp) * k * step) * Math.pow(damp, step);
    s.amp += s.ampV * step;
    velocity *= Math.pow(0.9, step);
    s.bump += (s.bumpTarget - s.bump) * 0.08 * step;
    s.bumpX += (s.bumpXTarget - s.bumpX) * 0.12 * step;
    s.phase += 0.004 * step;
    draw();
  };

  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !running) {
      running = true;
      gsap.ticker.add(tick);
      window.addEventListener("pointermove", onPointer, { passive: true });
    } else if (!entry.isIntersecting && running) {
      running = false;
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", onPointer);
    }
  }).observe(root);
}
