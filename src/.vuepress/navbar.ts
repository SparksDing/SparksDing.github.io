import { navbar } from "vuepress-theme-hope";

export default navbar([
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
  {
    text: '个人介绍',
    icon: 'arrow',
    link: '/intro/'
  },
]);
