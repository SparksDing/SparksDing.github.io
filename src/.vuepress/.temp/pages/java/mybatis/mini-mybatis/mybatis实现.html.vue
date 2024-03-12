<template><div><h2 id="mybatis的设计" tabindex="-1"><a class="header-anchor" href="#mybatis的设计" aria-hidden="true">#</a> <strong>Mybatis的设计</strong></h2>
<blockquote>
<p>MyBatis 是一个持久层框架，它简化了在 Java 应用程序中与数据库的交互过程。MyBatis 的核心思想是将 SQL 语句与 Java 对象之间的映射关系配置在 XML 文件或者注解中，从而实现数据的持久化操作。</p>
</blockquote>
<p>以下是 MyBatis 的一些主要特点和优势：</p>
<ol>
<li>简单易用： MyBatis 的配置简单清晰，学习曲线较低，易于上手。</li>
<li>灵活性： MyBatis 允许使用 SQL 来直接操作数据库，提供了更大的灵活性和控制力，可以优化 SQL 语句以提高性能。</li>
<li>性能优异： MyBatis 采用了预编译 SQL、缓存等技术来提高数据库访问性能。</li>
<li>可定制性： MyBatis 提供了丰富的插件机制，可以方便地扩展和定制框架的功能。</li>
<li>支持注解和 XML 配置： MyBatis 可以使用注解或者 XML 文件来配置 SQL 映射关系，开发者可以根据实际需求选择更适合的方式。</li>
<li>与 Spring 等框架集成： MyBatis 与 Spring、Spring Boot 等主流 Java 框架无缝集成，可以方便地在企业应用中使用。</li>
</ol>
<p>MyBatis 的工作原理主要包括以下几个步骤：</p>
<ol>
<li>定义 SQL 映射文件或者注解：将 SQL 语句与 Java 对象的映射关系配置在 XML 文件或者 Java 注解中。</li>
<li>配置数据源和 SqlSessionFactory：配置数据源和 SqlSessionFactory，SqlSessionFactory 是 MyBatis 的主要入口点，用于创建 SqlSession 对象。</li>
<li>创建 SqlSession：通过 SqlSessionFactory 创建 SqlSession 对象，用于执行 SQL 语句。</li>
<li>执行 SQL 操作：在 SqlSession 中调用相应的 SQL 方法执行数据库操作，例如查询、插入、更新等。</li>
<li>关闭 SqlSession：操作完成后关闭 SqlSession，释放资源。</li>
</ol>
<p>总的来说，MyBatis 是一个功能强大、灵活性高、易于上手的持久层框架，适用于各种规模的 Java 项目，并且在企业级应用中得到了广泛的应用。</p>
<figure><img src="/assets/images/java/spring/获取sqlSession时序图.png" alt="https://pdai.tech/md/framework/orm-mybatis/mybatis-y-sql-exec.html" width="700" tabindex="0" loading="lazy"><figcaption><a href="https://pdai.tech/md/framework/orm-mybatis/mybatis-y-sql-exec.html" target="_blank" rel="noopener noreferrer">https://pdai.tech/md/framework/orm-mybatis/mybatis-y-sql-exec.html<ExternalLinkIcon/></a></figcaption></figure>
<h3 id="mybatis事务" tabindex="-1"><a class="header-anchor" href="#mybatis事务" aria-hidden="true">#</a> <strong>Mybatis事务</strong></h3>
<h4 id="dogettransaction源码分析" tabindex="-1"><a class="header-anchor" href="#dogettransaction源码分析" aria-hidden="true">#</a> doGetTransaction源码分析</h4>
<p><a href="https://blog.csdn.net/weixin_44367006/article/details/104678746" target="_blank" rel="noopener noreferrer">doGetTransaction<ExternalLinkIcon/></a></p>
<h4 id="mybatis的事务如何被spring管理" tabindex="-1"><a class="header-anchor" href="#mybatis的事务如何被spring管理" aria-hidden="true">#</a> Mybatis的事务如何被spring管理</h4>
<p><a href="https://github.com/mybatis/spring" target="_blank" rel="noopener noreferrer">mybatis-spring<ExternalLinkIcon/></a><br>
<a href="https://www.cnblogs.com/java-chen-hao/p/11839993.html" target="_blank" rel="noopener noreferrer">Mybatis的事务如何被spring管理<ExternalLinkIcon/></a></p>
<h3 id="杂项" tabindex="-1"><a class="header-anchor" href="#杂项" aria-hidden="true">#</a> <strong>杂项</strong></h3>
<p><a href="https://blog.csdn.net/qq_35835624/article/details/108440224" target="_blank" rel="noopener noreferrer">UnpooledDataSource源码分析<ExternalLinkIcon/></a></p>
<h3 id="参考文章" tabindex="-1"><a class="header-anchor" href="#参考文章" aria-hidden="true">#</a> <strong>参考文章</strong></h3>
<p><a href="https://pdai.tech/md/framework/orm-mybatis/mybatis-y-sql-exec.html#google_vignette" target="_blank" rel="noopener noreferrer">Java全栈知识<ExternalLinkIcon/></a></p>
</div></template>


