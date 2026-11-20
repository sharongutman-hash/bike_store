/**
 * Product slider (works with or without motion; transitions come from CSS tokens).
 * Arrow buttons, ←/→ keys on the region, and horizontal swipe.
 * Inactive slides are inert so focus and screen readers stay on the active one.
 */
export function initSlider() {
  document.querySelectorAll<HTMLElement>("[data-slider]").forEach(setup);
}

function setup(root: HTMLElement) {
  const slides = [...root.querySelectorAll<HTMLElement>("[data-slider-slide]")];
  const prevBtn = root.querySelector<HTMLButtonElement>("[data-slider-prev]");
  const nextBtn = root.querySelector<HTMLButtonElement>("[data-slider-next]");
  const status = root.querySelector<HTMLElement>("[data-slider-status]");
  const track = root.querySelector<HTMLElement>("[data-slider-track]")!;
  if (slides.length < 2) return;

  root.classList.add("is-enhanced");
  root.tabIndex = 0;
  const rtl = document.documentElement.dir === "rtl";
  const n = slides.length;
  let index = 0;

  const render = () => {
    slides.forEach((s, i) => {
      const offset = (i - index + n) % n;
      s.classList.toggle("is-active", offset === 0);
      s.classList.toggle("is-next", offset === 1);
      s.classList.toggle("is-prev", offset === n - 1);
      s.inert = offset !== 0;
    });
    if (status) status.textContent = `${index + 1} / ${n}`;
  };
  const go = (delta: number) => {
    index = (index + delta + n) % n;
    render();
  };

  prevBtn?.addEventListener("click", () => go(-1));
  nextBtn?.addEventListener("click", () => go(1));
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") go(rtl ? 1 : -1);
    else if (e.key === "ArrowRight") go(rtl ? -1 : 1);
    else return;
    e.preventDefault();
  });

  // Swipe
  let x0: number | null = null;
  track.addEventListener("pointerdown", (e) => (x0 = e.clientX));
  track.addEventListener("pointerup", (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) < 40) return;
    const forward = rtl ? dx > 0 : dx < 0;
    go(forward ? 1 : -1);
  });
  track.addEventListener("pointercancel", () => (x0 = null));

  render();
}
