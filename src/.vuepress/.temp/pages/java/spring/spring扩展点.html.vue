<template><div><h3 id="bean生命周期" tabindex="-1"><a class="header-anchor" href="#bean生命周期" aria-hidden="true">#</a> Bean生命周期</h3>
<figure><img src="/assets/images/java/spring/spring_bean_life.png" alt="image" width="600" tabindex="0" loading="lazy"><figcaption>image</figcaption></figure>
<hr>
<h3 id="bean创建过程扩展点" tabindex="-1"><a class="header-anchor" href="#bean创建过程扩展点" aria-hidden="true">#</a> Bean创建过程扩展点</h3>
<table>
<thead>
<tr>
<th>方法</th>
<th>Log</th>
</tr>
</thead>
<tbody>
<tr>
<td>Constructor</td>
<td>Cat constructor run...</td>
</tr>
<tr>
<td>BeanPostProcessor.postProcessBeforeInitialization</td>
<td>Cat postProcessBeforeInitialization run...</td>
</tr>
<tr>
<td>@PostConstruct</td>
<td>Cat PostConstruct run...</td>
</tr>
<tr>
<td>InitializingBean.afterPropertiesSet</td>
<td>Cat afterPropertiesSet run...</td>
</tr>
<tr>
<td>BeanPostProcessor.postProcessAfterInitialization</td>
<td>Cat postProcessAfterInitialization run...</td>
</tr>
</tbody>
</table>
<h3 id="beannameaware-beanfactoryaware-applicationcontextaware-initializingbean-beanpostprocessor" tabindex="-1"><a class="header-anchor" href="#beannameaware-beanfactoryaware-applicationcontextaware-initializingbean-beanpostprocessor" aria-hidden="true">#</a> BeanNameAware, BeanFactoryAware, ApplicationContextAware, InitializingBean, BeanPostProcessor</h3>
<table>
<thead>
<tr>
<th style="text-align:center">实现接口</th>
<th style="text-align:center">作用</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:center">BeanNameAware</td>
<td style="text-align:center">实现setBeanName方法</td>
</tr>
<tr>
<td style="text-align:center">BeanFactoryAware</td>
<td style="text-align:center">实现setBeanFactory获取beanFactory</td>
</tr>
<tr>
<td style="text-align:center">ApplicationContextAware</td>
<td style="text-align:center">实现setApplicationContext获取applicationContext</td>
</tr>
<tr>
<td style="text-align:center">InitializingBean</td>
<td style="text-align:center">实现afterPropertiesSet接口</td>
</tr>
<tr>
<td style="text-align:center">BeanPostProcessor</td>
<td style="text-align:center">实现postProcessBeforeInitialization, postProcessAfterInitialization</td>
</tr>
</tbody>
</table>
<h3 id="beandefinitionregistrypostprocessor-beanfactorypostprocessor" tabindex="-1"><a class="header-anchor" href="#beandefinitionregistrypostprocessor-beanfactorypostprocessor" aria-hidden="true">#</a> BeanDefinitionRegistryPostProcessor, BeanFactoryPostProcessor</h3>
<table>
<thead>
<tr>
<th style="text-align:center">实现接口</th>
<th style="text-align:center">作用</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:center">BeanFactoryPostProcessor</td>
<td style="text-align:center">实现postProcessBeanFactory方法</td>
</tr>
<tr>
<td style="text-align:center">BeanDefinitionRegistryPostProcessor</td>
<td style="text-align:center">实现postProcessBeanDefinitionRegistry方法</td>
</tr>
</tbody>
</table>
<h3 id="importbeandefinitionregistrar" tabindex="-1"><a class="header-anchor" href="#importbeandefinitionregistrar" aria-hidden="true">#</a> ImportBeanDefinitionRegistrar</h3>
<table>
<thead>
<tr>
<th style="text-align:center">实现接口</th>
<th style="text-align:center">作用</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:center">ImportBeanDefinitionRegistrar</td>
<td style="text-align:center">实现registerBeanDefinitions方法</td>
</tr>
</tbody>
</table>
<h3 id="循环依赖" tabindex="-1"><a class="header-anchor" href="#循环依赖" aria-hidden="true">#</a> <strong>循环依赖</strong></h3>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token annotation punctuation">@Component</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">AService</span> <span class="token punctuation">{</span>

  <span class="token annotation punctuation">@Autowired</span>
  <span class="token keyword">private</span> <span class="token class-name">BService</span> bService<span class="token punctuation">;</span>

  <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">test</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span>bService<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

<span class="token punctuation">}</span>

