<template><div><div class="language-text line-numbers-mode" data-ext="text"><pre v-pre class="language-text"><code>├── consumer
│   ├── pom.xml
│   └── src
│       ├── main
│       │   └── java
│       │       └── cn
│       │           └── sparks
│       │               └── Consumer.java #掉用方

├── dyqrpc
│   ├── pom.xml
│   └── src
│       ├── main
│       │   └── java
│       │       └── cn
│       │           └── sparks
│       │               ├── common
│       │               │   └── Invocation.java # 接口定义（可自定义如何序列化）
│       │               ├── protocol
│       │               │   ├── DispatchServlet.java # 自定义DispatchServlet
│       │               │   ├── HttpClient.java #  Client端，供调用方使用
│       │               │   ├── HttpServerHandler.java # 处理rpc调用请求
│       │               │   └── HttpServer.java # 这里用tomcat，也可以自己用Netty实现
│       │               └── register
│       │                   └── LocalRegister.java # 本地方法注册

├── pom.xml
├── producer
│   ├── pom.xml
│   └── src
│       ├── main
│       │   └── java
│       │       └── cn
│       │           └── sparks
│       │               ├── HelloServiceImpl.java
│       │               └── Provider.java # 服务提供方

├── producer-common
│   ├── pom.xml
│   └── src
│       ├── main
│       │   └── java
│       │       └── cn
│       │           └── sparks
│       │               └── HelloService.java # 服务提供方接口

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>RPC Client调用代码</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token class-name">Invocation</span> invocation <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Invocation</span><span class="token punctuation">(</span><span class="token class-name">HelloService</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">.</span><span class="token function">getName</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token string">"sayHello"</span><span class="token punctuation">,</span> <span class="token keyword">new</span> <span class="token class-name">Class</span><span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">{</span><span class="token class-name">String</span><span class="token punctuation">.</span><span class="token keyword">class</span><span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token keyword">new</span> <span class="token class-name">Object</span><span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">{</span><span class="token string">"dyq"</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token class-name">HttpClient</span> httpClient <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">HttpClient</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token class-name">String</span> result <span class="token operator">=</span> httpClient<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span><span class="token string">"localhost"</span><span class="token punctuation">,</span> <span class="token number">8080</span><span class="token punctuation">,</span> invocation<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span>result<span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>RPC 框架提供的Client</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">HttpClient</span> <span class="token punctuation">{</span>
    <span class="token keyword">public</span> <span class="token class-name">String</span> <span class="token function">send</span><span class="token punctuation">(</span><span class="token class-name">String</span> hostname<span class="token punctuation">,</span> <span class="token class-name">Integer</span> port<span class="token punctuation">,</span> <span class="token class-name">Invocation</span> invocation<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token comment">// 用户的配置</span>
        <span class="token keyword">try</span> <span class="token punctuation">{</span>
            <span class="token class-name">URL</span> url <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">URL</span><span class="token punctuation">(</span><span class="token string">"http"</span><span class="token punctuation">,</span> hostname<span class="token punctuation">,</span> port<span class="token punctuation">,</span> <span class="token string">"/"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token class-name">HttpURLConnection</span> httpURLConnection <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token class-name">HttpURLConnection</span><span class="token punctuation">)</span> url<span class="token punctuation">.</span><span class="token function">openConnection</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

            httpURLConnection<span class="token punctuation">.</span><span class="token function">setRequestMethod</span><span class="token punctuation">(</span><span class="token string">"POST"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            httpURLConnection<span class="token punctuation">.</span><span class="token function">setDoOutput</span><span class="token punctuation">(</span><span class="token boolean">true</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

            <span class="token class-name">OutputStream</span> outputStream <span class="token operator">=</span> httpURLConnection<span class="token punctuation">.</span><span class="token function">getOutputStream</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token class-name">ObjectOutputStream</span> oos <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ObjectOutputStream</span><span class="token punctuation">(</span>outputStream<span class="token punctuation">)</span><span class="token punctuation">;</span>

            oos<span class="token punctuation">.</span><span class="token function">writeObject</span><span class="token punctuation">(</span>invocation<span class="token punctuation">)</span><span class="token punctuation">;</span>
            oos<span class="token punctuation">.</span><span class="token function">flush</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            oos<span class="token punctuation">.</span><span class="token function">close</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

            <span class="token class-name">InputStream</span> inputStream <span class="token operator">=</span> httpURLConnection<span class="token punctuation">.</span><span class="token function">getInputStream</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token class-name">String</span> result <span class="token operator">=</span> <span class="token class-name">IOUtils</span><span class="token punctuation">.</span><span class="token function">toString</span><span class="token punctuation">(</span>inputStream<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token keyword">return</span> result<span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">MalformedURLException</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            e<span class="token punctuation">.</span><span class="token function">printStackTrace</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">IOException</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            e<span class="token punctuation">.</span><span class="token function">printStackTrace</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>

        <span class="token keyword">return</span> <span class="token keyword">null</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>RPC 框架的Handler</p>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">HttpServerHandler</span> <span class="token punctuation">{</span>
    <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">handler</span><span class="token punctuation">(</span><span class="token class-name">HttpServletRequest</span> req<span class="token punctuation">,</span> <span class="token class-name">HttpServletResponse</span> resp<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token comment">// 处理请求 -- 接口、方法、方法参数</span>
        <span class="token comment">// </span>
        <span class="token keyword">try</span> <span class="token punctuation">{</span>
            <span class="token class-name">Invocation</span> invocation <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token class-name">Invocation</span><span class="token punctuation">)</span> <span class="token keyword">new</span> <span class="token class-name">ObjectInputStream</span><span class="token punctuation">(</span>req<span class="token punctuation">.</span><span class="token function">getInputStream</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">readObject</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token class-name">String</span> interfaceName <span class="token operator">=</span> invocation<span class="token punctuation">.</span><span class="token function">getInterfaceName</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span>interfaceName<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token class-name">Class</span> classImpl <span class="token operator">=</span> <span class="token class-name">LocalRegister</span><span class="token punctuation">.</span><span class="token function">get</span><span class="token punctuation">(</span>interfaceName<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token class-name">System</span><span class="token punctuation">.</span>out<span class="token punctuation">.</span><span class="token function">println</span><span class="token punctuation">(</span>classImpl<span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token class-name">Method</span> method <span class="token operator">=</span> classImpl<span class="token punctuation">.</span><span class="token function">getMethod</span><span class="token punctuation">(</span>invocation<span class="token punctuation">.</span><span class="token function">getMethodName</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span> invocation<span class="token punctuation">.</span><span class="token function">getParameterTypes</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token class-name">String</span> result <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token class-name">String</span><span class="token punctuation">)</span> method<span class="token punctuation">.</span><span class="token function">invoke</span><span class="token punctuation">(</span>classImpl<span class="token punctuation">.</span><span class="token function">newInstance</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span> invocation<span class="token punctuation">.</span><span class="token function">getParameters</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            
            <span class="token class-name">IOUtils</span><span class="token punctuation">.</span><span class="token function">write</span><span class="token punctuation">(</span>result<span class="token punctuation">,</span> resp<span class="token punctuation">.</span><span class="token function">getOutputStream</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">IOException</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            e<span class="token punctuation">.</span><span class="token function">printStackTrace</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">ClassNotFoundException</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            e<span class="token punctuation">.</span><span class="token function">printStackTrace</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>    
        <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">NoSuchMethodException</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            e<span class="token punctuation">.</span><span class="token function">printStackTrace</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">InvocationTargetException</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            e<span class="token punctuation">.</span><span class="token function">printStackTrace</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">IllegalAccessException</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            e<span class="token punctuation">.</span><span class="token function">printStackTrace</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span><span class="token class-name">InstantiationException</span> e<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            e<span class="token punctuation">.</span><span class="token function">printStackTrace</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></div></template>


