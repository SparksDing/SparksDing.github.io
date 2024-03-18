---
title: feign整合ribbon和consul源码分析
isTimeLine: true
date: 2024-03-17
category:
  - java
tag:
  - spring
  - consul
  - ribbon
  - feign
---

## Ribbon中重要的自动注入的类

FeignRibbonClientAutoConfiguration

```java
@ConditionalOnClass({ ILoadBalancer.class, Feign.class })
@ConditionalOnProperty(value = "spring.cloud.loadbalancer.ribbon.enabled",
		matchIfMissing = true)
@Configuration(proxyBeanMethods = false)
@AutoConfigureBefore(FeignAutoConfiguration.class)
@EnableConfigurationProperties({ FeignHttpClientProperties.class })
// Order is important here, last should be the default, first should be optional
// see
// https://github.com/spring-cloud/spring-cloud-netflix/issues/2086#issuecomment-316281653
@Import({ HttpClientFeignLoadBalancedConfiguration.class,
		OkHttpFeignLoadBalancedConfiguration.class,
		DefaultFeignLoadBalancedConfiguration.class })
public class FeignRibbonClientAutoConfiguration {

	@Bean
	@Primary
	@ConditionalOnMissingBean
	@ConditionalOnMissingClass("org.springframework.retry.support.RetryTemplate")
	public CachingSpringLoadBalancerFactory cachingLBClientFactory(
			SpringClientFactory factory) {
		return new CachingSpringLoadBalancerFactory(factory);
	}

	@Bean
	@Primary
	@ConditionalOnMissingBean
	@ConditionalOnClass(name = "org.springframework.retry.support.RetryTemplate")
	public CachingSpringLoadBalancerFactory retryabeCachingLBClientFactory(
			SpringClientFactory factory, LoadBalancedRetryFactory retryFactory) {
		return new CachingSpringLoadBalancerFactory(factory, retryFactory);
	}

	@Bean
	@ConditionalOnMissingBean
	public Request.Options feignRequestOptions() {
		return LoadBalancerFeignClient.DEFAULT_OPTIONS;
	}

}
```

RibbonAutoConfiguration###SpringClientFactory

```java
@Configuration
@Conditional(RibbonAutoConfiguration.RibbonClassesConditions.class)
@RibbonClients
@AutoConfigureAfter(
		name = "org.springframework.cloud.netflix.eureka.EurekaClientAutoConfiguration")
@AutoConfigureBefore({ LoadBalancerAutoConfiguration.class,
		AsyncLoadBalancerAutoConfiguration.class })
@EnableConfigurationProperties({ RibbonEagerLoadProperties.class,
		ServerIntrospectorProperties.class })
public class RibbonAutoConfiguration {

  @Bean
	@ConditionalOnMissingBean
	public SpringClientFactory springClientFactory() {
		SpringClientFactory factory = new SpringClientFactory();
		factory.setConfigurations(this.configurations);
		return factory;
	}
}

```

LoadBalancerAutoConfiguration###LoadBalancedRetryFactory

```java
@Configuration(proxyBeanMethods = false)
@ConditionalOnClass(RestTemplate.class)
@ConditionalOnBean(LoadBalancerClient.class)
@EnableConfigurationProperties(LoadBalancerRetryProperties.class)
public class LoadBalancerAutoConfiguration {

  @Configuration(proxyBeanMethods = false)
	@ConditionalOnClass(RetryTemplate.class)
	public static class RetryAutoConfiguration {

		@Bean
		@ConditionalOnMissingBean
		public LoadBalancedRetryFactory loadBalancedRetryFactory() {
			return new LoadBalancedRetryFactory() {
			};
		}

	}

}
```


RibbonClientConfiguration###ZoneAwareLoadBalancer

```java
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties
// Order is important here, last should be the default, first should be optional
// see
// https://github.com/spring-cloud/spring-cloud-netflix/issues/2086#issuecomment-316281653
@Import({ HttpClientConfiguration.class, OkHttpRibbonConfiguration.class,
		RestClientRibbonConfiguration.class, HttpClientRibbonConfiguration.class })
public class RibbonClientConfiguration {
  @Bean
	@ConditionalOnMissingBean
	public ILoadBalancer ribbonLoadBalancer(IClientConfig config,
			ServerList<Server> serverList, ServerListFilter<Server> serverListFilter,
			IRule rule, IPing ping, ServerListUpdater serverListUpdater) {
		if (this.propertiesFactory.isSet(ILoadBalancer.class, name)) {
			return this.propertiesFactory.get(ILoadBalancer.class, config, name);
		}
		return new ZoneAwareLoadBalancer<>(config, rule, ping, serverList,
				serverListFilter, serverListUpdater);
	}
}
```

## Ribbon和Consul的配合

```java
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties
@ConditionalOnConsulEnabled
@ConditionalOnBean(SpringClientFactory.class)
@ConditionalOnProperty(value = "spring.cloud.consul.ribbon.enabled",
        matchIfMissing = true)
@AutoConfigureAfter(RibbonAutoConfiguration.class)
@RibbonClients(defaultConfiguration = ConsulRibbonClientConfiguration.class)
public class RibbonConsulAutoConfiguration {

}
```

ribbonServerList中通过consulClient找到提供服务的实例列表

```java
@Configuration(proxyBeanMethods = false)
public class ConsulRibbonClientConfiguration {

	protected static final String VALUE_NOT_SET = "__not__set__";

	protected static final String DEFAULT_NAMESPACE = "ribbon";

	@Autowired
	private ConsulClient client;

	@Value("${ribbon.client.name}")
	private String serviceId = "client";

	public ConsulRibbonClientConfiguration() {
	}

	public ConsulRibbonClientConfiguration(String serviceId) {
		this.serviceId = serviceId;
	}

	@Bean
	@ConditionalOnMissingBean
	public ServerList<?> ribbonServerList(IClientConfig config,
			ConsulDiscoveryProperties properties) {
		ConsulServerList serverList = new ConsulServerList(this.client, properties);
		serverList.initWithNiwsConfig(config);
		return serverList;
	}
}
```


## Consul自动配置

```java
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties
@ConditionalOnConsulEnabled
public class ConsulAutoConfiguration {

	@Bean
	@ConditionalOnMissingBean
	public ConsulProperties consulProperties() {
		return new ConsulProperties();
	}

	@Bean
	@ConditionalOnMissingBean
	public ConsulClient consulClient(ConsulProperties consulProperties) {
		final int agentPort = consulProperties.getPort();
		final String agentHost = !StringUtils.isEmpty(consulProperties.getScheme())
				? consulProperties.getScheme() + "://" + consulProperties.getHost()
				: consulProperties.getHost();

		if (consulProperties.getTls() != null) {
			ConsulProperties.TLSConfig tls = consulProperties.getTls();
			TLSConfig tlsConfig = new TLSConfig(tls.getKeyStoreInstanceType(),
					tls.getCertificatePath(), tls.getCertificatePassword(),
					tls.getKeyStorePath(), tls.getKeyStorePassword());
			return new ConsulClient(agentHost, agentPort, tlsConfig);
		}
		return new ConsulClient(agentHost, agentPort);
	}

}
```

### 参考文章

[Spring Cloud NamedContextFactory 原理分析](https://blog.csdn.net/qq_39363204/article/details/124316687)

[consul和ribbon集成的原理](https://www.jianshu.com/p/129cafb6f04a)