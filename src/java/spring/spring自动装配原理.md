---
title: spring自动装配原理
isTimeLine: true
date: 2024-03-12
category:
  - java
tag:
  - spring
---


### invokeBeanFactoryPostProcessors
1.获取所有硬编码的BeanDefinitionRegistryPostProcessor，调用postProcessBeanDefinitionRegistry方法
2.获取所有配置的BeanDefinitionRegistryPostProcessor，调用postProcessBeanDefinitionRegistry方法


### ConfigurationClassPostProcessor
```
1. processConfigBeanDefinitions
    1.1 checkConfigurationClassCandidate
        1.1.1 isConfigurationCandidate
    1.2 parser.parse(candidates);
        1.2.1 处理 @Component 注解
        1.2.2 处理 @PropertySource 注解
        1.2.3 处理 @ComponentScan、@ComponentScans 注解
        1.2.4 处理 @Import、ImportSelector、ImportBeanDefinitionRegistrar
        1.2.5 处理 @ImportResource 注解
        1.2.6 处理 @Bean修饰的方法
        1.2.7 处理接口默认方法
        1.2.8 处理父类
    1.3 parser.validate();
    1.4 this.reader.loadBeanDefinitions(configClasses);
        1.4.1 registerBeanDefinitionForImportedConfigurationClass
        1.4.2 loadBeanDefinitionsForBeanMethod
        1.4.3 loadBeanDefinitionsFromImportedResources
        1.4.4 loadBeanDefinitionsFromRegistrars
```


### @Import

1.2.4 处理@Import注解: processImports(configClass, sourceClass, getImports(sourceClass), filter, true); 其中会调用selectImports方法

AutoConfigurationImportSelector的selectImports方法从spring.factories中读取starter需要的类。

其中某些特殊的类可以扫描@SpringApplication主类所在目录下所有的package，将包含注解的类加入spring容器中。