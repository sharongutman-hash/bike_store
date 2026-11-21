import { path } from "../lib/content";

/** Main navigation: the pills under the hero logo (home page), header bar and mobile menu. */
export const mainNav = [
  { label: "אופניים", href: path("/shop/?cat=21") },
  { label: "קורקינטים", href: path("/shop/?cat=1400") },
  { label: "אביזרים", href: path("/shop/?cat=46") },
  { label: "חלקים", href: path("/shop/?cat=1300") },
  { label: "יד שניה", href: path("/shop/?cat=34") },
  { label: "סדנת תיקונים", href: path("/#workshop") },
];

/** The header bar and mobile menu also link to the contact details in the footer. */
export const headerNav = [...mainNav, { label: "צרו קשר", href: "#contact" }];
