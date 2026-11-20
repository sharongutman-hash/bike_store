/** Pointer tilt for [data-tilt] (fine pointers only): rotateY ±8°, rotateX ±6°, 0.6s smooth. */
import { gsap } from "gsap";
import { duration, ease, motionOK } from "./tokens";

export function initTilt() {
  if (!motionOK() || !window.matchMedia("(pointer: fine)").matches) return;
  document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
    const target = el.querySelector<HTMLElement>("[data-tilt-target]") ?? el;
    gsap.set(el, { perspective: 1000 });
    const rx = gsap.quickTo(target, "rotationX", { duration: duration.slow, ease: ease.smooth });
    const ry = gsap.quickTo(target, "rotationY", { duration: duration.slow, ease: ease.smooth });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 16);
      rx(((e.clientY - r.top) / r.height - 0.5) * -12);
    });
    el.addEventListener("pointerleave", () => {
      rx(0);
      ry(0);
    });
  });
}
