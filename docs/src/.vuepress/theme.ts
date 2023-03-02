import { hopeTheme } from "vuepress-theme-hope";
import { enNavbar, zhNavbar } from "./navbar/index.js";

export default hopeTheme({
  hostname: "https://vuepress-theme-hope-docs-demo.netlify.app",

  favicon: "/logo.svg",

  author: {
    name: "SOVLOOKUP",
    url: "https://github.com/SOVLOOKUP",
  },

  iconAssets: "iconfont",

  logo: "/logo.svg",

  repo: "SOVLOOKUP/metapoint",

  docsDir: "demo/theme-docs/src",

  displayFooter: false,
  locales: {
    "/": {
      // navbar
      navbar: enNavbar,

      footer: "Default footer",

      metaLocales: {
        editLink: "Edit this page on GitHub",
      },
    },

    /**
     * Chinese locale config
     */
    "/zh/": {
      // navbar
      navbar: zhNavbar,

      footer: "默认页脚",

      // page meta
      metaLocales: {
        editLink: "在 GitHub 上编辑此页",
      },
    },
  },

  plugins: {
    comment: {
      comment: true,
      provider: "Giscus",
      repo: `SOVLOOKUP/metapoint`,
      repoId: "R_kgDOI1te7w",
      category: "Comments",
      categoryId: "DIC_kwDOI1te784CUkvI",
      lazyLoading: true,
      reactionsEnabled: true,
      lightTheme: "preferred_color_scheme",
    },

    // all features are enabled for demo, only preserve features you need here
    mdEnhance: {
      align: true,
      attrs: true,
      chart: true,
      codetabs: true,
      container: true,
      demo: true,
      echarts: true,
      figure: true,
      flowchart: true,
      gfm: true,
      imgLazyload: true,
      imgSize: true,
      include: true,
      katex: true,
      mark: true,
      mermaid: true,
      playground: {
        presets: ["ts", "vue"],
      },
      presentation: {
        plugins: ["highlight", "math", "search", "notes", "zoom"],
      },
      stylize: [
        {
          matcher: "Recommended",
          replacer: ({ tag }) => {
            if (tag === "em") {
              return {
                tag: "Badge",
                attrs: { type: "tip" },
                content: "Recommended",
              };
            }
          },
        },
      ],
      sub: true,
      sup: true,
      tabs: true,
      vPre: true,
      vuePlayground: true,
    },
  },
});
