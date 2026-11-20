// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://slalumpardeshana.co.il",
  trailingSlash: "always",
  build: { inlineStylesheets: "auto" },
  image: { responsiveStyles: false },
  devToolbar: { enabled: false },
});
