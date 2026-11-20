// @ts-check
import { defineConfig } from "astro/config";

// GITHUB_PAGES=true builds the preview served at https://sharongutman-hash.github.io/bike_store/
// (set by .github/workflows/pages.yml). Otherwise the site builds for its own domain at "/".
const pages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  site: pages ? "https://sharongutman-hash.github.io" : "https://slalumpardeshana.co.il",
  base: pages ? "/bike_store" : undefined,
  trailingSlash: "always",
  build: { inlineStylesheets: "auto" },
  image: { responsiveStyles: false },
  devToolbar: { enabled: false },
});
