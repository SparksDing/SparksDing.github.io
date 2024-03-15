export const data = JSON.parse("{\"key\":\"v-dbd36ba6\",\"path\":\"/java/mybatis/mini-mybatis/mybatis%E5%AE%9E%E7%8E%B0.html\",\"title\":\"mybatis实现\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"mybatis实现\",\"isTimeLine\":true,\"date\":\"2024-03-08T00:00:00.000Z\",\"category\":[\"java\"],\"tag\":[\"mybatis\"],\"description\":\"Mybatis的设计 MyBatis 是一个持久层框架，它简化了在 Java 应用程序中与数据库的交互过程。MyBatis 的核心思想是将 SQL 语句与 Java 对象之间的映射关系配置在 XML 文件或者注解中，从而实现数据的持久化操作。 以下是 MyBatis 的一些主要特点和优势： 简单易用： MyBatis 的配置简单清晰，学习曲线较低，易于上手。 灵活性： MyBatis 允许使用 SQL 来直接操作数据库，提供了更大的灵活性和控制力，可以优化 SQL 语句以提高性能。 性能优异： MyBatis 采用了预编译 SQL、缓存等技术来提高数据库访问性能。 可定制性： MyBatis 提供了丰富的插件机制，可以方便地扩展和定制框架的功能。 支持注解和 XML 配置： MyBatis 可以使用注解或者 XML 文件来配置 SQL 映射关系，开发者可以根据实际需求选择更适合的方式。 与 Spring 等框架集成： MyBatis 与 Spring、Spring Boot 等主流 Java 框架无缝集成，可以方便地在企业应用中使用。\",\"head\":[[\"meta\",{\"property\":\"og:url\",\"content\":\"https://sparksding.github.io/blogs/java/mybatis/mini-mybatis/mybatis%E5%AE%9E%E7%8E%B0.html\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"还不知道叫什么名字\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"mybatis实现\"}],[\"meta\",{\"property\":\"og:description\",\"content\":\"Mybatis的设计 MyBatis 是一个持久层框架，它简化了在 Java 应用程序中与数据库的交互过程。MyBatis 的核心思想是将 SQL 语句与 Java 对象之间的映射关系配置在 XML 文件或者注解中，从而实现数据的持久化操作。 以下是 MyBatis 的一些主要特点和优势： 简单易用： MyBatis 的配置简单清晰，学习曲线较低，易于上手。 灵活性： MyBatis 允许使用 SQL 来直接操作数据库，提供了更大的灵活性和控制力，可以优化 SQL 语句以提高性能。 性能优异： MyBatis 采用了预编译 SQL、缓存等技术来提高数据库访问性能。 可定制性： MyBatis 提供了丰富的插件机制，可以方便地扩展和定制框架的功能。 支持注解和 XML 配置： MyBatis 可以使用注解或者 XML 文件来配置 SQL 映射关系，开发者可以根据实际需求选择更适合的方式。 与 Spring 等框架集成： MyBatis 与 Spring、Spring Boot 等主流 Java 框架无缝集成，可以方便地在企业应用中使用。\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"article\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"zh-CN\"}],[\"meta\",{\"property\":\"og:updated_time\",\"content\":\"2024-03-12T03:37:13.000Z\"}],[\"meta\",{\"property\":\"article:author\",\"content\":\"还不知道叫什么名字\"}],[\"meta\",{\"property\":\"article:tag\",\"content\":\"mybatis\"}],[\"meta\",{\"property\":\"article:published_time\",\"content\":\"2024-03-08T00:00:00.000Z\"}],[\"meta\",{\"property\":\"article:modified_time\",\"content\":\"2024-03-12T03:37:13.000Z\"}],[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"Article\\\",\\\"headline\\\":\\\"mybatis实现\\\",\\\"image\\\":[\\\"\\\"],\\\"datePublished\\\":\\\"2024-03-08T00:00:00.000Z\\\",\\\"dateModified\\\":\\\"2024-03-12T03:37:13.000Z\\\",\\\"author\\\":[{\\\"@type\\\":\\\"Person\\\",\\\"name\\\":\\\"还不知道叫什么名字\\\",\\\"url\\\":\\\"https://sparksding.github.io/blogs\\\"}]}\"]]},\"headers\":[{\"level\":2,\"title\":\"Mybatis的设计\",\"slug\":\"mybatis的设计\",\"link\":\"#mybatis的设计\",\"children\":[{\"level\":3,\"title\":\"Mybatis事务\",\"slug\":\"mybatis事务\",\"link\":\"#mybatis事务\",\"children\":[]},{\"level\":3,\"title\":\"杂项\",\"slug\":\"杂项\",\"link\":\"#杂项\",\"children\":[]},{\"level\":3,\"title\":\"参考文章\",\"slug\":\"参考文章\",\"link\":\"#参考文章\",\"children\":[]}]}],\"git\":{\"createdTime\":1710214633000,\"updatedTime\":1710214633000,\"contributors\":[{\"name\":\"sparksd\",\"email\":\"sparks23332@163.com\",\"commits\":1}]},\"readingTime\":{\"minutes\":2,\"words\":600},\"filePathRelative\":\"java/mybatis/mini-mybatis/mybatis实现.md\",\"localizedDate\":\"2024年3月8日\",\"excerpt\":\"<h2> <strong>Mybatis的设计</strong></h2>\\n<blockquote>\\n<p>MyBatis 是一个持久层框架，它简化了在 Java 应用程序中与数据库的交互过程。MyBatis 的核心思想是将 SQL 语句与 Java 对象之间的映射关系配置在 XML 文件或者注解中，从而实现数据的持久化操作。</p>\\n</blockquote>\\n<p>以下是 MyBatis 的一些主要特点和优势：</p>\\n<ol>\\n<li>简单易用： MyBatis 的配置简单清晰，学习曲线较低，易于上手。</li>\\n<li>灵活性： MyBatis 允许使用 SQL 来直接操作数据库，提供了更大的灵活性和控制力，可以优化 SQL 语句以提高性能。</li>\\n<li>性能优异： MyBatis 采用了预编译 SQL、缓存等技术来提高数据库访问性能。</li>\\n<li>可定制性： MyBatis 提供了丰富的插件机制，可以方便地扩展和定制框架的功能。</li>\\n<li>支持注解和 XML 配置： MyBatis 可以使用注解或者 XML 文件来配置 SQL 映射关系，开发者可以根据实际需求选择更适合的方式。</li>\\n<li>与 Spring 等框架集成： MyBatis 与 Spring、Spring Boot 等主流 Java 框架无缝集成，可以方便地在企业应用中使用。</li>\\n</ol>\",\"autoDesc\":true}")

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