<span class="token annotation punctuation">@Component</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">BService</span> <span class="token punctuation">{</span>

  <span class="token annotation punctuation">@Autowired</span>
  <span class="token keyword">private</span> <span class="token class-name">AService</span> aService<span class="token punctuation">;</span>

  <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">test</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span>aService<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
  
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="aservice的bean的生命周期" tabindex="-1"><a class="header-anchor" href="#aservice的bean的生命周期" aria-hidden="true">#</a> <strong>AService的Bean的生命周期</strong></h4>
<ol>
<li>实例化--&gt;AService普通对象</li>
<li>填充BService--&gt;单例池Map--&gt;创建BService<br>
BService的Bean的生命周期
<ol>
<li>实例化--&gt;普通对象</li>
<li>填充aService--&gt;单例池Map--&gt;AService普通对象</li>
<li>填充其他属性</li>
<li>做其他事情(AOP)</li>
<li>添加到单例池</li>
</ol>
</li>
<li>填充其他属性</li>
<li>做其他事情(AOP)--&gt;AService的代理对象</li>
<li>添加到单例池</li>
</ol>
<p>上述2.2步骤中，填充aService时单例池Map里没有aService，那么又需要创建aService，而aService正在创建过程中，这样则会出现问题。</p>
<h4 id="打破循环依赖" tabindex="-1"><a class="header-anchor" href="#打破循环依赖" aria-hidden="true">#</a> <strong>打破循环依赖</strong></h4>
<p><strong>三级缓存</strong><br>
第一级: singletonObjects ------ 单例<br>
第二级缓存: earlySingletonObjects ------ 提前产生的代理对象，也保证单例<br>
第三级缓存: singletonFactories ------ 打破循环</p>
<hr>
<ol>
<li>实例化--&gt;AService普通对象--&gt;earlySingletonObjects.put(&quot;AService&quot;, AService普通对象)</li>
<li>填充BService--&gt;单例池Map--&gt;创建BService<br>
BService的Bean的生命周期
<ol>
<li>实例化--&gt;普通对象</li>
<li>填充aService--&gt;单例池Map-不存在-&gt;earlySingletonObjects--&gt;AService普通对象</li>
<li>填充其他属性</li>
<li>做其他事情(AOP)</li>
<li>添加到单例池</li>
</ol>
</li>
<li>填充其他属性</li>
<li>做其他事情(AOP)--&gt;AService的代理对象</li>
<li>添加到单例池</li>
</ol>
<p>以上步骤存在问题，2.2中得到的是AService普通对象，而4中生成的又是AService的代理对象，冲突。</p>
<hr>
<p><strong>循环依赖: 提前AOP</strong></p>
<ol>
<li>creatingSet&lt;'AService'&gt;</li>
<li>实例化--&gt;AService普通对象--&gt;singletonFactories.put(&quot;AService&quot;, () -&gt; getEarlyBeanReference(beanName, mbd, AService普通对象))</li>
<li>填充BService--&gt;单例池Map--&gt;创建BService<br>
BService的Bean的生命周期
<ol>
<li>实例化--&gt;普通对象</li>
<li>填充aService--&gt;单例池Map-不存在-&gt;creatingSet--&gt;出现循环依赖--&gt;earlySingletonObjects--&gt;singletonFactories--&gt;AOP--&gt;AService代理对象--&gt;earlySingletonObjects</li>
<li>填充其他属性</li>
<li>做其他事情(AOP)</li>
<li>添加到单例池</li>
</ol>
</li>
<li>填充其他属性</li>
<li>做其他事情(AOP)--&gt;AService的代理对象</li>
<li>添加到单例池</li>
<li>creatingSet.remove&lt;'AService'&gt;</li>
</ol>
<p>2.2步骤中AService代理对象还没有填充属性，因此不能添加到单例池</p>
<p><strong>earlySingletonObjects用于保证单例</strong></p>
<ul>
<li>3.2步骤发现出现循环依赖后会创建AService代理对象，此时如果有CService也依赖AService，也进行到这一步骤，那么也会创建AService代理对象，则单例无法保证。</li>
</ul>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">boolean</span> earlySingletonExposure <span class="token operator">=</span> <span class="token punctuation">(</span>mbd<span class="token punctuation">.</span><span class="token function">isSingleton</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">&amp;&amp;</span> <span class="token keyword">this</span><span class="token punctuation">.</span>allowCircularReferences <span class="token operator">&amp;&amp;</span>
				<span class="token function">isSingletonCurrentlyInCreation</span><span class="token punctuation">(</span>beanName<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">if</span> <span class="token punctuation">(</span>earlySingletonExposure<span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">if</span> <span class="token punctuation">(</span>logger<span class="token punctuation">.</span><span class="token function">isTraceEnabled</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    logger<span class="token punctuation">.</span><span class="token function">trace</span><span class="token punctuation">(</span><span class="token string">"Eagerly caching bean '"</span> <span class="token operator">+</span> beanName <span class="token operator">+</span>
        <span class="token string">"' to allow for resolving potential circular references"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
  <span class="token function">addSingletonFactory</span><span class="token punctuation">(</span>beanName<span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">-></span> <span class="token function">getEarlyBeanReference</span><span class="token punctuation">(</span>beanName<span class="token punctuation">,</span> mbd<span class="token punctuation">,</span> bean<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

<span class="token keyword">protected</span> <span class="token class-name">Object</span> <span class="token function">getEarlyBeanReference</span><span class="token punctuation">(</span><span class="token class-name">String</span> beanName<span class="token punctuation">,</span> <span class="token class-name">RootBeanDefinition</span> mbd<span class="token punctuation">,</span> <span class="token class-name">Object</span> bean<span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token class-name">Object</span> exposedObject <span class="token operator">=</span> bean<span class="token punctuation">;</span>
  <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>mbd<span class="token punctuation">.</span><span class="token function">isSynthetic</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">&amp;&amp;</span> <span class="token function">hasInstantiationAwareBeanPostProcessors</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token class-name">BeanPostProcessor</span> bp <span class="token operator">:</span> <span class="token function">getBeanPostProcessors</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">if</span> <span class="token punctuation">(</span>bp <span class="token keyword">instanceof</span> <span class="token class-name">SmartInstantiationAwareBeanPostProcessor</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">SmartInstantiationAwareBeanPostProcessor</span> ibp <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token class-name">SmartInstantiationAwareBeanPostProcessor</span><span class="token punctuation">)</span> bp<span class="token punctuation">;</span>
        exposedObject <span class="token operator">=</span> ibp<span class="token punctuation">.</span><span class="token function">getEarlyBeanReference</span><span class="token punctuation">(</span>exposedObject<span class="token punctuation">,</span> beanName<span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>
  <span class="token keyword">return</span> exposedObject<span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></div></template>


