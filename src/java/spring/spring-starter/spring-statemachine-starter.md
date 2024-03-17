---
title: spring整合spring-statemachine
isTimeLine: true
date: 2024-03-17
category:
  - java
tag:
  - spring
  - statemachine
---

## 整合spring


![statemachine整合spring](/assets/images/java/spring/spring-starter/statemachine利用spring装载.png =800x)



AbstractImportingAnnotationConfiguration实现了ImportBeanDefinitionRegistrar接口，重写registerBeanDefinitions方法，往spring容器中放入了StateMachineDelegatingFactoryBean类，且构造函数的方法如下：
```java
builder = new StateMachineConfigBuilder<S, E>();

beanDefinitionBuilder.addConstructorArgValue(builder);
beanDefinitionBuilder.addConstructorArgValue(StateMachine.class);
beanDefinitionBuilder.addConstructorArgValue(importingClassMetadata.getClassName());
beanDefinitionBuilder.addConstructorArgValue(contextEvents);
```

```java
public abstract class AbstractImportingAnnotationConfiguration<B extends AnnotationBuilder<O>, O> implements
		ImportBeanDefinitionRegistrar, BeanFactoryAware, EnvironmentAware {
  
  
  @Override
	public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
		List<Class<? extends Annotation>> annotationTypes = getAnnotations();
		Class<? extends Annotation> namedAnnotation = null;
		String[] names = null;
		ScopedProxyMode proxyMode = null;
		if (annotationTypes != null) {
			for (Class<? extends Annotation> annotationType : annotationTypes) {
				AnnotationAttributes attributes = AnnotationAttributes.fromMap(importingClassMetadata.getAnnotationAttributes(
						annotationType.getName(), false));
				if (attributes != null && attributes.containsKey("name")) {
					names = attributes.getStringArray("name");
					namedAnnotation = annotationType;
					break;
				}
			}
		}

		// check if Scope annotation is defined and get proxyMode from it
		AnnotationAttributes scopeAttributes = AnnotationAttributes.fromMap(importingClassMetadata.getAnnotationAttributes(
				Scope.class.getName(), false));
		if (scopeAttributes != null) {
			proxyMode = scopeAttributes.getEnum("proxyMode");
		}

		BeanDefinition beanDefinition;
		try {
			beanDefinition = buildBeanDefinition(importingClassMetadata, namedAnnotation);
		} catch (Exception e) {
			throw new RuntimeException("Error with onConfigurers", e);
		}

		// implementation didn't return definition so don't continue registration
		if (beanDefinition == null) {
			return;
		}

		if (ObjectUtils.isEmpty(names)) {
			// ok, name(s) not given, generate one
			names = new String[] { beanNameGenerator.generateBeanName(beanDefinition, registry) };
		}

		registry.registerBeanDefinition(names[0], beanDefinition);
		if (names.length > 1) {
			for (int i = 1; i < names.length; i++) {
				registry.registerAlias(names[0], names[i]);
			}
		}

		// wrap in scoped proxy if needed
		if (proxyMode != null && proxyMode != ScopedProxyMode.DEFAULT && proxyMode != ScopedProxyMode.NO) {
			BeanDefinitionHolder definitionHolder = new BeanDefinitionHolder(beanDefinition, names[0]);
			BeanDefinitionHolder scopedProxy = null;
			if (proxyMode == ScopedProxyMode.TARGET_CLASS) {
				scopedProxy = ScopedProxyUtils.createScopedProxy(definitionHolder, registry, true);
			} else if (proxyMode == ScopedProxyMode.INTERFACES) {
				scopedProxy = ScopedProxyUtils.createScopedProxy(definitionHolder, registry, false);
			} else {
				throw new IllegalArgumentException("Unknown proxyMode " + proxyMode);
			}
			BeanDefinitionReaderUtils.registerBeanDefinition(scopedProxy, registry);
		}
	}
}
```


