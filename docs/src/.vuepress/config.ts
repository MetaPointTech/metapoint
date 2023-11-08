import { defineUserConfig } from "vuepress";
import theme from "./theme.js";

export default defineUserConfig({
  base: "/metapoint/",
  locales: {
    "/": {
      lang: "en-US",
      title: "MetaPoint",
      description: "Low-code p2p web framework",
    },
    "/zh/": {
      lang: "zh-CN",
      title: "元点",
      description: "低代码点对点通讯框架",
    },
  },
  theme,
});
