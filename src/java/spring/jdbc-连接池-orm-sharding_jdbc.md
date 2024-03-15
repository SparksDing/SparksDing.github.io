---
title: jdbc-连接池-orm-sharding_jdbc之间的关系
isTimeLine: true
date: 2024-03-14
category:
  - java
tags:
  - spring
  - jdbc
  - orm
---


### jdbc和ORM
[jdbc使用](/java/mybatis/mini-mybatis/orm框架实现.md)


### 连接池
> 数据库连接池是指，在Java程序未和数据库建立连接时，就提前创建好一定数量的连接并放入缓冲池中；当Java程序请求建立数据库连接时，就可以直接从缓冲池中“拿出”建立好的连接来用，用完后取消Java程序对该连接的引用即可，连接本身不会中断，只是“放回”了连接池（动态绑定机制）。

> 数据库连接池负责分配，管理和释放数据库连接，它允许用户程序重复使用一个现有的数据库连接，而不是重新建立一个。（即连接池中的连接是公共的，谁都能用，你用完我可以接着用）

> 当应用程序向连接池请求的连接数超过最大连接数量时，这些请求将被加入到等待队列中


### sharding-jdbc

* 适用于任何基于 JDBC 的 ORM 框架，如：JPA, Hibernate, Mybatis, Spring JDBC Template或直接使用 JDBC。
* 支持任何第三方的数据库连接池，如：DBCP, C3P0, BoneCP, Druid, HikariCP 等。
* 支持任意实现 JDBC 规范的数据库，目前支持 MySQL，Oracle，SQLServer，PostgreSQL 以及任何遵循
SQL92 标准的数据库。


```java
private final Map<String, DataSource> dataSourceMap = new LinkedHashMap<>();

@Bean
@Conditional(ShardingRuleCondition.class)
public DataSource shardingDataSource() throws SQLException {
    return ShardingDataSourceFactory.createDataSource(dataSourceMap, new ShardingRuleConfigurationYamlSwapper().swap(shardingRule), props.getProps());
}
```
底层与数据库直接交互的仍然为javax.sql.DataSource，sharding-jdbc是在交互之前做一些操作，比如：
1. 用一个map保存多个库，根据规则实现分库
2. 在执行sql语句之前改写，实现分表



### 参考文章
[JDBC 连接池 详解](https://blog.csdn.net/TYRA9/article/details/131144703)
[shardingjdbc—— 配置druid数据库连接池](https://blog.csdn.net/weixin_44643439/article/details/108671120)
