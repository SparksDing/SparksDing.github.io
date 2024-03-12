<template><div><p>今天探究 <code v-pre>Zustand</code> 底层原理</p>
<h3 id="🚀zustand为什么这么好用" tabindex="-1"><a class="header-anchor" href="#🚀zustand为什么这么好用" aria-hidden="true">#</a> 🚀<code v-pre>zustand</code>为什么这么好用</h3>
<p>第一次使用 <code v-pre>zustand</code> 被惊艳到了。只需要调用<code v-pre>create</code>函数创建<code v-pre>store</code>就可以直接在任何组件使用了。</p>
<h4 id="💎-底层原理很简单" tabindex="-1"><a class="header-anchor" href="#💎-底层原理很简单" aria-hidden="true">#</a> 💎 底层原理很简单</h4>
<p>好奇的翻开代码，才发现 <code v-pre>zustand</code> 基于发布订阅模式实现的响应式。下面是核心代码实现。</p>
<div class="language-javascript line-numbers-mode" data-ext="js"><pre v-pre class="language-javascript"><code><span class="token keyword">function</span> <span class="token function">createStoreImpl</span><span class="token punctuation">(</span><span class="token parameter">initialState</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">let</span> state <span class="token operator">=</span> initialState<span class="token punctuation">;</span>
  <span class="token keyword">const</span> listeners <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Set</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

  <span class="token keyword">function</span> <span class="token function">setState</span><span class="token punctuation">(</span><span class="token parameter">newState</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    state <span class="token operator">=</span> newState<span class="token punctuation">;</span>
    listeners<span class="token punctuation">.</span><span class="token function">forEach</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">listener</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token function">listener</span><span class="token punctuation">(</span>state<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token keyword">function</span> <span class="token function">subscribe</span><span class="token punctuation">(</span><span class="token parameter">listener</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    listeners<span class="token punctuation">.</span><span class="token function">add</span><span class="token punctuation">(</span>listener<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">{</span>
      listeners<span class="token punctuation">.</span><span class="token function">delete</span><span class="token punctuation">(</span>listener<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token keyword">function</span> <span class="token function">destroy</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    listeners<span class="token punctuation">.</span><span class="token function">clear</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token keyword">return</span> <span class="token punctuation">{</span>
    <span class="token function-variable function">getState</span><span class="token operator">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=></span> state<span class="token punctuation">,</span>
    setState<span class="token punctuation">,</span>
    subscribe<span class="token punctuation">,</span>
    destroy<span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>使用方法如下：</p>
<div class="language-javascript line-numbers-mode" data-ext="js"><pre v-pre class="language-javascript"><code><span class="token comment">// 创建</span>
<span class="token keyword">const</span> store <span class="token operator">=</span> <span class="token function">createStoreImpl</span><span class="token punctuation">(</span><span class="token punctuation">{</span> <span class="token literal-property property">count</span><span class="token operator">:</span> <span class="token number">0</span> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token comment">// 更新</span>
store<span class="token punctuation">.</span><span class="token function">setState</span><span class="token punctuation">(</span><span class="token punctuation">{</span> <span class="token literal-property property">count</span><span class="token operator">:</span> <span class="token number">1</span> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token comment">// 订阅</span>
<span class="token keyword">const</span> unsubscribe <span class="token operator">=</span> store<span class="token punctuation">.</span><span class="token function">subscribe</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">state</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"State changed:"</span><span class="token punctuation">,</span> state<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

store<span class="token punctuation">.</span><span class="token function">setState</span><span class="token punctuation">(</span><span class="token punctuation">{</span> <span class="token literal-property property">count</span><span class="token operator">:</span> <span class="token number">2</span> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// 触发订阅的回调函数</span>

<span class="token function">unsubscribe</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// 取消订阅</span>

store<span class="token punctuation">.</span><span class="token function">setState</span><span class="token punctuation">(</span><span class="token punctuation">{</span> <span class="token literal-property property">count</span><span class="token operator">:</span> <span class="token number">3</span> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// 不会触发订阅的回调函数</span>

store<span class="token punctuation">.</span><span class="token function">destroy</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// 销毁这个store</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="💎-不同环境处理" tabindex="-1"><a class="header-anchor" href="#💎-不同环境处理" aria-hidden="true">#</a> 💎 不同环境处理</h4>
<p>事实上，<code v-pre>zustand</code> 提供了两个版本的包，即 react 版本和非 react 的 <code v-pre>vanilla</code> 版本。</p>
<p>包的 export 信息如下，可以看出默认为 react 版本，</p>
<div class="language-javascript line-numbers-mode" data-ext="js"><pre v-pre class="language-javascript"><code><span class="token keyword">export</span> <span class="token operator">*</span> <span class="token keyword">from</span> <span class="token string">"./vanilla.ts"</span><span class="token punctuation">;</span>
<span class="token keyword">export</span> <span class="token operator">*</span> <span class="token keyword">from</span> <span class="token string">"./react.ts"</span><span class="token punctuation">;</span>
<span class="token keyword">export</span> <span class="token punctuation">{</span> <span class="token keyword">default</span> <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">"./react.ts"</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>非 react 的环境使用如下</p>
<div class="language-javascript line-numbers-mode" data-ext="js"><pre v-pre class="language-javascript"><code><span class="token keyword">import</span> <span class="token punctuation">{</span> createStore <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'zustand/vanilla'</span>

<span class="token keyword">const</span> store <span class="token operator">=</span> <span class="token function">createStore</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">(</span><span class="token punctuation">{</span> <span class="token operator">...</span> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">)</span>

<span class="token keyword">const</span> <span class="token punctuation">{</span> getState<span class="token punctuation">,</span> setState<span class="token punctuation">,</span> subscribe <span class="token punctuation">}</span> <span class="token operator">=</span> store

<span class="token keyword">export</span> <span class="token keyword">default</span> store
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>在 react 模式下，和 <code v-pre>vanilla</code> 版本相同的是他们都是使用 <code v-pre>createStore</code> 创建的，使用 <code v-pre>create</code> 创建 <code v-pre>store</code></p>
<p>和 <code v-pre>vanilla</code> 版本不同的是，<code v-pre>createImpl</code> 的返回值是使用 <code v-pre>useStore</code> 包装了一层的返回值（实际是 <code v-pre>useSyncExternalStore api</code>）。</p>
<div class="language-javascript line-numbers-mode" data-ext="js"><pre v-pre class="language-javascript"><code><span class="token keyword">const</span> <span class="token function-variable function">createImpl</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token parameter">createState</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">{</span>
  <span class="token keyword">const</span> api <span class="token operator">=</span>
    <span class="token keyword">typeof</span> createState <span class="token operator">===</span> <span class="token string">"function"</span> <span class="token operator">?</span> <span class="token function">createStore</span><span class="token punctuation">(</span>createState<span class="token punctuation">)</span> <span class="token operator">:</span> createState<span class="token punctuation">;</span>

  <span class="token keyword">const</span> <span class="token function-variable function">useBoundStore</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token parameter">selector<span class="token punctuation">,</span> equalityFn</span><span class="token punctuation">)</span> <span class="token operator">=></span>
    <span class="token function">useStore</span><span class="token punctuation">(</span>api<span class="token punctuation">,</span> selector<span class="token punctuation">,</span> equalityFn<span class="token punctuation">)</span><span class="token punctuation">;</span>

  Object<span class="token punctuation">.</span><span class="token function">assign</span><span class="token punctuation">(</span>useBoundStore<span class="token punctuation">,</span> api<span class="token punctuation">)</span><span class="token punctuation">;</span>

  <span class="token keyword">return</span> useBoundStore<span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">;</span>

<span class="token keyword">export</span> <span class="token keyword">const</span> <span class="token function-variable function">create</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token parameter">createState</span><span class="token punctuation">)</span> <span class="token operator">=></span>
  createState <span class="token operator">?</span> <span class="token function">createImpl</span><span class="token punctuation">(</span>createState<span class="token punctuation">)</span> <span class="token operator">:</span> createImpl<span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code v-pre>useStore</code> 又通过内置的包 <code v-pre>use-sync-external-store/shim/with-selector</code>处理。</p>
<p><code v-pre>use-sync-external-store</code>可以在 <code v-pre>Zustand</code> 中使用外部状态管理库的状态，例如 <code v-pre>Redux</code>。</p>
<div class="language-javascript line-numbers-mode" data-ext="js"><pre v-pre class="language-javascript"><code><span class="token keyword">import</span> useSyncExternalStoreExports <span class="token keyword">from</span> <span class="token string">'use-sync-external-store/shim/with-selector'</span>

<span class="token keyword">export</span> <span class="token keyword">function</span> useStore<span class="token operator">&lt;</span>TState<span class="token punctuation">,</span> StateSlice<span class="token operator">></span><span class="token punctuation">(</span>
  <span class="token literal-property property">api</span><span class="token operator">:</span> WithReact<span class="token operator">&lt;</span>StoreApi<span class="token operator">&lt;</span>TState<span class="token operator">>></span><span class="token punctuation">,</span>
  <span class="token function-variable function">selector</span><span class="token operator">:</span> <span class="token punctuation">(</span><span class="token parameter"><span class="token literal-property property">state</span><span class="token operator">:</span> TState</span><span class="token punctuation">)</span> <span class="token operator">=></span> StateSlice <span class="token operator">=</span> api<span class="token punctuation">.</span>getState <span class="token keyword">as</span> any<span class="token punctuation">,</span>
  equalityFn<span class="token operator">?</span><span class="token operator">:</span> <span class="token punctuation">(</span><span class="token parameter"><span class="token literal-property property">a</span><span class="token operator">:</span> StateSlice<span class="token punctuation">,</span> <span class="token literal-property property">b</span><span class="token operator">:</span> StateSlice</span><span class="token punctuation">)</span> <span class="token operator">=></span> boolean
<span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">const</span> slice <span class="token operator">=</span> <span class="token function">useSyncExternalStoreWithSelector</span><span class="token punctuation">(</span>
    api<span class="token punctuation">.</span>subscribe<span class="token punctuation">,</span>
    api<span class="token punctuation">.</span>getState<span class="token punctuation">,</span>
    api<span class="token punctuation">.</span>getServerState <span class="token operator">||</span> api<span class="token punctuation">.</span>getState<span class="token punctuation">,</span>
    selector<span class="token punctuation">,</span>
    equalityFn
  <span class="token punctuation">)</span>
  <span class="token function">useDebugValue</span><span class="token punctuation">(</span>slice<span class="token punctuation">)</span>
  <span class="token keyword">return</span> slice
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div></div></template>


