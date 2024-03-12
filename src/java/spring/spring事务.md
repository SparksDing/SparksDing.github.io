---
title: spring事务
isTimeLine: true
date: 2024-03-10
category:
  - java
tag:
  - spring transaction
---

### **spring事务**

> 经典的用编程式AOP的样例

```java
@Configuration(proxyBeanMethods = false)
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
public class ProxyTransactionManagementConfiguration extends AbstractTransactionManagementConfiguration {

	@Bean(name = TransactionManagementConfigUtils.TRANSACTION_ADVISOR_BEAN_NAME)
	@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
	public BeanFactoryTransactionAttributeSourceAdvisor transactionAdvisor(
			TransactionAttributeSource transactionAttributeSource, TransactionInterceptor transactionInterceptor) {

		BeanFactoryTransactionAttributeSourceAdvisor advisor = new BeanFactoryTransactionAttributeSourceAdvisor();
		advisor.setTransactionAttributeSource(transactionAttributeSource);
		advisor.setAdvice(transactionInterceptor);
		if (this.enableTx != null) {
			advisor.setOrder(this.enableTx.<Integer>getNumber("order"));
		}
		return advisor;
	}

	@Bean
	@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
	public TransactionAttributeSource transactionAttributeSource() {
		return new AnnotationTransactionAttributeSource();
	}

	@Bean
	@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
	public TransactionInterceptor transactionInterceptor(TransactionAttributeSource transactionAttributeSource) {
		TransactionInterceptor interceptor = new TransactionInterceptor();
		interceptor.setTransactionAttributeSource(transactionAttributeSource);
		if (this.txManager != null) {
			interceptor.setTransactionManager(this.txManager);
		}
		return interceptor;
	}

}
```

打开@EnableTransactionManagement后
```java
public static List<Advisor> findAdvisorsThatCanApply(List<Advisor> candidateAdvisors, Class<?> clazz) {
  if (candidateAdvisors.isEmpty()) {
    return candidateAdvisors;
  }
  List<Advisor> eligibleAdvisors = new ArrayList<>();
  for (Advisor candidate : candidateAdvisors) {
    if (candidate instanceof IntroductionAdvisor && canApply(candidate, clazz)) {
      eligibleAdvisors.add(candidate);
    }
  }
  boolean hasIntroductions = !eligibleAdvisors.isEmpty();
  for (Advisor candidate : candidateAdvisors) {
    if (candidate instanceof IntroductionAdvisor) {
      // already processed
      continue;
    }
    if (canApply(candidate, clazz, hasIntroductions)) {
      eligibleAdvisors.add(candidate);
    }
  }
  return eligibleAdvisors;
}
```

candidateAdvisors中会包含
![candidateAdvisors](/assets/images/java/spring/candidateAdvisors事务.png =700x)


AOP 会用动态代理的方式将这些切面逻辑织入。
```java
@Override
@Nullable
public Object invoke(MethodInvocation invocation) throws Throwable {
  // Work out the target class: may be {@code null}.
  // The TransactionAttributeSource should be passed the target class
  // as well as the method, which may be from an interface.
  Class<?> targetClass = (invocation.getThis() != null ? AopUtils.getTargetClass(invocation.getThis()) : null);

  // Adapt to TransactionAspectSupport's invokeWithinTransaction...
  return invokeWithinTransaction(invocation.getMethod(), targetClass, invocation::proceed);
}

@Nullable
	protected Object invokeWithinTransaction(Method method, @Nullable Class<?> targetClass,
			final InvocationCallback invocation) throws Throwable {

		// If the transaction attribute is null, the method is non-transactional.
		TransactionAttributeSource tas = getTransactionAttributeSource();
		final TransactionAttribute txAttr = (tas != null ? tas.getTransactionAttribute(method, targetClass) : null);
		final TransactionManager tm = determineTransactionManager(txAttr);

		if (this.reactiveAdapterRegistry != null && tm instanceof ReactiveTransactionManager) {
			ReactiveTransactionSupport txSupport = this.transactionSupportCache.computeIfAbsent(method, key -> {
				if (KotlinDetector.isKotlinType(method.getDeclaringClass()) && KotlinDelegate.isSuspend(method)) {
					throw new TransactionUsageException(
							"Unsupported annotated transaction on suspending function detected: " + method +
							". Use TransactionalOperator.transactional extensions instead.");
				}
				ReactiveAdapter adapter = this.reactiveAdapterRegistry.getAdapter(method.getReturnType());
				if (adapter == null) {
					throw new IllegalStateException("Cannot apply reactive transaction to non-reactive return type: " +
							method.getReturnType());
				}
				return new ReactiveTransactionSupport(adapter);
			});
			return txSupport.invokeWithinTransaction(
					method, targetClass, invocation, txAttr, (ReactiveTransactionManager) tm);
		}

		PlatformTransactionManager ptm = asPlatformTransactionManager(tm);
		final String joinpointIdentification = methodIdentification(method, targetClass, txAttr);

		if (txAttr == null || !(ptm instanceof CallbackPreferringPlatformTransactionManager)) {
			// Standard transaction demarcation with getTransaction and commit/rollback calls.
			TransactionInfo txInfo = createTransactionIfNecessary(ptm, txAttr, joinpointIdentification);

			Object retVal;
			try {
				// This is an around advice: Invoke the next interceptor in the chain.
				// This will normally result in a target object being invoked.
				retVal = invocation.proceedWithInvocation();
			}
			catch (Throwable ex) {
				// target invocation exception
				completeTransactionAfterThrowing(txInfo, ex);
				throw ex;
			}
			finally {
				cleanupTransactionInfo(txInfo);
			}

			if (retVal != null && vavrPresent && VavrDelegate.isVavrTry(retVal)) {
				// Set rollback-only in case of Vavr failure matching our rollback rules...
				TransactionStatus status = txInfo.getTransactionStatus();
				if (status != null && txAttr != null) {
					retVal = VavrDelegate.evaluateTryFailure(retVal, txAttr, status);
				}
			}

			commitTransactionAfterReturning(txInfo);
			return retVal;
		}

		else {
			Object result;
			final ThrowableHolder throwableHolder = new ThrowableHolder();

			// It's a CallbackPreferringPlatformTransactionManager: pass a TransactionCallback in.
			try {
				result = ((CallbackPreferringPlatformTransactionManager) ptm).execute(txAttr, status -> {
					TransactionInfo txInfo = prepareTransactionInfo(ptm, txAttr, joinpointIdentification, status);
					try {
						Object retVal = invocation.proceedWithInvocation();
						if (retVal != null && vavrPresent && VavrDelegate.isVavrTry(retVal)) {
							// Set rollback-only in case of Vavr failure matching our rollback rules...
							retVal = VavrDelegate.evaluateTryFailure(retVal, txAttr, status);
						}
						return retVal;
					}
					catch (Throwable ex) {
						if (txAttr.rollbackOn(ex)) {
							// A RuntimeException: will lead to a rollback.
							if (ex instanceof RuntimeException) {
								throw (RuntimeException) ex;
							}
							else {
								throw new ThrowableHolderException(ex);
							}
						}
						else {
							// A normal return value: will lead to a commit.
							throwableHolder.throwable = ex;
							return null;
						}
					}
					finally {
						cleanupTransactionInfo(txInfo);
					}
				});
			}
			catch (ThrowableHolderException ex) {
				throw ex.getCause();
			}
			catch (TransactionSystemException ex2) {
				if (throwableHolder.throwable != null) {
					logger.error("Application exception overridden by commit exception", throwableHolder.throwable);
					ex2.initApplicationException(throwableHolder.throwable);
				}
				throw ex2;
			}
			catch (Throwable ex2) {
				if (throwableHolder.throwable != null) {
					logger.error("Application exception overridden by commit exception", throwableHolder.throwable);
				}
				throw ex2;
			}

			// Check result state: It might indicate a Throwable to rethrow.
			if (throwableHolder.throwable != null) {
				throw throwableHolder.throwable;
			}
			return result;
		}
	}
```

