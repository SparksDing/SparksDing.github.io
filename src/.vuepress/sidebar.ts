import { sidebar } from "vuepress-theme-hope";

export const zhSidebar = sidebar([
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
  },
  
  {
    text: "工程实践",
    prefix: "/architecture/",
    activeMatch: "^/architecture/$",
    collapsible: true,
    children: [
      "dsh-peer.md",
    ],
  },

  {
    text: "DeepSeek Harness 源码",
    icon: "code",
    prefix: "/deepseek-harness/",
    activeMatch: "^/deepseek-harness/$",
    collapsible: true,
    children: [
      "README.md",
      "01-boot.md",
      "02-cordis.md",
      "03-agent-loop.md",
      "04-tools.md",
      "05-session.md",
      "06-llm.md",
      "07-sdk-web.md",
    ],
  },

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
        text: "java-feature",
        prefix: "java-feature/",
        // icon: "java",
        collapsible: true,
        
        children: [
          "stream-api.md",
        ],
      },
      {
        text: "spring",
        prefix: "spring/",
        // icon: "java",
        collapsible: true,
        
        children: [
          {
            text: "spring-starter",
            prefix: "spring-starter/",
            // icon: "java",
            collapsible: true,
            
            children: [
              "spring整合jdbc.md",
              "spring整合feign.md",
              "spring整合rocketmq.md",
              "spring整合sharding-jdbc.md",
              "spring-statemachine-starter.md"
            ],
          },
          "spring扩展点.md",
          "spring事务.md",
          "spring零碎知识点.md",
          "FactoryBean介绍.md",
          "spring AOP.md",
          "注解处理时机.md",
          "spring条件注解.md",
          "spring自动装配原理.md",
          "jdbc-连接池-orm-sharding_jdbc.md",
          "springMVC.md",
          "maven常用.md"
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
          {
            text: "feign",
            prefix: "feign/",
            // icon: "java",
            collapsible: true,
            
            children: [
              "手写rpc.md",
              "feign如何整合ribbon和consul.md"
            ],
          },
          {
            text: "rocketmq",
            prefix: "rocketmq/",
            // icon: "java",
            collapsible: true,
            
            children: [
              "rocketmq-spring-boot-starter源码分析.md",
            ],
          },
          {
            text: "spring-data-jpa",
            prefix: "spring-data-jpa/",
            // icon: "java",
            collapsible: true,
            
            children: [
              "spring-data-jpa使用.md",
            ],
          },
          {
            text: "spring-statemachine",
            prefix: "spring-statemachine/",
            // icon: "java",
            collapsible: true,
            
            children: [
              "使用.md",
            ],
          },
        ],
      },
      "problems.md"
    ],
  },
  {
    text: "分布式",
    icon: "remote",
    prefix: "/distributed-system/",
    activeMatch: "^/distributed-system/$",
    collapsible: true,
    children: [
      {
        text: "微服务",
        // icon: "react",
        prefix: "microservice/",
        collapsible: true,
        children: [
          "组件.md",
        ],
      },
      {
        text: "k8s",
        // icon: "react",
        prefix: "k8s/",
        collapsible: true,
        children: [
          "概述.md",
        ],
      },
      {
        text: "redis",
        // icon: "react",
        prefix: "redis/",
        collapsible: true,
        children: [
          "redis基本数据结构.md",
        ],
      },
      {
        text: "raft协议",
        // icon: "react",
        prefix: "raft/",
        collapsible: true,
        children: [
          "raft介绍.md",
          "raft实验.md"
        ],
      },
      "overview.md",
      "CAP.md"
    ],
  },
  {
    text: "其他",
    icon: "arrow",
    prefix: "/others/",
    activeMatch: "^/others/$",
    collapsible: true,
    children: [
      {
        text: "mac",
        // icon: "react",
        prefix: "mac/",
        collapsible: true,
        children: [
          "idea快捷键.md",
          "excalidraw快捷键.md"
        ],
      },
      {
        text: "webtools",
        // icon: "react",
        prefix: "webtools/",
        collapsible: true,
        children: [
          "vuepress相关.md",
          "一些好用的web网站.md"
        ],
      },
      {
        text: "运维",
        // icon: "react",
        prefix: "operation_and_maintenance/",
        collapsible: true,
        children: [
          "ngrok部署.md",
        ],
      }
    ],
  },
]);

/** English sidebar. Only translated sections are listed. */
export const enSidebar = sidebar([
  {
    text: "Engineering",
    prefix: "/en/architecture/",
    activeMatch: "^/en/architecture/$",
    collapsible: false,
    children: [
      "dsh-peer.md",
    ],
  },
]);

export default zhSidebar;
