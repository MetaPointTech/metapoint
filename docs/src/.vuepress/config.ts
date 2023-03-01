import { defineUserConfig } from "vuepress";
import theme from "./theme.js";
import { commentPlugin } from "vuepress-plugin-comment2";

export default defineUserConfig({
  base: "/metapoint/",

  locales: {
    "/": {
      lang: "en-US",
      title: "Docs Demo",
      description: "A docs demo for vuepress-theme-hope",
    },
    "/zh/": {
      lang: "zh-CN",
      title: "文档演示",
      description: "vuepress-theme-hope 的文档演示",
    },
  },
  plugins: [commentPlugin({
    provider: "Giscus",
    repo: `SOVLOOKUP/metapoint`,
    repoId: "R_kgDOI1te7w",
    category: "Comments",
    categoryId: "DIC_kwDOI1te784CUkvI",
    lazyLoading: true,
    reactionsEnabled: true,
    lightTheme: "preferred_color_scheme",
  })],

  theme,
  // Enable it with pwa
  // shouldPrefetch: false,
});
