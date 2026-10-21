import { navbar } from "vuepress-theme-hope";

export const zhNavbar = navbar([
  "/",
  {
    text: '前端',
    icon: 'react',
    link: '/frontend/'
  },
  {
    text: 'Java',
    icon: 'java',
    link: '/java/'
  },
  {
    text: "数据库",
    icon: 'box',
    link: '/database/'
  },
  {
    text: '微服务',
    icon: 'remote',
    link: '/distributed-system/'
  },
  {
    text: '工程实践',
    link: '/architecture/'
  },
  {
    text: 'DSH 源码',
    icon: 'code',
    link: '/deepseek-harness/'
  },
  {
    text: '学习源码',
    icon: 'code',
    link: '/source-study/'
  },
  {
    text: '其他',
    icon: 'arrow',
    link: '/others/'
  },
  {
    text: '标签',
    icon: 'tag',
    link: '/tag/javascript/'
  },
  {
    text: '分类',
    icon: 'categoryselected',
    link: '/category/前端/'
  },
  {
    text: '时间轴',
    icon: 'time',
    link: '/timeline/'
  },
]);

/** English navigation. Only translated sections are listed. */
export const enNavbar = navbar([
  "/en/",
  {
    text: "Engineering",
    link: "/en/architecture/",
  },
]);

export default zhNavbar;
