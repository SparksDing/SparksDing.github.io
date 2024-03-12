---
title: orm框架实现
isTimeLine: true
date: 2024-03-08
category:
  - java
tag:
  - orm
---

## **实现一个简单的mybatis**

### **JDBC是什么**
JDBC（Java Database Connectivity）是Java语言用于与关系型数据库进行交互的一组API（应用程序编程接口）。它允许Java应用程序通过标准的数据库访问方法与数据库进行通信，执行SQL查询、更新数据库、检索和修改数据等操作。

JDBC的核心组件包括以下几个部分：
* DriverManager：负责管理一组数据库驱动程序，并根据给定的数据库URL选择合适的驱动程序来建立与数据库的连接。
* Connection：表示与数据库的连接，通过Connection对象可以创建Statement对象、PreparedStatement对象和CallableStatement对象，以执行SQL语句和存储过程。
* Statement：用于执行静态SQL语句，可以是普通的Statement对象、带有参数的PreparedStatement对象或者可调用的CallableStatement对象。
* ResultSet：表示SQL查询的结果集，通过ResultSet对象可以获取查询结果中的数据。

```java
Connection connection = null;
Statement statement = null;
ResultSet resultSet = null;

try {
    // 注册数据库驱动程序
    Class.forName("com.mysql.jdbc.Driver");

    // 建立数据库连接
    connection = DriverManager.getConnection(JDBC_URL, JDBC_USER, JDBC_PASSWORD);

    // 创建Statement对象
    statement = connection.createStatement();

    // 执行SQL查询语句
    String sqlQuery = "SELECT * FROM my_table";
    resultSet = statement.executeQuery(sqlQuery);

    // 处理查询结果集
    while (resultSet.next()) {
        // 读取每一行数据并进行处理
        int id = resultSet.getInt("id");
        String name = resultSet.getString("name");
        // 其他列的处理

        // 输出结果
        System.out.println("ID: " + id + ", Name: " + name);
    }
} catch (...) {
  ...
}
```


### **ORM是什么**
以上是一个使用JDBC的样例，可以看出比较麻烦，因此ORM被提出。

> ORM（对象关系映射）是一种编程技术，用于在面向对象编程语言和关系型数据库之间建立映射关系。它允许开发人员使用面向对象的方式操作数据库，而不必关心数据库的底层细节和SQL语句的编写。

![orm框架](/assets/images/java/spring/orm框架的组成.png =600x)

有了ORM框架后，开发人员只需定义一个Mapper接口
```java
public interface IUserDao {
    User queryUserInfoById(Long id);

}
```
此外，提供对应这个Mapper接口的配置xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.sparks.middleware.test.po.IUserDao">

    <select id="queryUserInfoById" parameterType="java.lang.Long" resultType="com.sparks.middleware.test.dao.User">
        SELECT id, userId, userNickName, userHead, userPassword, createTime
        FROM user
        where id = #{id}
    </select>

    <select id="queryUserList" parameterType="com.sparks.middleware.test.dao.User" resultType="com.sparks.middleware.test.dao.User">
        SELECT id, userId, userNickName, userHead, userPassword, createTime, updateTime
        FROM user
        where userNickName = #{userNickName}
    </select>

</mapper>
```
即可使用面向对象的方式操作数据库
```java
BeanFactory beanFactory = new ClassPathXmlApplicationContext("spring-config.xml");
IUserDao userDao = beanFactory.getBean("IUserDao", IUserDao.class);
User user = userDao.queryUserInfoById(1L);
logger.info("测试结果：{}", JSON.toJSONString(user));
```

### **简单ORM设计**

#### **动态代理**
上述用法中开发者只需针对MySQL的一张表定义一个接口，接口中定义操作数据库的方法，再在xml配置文件中定义参数类型、返回值类型以及SQL语句即可操作。
|接口方法|入参|返回参数|SQL语句|
|:-:|:-:|:-:|:-:|
|queryUserInfoById|Long|User|SELECT ...|

要实现上述功能，需要用到Java的动态代理(Java Proxy或者Cglib)。


#### **SqlSession**
为了向用户屏蔽JDBC的细节，动态代理的代理逻辑中，我们需要实现与数据库交互的逻辑，为此设计了SqlSession接口，在其实现类中完成这些工作。

```java
public interface SqlSession {

