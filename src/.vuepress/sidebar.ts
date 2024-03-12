import { sidebar } from "vuepress-theme-hope";

export default sidebar([
  {
    text: "前端",
    icon: "react",
    prefix: "/frontend/",
    activeMatch: "^/frontend/$",
    collapsible: true,
    children: [
      {
        text: "react",
        icon: "react",
        prefix: "react/",
        collapsible: true,
        children: [
          "202307032.md",
          "Zustand 底层原理🚀🚀🚀.md"
        ],
      }
    ],
  }
  ,
  {
    text: "数据库",
    icon: "box",
    prefix: "/database/",
    activeMatch: "^/database/$",
    collapsible: true,
    children: [
      {
        text: "MySQL",
        icon: "box",
        prefix: "mysql/",
        collapsible: true,
        children: [
          "mysql的锁.md",
          "mysql性能调优.md"
        ],
      }
    ],
  },
  {
    text: "java",
    icon: "java",
    prefix: "/java/",
    activeMatch: "^/java/$",
    collapsible: true,
    children: [
      {
        text: "jvm",
        prefix: "jvm/",
        // icon: "java",
        collapsible: true,
        
        children: [
          "垃圾回收器.md",
          "常见内存泄漏问题.md",
          "内存泄漏排查工具.md",
          "jvm常用参数"
        ],
      },
      {
        text: "spring",
        prefix: "spring/",
        // icon: "java",
        collapsible: true,
        
        children: [
          "spring扩展点.md",
          "spring事务.md",
          "spring零碎知识点.md",
          "FactoryBean介绍.md",
          "spring AOP.md",
          "注解处理时机.md"
        ],
      },
      {
        text: "idea",
        prefix: "idea/",
        // icon: "java",
        collapsible: true,
        
        children: [
          "插件开发.md",
          "好用的插件.md",
        ],
      },

      {
        text: "bussiness-design",
        prefix: "bussiness-design/",
        // icon: "java",
        collapsible: true,
        
        children: [
          "秒杀场景.md",
          "一人一单.md",
        ],
      },
      {
        text: "mybatis",
        prefix: "mybatis/",
        // icon: "java",
        collapsible: true,
        
        children: [
          {
            text: "mini-mybatis",
            prefix: "mini-mybatis/",
            // icon: "java",
            collapsible: true,
            
            children: [
              "orm框架实现.md",
              "mybatis实现.md"
            ],
          },
        ],
      },
      {
        text: "awesome-project",
        prefix: "awesome-project/",
        // icon: "java",
        collapsible: true,
        
        children: [
          {
            text: "tomcat",
            prefix: "tomcat/",
            // icon: "java",
            collapsible: true,
            
            children: [
              "tomcat概述.md",
            ],
          },
          {
            text: "netty",
            prefix: "netty/",
            // icon: "java",
            collapsible: true,
            
            children: [
              "netty骨架.md",
            ],
          },
        ],
      },
      "problems.md"
    ],
  },
]);
