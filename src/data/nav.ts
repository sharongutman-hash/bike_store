import { path } from "../lib/content";

/** Main navigation: header bar, mobile menu and (home page) the pills under the hero logo. */
export const mainNav = [
  { label: "אופניים", href: path("/shop/") },
  { label: "חשמליים", href: path("/shop/?cat=23") },
  { label: "ילדים", href: path("/shop/?cat=22") },
  { label: "סדנת תיקונים", href: path("/#workshop") },
  { label: "יד 2", href: path("/shop/?cat=34") },
  { label: "צרו קשר", href: "#contact" },
];
