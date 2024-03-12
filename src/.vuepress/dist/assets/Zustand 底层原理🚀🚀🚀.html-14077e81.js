const n=JSON.parse('{"key":"v-12669166","path":"/frontend/react/Zustand%20%E5%BA%95%E5%B1%82%E5%8E%9F%E7%90%86%F0%9F%9A%80%F0%9F%9A%80%F0%9F%9A%80.html","title":"Zustand 底层原理🚀🚀🚀","lang":"zh-CN","frontmatter":{"title":"Zustand 底层原理🚀🚀🚀","isTimeLine":true,"date":"2023-08-24T00:00:00.000Z","category":["前端"],"tag":["React"],"description":"今天探究 Zustand 底层原理 🚀zustand为什么这么好用 第一次使用 zustand 被惊艳到了。只需要调用create函数创建store就可以直接在任何组件使用了。 💎 底层原理很简单 好奇的翻开代码，才发现 zustand 基于发布订阅模式实现的响应式。下面是核心代码实现。 function createStoreImpl(initialState) { let state = initialState; const listeners = new Set(); function setState(newState) { state = newState; listeners.forEach((listener) =&gt; listener(state)); } function subscribe(listener) { listeners.add(listener); return () =&gt; { listeners.delete(listener); }; } function destroy() { listeners.clear(); } return { getState: () =&gt; state, setState, subscribe, destroy, }; }","head":[["meta",{"property":"og:url","content":"https://sparksding.github.io/blogs/blogs/frontend/react/Zustand%20%E5%BA%95%E5%B1%82%E5%8E%9F%E7%90%86%F0%9F%9A%80%F0%9F%9A%80%F0%9F%9A%80.html"}],["meta",{"property":"og:site_name","content":"还不知道叫什么名字"}],["meta",{"property":"og:title","content":"Zustand 底层原理🚀🚀🚀"}],["meta",{"property":"og:description","content":"今天探究 Zustand 底层原理 🚀zustand为什么这么好用 第一次使用 zustand 被惊艳到了。只需要调用create函数创建store就可以直接在任何组件使用了。 💎 底层原理很简单 好奇的翻开代码，才发现 zustand 基于发布订阅模式实现的响应式。下面是核心代码实现。 function createStoreImpl(initialState) { let state = initialState; const listeners = new Set(); function setState(newState) { state = newState; listeners.forEach((listener) =&gt; listener(state)); } function subscribe(listener) { listeners.add(listener); return () =&gt; { listeners.delete(listener); }; } function destroy() { listeners.clear(); } return { getState: () =&gt; state, setState, subscribe, destroy, }; }"}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2024-03-09T13:39:39.000Z"}],["meta",{"property":"article:author","content":"还不知道叫什么名字"}],["meta",{"property":"article:tag","content":"React"}],["meta",{"property":"article:published_time","content":"2023-08-24T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2024-03-09T13:39:39.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"Zustand 底层原理🚀🚀🚀\\",\\"image\\":[\\"\\"],\\"datePublished\\":\\"2023-08-24T00:00:00.000Z\\",\\"dateModified\\":\\"2024-03-09T13:39:39.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"还不知道叫什么名字\\",\\"url\\":\\"https://sparksding.github.io/blogs\\"}]}"]]},"headers":[{"level":3,"title":"🚀zustand为什么这么好用","slug":"🚀zustand为什么这么好用","link":"#🚀zustand为什么这么好用","children":[]}],"git":{"createdTime":1709876903000,"updatedTime":1709991579000,"contributors":[{"name":"sparksd","email":"sparks23332@163.com","commits":2}]},"readingTime":{"minutes":1.6,"words":480},"filePathRelative":"frontend/react/Zustand 底层原理🚀🚀🚀.md","localizedDate":"2023年8月24日","excerpt":"<p>今天探究 <code>Zustand</code> 底层原理</p>\\n<h3> 🚀<code>zustand</code>为什么这么好用</h3>\\n<p>第一次使用 <code>zustand</code> 被惊艳到了。只需要调用<code>create</code>函数创建<code>store</code>就可以直接在任何组件使用了。</p>\\n<h4> 💎 底层原理很简单</h4>\\n<p>好奇的翻开代码，才发现 <code>zustand</code> 基于发布订阅模式实现的响应式。下面是核心代码实现。</p>\\n<div class=\\"language-javascript line-numbers-mode\\" data-ext=\\"js\\"><pre class=\\"language-javascript\\"><code><span class=\\"token keyword\\">function</span> <span class=\\"token function\\">createStoreImpl</span><span class=\\"token punctuation\\">(</span><span class=\\"token parameter\\">initialState</span><span class=\\"token punctuation\\">)</span> <span class=\\"token punctuation\\">{</span>\\n  <span class=\\"token keyword\\">let</span> state <span class=\\"token operator\\">=</span> initialState<span class=\\"token punctuation\\">;</span>\\n  <span class=\\"token keyword\\">const</span> listeners <span class=\\"token operator\\">=</span> <span class=\\"token keyword\\">new</span> <span class=\\"token class-name\\">Set</span><span class=\\"token punctuation\\">(</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n\\n  <span class=\\"token keyword\\">function</span> <span class=\\"token function\\">setState</span><span class=\\"token punctuation\\">(</span><span class=\\"token parameter\\">newState</span><span class=\\"token punctuation\\">)</span> <span class=\\"token punctuation\\">{</span>\\n    state <span class=\\"token operator\\">=</span> newState<span class=\\"token punctuation\\">;</span>\\n    listeners<span class=\\"token punctuation\\">.</span><span class=\\"token function\\">forEach</span><span class=\\"token punctuation\\">(</span><span class=\\"token punctuation\\">(</span><span class=\\"token parameter\\">listener</span><span class=\\"token punctuation\\">)</span> <span class=\\"token operator\\">=&gt;</span> <span class=\\"token function\\">listener</span><span class=\\"token punctuation\\">(</span>state<span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n  <span class=\\"token punctuation\\">}</span>\\n\\n  <span class=\\"token keyword\\">function</span> <span class=\\"token function\\">subscribe</span><span class=\\"token punctuation\\">(</span><span class=\\"token parameter\\">listener</span><span class=\\"token punctuation\\">)</span> <span class=\\"token punctuation\\">{</span>\\n    listeners<span class=\\"token punctuation\\">.</span><span class=\\"token function\\">add</span><span class=\\"token punctuation\\">(</span>listener<span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n    <span class=\\"token keyword\\">return</span> <span class=\\"token punctuation\\">(</span><span class=\\"token punctuation\\">)</span> <span class=\\"token operator\\">=&gt;</span> <span class=\\"token punctuation\\">{</span>\\n      listeners<span class=\\"token punctuation\\">.</span><span class=\\"token function\\">delete</span><span class=\\"token punctuation\\">(</span>listener<span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n    <span class=\\"token punctuation\\">}</span><span class=\\"token punctuation\\">;</span>\\n  <span class=\\"token punctuation\\">}</span>\\n\\n  <span class=\\"token keyword\\">function</span> <span class=\\"token function\\">destroy</span><span class=\\"token punctuation\\">(</span><span class=\\"token punctuation\\">)</span> <span class=\\"token punctuation\\">{</span>\\n    listeners<span class=\\"token punctuation\\">.</span><span class=\\"token function\\">clear</span><span class=\\"token punctuation\\">(</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n  <span class=\\"token punctuation\\">}</span>\\n\\n  <span class=\\"token keyword\\">return</span> <span class=\\"token punctuation\\">{</span>\\n    <span class=\\"token function-variable function\\">getState</span><span class=\\"token operator\\">:</span> <span class=\\"token punctuation\\">(</span><span class=\\"token punctuation\\">)</span> <span class=\\"token operator\\">=&gt;</span> state<span class=\\"token punctuation\\">,</span>\\n    setState<span class=\\"token punctuation\\">,</span>\\n    subscribe<span class=\\"token punctuation\\">,</span>\\n    destroy<span class=\\"token punctuation\\">,</span>\\n  <span class=\\"token punctuation\\">}</span><span class=\\"token punctuation\\">;</span>\\n<span class=\\"token punctuation\\">}</span>\\n</code></pre><div class=\\"line-numbers\\" aria-hidden=\\"true\\"><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div></div></div>","autoDesc":true}');export{n as data};
