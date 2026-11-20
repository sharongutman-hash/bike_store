/**
 * Shop filters + sort. Reads/writes ?cat=<id>&sort=<key> so links from the
 * home page and header land on a filtered view. Layout changes animate with
 * GSAP Flip (0.6s smooth, items entering pop with the elastic ease).
 * Without JS every product is listed and the filter bar stays hidden.
 */
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { duration, ease, motionOK } from "./tokens";

gsap.registerPlugin(Flip);

export function initShop() {
  const root = document.querySelector<HTMLElement>("[data-shop]");
  if (!root) return;
  const grid = root.querySelector<HTMLElement>("[data-shop-grid]")!;
  const items = [...grid.querySelectorAll<HTMLElement>("[data-shop-item]")];
  const filters = [...root.querySelectorAll<HTMLButtonElement>("[data-filter]")];
  const sort = root.querySelector<HTMLSelectElement>("[data-sort]");
  const count = root.querySelector<HTMLElement>("[data-shop-count]");
  const empty = root.querySelector<HTMLElement>("[data-shop-empty]");
  root.querySelector("[data-shop-controls]")?.removeAttribute("hidden");

  const params = new URLSearchParams(location.search);
  let cat = params.get("cat") ?? "all";
  let order = params.get("sort") ?? "featured";
  if (!filters.some((f) => f.dataset.filter === cat)) cat = "all";
  if (sort) sort.value = order;

  const apply = (animate: boolean) => {
    const state = animate && motionOK() ? Flip.getState(items) : null;

    let visible = 0;
    items.forEach((el) => {
      const cats = (el.dataset.cats ?? "").split(",");
      const show = cat === "all" || cats.includes(cat);
      el.hidden = !show;
      if (show) visible++;
    });
    const price = (el: HTMLElement) => Number(el.dataset.price);
    const sorted = [...items].sort((a, b) => {
      if (order === "price-asc") return price(a) - price(b);
      if (order === "price-desc") return price(b) - price(a);
      return Number(a.dataset.index) - Number(b.dataset.index);
    });
    sorted.forEach((el) => grid.appendChild(el));

    filters.forEach((f) => f.setAttribute("aria-pressed", String(f.dataset.filter === cat)));
    if (count) count.textContent = `${visible} מוצרים`;
    if (empty) empty.hidden = visible > 0;

    const url = new URL(location.href);
    cat === "all" ? url.searchParams.delete("cat") : url.searchParams.set("cat", cat);
    order === "featured" ? url.searchParams.delete("sort") : url.searchParams.set("sort", order);
    history.replaceState(null, "", url);

    if (state) {
      Flip.from(state, {
        duration: duration.slow,
        ease: ease.smooth,
        absolute: true,
        onEnter: (els) =>
          gsap.fromTo(els, { opacity: 0, scale: 0.6, rotate: -8 }, { opacity: 1, scale: 1, rotate: 0, duration: duration.pop, ease: ease.elastic }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.6, duration: duration.fast }),
      });
    }
  };

  filters.forEach((f) =>
    f.addEventListener("click", () => {
      cat = f.dataset.filter!;
      apply(true);
    }),
  );
  sort?.addEventListener("change", () => {
    order = sort.value;
    apply(true);
  });
  apply(false);
}
