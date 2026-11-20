/**
 * Check marks bounce each time they cross the viewport middle
 * (reference: scaleX .65 / y 25% / rotate 25° then elastic.out(1, 0.4), 0.85s, restart on re-enter).
 * Row rules are handled by [data-lines] in reveals.ts.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motionOK } from "./tokens";

gsap.registerPlugin(ScrollTrigger);

export function initCompare() {
  if (!motionOK()) return;
  document.querySelectorAll<HTMLElement>("[data-check]").forEach((el) => {
    const tl = gsap.timeline({ paused: true }).to(el, {
      keyframes: {
        "0%": { scaleX: 1, yPercent: 0, rotate: 0 },
        "20%": { scaleX: 0.65, yPercent: 25, rotate: 25, ease: "power2.in" },
        "100%": { scaleX: 1, yPercent: 0, rotate: 0, ease: "elastic.out(1,0.4)" },
      },
      duration: 0.85,
    });
    ScrollTrigger.create({
      trigger: el,
      start: "top 49%",
      end: "bottom 51%",
      onEnter: () => tl.restart(),
      onEnterBack: () => tl.restart(),
    });
  });
}
