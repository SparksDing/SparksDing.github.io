---
title: spring整合feign
isTimeLine: true
date: 2024-03-17
category:
  - java
tag:
  - spring
  - feign
  - rpc
---


EnableFeignClients注解引入了FeignClientsRegistrar.class
```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Documented
@Import(FeignClientsRegistrar.class)
public @interface EnableFeignClients
```

FeignClientsRegistrar实现了ImportBeanDefinitionRegistrar接口，重写registerBeanDefinitions方法往beanDefinitionsMap中增加Feign框架中所需要的beanDefinition

```java
class FeignClientsRegistrar
		implements ImportBeanDefinitionRegistrar, ResourceLoaderAware, EnvironmentAware {

  @Override
	public void registerBeanDefinitions(AnnotationMetadata metadata,
			BeanDefinitionRegistry registry) {
		registerDefaultConfiguration(metadata, registry);
		registerFeignClients(metadata, registry);
	}

}
```

如果basePackages目录下有FeignClient注解的类，调用registerFeignClient

```java
private void registerFeignClient(BeanDefinitionRegistry registry,
			AnnotationMetadata annotationMetadata, Map<String, Object> attributes) {
  String className = annotationMetadata.getClassName();
  Class clazz = ClassUtils.resolveClassName(className, null);
  ConfigurableBeanFactory beanFactory = registry instanceof ConfigurableBeanFactory
      ? (ConfigurableBeanFactory) registry : null;
  String contextId = getContextId(beanFactory, attributes);
  String name = getName(attributes);
  FeignClientFactoryBean factoryBean = new FeignClientFactoryBean();
  factoryBean.setBeanFactory(beanFactory);
  factoryBean.setName(name);
  factoryBean.setContextId(contextId);
  factoryBean.setType(clazz);
  BeanDefinitionBuilder definition = BeanDefinitionBuilder
      .genericBeanDefinition(clazz, () -> {
        factoryBean.setUrl(getUrl(beanFactory, attributes));
        factoryBean.setPath(getPath(beanFactory, attributes));
        factoryBean.setDecode404(Boolean
            .parseBoolean(String.valueOf(attributes.get("decode404"))));
        Object fallback = attributes.get("fallback");
        if (fallback != null) {
          factoryBean.setFallback(fallback instanceof Class
              ? (Class<?>) fallback
              : ClassUtils.resolveClassName(fallback.toString(), null));
        }
        Object fallbackFactory = attributes.get("fallbackFactory");
        if (fallbackFactory != null) {
          factoryBean.setFallbackFactory(fallbackFactory instanceof Class
              ? (Class<?>) fallbackFactory
              : ClassUtils.resolveClassName(fallbackFactory.toString(),
                  null));
        }
        return factoryBean.getObject();
      });
  definition.setAutowireMode(AbstractBeanDefinition.AUTOWIRE_BY_TYPE);
  definition.setLazyInit(true);
  validate(attributes);

  String alias = contextId + "FeignClient";
  AbstractBeanDefinition beanDefinition = definition.getBeanDefinition();
  beanDefinition.setAttribute(FactoryBean.OBJECT_TYPE_ATTRIBUTE, className);
  beanDefinition.setAttribute("feignClientsRegistrarFactoryBean", factoryBean);

  // has a default, won't be null
  boolean primary = (Boolean) attributes.get("primary");

  beanDefinition.setPrimary(primary);

  String qualifier = getQualifier(attributes);
  if (StringUtils.hasText(qualifier)) {
    alias = qualifier;
  }

  BeanDefinitionHolder holder = new BeanDefinitionHolder(beanDefinition, className,
      new String[] { alias });
  BeanDefinitionReaderUtils.registerBeanDefinition(holder, registry);
}
```


FeignClientFactoryBean

```java
public class FeignClientFactoryBean implements FactoryBean<Object>, InitializingBean,
		ApplicationContextAware, BeanFactoryAware {

  @Override
	public Object getObject() {
		return getTarget();
	}

	/**
	 * @param <T> the target type of the Feign client
	 * @return a {@link Feign} client created with the specified data and the context
	 * information
	 */
	<T> T getTarget() {
		FeignContext context = beanFactory != null
				? beanFactory.getBean(FeignContext.class)
				: applicationContext.getBean(FeignContext.class);
		Feign.Builder builder = feign(context);

		if (!StringUtils.hasText(url)) {
			if (!name.startsWith("http")) {
				url = "http://" + name;
			}
			else {
				url = name;
			}
			url += cleanPath();
			return (T) loadBalance(builder, context,
					new HardCodedTarget<>(type, name, url));
		}
		if (StringUtils.hasText(url) && !url.startsWith("http")) {
			url = "http://" + url;
		}
		String url = this.url + cleanPath();
		Client client = getOptional(context, Client.class);
		if (client != null) {
			if (client instanceof LoadBalancerFeignClient) {
				// not load balancing because we have a url,
				// but ribbon is on the classpath, so unwrap
				client = ((LoadBalancerFeignClient) client).getDelegate();
			}
			if (client instanceof FeignBlockingLoadBalancerClient) {
				// not load balancing because we have a url,
				// but Spring Cloud LoadBalancer is on the classpath, so unwrap
				client = ((FeignBlockingLoadBalancerClient) client).getDelegate();
			}
			builder.client(client);
		}
		Targeter targeter = get(context, Targeter.class);
		return (T) targeter.target(this, builder, context,
				new HardCodedTarget<>(type, name, url));
	}


}
```

默认注入LoadBalancerFeignClient


```java
@Configuration(proxyBeanMethods = false)
class DefaultFeignLoadBalancedConfiguration {

	@Bean
	@ConditionalOnMissingBean
	public Client feignClient(CachingSpringLoadBalancerFactory cachingFactory,
			SpringClientFactory clientFactory) {
		return new LoadBalancerFeignClient(new Client.Default(null, null), cachingFactory,
				clientFactory);
	}

}
```



### 参考文章


[feign代理类创建流程](https://blog.csdn.net/weixin_46053046/article/details/116859619)

[feign代理类handler执行流程](https://blog.csdn.net/RenshenLi/article/details/122792618)

[微服务学习之Consul与Feign](https://blog.csdn.net/qq_36628536/article/details/113753925)