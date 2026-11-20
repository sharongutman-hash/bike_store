/**
 * Shop filters + sort + paging. Reads/writes ?cat=<id>&sort=<key> so links from the
 * home page and header land on a filtered view. A department chip opens a second row
 * with its sub-categories. Only `data-page-size` matches show at first; "show more"
 * adds the next page. Layout changes animate with
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
  const subRows = [...root.querySelectorAll<HTMLElement>("[data-sub-for]")];
  const more = root.querySelector<HTMLElement>("[data-shop-more]");
  const moreBtn = root.querySelector<HTMLButtonElement>("[data-shop-more-btn]");
  const pageSize = Number(root.dataset.pageSize) || 24;
  let limit = pageSize;
  root.querySelector("[data-shop-controls]")?.removeAttribute("hidden");

  const params = new URLSearchParams(location.search);
  let cat = params.get("cat") ?? "all";
  let order = params.get("sort") ?? "featured";
  if (!filters.some((f) => f.dataset.filter === cat)) cat = "all";
  if (sort) sort.value = order;

  // Products with no price (on request) sort last whichever way.
  const price = (el: HTMLElement) => Number(el.dataset.price) || (order === "price-desc" ? -1 : Infinity);

  const apply = (animate: boolean) => {
    const before = items.filter((el) => !el.hidden);
    // Flip measures every card; keep it to small result sets.
    const state = animate && motionOK() && before.length <= 48 ? Flip.getState(before) : null;

    const matches = items.filter((el) => cat === "all" || (el.dataset.cats ?? "").split(",").includes(cat));
    const sorted = [...matches].sort((a, b) => {
      if (order === "price-asc") return price(a) - price(b);
      if (order === "price-desc") return price(b) - price(a);
      return Number(a.dataset.index) - Number(b.dataset.index);
    });
    const shown = new Set(sorted.slice(0, limit));
    items.forEach((el) => (el.hidden = !shown.has(el)));
    sorted.forEach((el) => grid.appendChild(el));

    // The department of the active chip (itself, or the parent of a sub-category chip).
    const active = filters.find((f) => f.dataset.filter === cat);
    const dept = active?.dataset.parent ?? cat;
    subRows.forEach((row) => (row.hidden = row.dataset.subFor !== dept));
    filters.forEach((f) => {
      const on = f.dataset.filter === cat || (f.dataset.filter === dept && !f.dataset.parent && cat !== "all");
      f.setAttribute("aria-pressed", String(on));
    });

    if (count) count.textContent = `${matches.length} מוצרים`;
    if (empty) empty.hidden = matches.length > 0;
    if (more) more.hidden = matches.length <= limit;
    if (moreBtn) moreBtn.textContent = `להציג עוד (${Math.min(pageSize, matches.length - limit)} מתוך ${matches.length - limit} שנותרו)`;

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
      limit = pageSize;
      apply(true);
    }),
  );
  sort?.addEventListener("change", () => {
    order = sort.value;
    limit = pageSize;
    apply(true);
  });
  moreBtn?.addEventListener("click", () => {
    const firstNew = limit;
    limit += pageSize;
    apply(false);
    // Move focus to the first newly shown product so keyboard users continue from there.
    const next = [...grid.querySelectorAll<HTMLElement>("[data-shop-item]:not([hidden])")][firstNew];
    next?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });
    if (motionOK()) {
      const added = [...grid.querySelectorAll<HTMLElement>("[data-shop-item]:not([hidden])")].slice(firstNew);
      gsap.fromTo(added, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: duration.base, ease: ease.smooth, stagger: 0.02 });
    }
  });
  apply(false);
}
