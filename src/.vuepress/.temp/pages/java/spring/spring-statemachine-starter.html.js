export const data = JSON.parse("{\"key\":\"v-89f6ebe2\",\"path\":\"/java/spring/spring-statemachine-starter.html\",\"title\":\"spring整合spring-statemachine\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"spring整合spring-statemachine\",\"isTimeLine\":true,\"date\":\"2024-03-15T00:00:00.000Z\",\"category\":[\"java\"],\"tag\":[\"spring\",\"statemachine\"],\"description\":\"AbstractImportingAnnotationConfiguration实现了ImportBeanDefinitionRegistrar接口，重写registerBeanDefinitions方法，往spring容器中放入了StateMachineDelegatingFactoryBean类，且构造函数的方法如下： builder = new StateMachineConfigBuilder&lt;S, E&gt;(); beanDefinitionBuilder.addConstructorArgValue(builder); beanDefinitionBuilder.addConstructorArgValue(StateMachine.class); beanDefinitionBuilder.addConstructorArgValue(importingClassMetadata.getClassName()); beanDefinitionBuilder.addConstructorArgValue(contextEvents);\"},\"headers\":[],\"git\":{\"createdTime\":null,\"updatedTime\":null,\"contributors\":[]},\"readingTime\":{\"minutes\":1.93,\"words\":578},\"filePathRelative\":\"java/spring/spring-statemachine-starter.md\",\"localizedDate\":\"2024年3月15日\",\"excerpt\":\"<p>AbstractImportingAnnotationConfiguration实现了ImportBeanDefinitionRegistrar接口，重写registerBeanDefinitions方法，往spring容器中放入了StateMachineDelegatingFactoryBean类，且构造函数的方法如下：</p>\\n<div class=\\\"language-java line-numbers-mode\\\" data-ext=\\\"java\\\"><pre class=\\\"language-java\\\"><code>builder <span class=\\\"token operator\\\">=</span> <span class=\\\"token keyword\\\">new</span> <span class=\\\"token class-name\\\">StateMachineConfigBuilder</span><span class=\\\"token generics\\\"><span class=\\\"token punctuation\\\">&lt;</span><span class=\\\"token class-name\\\">S</span><span class=\\\"token punctuation\\\">,</span> <span class=\\\"token class-name\\\">E</span><span class=\\\"token punctuation\\\">&gt;</span></span><span class=\\\"token punctuation\\\">(</span><span class=\\\"token punctuation\\\">)</span><span class=\\\"token punctuation\\\">;</span>\\n\\nbeanDefinitionBuilder<span class=\\\"token punctuation\\\">.</span><span class=\\\"token function\\\">addConstructorArgValue</span><span class=\\\"token punctuation\\\">(</span>builder<span class=\\\"token punctuation\\\">)</span><span class=\\\"token punctuation\\\">;</span>\\nbeanDefinitionBuilder<span class=\\\"token punctuation\\\">.</span><span class=\\\"token function\\\">addConstructorArgValue</span><span class=\\\"token punctuation\\\">(</span><span class=\\\"token class-name\\\">StateMachine</span><span class=\\\"token punctuation\\\">.</span><span class=\\\"token keyword\\\">class</span><span class=\\\"token punctuation\\\">)</span><span class=\\\"token punctuation\\\">;</span>\\nbeanDefinitionBuilder<span class=\\\"token punctuation\\\">.</span><span class=\\\"token function\\\">addConstructorArgValue</span><span class=\\\"token punctuation\\\">(</span>importingClassMetadata<span class=\\\"token punctuation\\\">.</span><span class=\\\"token function\\\">getClassName</span><span class=\\\"token punctuation\\\">(</span><span class=\\\"token punctuation\\\">)</span><span class=\\\"token punctuation\\\">)</span><span class=\\\"token punctuation\\\">;</span>\\nbeanDefinitionBuilder<span class=\\\"token punctuation\\\">.</span><span class=\\\"token function\\\">addConstructorArgValue</span><span class=\\\"token punctuation\\\">(</span>contextEvents<span class=\\\"token punctuation\\\">)</span><span class=\\\"token punctuation\\\">;</span>\\n</code></pre><div class=\\\"line-numbers\\\" aria-hidden=\\\"true\\\"><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div></div></div>\",\"autoDesc\":true}")

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updatePageData) {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ data }) => {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  })
}
