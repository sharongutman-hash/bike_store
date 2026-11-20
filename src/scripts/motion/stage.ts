/**
 * Category stage (desktop + motion): sticky viewport, scroll picks the active step.
 *
 * Step change (reference: sequence cards):
 *   card out   opacity 0, y -30%, rotate 8°, scale .8          0.45s smooth
 *   card in    y100 x-40 rotate-35 scale.6 → rest              0.80s elastic
 *   visual out opacity 0, y -15%, rotate -10°, scale .9         0.45s smooth
 *   visual in  y30% rotate 12° scale .85 → rest                0.95s elasticSoft
 * The white line draws with scroll progress (scrub).
 * Mobile / reduced motion: cards pop in once as they enter (grid layout).
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { dir, duration, ease, isDesktop, motionOK, start } from "./tokens";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

export function initStage() {
  const root = document.querySelector<HTMLElement>("[data-stage]");
  if (!root || !motionOK()) return;

  const steps = [...root.querySelectorAll<HTMLElement>("[data-stage-step]")];
  const dots = [...root.querySelectorAll<HTMLElement>("[data-stage-dot]")];
  const line = root.querySelector<SVGPathElement>("[data-stage-line]");

  if (!isDesktop()) {
    steps.forEach((step) => {
      gsap.fromTo(
        step,
        { opacity: 0, y: 80, rotate: -6 * dir, scale: 0.85 },
        { opacity: 1, y: 0, rotate: 0, scale: 1, ease: ease.elastic, duration: duration.pop, scrollTrigger: { trigger: step, start: start.pop, once: true } },
      );
    });
    if (line) gsap.fromTo(line, { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", ease: "none", scrollTrigger: { trigger: root, start: "top 80%", end: "bottom 20%", scrub: true } });
    return;
  }

  root.classList.add("is-enhanced");
  let active = -1;

  const show = (i: number) => {
    if (i === active) return;
    const prev = steps[active];
    const next = steps[i];
    const down = i > active;
    if (prev) {
      const pc = prev.querySelector("[data-stage-card]");
      const pv = prev.querySelector("[data-stage-visual]");
      gsap.to(pc, { opacity: 0, yPercent: down ? -30 : 30, rotate: 8 * dir, scale: 0.8, duration: 0.45, overwrite: true });
      gsap.to(pv, {
        opacity: 0,
        yPercent: down ? -15 : 15,
        rotate: -10 * dir,
        scale: 0.9,
        duration: 0.45,
        overwrite: true,
        onComplete: () => prev.classList.remove("is-active"),
      });
    }
    next.classList.add("is-active");
    const nc = next.querySelector("[data-stage-card]");
    const nv = next.querySelector("[data-stage-visual]");
    const badge = next.querySelector(".wheel-badge");
    gsap.fromTo(
      nc,
      { opacity: 0, y: down ? 100 : -100, yPercent: 0, x: -40 * dir, rotate: -35 * dir, scale: 0.6 },
      { opacity: 1, y: 0, x: 0, rotate: 0, scale: 1, ease: ease.elastic, duration: duration.pop, overwrite: true },
    );
    gsap.fromTo(
      nv,
      { opacity: 0, yPercent: down ? 30 : -30, rotate: 12 * dir, scale: 0.85 },
      { opacity: 1, yPercent: 0, rotate: 0, scale: 1, ease: ease.elasticSoft, duration: duration.reveal, delay: 0.05, overwrite: true },
    );
    if (badge)
      gsap.fromTo(badge, { scale: 0.5, rotate: 80 * dir, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, ease: ease.elastic, duration: duration.reveal, delay: 0.1 });
    dots.forEach((d, k) => d.classList.toggle("is-active", k === i));
    active = i;
  };

  // Hide every step except the first before the first paint of the enhanced layout.
  steps.forEach((s, k) => {
    if (k) gsap.set([s.querySelector("[data-stage-card]"), s.querySelector("[data-stage-visual]")], { opacity: 0 });
  });
  show(0);

  ScrollTrigger.create({
    trigger: root.querySelector("[data-stage-track]"),
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      const i = Math.min(steps.length - 1, Math.floor(self.progress * steps.length * 0.999));
      show(i);
    },
  });

  if (line) {
    gsap.fromTo(
      line,
      { drawSVG: "0% 0%" },
      {
        drawSVG: "0% 100%",
        ease: "none",
        scrollTrigger: { trigger: root.querySelector("[data-stage-track]"), start: "top top", end: "bottom bottom", scrub: 0.7 },
      },
    );
  }
}
