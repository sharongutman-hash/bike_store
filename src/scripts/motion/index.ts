/**
 * Motion entry. Every module checks for its own elements, so one bundle serves all pages.
 * - Entrances run once and only when html.motion-ok is set (JS loaded + motion allowed).
 * - Interactive parts (sliders, filters, gallery) work with or without motion.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { motionOK } from "./tokens";
import { initReveals } from "./reveals";
import { initHero } from "./hero";
import { initWave } from "./wave";
import { initStage } from "./stage";
import { initSlider } from "./slider";
import { initCompare } from "./compare";
import { initReviews } from "./reviews";
import { initBubbles } from "./bubbles";
import { initFooter } from "./footer";
import { initShop } from "./shop";
import { initGallery } from "./gallery";
import { initTilt } from "./tilt";

declare global {
  interface Window {
    __motionReady?: boolean;
    __lenis?: Lenis;
  }
}

gsap.registerPlugin(ScrollTrigger);
window.__motionReady = true;

if (motionOK()) {
  // Smooth scroll, same feel as the reference (Lenis, lerp 0.18).
  const lenis = new Lenis({ lerp: 0.18, autoRaf: false });
  window.__lenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // In-page anchors go through Lenis so the smooth scroll is not interrupted.
  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const target = document.querySelector(url.hash);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target as HTMLElement, { offset: 0 });
    history.pushState(null, "", url.hash);
    (target as HTMLElement).setAttribute("tabindex", "-1");
    (target as HTMLElement).focus({ preventScroll: true });
  });
}

const modules = [
  initHero,
  initReveals,
  initWave,
  initStage,
  initSlider,
  initCompare,
  initReviews,
  initBubbles,
  initFooter,
  initShop,
  initGallery,
  initTilt,
];

for (const init of modules) {
  try {
    init();
  } catch (err) {
    console.error(err);
  }
}

// Fonts change line breaks (SplitText, pinned sections) — measure again once loaded.
document.fonts?.ready.then(() => ScrollTrigger.refresh());