不管是编程式事务，还是声明式事务，最终源码都是调用事务管理器的PlatformTransactionManager接口的3个方法:
1. getTransaction
2. commit
3. rollback

```java
@Override
public final TransactionStatus getTransaction(@Nullable TransactionDefinition definition)
    throws TransactionException {

  // Use defaults if no transaction definition given.
  TransactionDefinition def = (definition != null ? definition : TransactionDefinition.withDefaults());

  Object transaction = doGetTransaction();
  boolean debugEnabled = logger.isDebugEnabled();

  if (isExistingTransaction(transaction)) {
    // Existing transaction found -> check propagation behavior to find out how to behave.
    return handleExistingTransaction(def, transaction, debugEnabled);
  }

  // Check definition settings for new transaction.
  if (def.getTimeout() < TransactionDefinition.TIMEOUT_DEFAULT) {
    throw new InvalidTimeoutException("Invalid transaction timeout", def.getTimeout());
  }

  // No existing transaction found -> check propagation behavior to find out how to proceed.
  if (def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_MANDATORY) {
    throw new IllegalTransactionStateException(
        "No existing transaction found for transaction marked with propagation 'mandatory'");
  }
  else if (def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_REQUIRED ||
      def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_REQUIRES_NEW ||
      def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_NESTED) {
    SuspendedResourcesHolder suspendedResources = suspend(null);
    if (debugEnabled) {
      logger.debug("Creating new transaction with name [" + def.getName() + "]: " + def);
    }
    try {
      return startTransaction(def, transaction, debugEnabled, suspendedResources);
    }
    catch (RuntimeException | Error ex) {
      resume(null, suspendedResources);
      throw ex;
    }
  }
  else {
    // Create "empty" transaction: no actual transaction, but potentially synchronization.
    if (def.getIsolationLevel() != TransactionDefinition.ISOLATION_DEFAULT && logger.isWarnEnabled()) {
      logger.warn("Custom isolation level specified but no actual transaction initiated; " +
          "isolation level will effectively be ignored: " + def);
    }
    boolean newSynchronization = (getTransactionSynchronization() == SYNCHRONIZATION_ALWAYS);
    return prepareTransactionStatus(def, null, true, newSynchronization, debugEnabled, null);
  }
}
```

当前不存在事务，传播机制=REQUIRED/REQUIRED_NEW/NESTED,这三种情况，需要新开启事务，且加上事务同步
```java
private TransactionStatus startTransaction(TransactionDefinition definition, Object transaction,
			boolean debugEnabled, @Nullable SuspendedResourcesHolder suspendedResources) {

  boolean newSynchronization = (getTransactionSynchronization() != SYNCHRONIZATION_NEVER);
  DefaultTransactionStatus status = newTransactionStatus(
      definition, transaction, true, newSynchronization, debugEnabled, suspendedResources);
  doBegin(transaction, definition);
  prepareSynchronization(status, definition);
  return status;
}
```




### **事务传播机制**

![https://www.cnblogs.com/vipstone/p/16735893.html](/assets/images/java/spring/事务传播机制.png =700x)

### **参考文章**
[cnblogs](https://www.cnblogs.com/dennyzhangdd/p/9602673.html)