    <T> T selectOne(String statement);

    <T> T selectOne(String statement, Object parameter);

    <T> List<T> selectList(String statement);

    <T> List<T> selectList(String statement, Object parameter);

    void close();
}
```
它的实现类是DefaultSqlSession

```java
public class DefaultSqlSession implements SqlSession {

    private Connection connection;
    private Map<String, XNode> mapperElement;

    public DefaultSqlSession(Connection connection, Map<String, XNode> mapperElement) {
        this.connection = connection;
        this.mapperElement = mapperElement;
    }

    @Override
    public <T> T selectOne(String statement, Object parameter) {
        try {
            XNode xNode = mapperElement.get(statement);
            Map<Integer, String> parameterMap = xNode.getParameter();
            PreparedStatement preparedStatement = connection.prepareStatement(xNode.getSql());
            buildParameter(preparedStatement, parameter, parameterMap);
            ResultSet resultSet = preparedStatement.executeQuery();
            List<T> objects = resultSet2Obj(resultSet, Class.forName(xNode.getResultType()));
            return objects.get(0);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
```

在其实现类中，完成了参数映射、SQL解析、SQL执行、结果映射。

![JDBC细节屏蔽](/assets/images/java/spring/JDBC细节屏蔽.png =400x)


获取SqlSession的时序图如下

![获取sqlSession的时序图](/assets/images/java/spring/orm获取sqlSession时序图.png =700x)

最终的代理逻辑如下

```java
InvocationHandler handler = (proxy, method, args) -> {
  logger.info("你被代理了，执行SQL操作！{}", method.getName());
  try {
      SqlSession session = sqlSessionFactory.openSession();
      try {
          return session.selectOne(mapperInterface.getName() + "." + method.getName(), args[0]);
      } finally {
          session.close();
      }
  } catch (Exception e) {
      e.printStackTrace();
  }

  return method.getReturnType().newInstance();
};
return (T) Proxy.newProxyInstance(Thread.currentThread().getContextClassLoader(), new Class[]{mapperInterface}, handler);
```

实现了以上逻辑后，用户使用样例如下
```java
SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(reader);

InvocationHandler handler = (proxy, method, arg) -> {
    try {
        SqlSession sess = sqlSessionFactory.openSession();
        try {
            return sess.selectOne(IUserDao.class.getName() + "." + method.getName(), arg[0]);
        } finally {
            sess.close();
        }
    } catch (Exception e) {
        e.printStackTrace();
    }

    return method.getReturnType().newInstance();
};
IUserDao iUserDao = (IUserDao) Proxy.newProxyInstance(Thread.currentThread().getContextClassLoader(), new Class[]{IUserDao.class}, handler);

try {
    User user = iUserDao.queryUserInfoById(1L);
    ...
}
...
```

### **集成Spring**
在上述ORM实现中，用户需要针对数据库每个表的接口手动生成代理对象，操作繁琐。
通过使用spring的扩展点，可以自动生成。
Spring扩展点的相关内容可以参考下述链接。
[spring扩展点](/java/spring/spring扩展点.md)

通过实现BeanDefinitionRegistryPostProcessor接口，重写其postProcessBeanDefinitionRegistry方法可以在spring的beanDefinitionMap中新增我们需要的代理类的beanDefinition

```java
public class MapperScannerConfigurer implements BeanDefinitionRegistryPostProcessor {

    private String basePackage;
    private SqlSessionFactory sqlSessionFactory;

    @Override
    public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) throws BeansException {
        try {
            // classpath*:cn/bugstack/**/dao/**/*.class
            String packageSearchPath = "classpath*:" + basePackage.replace('.', '/') + "/**/*.class";

            ResourcePatternResolver resourcePatternResolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resourcePatternResolver.getResources(packageSearchPath);

            for (Resource resource : resources) {
                MetadataReader metadataReader = new SimpleMetadataReader(resource, ClassUtils.getDefaultClassLoader());

                ScannedGenericBeanDefinition beanDefinition = new ScannedGenericBeanDefinition(metadataReader);
                String beanName = Introspector.decapitalize(ClassUtils.getShortName(beanDefinition.getBeanClassName()));

                beanDefinition.setResource(resource);
                beanDefinition.setSource(resource);
                beanDefinition.setScope("singleton");
                beanDefinition.getConstructorArgumentValues().addGenericArgumentValue(beanDefinition.getBeanClassName());
                beanDefinition.getConstructorArgumentValues().addGenericArgumentValue(sqlSessionFactory);
                beanDefinition.setBeanClass(MapperFactoryBean.class);

                BeanDefinitionHolder definitionHolder = new BeanDefinitionHolder(beanDefinition, beanName);
                registry.registerBeanDefinition(beanName, definitionHolder.getBeanDefinition());
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

    }

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        // left intentionally blank
    }

    public void setBasePackage(String basePackage) {
        this.basePackage = basePackage;
    }

    public void setSqlSessionFactory(SqlSessionFactory sqlSessionFactory) {
        this.sqlSessionFactory = sqlSessionFactory;
    }
}
```

注意到上面的beanDefinition的BeanClass为MapperFactoryBean，这是一个FactoryBean，用于创建复杂对象或者具有特殊构建逻辑的对象。
[FactoryBean介绍](/java/spring/FactoryBean介绍.md)


```java
public class MapperFactoryBean<T> implements FactoryBean<T> {

    private Logger logger = LoggerFactory.getLogger(MapperFactoryBean.class);

    private Class<T> mapperInterface;
    private SqlSessionFactory sqlSessionFactory;

    public MapperFactoryBean(Class<T> mapperInterface, SqlSessionFactory sqlSessionFactory) {
        this.mapperInterface = mapperInterface;
        this.sqlSessionFactory = sqlSessionFactory;
    }

    @Override
    public T getObject() throws Exception {
        InvocationHandler handler = (proxy, method, args) -> {
            logger.info("你被代理了，执行SQL操作！{}", method.getName());
            try {
                SqlSession session = sqlSessionFactory.openSession();
                try {
                    return session.selectOne(mapperInterface.getName() + "." + method.getName(), args[0]);
                } finally {
                    session.close();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            return method.getReturnType().newInstance();
        };
        return (T) Proxy.newProxyInstance(Thread.currentThread().getContextClassLoader(), new Class[]{mapperInterface}, handler);
    }

    @Override
    public Class<?> getObjectType() {
        return mapperInterface;
    }

    @Override
    public boolean isSingleton() {
        return true;
    }

}
```
在本文的ORM实现中，MapperFactoryBean用于生产数据表操作接口的代理对象。

同样的，我们还可以利用FactoryBean来生产SqlSessionFactory，在使用时就不需要自己定义该对象。

```java
public class SqlSessionFactoryBean implements FactoryBean<SqlSessionFactory>, InitializingBean {

    private String resource;
    private SqlSessionFactory sqlSessionFactory;

    @Override
    public void afterPropertiesSet() throws Exception {
        try (Reader reader = Resources.getResourceAsReader(resource)) {
            this.sqlSessionFactory = new SqlSessionFactoryBuilder().build(reader);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public SqlSessionFactory getObject() throws Exception {
        return sqlSessionFactory;
    }

    @Override
    public Class<?> getObjectType() {
        return sqlSessionFactory.getClass();
    }

    @Override
    public boolean isSingleton() {
        return true;
    }

    public void setResource(String resource) {
        this.resource = resource;
    }

}
```

集成spring后，该ORM的用法为

```java
BeanFactory beanFactory = new ClassPathXmlApplicationContext("spring-config.xml");
IUserDao userDao = beanFactory.getBean("IUserDao", IUserDao.class);
User user = userDao.queryUserInfoById(1L);
```

