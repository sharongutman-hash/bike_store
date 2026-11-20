/**
 * Motion tokens for GSAP — the same values as the CSS variables in tokens.css.
 * Curves are the reference site's own CustomEase definitions.
 */
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

CustomEase.create("smooth", "0.32, 0.72, 0, 1");
CustomEase.create("default", "0.72, 0.17, 0.17, 1");
CustomEase.create(
  "elastic",
  "M0,0 L0.076,0.5737 L0.1187,0.8382 L0.1419,0.9463 L0.1654,1.0292 L0.1897,1.0886 L0.2153,1.1258 L0.2297,1.137 L0.2448,1.1424 L0.261,1.1423 L0.2786,1.1366 L0.3101,1.1165 L0.3862,1.0507 L0.4257,1.0219 L0.4699,0.9995 L0.5163,0.9872 L0.5877,0.9842 L0.8126,1.0011 L1,1",
);
CustomEase.create(
  "elasticSoft",
  "M0,0 L0.017,0.029 L0.036,0.113 L0.111,0.604 L0.15,0.809 L0.191,0.949 L0.213,0.995 L0.236,1.026 L0.262,1.044 L0.293,1.049 L0.435,1.01 L0.512,1 L1,1",
);

gsap.defaults({ ease: "smooth" });

export const ease = {
  smooth: "smooth",
  default: "default",
  elastic: "elastic",
  elasticSoft: "elasticSoft",
  float: "sine.inOut",
  linear: "none",
} as const;

export const duration = {
  instant: 0.15,
  fast: 0.25,
  base: 0.35,
  slow: 0.6,
  elastic: 0.725,
  pop: 0.8,
  reveal: 0.95,
  float: 1.38, // hero product idle loop (yoyo)
  draw: 1.4,
} as const;

export const stagger = {
  words: 0.039,
  lines: 0.076,
  items: 0.048,
} as const;

/** Viewport start positions used by ScrollTrigger entrances (from the reference). */
export const start = {
  text: "top 96%",
  pop: "top 95%",
  block: "top 85%",
  line: "top 70%",
} as const;

/** 1 for LTR, -1 for RTL — mirrors horizontal offsets taken from the LTR reference. */
export const dir = document.documentElement.dir === "rtl" ? -1 : 1;

export const motionOK = () => document.documentElement.classList.contains("motion-ok");
export const isDesktop = () => window.matchMedia("(min-width: 992px)").matches;
