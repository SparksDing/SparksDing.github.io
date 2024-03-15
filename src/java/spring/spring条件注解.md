---
title: spring条件注解
isTimeLine: true
date: 2024-03-12
category:
  - java
tag:
  - spring
---

### **总结**

|条件注解|作用|
|:-:|:-:|
|ConditionalOnBean|是否存在某个类或某个名字的Bean|
|ConditionalOnMissingBean|是否缺失某个类或某个名字的Bean|
|ConditionalOnSingleCandidate|是否符合指定类型的Bean只有一个|
|ConditionalOnClass|是否存在某个类|
|ConditionalOnMissingClass|是否不存在某个类|
|ConditionalOnExpression|指定的表达式返回是true或者false|
|ConditionalOnJava|判断Java版本|
|ConditionalOnJndi|JNDI指定的资源是否存在|
|ConditionalOnWebApplication|当前应用是web应用|
|ConditionalOnNotWebApplication|当前应用不是web应用|
|ConditionalOnProperty|Environment中是否存在某个属性|
|ConditionalOnResource|是否存在指定资源|
|ConditionalOnWarDeployment|是否以war包方式部署运行|
|ConditionalOnCloudPlatform|是否在某个云平台上|


#### AnyNestedCondition
用法
```java
static class PooledDataSourceCondition extends AnyNestedCondition {

  PooledDataSourceCondition() {
    super(ConfigurationPhase.PARSE_CONFIGURATION);
  }

  @ConditionalOnProperty(prefix = "spring.datasource", name = "type")
  static class ExplicitType {

  }

  @Conditional(PooledDataSourceAvailableCondition.class)
  static class PooledDataSourceAvailable {

  }

}
```
原理：会收集AnyNestedCondition的所有内部类的条件，只要有一个条件为真则为真
```java
private Map<AnnotationMetadata, List<Condition>> getMemberConditions(String[] members, ConfigurationPhase phase,
				String className) {
    MultiValueMap<AnnotationMetadata, Condition> memberConditions = new LinkedMultiValueMap<>();
    for (String member : members) {
      AnnotationMetadata metadata = getMetadata(member);
      for (String[] conditionClasses : getConditionClasses(metadata)) {
        for (String conditionClass : conditionClasses) {
          Condition condition = getCondition(conditionClass);
          validateMemberCondition(condition, phase, className);
          memberConditions.add(metadata, condition);
        }
      }
    }
    return Collections.unmodifiableMap(memberConditions);
  }
```


### **一些使用样例**

```java
@ConditionalOnBean(name = "xxx")
@ConditionalOnBean(value = MemberService.class)
```


### **自定义**

自定义一个条件注解

```java
public class DyqCondition implements Condition {

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {

        Map<String, Object> annotationAttributes = metadata.getAnnotationAttributes(DyqConditionOnClass.class.getName());
        String className = (String) annotationAttributes.get("value");

        try {
            context.getClassLoader().loadClass(className);
            return true;
        } catch (ClassNotFoundException e) {
            return false;
        }
    }
}


@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Conditional(DyqCondition.class)
public @interface DyqConditionOnClass {
    String value();
}
```



### 参考文章

[Spring Data之DataSource创建及源码分析](https://blog.csdn.net/f4761/article/details/83536210)