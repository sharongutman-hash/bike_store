/**
 * Product gallery: thumbnails swap the main image. With motion the new image
 * springs in (scale .92 → 1, 0.6s elasticSoft); otherwise it swaps instantly.
 */
import { gsap } from "gsap";
import { duration, ease, motionOK } from "./tokens";

export function initGallery() {
  document.querySelectorAll<HTMLElement>("[data-gallery]").forEach((root) => {
    const slides = [...root.querySelectorAll<HTMLElement>("[data-gallery-slide]")];
    const thumbs = [...root.querySelectorAll<HTMLButtonElement>("[data-gallery-thumb]")];
    const show = (i: number) => {
      slides.forEach((s, k) => (s.hidden = k !== i));
      thumbs.forEach((t, k) => t.setAttribute("aria-current", String(k === i)));
      if (motionOK())
        gsap.fromTo(slides[i], { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: duration.slow, ease: ease.elasticSoft });
    };
    thumbs.forEach((t, i) => t.addEventListener("click", () => show(i)));
  });
}
