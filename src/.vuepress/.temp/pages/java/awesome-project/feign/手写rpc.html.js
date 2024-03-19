export const data = JSON.parse("{\"key\":\"v-36d1ce44\",\"path\":\"/java/awesome-project/feign/%E6%89%8B%E5%86%99rpc.html\",\"title\":\"手写rpc\",\"lang\":\"zh-CN\",\"frontmatter\":{\"title\":\"手写rpc\",\"isTimeLine\":true,\"date\":\"2024-03-17T00:00:00.000Z\",\"category\":[\"java\"],\"tag\":[\"rpc\"],\"description\":\"├── consumer │ ├── pom.xml │ └── src │ ├── main │ │ └── java │ │ └── cn │ │ └── sparks │ │ └── Consumer.java #掉用方 ├── dyqrpc │ ├── pom.xml │ └── src │ ├── main │ │ └── java │ │ └── cn │ │ └── sparks │ │ ├── common │ │ │ └── Invocation.java # 接口定义（可自定义如何序列化） │ │ ├── protocol │ │ │ ├── DispatchServlet.java # 自定义DispatchServlet │ │ │ ├── HttpClient.java # Client端，供调用方使用 │ │ │ ├── HttpServerHandler.java # 处理rpc调用请求 │ │ │ └── HttpServer.java # 这里用tomcat，也可以自己用Netty实现 │ │ └── register │ │ └── LocalRegister.java # 本地方法注册 ├── pom.xml ├── producer │ ├── pom.xml │ └── src │ ├── main │ │ └── java │ │ └── cn │ │ └── sparks │ │ ├── HelloServiceImpl.java │ │ └── Provider.java # 服务提供方 ├── producer-common │ ├── pom.xml │ └── src │ ├── main │ │ └── java │ │ └── cn │ │ └── sparks │ │ └── HelloService.java # 服务提供方接口\",\"head\":[[\"meta\",{\"property\":\"og:url\",\"content\":\"https://sparksding.github.io/blogs/java/awesome-project/feign/%E6%89%8B%E5%86%99rpc.html\"}],[\"meta\",{\"property\":\"og:site_name\",\"content\":\"还不知道叫什么名字\"}],[\"meta\",{\"property\":\"og:title\",\"content\":\"手写rpc\"}],[\"meta\",{\"property\":\"og:description\",\"content\":\"├── consumer │ ├── pom.xml │ └── src │ ├── main │ │ └── java │ │ └── cn │ │ └── sparks │ │ └── Consumer.java #掉用方 ├── dyqrpc │ ├── pom.xml │ └── src │ ├── main │ │ └── java │ │ └── cn │ │ └── sparks │ │ ├── common │ │ │ └── Invocation.java # 接口定义（可自定义如何序列化） │ │ ├── protocol │ │ │ ├── DispatchServlet.java # 自定义DispatchServlet │ │ │ ├── HttpClient.java # Client端，供调用方使用 │ │ │ ├── HttpServerHandler.java # 处理rpc调用请求 │ │ │ └── HttpServer.java # 这里用tomcat，也可以自己用Netty实现 │ │ └── register │ │ └── LocalRegister.java # 本地方法注册 ├── pom.xml ├── producer │ ├── pom.xml │ └── src │ ├── main │ │ └── java │ │ └── cn │ │ └── sparks │ │ ├── HelloServiceImpl.java │ │ └── Provider.java # 服务提供方 ├── producer-common │ ├── pom.xml │ └── src │ ├── main │ │ └── java │ │ └── cn │ │ └── sparks │ │ └── HelloService.java # 服务提供方接口\"}],[\"meta\",{\"property\":\"og:type\",\"content\":\"article\"}],[\"meta\",{\"property\":\"og:locale\",\"content\":\"zh-CN\"}],[\"meta\",{\"property\":\"og:updated_time\",\"content\":\"2024-03-18T13:42:28.000Z\"}],[\"meta\",{\"property\":\"article:author\",\"content\":\"还不知道叫什么名字\"}],[\"meta\",{\"property\":\"article:tag\",\"content\":\"rpc\"}],[\"meta\",{\"property\":\"article:published_time\",\"content\":\"2024-03-17T00:00:00.000Z\"}],[\"meta\",{\"property\":\"article:modified_time\",\"content\":\"2024-03-18T13:42:28.000Z\"}],[\"script\",{\"type\":\"application/ld+json\"},\"{\\\"@context\\\":\\\"https://schema.org\\\",\\\"@type\\\":\\\"Article\\\",\\\"headline\\\":\\\"手写rpc\\\",\\\"image\\\":[\\\"\\\"],\\\"datePublished\\\":\\\"2024-03-17T00:00:00.000Z\\\",\\\"dateModified\\\":\\\"2024-03-18T13:42:28.000Z\\\",\\\"author\\\":[{\\\"@type\\\":\\\"Person\\\",\\\"name\\\":\\\"还不知道叫什么名字\\\",\\\"url\\\":\\\"https://sparksding.github.io/blogs\\\"}]}\"]]},\"headers\":[],\"git\":{\"createdTime\":1710769348000,\"updatedTime\":1710769348000,\"contributors\":[{\"name\":\"sparksd\",\"email\":\"sparks23332@163.com\",\"commits\":1}]},\"readingTime\":{\"minutes\":1.05,\"words\":315},\"filePathRelative\":\"java/awesome-project/feign/手写rpc.md\",\"localizedDate\":\"2024年3月17日\",\"excerpt\":\"<div class=\\\"language-text line-numbers-mode\\\" data-ext=\\\"text\\\"><pre class=\\\"language-text\\\"><code>├── consumer\\n│   ├── pom.xml\\n│   └── src\\n│       ├── main\\n│       │   └── java\\n│       │       └── cn\\n│       │           └── sparks\\n│       │               └── Consumer.java #掉用方\\n\\n├── dyqrpc\\n│   ├── pom.xml\\n│   └── src\\n│       ├── main\\n│       │   └── java\\n│       │       └── cn\\n│       │           └── sparks\\n│       │               ├── common\\n│       │               │   └── Invocation.java # 接口定义（可自定义如何序列化）\\n│       │               ├── protocol\\n│       │               │   ├── DispatchServlet.java # 自定义DispatchServlet\\n│       │               │   ├── HttpClient.java #  Client端，供调用方使用\\n│       │               │   ├── HttpServerHandler.java # 处理rpc调用请求\\n│       │               │   └── HttpServer.java # 这里用tomcat，也可以自己用Netty实现\\n│       │               └── register\\n│       │                   └── LocalRegister.java # 本地方法注册\\n\\n├── pom.xml\\n├── producer\\n│   ├── pom.xml\\n│   └── src\\n│       ├── main\\n│       │   └── java\\n│       │       └── cn\\n│       │           └── sparks\\n│       │               ├── HelloServiceImpl.java\\n│       │               └── Provider.java # 服务提供方\\n\\n├── producer-common\\n│   ├── pom.xml\\n│   └── src\\n│       ├── main\\n│       │   └── java\\n│       │       └── cn\\n│       │           └── sparks\\n│       │               └── HelloService.java # 服务提供方接口\\n\\n</code></pre><div class=\\\"line-numbers\\\" aria-hidden=\\\"true\\\"><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div><div class=\\\"line-number\\\"></div></div></div>\",\"autoDesc\":true}")

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
