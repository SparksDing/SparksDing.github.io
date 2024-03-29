<template><div><h3 id="jdbc和orm" tabindex="-1"><a class="header-anchor" href="#jdbc和orm" aria-hidden="true">#</a> jdbc和ORM</h3>
<p><RouterLink to="/java/mybatis/mini-mybatis/orm%E6%A1%86%E6%9E%B6%E5%AE%9E%E7%8E%B0.html">jdbc使用</RouterLink></p>
<h3 id="连接池" tabindex="-1"><a class="header-anchor" href="#连接池" aria-hidden="true">#</a> 连接池</h3>
<blockquote>
<p>数据库连接池是指，在Java程序未和数据库建立连接时，就提前创建好一定数量的连接并放入缓冲池中；当Java程序请求建立数据库连接时，就可以直接从缓冲池中“拿出”建立好的连接来用，用完后取消Java程序对该连接的引用即可，连接本身不会中断，只是“放回”了连接池（动态绑定机制）。</p>
</blockquote>
<blockquote>
<p>数据库连接池负责分配，管理和释放数据库连接，它允许用户程序重复使用一个现有的数据库连接，而不是重新建立一个。（即连接池中的连接是公共的，谁都能用，你用完我可以接着用）</p>
</blockquote>
<blockquote>
<p>当应用程序向连接池请求的连接数超过最大连接数量时，这些请求将被加入到等待队列中</p>
</blockquote>
<h3 id="sharding-jdbc" tabindex="-1"><a class="header-anchor" href="#sharding-jdbc" aria-hidden="true">#</a> sharding-jdbc</h3>
<ul>
<li>适用于任何基于 JDBC 的 ORM 框架，如：JPA, Hibernate, Mybatis, Spring JDBC Template或直接使用 JDBC。</li>
<li>支持任何第三方的数据库连接池，如：DBCP, C3P0, BoneCP, Druid, HikariCP 等。</li>
<li>支持任意实现 JDBC 规范的数据库，目前支持 MySQL，Oracle，SQLServer，PostgreSQL 以及任何遵循<br>
SQL92 标准的数据库。</li>
</ul>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">private</span> <span class="token keyword">final</span> <span class="token class-name">Map</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">String</span><span class="token punctuation">,</span> <span class="token class-name">DataSource</span><span class="token punctuation">></span></span> dataSourceMap <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">LinkedHashMap</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token annotation punctuation">@Bean</span>
<span class="token annotation punctuation">@Conditional</span><span class="token punctuation">(</span><span class="token class-name">ShardingRuleCondition</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">)</span>
<span class="token keyword">public</span> <span class="token class-name">DataSource</span> <span class="token function">shardingDataSource</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token keyword">throws</span> <span class="token class-name">SQLException</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token class-name">ShardingDataSourceFactory</span><span class="token punctuation">.</span><span class="token function">createDataSource</span><span class="token punctuation">(</span>dataSourceMap<span class="token punctuation">,</span> <span class="token keyword">new</span> <span class="token class-name">ShardingRuleConfigurationYamlSwapper</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">swap</span><span class="token punctuation">(</span>shardingRule<span class="token punctuation">)</span><span class="token punctuation">,</span> props<span class="token punctuation">.</span><span class="token function">getProps</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>底层与数据库直接交互的仍然为javax.sql.DataSource，sharding-jdbc是在交互之前做一些操作，比如：</p>
<ol>
<li>用一个map保存多个库，根据规则实现分库</li>
<li>在执行sql语句之前改写，实现分表</li>
</ol>
<h3 id="参考文章" tabindex="-1"><a class="header-anchor" href="#参考文章" aria-hidden="true">#</a> 参考文章</h3>
<p><a href="https://blog.csdn.net/TYRA9/article/details/131144703" target="_blank" rel="noopener noreferrer">JDBC 连接池 详解<ExternalLinkIcon/></a><br>
<a href="https://blog.csdn.net/weixin_44643439/article/details/108671120" target="_blank" rel="noopener noreferrer">shardingjdbc—— 配置druid数据库连接池<ExternalLinkIcon/></a></p>
</div></template>


