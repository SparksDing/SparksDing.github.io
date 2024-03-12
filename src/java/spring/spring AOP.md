---
title: spring AOP
isTimeLine: true
date: 2024-03-10
category:
  - java
tag:
  - spring AOP
---


## **AOP的实现**

### **没有循环依赖的bean的AOP时机**

```java
public abstract class AbstractAutoProxyCreator extends ProxyProcessorSupport
		implements SmartInstantiationAwareBeanPostProcessor, BeanFactoryAware
```

InstantiationAwareBeanPostProcessor接口中包含方法postProcessAfterInitialization

```java
public Object postProcessAfterInitialization(@Nullable Object bean, String beanName) {
    if (bean != null) {
        // 如果是普通bean，则返回beanName，如果是FactoryBean,则返回加上前缀&的&beanName
        Object cacheKey = getCacheKey(bean.getClass(), beanName);
        // earlyProxyReferences中缓存的是已经创建好的代理对象
        if (!this.earlyProxyReferences.contains(cacheKey)) {
            return wrapIfNecessary(bean, beanName, cacheKey);
        }
    }
    return bean;
}
```

### **出现循环依赖的bean的AOP时机**
对应[spring扩展点](/java/spring/spring扩展点.md) (循环依赖: 提前AOP)

```java
@Override
public Object getEarlyBeanReference(Object bean, String beanName) {
  Object cacheKey = getCacheKey(bean.getClass(), beanName);
  this.earlyProxyReferences.put(cacheKey, bean);
  return wrapIfNecessary(bean, beanName, cacheKey);
}
```


### 杂项

[spring中expose-proxy的作用与原理](https://blog.csdn.net/JustForSS/article/details/83008824)

[Spring——事务注解@Transactional的源码分析](https://blog.csdn.net/minghao0508/article/details/125834496)


### 参考文章
[javadoop](https://javadoop.com/post/spring-aop-source)
[简书](https://www.jianshu.com/p/e09ff92dfa8d)
[Spring AOP 最全源码详解之AOP元数据解析](https://blog.csdn.net/wuyuwei/article/details/88319018)
[Spring AOP 最全源码详解之创建代理对象](https://blog.csdn.net/wuyuwei/article/details/88357698)