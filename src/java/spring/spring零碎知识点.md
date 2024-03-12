---
title: spring零碎知识点
isTimeLine: true
date: 2024-03-07
category:
  - java
tag:
  - spring
---

### 推断构造方法

* 有无参构造方法则用无参构造方法
* 没有无参构造方法
  * 存在多个构造方法->异常
  * 存在一个->Spring查找参数中的对象是否存在(byType,byName)->不存在则异常


### BeanNameAware, BeanFactoryAware, ApplicationContextAware

|实现接口|作用|
|:-:|:-:|
|BeanNameAware|重写setBeanName方法|
|BeanFactoryAware|重写setBeanFactory获取beanFactory|
|ApplicationContextAware|重写setApplicationContext获取applicationContext|
