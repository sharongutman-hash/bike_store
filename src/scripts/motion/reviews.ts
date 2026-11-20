/** Reviews carousel: arrows scroll the snap track by one card (smooth only when motion is allowed). */
import { motionOK } from "./tokens";

export function initReviews() {
  document.querySelectorAll<HTMLElement>("[data-reviews]").forEach((root) => {
    const track = root.querySelector<HTMLElement>("[data-reviews-track]");
    if (!track) return;
    const step = () => {
      const card = track.firstElementChild as HTMLElement | null;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return (card?.offsetWidth ?? 300) + gap;
    };
    const rtl = document.documentElement.dir === "rtl";
    const behavior: ScrollBehavior = motionOK() ? "smooth" : "auto";
    root.querySelector("[data-reviews-next]")?.addEventListener("click", () =>
      track.scrollBy({ left: rtl ? -step() : step(), behavior }),
    );
    root.querySelector("[data-reviews-prev]")?.addEventListener("click", () =>
      track.scrollBy({ left: rtl ? step() : -step(), behavior }),
    );
  });
}
