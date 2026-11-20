/**
 * Inertia nudge (reference: data-inertia). When the cursor enters an item, it is
 * thrown along the cursor's velocity and spins by the cross product of the hit
 * offset and the velocity, then settles back (InertiaPlugin, resistance 180).
 * Velocity is clamped to ±1080 px/s, spin to ±60°/s — the reference's values.
 */
import { gsap } from "gsap";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { motionOK } from "./tokens";

gsap.registerPlugin(InertiaPlugin);

export function initBubbles() {
  if (!motionOK() || !window.matchMedia("(pointer: fine)").matches) return;
  const clampV = gsap.utils.clamp(-1080, 1080);
  const clampR = gsap.utils.clamp(-60, 60);

  document.querySelectorAll<HTMLElement>("[data-inertia]").forEach((root) => {
    let lastX = 0;
    let lastY = 0;
    let dx = 0;
    let dy = 0;
    let raf = 0;
    root.addEventListener("mousemove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        dx = e.clientX - lastX;
        dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        raf = 0;
      });
    });

    root.querySelectorAll<HTMLElement>("[data-inertia-item]").forEach((item) => {
      item.addEventListener("mouseenter", (e) => {
        const child = item.querySelector<HTMLElement>("[data-inertia-child]");
        if (!child) return;
        const r = child.getBoundingClientRect();
        const ox = e.clientX - (r.left + r.width / 2);
        const oy = e.clientY - (r.top + r.height / 2);
        const torque = (ox * dy - oy * dx) / (Math.hypot(ox, oy) || 1);
        gsap.to(child, {
          inertia: {
            x: { velocity: clampV(dx * 30), end: 0 },
            y: { velocity: clampV(dy * 30), end: 0 },
            rotation: { velocity: clampR(torque * 15), end: 0 },
            resistance: 180,
          },
        });
      });
    });
  });
}
