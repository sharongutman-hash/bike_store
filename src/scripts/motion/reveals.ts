/**
 * Generic scroll entrances (all trigger once).
 *
 * [data-highlight-text]  words spring in from the side, stagger 0.039s, elasticSoft 1s  (ref: data-highlight-text)
 * [data-reveal]          fade + rise 60px, 0.5s smooth                                   (ref: stage paragraph)
 * [data-reveal="pop"]    y100 x-40 rotate-35 scale.6 → rest, elastic 0.8s               (ref: data-payment-item)
 * [data-reveal-children] same as data-reveal, children staggered 0.048s
 * [data-pop]             scale .5 rotate 80° → rest, elastic 0.95s                       (ref: data-smiley)
 * [data-draw]            SVG stroke draws 0 → 100%, 0.75s linear                         (ref: data-fill-line)
 * [data-lines]           children rules grow scaleX 0 → 1, stagger 0.076s, 0.85s         (ref: benefit table lines)
 * [data-parallax="n"]    yPercent drift of n while the element crosses the viewport (scrub)
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { dir, duration, ease, motionOK, stagger, start } from "./tokens";

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);

export function initReveals() {
  if (!motionOK()) return;

  document.querySelectorAll<HTMLElement>("[data-highlight-text]").forEach((el) => {
    const split = SplitText.create(el, { type: "words", wordsClass: "split-word", aria: "auto" });
    gsap.set(el, { visibility: "visible" });
    gsap.set(split.words, { transformOrigin: dir === -1 ? "bottom left" : "bottom right", display: "inline-block" });
    gsap.from(split.words, {
      yPercent: 25,
      xPercent: 75 * dir,
      opacity: 0,
      scale: 0.6,
      ease: ease.elasticSoft,
      duration: 1,
      stagger: stagger.words,
      scrollTrigger: { trigger: el, start: start.text, once: true },
    });
  });

  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
    const pop = el.dataset.reveal === "pop";
    gsap.fromTo(
      el,
      pop
        ? { opacity: 0, y: 100, x: -40 * dir, rotate: -35 * dir, scale: 0.6 }
        : { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        x: 0,
        rotate: 0,
        scale: 1,
        duration: pop ? duration.pop : 0.5,
        ease: pop ? ease.elastic : ease.smooth,
        scrollTrigger: { trigger: el, start: pop ? start.pop : start.block, once: true },
      },
    );
  });

  document.querySelectorAll<HTMLElement>("[data-reveal-children]").forEach((el) => {
    const pop = el.dataset.revealChildren === "pop";
    gsap.fromTo(
      el.children,
      pop ? { opacity: 0, y: 100, x: -40 * dir, rotate: -35 * dir, scale: 0.6 } : { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        x: 0,
        rotate: 0,
        scale: 1,
        duration: pop ? duration.pop : 0.6,
        ease: pop ? ease.elastic : ease.smooth,
        stagger: pop ? -stagger.items : stagger.items * 2,
        scrollTrigger: { trigger: el, start: start.block, once: true },
      },
    );
  });

  document.querySelectorAll<HTMLElement>("[data-pop]").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, scale: 0.5, rotate: 80 * dir, transformOrigin: dir === -1 ? "right bottom" : "left bottom" },
      {
        opacity: 1,
        scale: 1,
        rotate: 0,
        ease: ease.elastic,
        duration: duration.reveal,
        scrollTrigger: { trigger: el, start: start.pop, once: true },
      },
    );
  });

  document.querySelectorAll<SVGPathElement>("[data-draw]").forEach((path) => {
    gsap.fromTo(
      path,
      { drawSVG: "0% 0%" },
      {
        drawSVG: "0% 100%",
        ease: ease.linear,
        duration: 0.75,
        scrollTrigger: { trigger: path.closest("svg") ?? path, start: start.line, once: true },
      },
    );
  });

  document.querySelectorAll<HTMLElement>("[data-lines]").forEach((el) => {
    const lines = el.querySelectorAll("[data-line]");
    gsap.fromTo(
      lines,
      { scaleX: 0, transformOrigin: dir === -1 ? "right center" : "left center" },
      {
        scaleX: 1,
        stagger: stagger.lines,
        duration: 0.85,
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      },
    );
  });

  document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
    const amount = Number(el.dataset.parallax || 10);
    gsap.fromTo(
      el,
      { yPercent: -amount },
      {
        yPercent: amount,
        ease: ease.linear,
        scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  });
}
