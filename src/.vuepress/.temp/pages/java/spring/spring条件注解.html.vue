<template><div><h3 id="总结" tabindex="-1"><a class="header-anchor" href="#总结" aria-hidden="true">#</a> <strong>总结</strong></h3>
<table>
<thead>
<tr>
<th style="text-align:center">条件注解</th>
<th style="text-align:center">作用</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:center">ConditionalOnBean</td>
<td style="text-align:center">是否存在某个类或某个名字的Bean</td>
</tr>
<tr>
<td style="text-align:center">ConditionalOnMissingBean</td>
<td style="text-align:center">是否缺失某个类或某个名字的Bean</td>
</tr>
<tr>
<td style="text-align:center">ConditionalOnSingleCandidate</td>
<td style="text-align:center">是否符合指定类型的Bean只有一个</td>
</tr>
<tr>
<td style="text-align:center">ConditionalOnClass</td>
<td style="text-align:center">是否存在某个类</td>
</tr>
<tr>
<td style="text-align:center">ConditionalOnMissingClass</td>
<td style="text-align:center">是否不存在某个类</td>
</tr>
<tr>
<td style="text-align:center">ConditionalOnExpression</td>
<td style="text-align:center">指定的表达式返回是true或者false</td>
</tr>
<tr>
<td style="text-align:center">ConditionalOnJava</td>
<td style="text-align:center">判断Java版本</td>
</tr>
<tr>
<td style="text-align:center">ConditionalOnJndi</td>
<td style="text-align:center">JNDI指定的资源是否存在</td>
</tr>
<tr>
<td style="text-align:center">ConditionalOnWebApplication</td>
<td style="text-align:center">当前应用是web应用</td>
</tr>
<tr>
<td style="text-align:center">ConditionalOnNotWebApplication</td>
<td style="text-align:center">当前应用不是web应用</td>
</tr>
<tr>
<td style="text-align:center">ConditionalOnProperty</td>
<td style="text-align:center">Environment中是否存在某个属性</td>
</tr>
<tr>
<td style="text-align:center">ConditionalOnResource</td>
<td style="text-align:center">是否存在指定资源</td>
</tr>
<tr>
<td style="text-align:center">ConditionalOnWarDeployment</td>
<td style="text-align:center">是否以war包方式部署运行</td>
</tr>
<tr>
<td style="text-align:center">ConditionalOnCloudPlatform</td>
<td style="text-align:center">是否在某个云平台上</td>
</tr>
</tbody>
</table>
<h4 id="anynestedcondition" tabindex="-1"><a class="header-anchor" href="#anynestedcondition" aria-hidden="true">#</a> AnyNestedCondition</h4>
<p>用法</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">static</span> <span class="token keyword">class</span> <span class="token class-name">PooledDataSourceCondition</span> <span class="token keyword">extends</span> <span class="token class-name">AnyNestedCondition</span> <span class="token punctuation">{</span>

  <span class="token class-name">PooledDataSourceCondition</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">super</span><span class="token punctuation">(</span><span class="token class-name">ConfigurationPhase</span><span class="token punctuation">.</span><span class="token constant">PARSE_CONFIGURATION</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token annotation punctuation">@ConditionalOnProperty</span><span class="token punctuation">(</span>prefix <span class="token operator">=</span> <span class="token string">"spring.datasource"</span><span class="token punctuation">,</span> name <span class="token operator">=</span> <span class="token string">"type"</span><span class="token punctuation">)</span>
  <span class="token keyword">static</span> <span class="token keyword">class</span> <span class="token class-name">ExplicitType</span> <span class="token punctuation">{</span>

  <span class="token punctuation">}</span>

  <span class="token annotation punctuation">@Conditional</span><span class="token punctuation">(</span><span class="token class-name">PooledDataSourceAvailableCondition</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">)</span>
  <span class="token keyword">static</span> <span class="token keyword">class</span> <span class="token class-name">PooledDataSourceAvailable</span> <span class="token punctuation">{</span>

  <span class="token punctuation">}</span>

<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>原理：会收集AnyNestedCondition的所有内部类的条件，只要有一个条件为真则为真</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">private</span> <span class="token class-name">Map</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">AnnotationMetadata</span><span class="token punctuation">,</span> <span class="token class-name">List</span><span class="token punctuation">&lt;</span><span class="token class-name">Condition</span><span class="token punctuation">></span><span class="token punctuation">></span></span> <span class="token function">getMemberConditions</span><span class="token punctuation">(</span><span class="token class-name">String</span><span class="token punctuation">[</span><span class="token punctuation">]</span> members<span class="token punctuation">,</span> <span class="token class-name">ConfigurationPhase</span> phase<span class="token punctuation">,</span>
				<span class="token class-name">String</span> className<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token class-name">MultiValueMap</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">AnnotationMetadata</span><span class="token punctuation">,</span> <span class="token class-name">Condition</span><span class="token punctuation">></span></span> memberConditions <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">LinkedMultiValueMap</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token class-name">String</span> member <span class="token operator">:</span> members<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token class-name">AnnotationMetadata</span> metadata <span class="token operator">=</span> <span class="token function">getMetadata</span><span class="token punctuation">(</span>member<span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token class-name">String</span><span class="token punctuation">[</span><span class="token punctuation">]</span> conditionClasses <span class="token operator">:</span> <span class="token function">getConditionClasses</span><span class="token punctuation">(</span>metadata<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token class-name">String</span> conditionClass <span class="token operator">:</span> conditionClasses<span class="token punctuation">)</span> <span class="token punctuation">{</span>
          <span class="token class-name">Condition</span> condition <span class="token operator">=</span> <span class="token function">getCondition</span><span class="token punctuation">(</span>conditionClass<span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token function">validateMemberCondition</span><span class="token punctuation">(</span>condition<span class="token punctuation">,</span> phase<span class="token punctuation">,</span> className<span class="token punctuation">)</span><span class="token punctuation">;</span>
          memberConditions<span class="token punctuation">.</span><span class="token function">add</span><span class="token punctuation">(</span>metadata<span class="token punctuation">,</span> condition<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">return</span> <span class="token class-name">Collections</span><span class="token punctuation">.</span><span class="token function">unmodifiableMap</span><span class="token punctuation">(</span>memberConditions<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="一些使用样例" tabindex="-1"><a class="header-anchor" href="#一些使用样例" aria-hidden="true">#</a> <strong>一些使用样例</strong></h3>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token annotation punctuation">@ConditionalOnBean</span><span class="token punctuation">(</span>name <span class="token operator">=</span> <span class="token string">"xxx"</span><span class="token punctuation">)</span>
<span class="token annotation punctuation">@ConditionalOnBean</span><span class="token punctuation">(</span>value <span class="token operator">=</span> <span class="token class-name">MemberService</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">)</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="自定义" tabindex="-1"><a class="header-anchor" href="#自定义" aria-hidden="true">#</a> <strong>自定义</strong></h3>
<p>自定义一个条件注解</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">DyqCondition</span> <span class="token keyword">implements</span> <span class="token class-name">Condition</span> <span class="token punctuation">{</span>

    <span class="token annotation punctuation">@Override</span>
    <span class="token keyword">public</span> <span class="token keyword">boolean</span> <span class="token function">matches</span><span class="token punctuation">(</span><span class="token class-name">ConditionContext</span> context<span class="token punctuation">,</span> <span class="token class-name">AnnotatedTypeMetadata</span> metadata<span class="token punctuation">)</span> <span class="token punctuation">{</span>

        <span class="token class-name">Map</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">Object</span><span class="token punctuation">></span></span> annotationAttributes <span class="token operator">=</span> metadata<span class="token punctuation">.</span><span class="token function">getAnnotationAttributes</span><span class="token punctuation">(</span><span class="token class-name">DyqConditionOnClass</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">.</span><span class="token function">getName</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">String</span> className <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token class-name">String</span><span class="token punctuation">)</span> annotationAttributes<span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span><span class="token string">"value"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token keyword">try</span> <span class="token punctuation">{</span>
            context<span class="token punctuation">.</span><span class="token function">getClassLoader</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">loadClass</span><span class="token punctuation">(</span>className<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token keyword">return</span> <span class="token boolean">true</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">ClassNotFoundException</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">return</span> <span class="token boolean">false</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>


<span class="token annotation punctuation">@Target</span><span class="token punctuation">(</span><span class="token punctuation">{</span> <span class="token class-name">ElementType</span><span class="token punctuation">.</span><span class="token constant">TYPE</span><span class="token punctuation">,</span> <span class="token class-name">ElementType</span><span class="token punctuation">.</span><span class="token constant">METHOD</span> <span class="token punctuation">}</span><span class="token punctuation">)</span>
<span class="token annotation punctuation">@Retention</span><span class="token punctuation">(</span><span class="token class-name">RetentionPolicy</span><span class="token punctuation">.</span><span class="token constant">RUNTIME</span><span class="token punctuation">)</span>
<span class="token annotation punctuation">@Conditional</span><span class="token punctuation">(</span><span class="token class-name">DyqCondition</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">)</span>
<span class="token keyword">public</span> <span class="token annotation punctuation">@interface</span> <span class="token class-name">DyqConditionOnClass</span> <span class="token punctuation">{</span>
    <span class="token class-name">String</span> <span class="token function">value</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="参考文章" tabindex="-1"><a class="header-anchor" href="#参考文章" aria-hidden="true">#</a> 参考文章</h3>
<p><a href="https://blog.csdn.net/f4761/article/details/83536210" target="_blank" rel="noopener noreferrer">Spring Data之DataSource创建及源码分析<ExternalLinkIcon/></a></p>
</div></template>


