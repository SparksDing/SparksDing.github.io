---
title: mybatis实现
isTimeLine: true
date: 2024-03-08
category:
  - java
tag:
  - mybatis
---

## **Mybatis的设计**


> MyBatis 是一个持久层框架，它简化了在 Java 应用程序中与数据库的交互过程。MyBatis 的核心思想是将 SQL 语句与 Java 对象之间的映射关系配置在 XML 文件或者注解中，从而实现数据的持久化操作。

以下是 MyBatis 的一些主要特点和优势：
1. 简单易用： MyBatis 的配置简单清晰，学习曲线较低，易于上手。
2. 灵活性： MyBatis 允许使用 SQL 来直接操作数据库，提供了更大的灵活性和控制力，可以优化 SQL 语句以提高性能。
3. 性能优异： MyBatis 采用了预编译 SQL、缓存等技术来提高数据库访问性能。
4. 可定制性： MyBatis 提供了丰富的插件机制，可以方便地扩展和定制框架的功能。
5. 支持注解和 XML 配置： MyBatis 可以使用注解或者 XML 文件来配置 SQL 映射关系，开发者可以根据实际需求选择更适合的方式。
6. 与 Spring 等框架集成： MyBatis 与 Spring、Spring Boot 等主流 Java 框架无缝集成，可以方便地在企业应用中使用。

MyBatis 的工作原理主要包括以下几个步骤：
1. 定义 SQL 映射文件或者注解：将 SQL 语句与 Java 对象的映射关系配置在 XML 文件或者 Java 注解中。
2. 配置数据源和 SqlSessionFactory：配置数据源和 SqlSessionFactory，SqlSessionFactory 是 MyBatis 的主要入口点，用于创建 SqlSession 对象。
3. 创建 SqlSession：通过 SqlSessionFactory 创建 SqlSession 对象，用于执行 SQL 语句。
4. 执行 SQL 操作：在 SqlSession 中调用相应的 SQL 方法执行数据库操作，例如查询、插入、更新等。
5. 关闭 SqlSession：操作完成后关闭 SqlSession，释放资源。

总的来说，MyBatis 是一个功能强大、灵活性高、易于上手的持久层框架，适用于各种规模的 Java 项目，并且在企业级应用中得到了广泛的应用。


![https://pdai.tech/md/framework/orm-mybatis/mybatis-y-sql-exec.html](/assets/images/java/spring/获取sqlSession时序图.png =700x)



### **Mybatis事务**

#### doGetTransaction源码分析
[doGetTransaction](https://blog.csdn.net/weixin_44367006/article/details/104678746)

#### Mybatis的事务如何被spring管理
[mybatis-spring](https://github.com/mybatis/spring)
[Mybatis的事务如何被spring管理](https://www.cnblogs.com/java-chen-hao/p/11839993.html)


### **杂项**

[UnpooledDataSource源码分析](https://blog.csdn.net/qq_35835624/article/details/108440224)

### **参考文章**
[Java全栈知识](https://pdai.tech/md/framework/orm-mybatis/mybatis-y-sql-exec.html#google_vignette)
