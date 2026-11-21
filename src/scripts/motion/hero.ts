/**
 * Hero load sequence — adapted from the reference's intro timeline (values kept,
 * the 1s loader delay dropped, x offsets mirrored for RTL):
 *
 *  0.00  wordmark travels from the viewport centre to its place      0.60s smooth
 * +0.125 nav fades in                                                 0.25s
 * +0.05  CTA rises 60px                                               0.50s
 * +0.005 ring draws out from its middle                               1.40s power2.out
 * -0.015 fact bubbles pop (y100 x-40 rot-35 s.6), reverse stagger     0.80s elastic, 0.048s
 * -0.015 hand-written note swings in                                  0.45s
 * -0.005 product flies up from below, rotating into place             0.85s smooth
 * -0.005 statement lines spring in (y60% x25% s.6)                    0.95s elasticSoft, 0.039s
 * +0.01  body lines rise out of a mask                                0.50s, 0.039s
 * +0.15  featured-product link fades up                               0.45s
 *
 * Then: idle float (1.38s sine yoyo, only while the hero is on screen) and a pointer tilt.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { dir, duration, ease, isDesktop, motionOK, stagger } from "./tokens";

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);

export function initHero() {
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  if (!hero) return;

  const q = <T extends Element = HTMLElement>(s: string) => hero.querySelector<T>(s);
  const qa = (s: string) => hero.querySelectorAll<HTMLElement>(s);
  const wordmark = q("[data-hero-wordmark]");
  const cta = q("[data-hero-cta]");
  const ring = q<SVGCircleElement>("[data-hero-ring]");
  const facts = qa("[data-hero-fact]");
  const note = q("[data-hero-note]");
  const product = q("[data-hero-product]");
  const tilt = q("[data-hero-tilt]");
  const lines = qa(".hero__line");
  const body = q("[data-hero-body]");
  const eyebrow = q("[data-hero-eyebrow]");
  const featured = q("[data-hero-underline]");
  const nav = document.querySelectorAll<HTMLElement>("[data-load-nav]");

  const restRotate = 6 * -dir; // matches the CSS resting tilt
  if (!motionOK()) return;

  const lenis = window.__lenis;
  lenis?.stop();

  const rect = wordmark!.getBoundingClientRect();
  const toCentre = window.innerHeight / 2 - (rect.top + rect.height / 2);
  const bodySplit = body ? SplitText.create(body, { type: "lines", mask: "lines", linesClass: "split-line", aria: "auto" }) : null;

  const tl = gsap.timeline({ delay: 0.15, onComplete: () => hero.classList.add("is-loaded") });
  tl.fromTo(wordmark, { y: toCentre, opacity: 0 }, { y: 0, opacity: 1, duration: duration.slow })
    .fromTo(nav, { opacity: 0 }, { opacity: 1, duration: duration.fast }, "<+=0.125")
    .fromTo(cta, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "<+=0.05")
    .fromTo(ring, { drawSVG: "50% 50%" }, { drawSVG: "0% 100%", ease: "power2.out", duration: duration.draw }, "<+=0.005")
    .fromTo(
      facts,
      { opacity: 0, y: 100, x: -40 * dir, rotate: -35 * dir, scale: 0.6 },
      { opacity: 1, y: 0, x: 0, rotate: 0, scale: 1, ease: ease.elastic, duration: duration.pop, stagger: -stagger.items },
      "<-=0.015",
    )
    .fromTo(
      note,
      { opacity: 0, rotate: -18, scale: 1.25, yPercent: -65, xPercent: -25 * dir },
      { opacity: 1, rotate: -7, scale: 1, yPercent: 0, xPercent: 0, duration: 0.45 },
      "<-=0.015",
    )
    .fromTo(
      product,
      { yPercent: 100, xPercent: -50 * dir, rotate: -35 * dir, scale: 0.9, opacity: 0, transformOrigin: "60% 50%" },
      { yPercent: -1, xPercent: 0, rotate: restRotate, scale: 1, opacity: 1, duration: 0.85 },
      "<-=0.005",
    )
    .fromTo(
      lines,
      { yPercent: 60, xPercent: 25 * dir, opacity: 0, scale: 0.6, transformOrigin: dir === -1 ? "0% 100%" : "100% 100%" },
      { yPercent: 0, xPercent: 0, opacity: 1, scale: 1, ease: ease.elasticSoft, duration: duration.reveal, stagger: stagger.words },
      "<-=0.005",
    )
    .fromTo(eyebrow, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, "<")
    .fromTo(bodySplit?.lines ?? [], { yPercent: 125 }, { yPercent: 0, duration: 0.5, stagger: stagger.words }, "<+=0.01")
    .set(body, { opacity: 1 }, "<")
    .fromTo(featured ?? [], { opacity: 0, yPercent: 45 }, { opacity: 1, yPercent: 0, duration: 0.45 }, "<+=0.15")
    .call(() => lenis?.start(), undefined, "-=1");

  // Idle float — runs only while the hero is visible.
  const float = gsap.fromTo(
    product,
    { yPercent: -1, rotate: restRotate, rotateX: 0, rotateY: 0 },
    {
      yPercent: 2,
      rotate: restRotate - 2 * dir,
      rotateX: -4,
      rotateY: -5 * dir,
      duration: duration.float,
      ease: ease.float,
      repeat: -1,
      yoyo: true,
      paused: true,
    },
  );
  tl.eventCallback("onComplete", () => {
    hero.classList.add("is-loaded");
    ScrollTrigger.create({
      trigger: hero,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (self.isActive ? float.play() : float.pause()),
    });
  });

  // Scroll-out parallax: the wordmark sinks behind, the product drifts down.
  gsap.to(wordmark, {
    yPercent: 35,
    ease: ease.linear,
    scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
  });

  // Pointer tilt (fine pointers on desktop only).
  if (tilt && isDesktop() && window.matchMedia("(pointer: fine)").matches) {
    const rx = gsap.quickTo(tilt, "rotationX", { duration: duration.slow, ease: ease.smooth });
    const ry = gsap.quickTo(tilt, "rotationY", { duration: duration.slow, ease: ease.smooth });
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      ry(nx * 16);
      rx(ny * -10);
    });
    hero.addEventListener("pointerleave", () => {
      rx(0);
      ry(0);
    });
  }
}
