import{_ as e}from"./plugin-vue_export-helper-c27b6911.js";import{o as i,c as n,f as s}from"./app-d932bdb6.js";const r={},o=s(`<h3 id="invokebeanfactorypostprocessors" tabindex="-1"><a class="header-anchor" href="#invokebeanfactorypostprocessors" aria-hidden="true">#</a> invokeBeanFactoryPostProcessors</h3><p>1.获取所有硬编码的BeanDefinitionRegistryPostProcessor，调用postProcessBeanDefinitionRegistry方法<br> 2.获取所有配置的BeanDefinitionRegistryPostProcessor，调用postProcessBeanDefinitionRegistry方法</p><h3 id="configurationclasspostprocessor" tabindex="-1"><a class="header-anchor" href="#configurationclasspostprocessor" aria-hidden="true">#</a> ConfigurationClassPostProcessor</h3><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>1. processConfigBeanDefinitions
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
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="import" tabindex="-1"><a class="header-anchor" href="#import" aria-hidden="true">#</a> @Import</h3><p>1.2.4 处理@Import注解: processImports(configClass, sourceClass, getImports(sourceClass), filter, true); 其中会调用selectImports方法</p><p>AutoConfigurationImportSelector的selectImports方法从spring.factories中读取starter需要的类。</p><p>其中某些特殊的类可以扫描@SpringApplication主类所在目录下所有的package，将包含注解的类加入spring容器中。</p>`,8),a=[o];function t(c,d){return i(),n("div",null,a)}const m=e(r,[["render",t],["__file","spring自动装配原理.html.vue"]]);export{m as default};
