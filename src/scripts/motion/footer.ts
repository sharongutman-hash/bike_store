/** Footer wordmark rises out of the bottom edge as the footer scrolls in (scrubbed). */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motionOK } from "./tokens";

gsap.registerPlugin(ScrollTrigger);

export function initFooter() {
  const mark = document.querySelector<HTMLElement>("[data-footer-mark]");
  if (!mark || !motionOK()) return;
  gsap.fromTo(
    mark,
    { yPercent: 70 },
    {
      yPercent: 0,
      ease: "none",
      scrollTrigger: { trigger: mark.parentElement, start: "top bottom", end: "bottom bottom", scrub: true },
    },
  );
}
