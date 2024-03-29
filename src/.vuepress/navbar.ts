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
    text: '微服务',
    icon: 'remote',
    link: '/distributed-system/'
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
