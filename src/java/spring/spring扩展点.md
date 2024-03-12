---
title: spring扩展点
isTimeLine: true
date: 2024-03-07
category:
  - java
tag:
  - spring
---

### Bean生命周期
![image](/assets/images/java/spring/spring_bean_life.png =600x)




---

### Bean创建过程扩展点

|方法|Log|
|--|--|
|Constructor| Cat constructor run...|
|BeanPostProcessor.postProcessBeforeInitialization| Cat postProcessBeforeInitialization run...|
|@PostConstruct| Cat PostConstruct run...|
|InitializingBean.afterPropertiesSet| Cat afterPropertiesSet run...|
|BeanPostProcessor.postProcessAfterInitialization| Cat postProcessAfterInitialization run...|


### BeanNameAware, BeanFactoryAware, ApplicationContextAware, InitializingBean, BeanPostProcessor

|实现接口|作用|
|:-:|:-:|
|BeanNameAware|实现setBeanName方法|
|BeanFactoryAware|实现setBeanFactory获取beanFactory|
|ApplicationContextAware|实现setApplicationContext获取applicationContext|
|InitializingBean|实现afterPropertiesSet接口|
|BeanPostProcessor|实现postProcessBeforeInitialization, postProcessAfterInitialization|

### BeanDefinitionRegistryPostProcessor, BeanFactoryPostProcessor

|实现接口|作用|
|:-:|:-:|
|BeanFactoryPostProcessor|实现postProcessBeanFactory方法|
|BeanDefinitionRegistryPostProcessor|实现postProcessBeanDefinitionRegistry方法|


### ImportBeanDefinitionRegistrar
|实现接口|作用|
|:-:|:-:|
|ImportBeanDefinitionRegistrar|实现registerBeanDefinitions方法|



### **循环依赖**
```java
@Component
public class AService {

  @Autowired
  private BService bService;

  public void test() {
    System.out.println(bService);
  }

}

@Component
public class BService {

  @Autowired
  private AService aService;

  public void test() {
    System.out.println(aService);
  }
  
}
```

#### **AService的Bean的生命周期**
1. 实例化-->AService普通对象
2. 填充BService-->单例池Map-->创建BService
   BService的Bean的生命周期
   1. 实例化-->普通对象
   2. 填充aService-->单例池Map-->AService普通对象
   3. 填充其他属性
   4. 做其他事情(AOP)
   5. 添加到单例池
3. 填充其他属性
4. 做其他事情(AOP)-->AService的代理对象
5. 添加到单例池

上述2.2步骤中，填充aService时单例池Map里没有aService，那么又需要创建aService，而aService正在创建过程中，这样则会出现问题。

#### **打破循环依赖**

**三级缓存**
第一级: singletonObjects ------ 单例
第二级缓存: earlySingletonObjects ------ 提前产生的代理对象，也保证单例
第三级缓存: singletonFactories ------ 打破循环

---

1. 实例化-->AService普通对象-->earlySingletonObjects.put("AService", AService普通对象)
2. 填充BService-->单例池Map-->创建BService
   BService的Bean的生命周期
   1. 实例化-->普通对象
   2. 填充aService-->单例池Map-不存在->earlySingletonObjects-->AService普通对象
   3. 填充其他属性
   4. 做其他事情(AOP)
   5. 添加到单例池
3. 填充其他属性
4. 做其他事情(AOP)-->AService的代理对象
5. 添加到单例池

以上步骤存在问题，2.2中得到的是AService普通对象，而4中生成的又是AService的代理对象，冲突。

---

**循环依赖: 提前AOP**


1. creatingSet<'AService'>
2. 实例化-->AService普通对象-->singletonFactories.put("AService", () -> getEarlyBeanReference(beanName, mbd, AService普通对象))
3. 填充BService-->单例池Map-->创建BService
   BService的Bean的生命周期
   1. 实例化-->普通对象
   2. 填充aService-->单例池Map-不存在->creatingSet-->出现循环依赖-->earlySingletonObjects-->singletonFactories-->AOP-->AService代理对象-->earlySingletonObjects
   3. 填充其他属性
   4. 做其他事情(AOP)
   5. 添加到单例池
4. 填充其他属性
5. 做其他事情(AOP)-->AService的代理对象
6. 添加到单例池
7. creatingSet.remove<'AService'>

2.2步骤中AService代理对象还没有填充属性，因此不能添加到单例池

**earlySingletonObjects用于保证单例**
* 3.2步骤发现出现循环依赖后会创建AService代理对象，此时如果有CService也依赖AService，也进行到这一步骤，那么也会创建AService代理对象，则单例无法保证。


```java
boolean earlySingletonExposure = (mbd.isSingleton() && this.allowCircularReferences &&
				isSingletonCurrentlyInCreation(beanName));
if (earlySingletonExposure) {
  if (logger.isTraceEnabled()) {
    logger.trace("Eagerly caching bean '" + beanName +
        "' to allow for resolving potential circular references");
  }
  addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
}

protected Object getEarlyBeanReference(String beanName, RootBeanDefinition mbd, Object bean) {
  Object exposedObject = bean;
  if (!mbd.isSynthetic() && hasInstantiationAwareBeanPostProcessors()) {
    for (BeanPostProcessor bp : getBeanPostProcessors()) {
      if (bp instanceof SmartInstantiationAwareBeanPostProcessor) {
        SmartInstantiationAwareBeanPostProcessor ibp = (SmartInstantiationAwareBeanPostProcessor) bp;
        exposedObject = ibp.getEarlyBeanReference(exposedObject, beanName);
      }
    }
  }
  return exposedObject;
}
```