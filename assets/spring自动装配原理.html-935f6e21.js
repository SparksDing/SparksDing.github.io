const e=JSON.parse('{"key":"v-593f01c6","path":"/java/spring/spring%E8%87%AA%E5%8A%A8%E8%A3%85%E9%85%8D%E5%8E%9F%E7%90%86.html","title":"spring自动装配原理","lang":"zh-CN","frontmatter":{"title":"spring自动装配原理","isTimeLine":true,"date":"2024-03-12T00:00:00.000Z","category":["java"],"tag":["spring"],"description":"invokeBeanFactoryPostProcessors 1.获取所有硬编码的BeanDefinitionRegistryPostProcessor，调用postProcessBeanDefinitionRegistry方法 2.获取所有配置的BeanDefinitionRegistryPostProcessor，调用postProcessBeanDefinitionRegistry方法 ConfigurationClassPostProcessor 1. processConfigBeanDefinitions 1.1 checkConfigurationClassCandidate 1.1.1 isConfigurationCandidate 1.2 parser.parse(candidates); 1.2.1 处理 @Component 注解 1.2.2 处理 @PropertySource 注解 1.2.3 处理 @ComponentScan、@ComponentScans 注解 1.2.4 处理 @Import、ImportSelector、ImportBeanDefinitionRegistrar 1.2.5 处理 @ImportResource 注解 1.2.6 处理 @Bean修饰的方法 1.2.7 处理接口默认方法 1.2.8 处理父类 1.3 parser.validate(); 1.4 this.reader.loadBeanDefinitions(configClasses); 1.4.1 registerBeanDefinitionForImportedConfigurationClass 1.4.2 loadBeanDefinitionsForBeanMethod 1.4.3 loadBeanDefinitionsFromImportedResources 1.4.4 loadBeanDefinitionsFromRegistrars","head":[["meta",{"property":"og:url","content":"https://sparksding.github.io/blogs/java/spring/spring%E8%87%AA%E5%8A%A8%E8%A3%85%E9%85%8D%E5%8E%9F%E7%90%86.html"}],["meta",{"property":"og:site_name","content":"还不知道叫什么名字"}],["meta",{"property":"og:title","content":"spring自动装配原理"}],["meta",{"property":"og:description","content":"invokeBeanFactoryPostProcessors 1.获取所有硬编码的BeanDefinitionRegistryPostProcessor，调用postProcessBeanDefinitionRegistry方法 2.获取所有配置的BeanDefinitionRegistryPostProcessor，调用postProcessBeanDefinitionRegistry方法 ConfigurationClassPostProcessor 1. processConfigBeanDefinitions 1.1 checkConfigurationClassCandidate 1.1.1 isConfigurationCandidate 1.2 parser.parse(candidates); 1.2.1 处理 @Component 注解 1.2.2 处理 @PropertySource 注解 1.2.3 处理 @ComponentScan、@ComponentScans 注解 1.2.4 处理 @Import、ImportSelector、ImportBeanDefinitionRegistrar 1.2.5 处理 @ImportResource 注解 1.2.6 处理 @Bean修饰的方法 1.2.7 处理接口默认方法 1.2.8 处理父类 1.3 parser.validate(); 1.4 this.reader.loadBeanDefinitions(configClasses); 1.4.1 registerBeanDefinitionForImportedConfigurationClass 1.4.2 loadBeanDefinitionsForBeanMethod 1.4.3 loadBeanDefinitionsFromImportedResources 1.4.4 loadBeanDefinitionsFromRegistrars"}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2024-03-15T08:57:47.000Z"}],["meta",{"property":"article:author","content":"还不知道叫什么名字"}],["meta",{"property":"article:tag","content":"spring"}],["meta",{"property":"article:published_time","content":"2024-03-12T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2024-03-15T08:57:47.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"spring自动装配原理\\",\\"image\\":[\\"\\"],\\"datePublished\\":\\"2024-03-12T00:00:00.000Z\\",\\"dateModified\\":\\"2024-03-15T08:57:47.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"还不知道叫什么名字\\",\\"url\\":\\"https://sparksding.github.io/blogs\\"}]}"]]},"headers":[{"level":3,"title":"invokeBeanFactoryPostProcessors","slug":"invokebeanfactorypostprocessors","link":"#invokebeanfactorypostprocessors","children":[]},{"level":3,"title":"ConfigurationClassPostProcessor","slug":"configurationclasspostprocessor","link":"#configurationclasspostprocessor","children":[]},{"level":3,"title":"@Import","slug":"import","link":"#import","children":[]}],"git":{"createdTime":1710493067000,"updatedTime":1710493067000,"contributors":[{"name":"sparksd","email":"sparks23332@163.com","commits":1}]},"readingTime":{"minutes":0.66,"words":199},"filePathRelative":"java/spring/spring自动装配原理.md","localizedDate":"2024年3月12日","excerpt":"<h3> invokeBeanFactoryPostProcessors</h3>\\n<p>1.获取所有硬编码的BeanDefinitionRegistryPostProcessor，调用postProcessBeanDefinitionRegistry方法<br>\\n2.获取所有配置的BeanDefinitionRegistryPostProcessor，调用postProcessBeanDefinitionRegistry方法</p>\\n<h3> ConfigurationClassPostProcessor</h3>\\n<div class=\\"language-text line-numbers-mode\\" data-ext=\\"text\\"><pre class=\\"language-text\\"><code>1. processConfigBeanDefinitions\\n    1.1 checkConfigurationClassCandidate\\n        1.1.1 isConfigurationCandidate\\n    1.2 parser.parse(candidates);\\n        1.2.1 处理 @Component 注解\\n        1.2.2 处理 @PropertySource 注解\\n        1.2.3 处理 @ComponentScan、@ComponentScans 注解\\n        1.2.4 处理 @Import、ImportSelector、ImportBeanDefinitionRegistrar\\n        1.2.5 处理 @ImportResource 注解\\n        1.2.6 处理 @Bean修饰的方法\\n        1.2.7 处理接口默认方法\\n        1.2.8 处理父类\\n    1.3 parser.validate();\\n    1.4 this.reader.loadBeanDefinitions(configClasses);\\n        1.4.1 registerBeanDefinitionForImportedConfigurationClass\\n        1.4.2 loadBeanDefinitionsForBeanMethod\\n        1.4.3 loadBeanDefinitionsFromImportedResources\\n        1.4.4 loadBeanDefinitionsFromRegistrars\\n</code></pre><div class=\\"line-numbers\\" aria-hidden=\\"true\\"><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div></div></div>","autoDesc":true}');export{e as data};