```java
@Configuration
public class StateMachineConfiguration<S, E> extends
		AbstractImportingAnnotationConfiguration<StateMachineConfigBuilder<S, E>, StateMachineConfig<S, E>> {
  
  @Override
	protected BeanDefinition buildBeanDefinition(AnnotationMetadata importingClassMetadata,
			Class<? extends Annotation> namedAnnotation) throws Exception {

		String enableStateMachineEnclosingClassName = importingClassMetadata.getClassName();
		// for below classloader, see gh122
		Class<?> enableStateMachineEnclosingClass = ClassUtils.forName(enableStateMachineEnclosingClassName,
				ClassUtils.getDefaultClassLoader());
		// return null if it looks like @EnableStateMachine was annotated with class
		// not extending StateMachineConfigurer.
		if (!ClassUtils.isAssignable(StateMachineConfigurer.class, enableStateMachineEnclosingClass)) {
			return null;
		}

		BeanDefinitionBuilder beanDefinitionBuilder = BeanDefinitionBuilder
				.rootBeanDefinition(StateMachineDelegatingFactoryBean.class);
		AnnotationAttributes esmAttributes = AnnotationAttributes.fromMap(importingClassMetadata.getAnnotationAttributes(
				EnableStateMachine.class.getName(), false));
		Boolean contextEvents = esmAttributes.getBoolean("contextEvents");

		// check if Scope annotation is defined and set scope from it
		AnnotationAttributes scopeAttributes = AnnotationAttributes.fromMap(importingClassMetadata.getAnnotationAttributes(
				Scope.class.getName(), false));
		if (scopeAttributes != null) {
			String scope = scopeAttributes.getString("value");
			if (StringUtils.hasText(scope)) {
				beanDefinitionBuilder.setScope(scope);
			}
		}

		beanDefinitionBuilder.addConstructorArgValue(builder);
		beanDefinitionBuilder.addConstructorArgValue(StateMachine.class);
		beanDefinitionBuilder.addConstructorArgValue(importingClassMetadata.getClassName());
		beanDefinitionBuilder.addConstructorArgValue(contextEvents);

		AbstractBeanDefinition beanDefinition = beanDefinitionBuilder.getBeanDefinition();

		// try to add more info about generics
		ResolvableType type = resolveFactoryObjectType(enableStateMachineEnclosingClass);
		if (type != null && beanDefinition instanceof RootBeanDefinition) {
			((RootBeanDefinition)beanDefinition).setTargetType(type);
		}
		return beanDefinition;
	}
}
```

## 生产statemachine


![生产statemachine](/assets/images/java/spring/spring-starter/生产statemachine.png =800x)


BeanDelegatingFactoryBean 实现了InitializingBean

```java
protected abstract static class BeanDelegatingFactoryBean<T, B extends AnnotationBuilder<O>, O> implements
			FactoryBean<T>, BeanFactoryAware, InitializingBean, DisposableBean
```

StateMachineDelegatingFactoryBean 继承BeanDelegatingFactoryBean

```java
private static class StateMachineDelegatingFactoryBean<S, E>
		extends BeanDelegatingFactoryBean<StateMachine<S, E>,StateMachineConfigBuilder<S, E>,StateMachineConfig<S, E>>
		implements SmartLifecycle, BeanNameAware, BeanClassLoaderAware {
  
  @Override
		public void afterPropertiesSet() throws Exception {
			AnnotationConfigurer<StateMachineConfig<S, E>, StateMachineConfigBuilder<S, E>> configurer =
					(AnnotationConfigurer<StateMachineConfig<S, E>, StateMachineConfigBuilder<S, E>>) getBeanFactory()
						.getBean(ClassUtils.forName(clazzName, classLoader));
			getBuilder().apply(configurer);

			StateMachineConfig<S, E> stateMachineConfig = getBuilder().getOrBuild();
			TransitionsData<S, E> stateMachineTransitions = stateMachineConfig.getTransitions();
			StatesData<S, E> stateMachineStates = stateMachineConfig.getStates();
			ConfigurationData<S, E> stateMachineConfigurationConfig = stateMachineConfig.getStateMachineConfigurationConfig();

			ObjectStateMachineFactory<S, E> stateMachineFactory = null;
			if (stateMachineConfig.getModel() != null && stateMachineConfig.getModel().getFactory() != null) {
				stateMachineFactory = new ObjectStateMachineFactory<S, E>(
						new DefaultStateMachineModel<S, E>(stateMachineConfigurationConfig, null, null),
						stateMachineConfig.getModel().getFactory());
			} else {
				stateMachineFactory = new ObjectStateMachineFactory<S, E>(new DefaultStateMachineModel<S, E>(
						stateMachineConfigurationConfig, stateMachineStates, stateMachineTransitions), null);
			}

			stateMachineFactory.setBeanFactory(getBeanFactory());
			stateMachineFactory.setContextEventsEnabled(contextEvents);
			stateMachineFactory.setBeanName(beanName);
			stateMachineFactory.setHandleAutostartup(stateMachineConfigurationConfig.isAutoStart());
			if (stateMachineMonitor != null) {
				stateMachineFactory.setStateMachineMonitor(stateMachineMonitor);
			}
			StateMachine<S, E> stateMachine = stateMachineFactory.getStateMachine();
			this.lifecycle = (SmartLifecycle) stateMachine;
			this.disposableBean = (DisposableBean) stateMachine;
			setObject(stateMachine);
		}
}
```


