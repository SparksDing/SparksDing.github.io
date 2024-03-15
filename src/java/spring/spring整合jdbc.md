---
title: spring整合jdbc
isTimeLine: true
date: 2024-03-14
category:
  - java
tag:
  - spring
  - jdbc
---

[spring条件注解](/java/spring/spring条件注解.md)
[jdbc使用](/java/mybatis/mini-mybatis/orm框架实现.md)

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-jdbc</artifactId>
  <scope>runtime</scope>
</dependency>
```

新增上述maven依赖后，PooledDataSourceAvailableCondition条件返回true。

```java
static class PooledDataSourceAvailableCondition extends SpringBootCondition {

  @Override
  public ConditionOutcome getMatchOutcome(ConditionContext context, AnnotatedTypeMetadata metadata) {
    ConditionMessage.Builder message = ConditionMessage.forCondition("PooledDataSource");
    if (DataSourceBuilder.findType(context.getClassLoader()) != null) {
      return ConditionOutcome.match(message.foundExactly("supported DataSource"));
    }
    return ConditionOutcome.noMatch(message.didNotFind("supported DataSource").atAll());
  }

}

public static Class<? extends DataSource> findType(ClassLoader classLoader) {
  for (String name : DATA_SOURCE_TYPE_NAMES) {
    try {
      return (Class<? extends DataSource>) ClassUtils.forName(name, classLoader);
    }
    catch (Exception ex) {
      // Swallow and continue
    }
  }
  return null;
}
```


之后会Import以下这个类，生成DataSource的实例
```java
@Configuration(proxyBeanMethods = false)
@ConditionalOnClass(HikariDataSource.class)
@ConditionalOnMissingBean(DataSource.class)
@ConditionalOnProperty(name = "spring.datasource.type", havingValue = "com.zaxxer.hikari.HikariDataSource",
    matchIfMissing = true)
static class Hikari {

  @Bean
  @ConfigurationProperties(prefix = "spring.datasource.hikari")
  HikariDataSource dataSource(DataSourceProperties properties) {
    HikariDataSource dataSource = createDataSource(properties, HikariDataSource.class);
    if (StringUtils.hasText(properties.getName())) {
      dataSource.setPoolName(properties.getName());
    }
    return dataSource;
  }

}
```

会用到application.properties中的配置DataSourceProperties，前缀是spring.datasource
```java
@ConfigurationProperties(prefix = "spring.datasource")
public class DataSourceProperties implements BeanClassLoaderAware, InitializingBean {
}
```


整合spring-boot-starter-jdbc后，查询数据库写法
```java
Connection connection = dataSource.getConnection();
ResultSet resultSet = connection.createStatement().executeQuery("SELECT * FROM customer WHERE id = 1");
while (resultSet.next()) {
    log.info("id:{},name:{}", resultSet.getLong("id"), resultSet.getString("customer_name"));
}
resultSet.close();
connection.close();
```


### 参考文章
[SpringBoot2.x入门教程：引入jdbc模块与JdbcTemplate简单使用](https://www.cnblogs.com/throwable/p/13326290.html)
[数据库连接池之Hikari源码解析](https://www.cnblogs.com/jackion5/p/14193025.html)
[HikariCP源码阅读（四）获取与创建连接](https://juejin.cn/post/6889934474348331021)
[Spring Data之DataSource创建及源码分析](https://blog.csdn.net/f4761/article/details/83536210)