import { defineUserConfig } from "vuepress";
import { searchProPlugin } from "vuepress-plugin-search-pro";
import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "还不知道叫什么名字",
  description: "还不知道叫什么名字的博客",

  // Site locales drive the navbar language switcher. A page without a
  // translation falls back to the target locale's home instead of a 404.
  locales: {
    "/": {
      lang: "zh-CN",
      title: "还不知道叫什么名字",
      description: "还不知道叫什么名字的博客",
    },
    "/en/": {
      lang: "en-US",
      title: "SparksDing Notes",
      description: "Notes on backend engineering, distributed systems, and practice.",
    },
  },

  theme,

  // Enable it with pwa
  // shouldPrefetch: false,
  head: [
    ['meta', { name: 'referrer', content: 'no-referrer' }]
  ],
  plugins: [
    searchProPlugin({
      // 索引全部内容
      indexContent: true,
      // 为分类和标签添加索引
      customFields: [
        {
          getter: (page) => page.frontmatter.category as any,
          formatter: "分类：$content",
        },
        {
          getter: (page) => page.frontmatter.tag as any,
          formatter: "标签：$content",
        },
      ],
    }),
  ],

});
