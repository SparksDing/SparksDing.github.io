<template><div><figure><img src="/assets/images/java/bussiness-design/秒杀优惠券.png" alt="秒杀优惠券流程" width="500" tabindex="0" loading="lazy"><figcaption>秒杀优惠券流程</figcaption></figure>
<div class="language-java line-numbers-mode" data-ext="java"><pre v-pre class="language-java"><code><span class="token annotation punctuation">@Override</span>
<span class="token annotation punctuation">@Transactional</span>
<span class="token keyword">public</span> <span class="token class-name">Result</span> <span class="token function">seckillVoucher</span><span class="token punctuation">(</span><span class="token class-name">Long</span> voucherId<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token comment">// 1. 查询优惠券</span>
    <span class="token class-name">SeckillVoucher</span> voucher <span class="token operator">=</span> seckillVoucherService<span class="token punctuation">.</span><span class="token function">getById</span><span class="token punctuation">(</span>voucherId<span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token comment">// 2. 判断秒杀是否开发</span>
    <span class="token keyword">if</span><span class="token punctuation">(</span>voucher<span class="token punctuation">.</span><span class="token function">getBeginTime</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">isAfter</span><span class="token punctuation">(</span><span class="token class-name">LocalDateTime</span><span class="token punctuation">.</span><span class="token function">now</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token class-name">Result</span><span class="token punctuation">.</span><span class="token function">fail</span><span class="token punctuation">(</span><span class="token string">"秒杀未开始"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token comment">// 3. 判断秒杀是否已经结束</span>
    <span class="token keyword">if</span><span class="token punctuation">(</span>voucher<span class="token punctuation">.</span><span class="token function">getBeginTime</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">isBefore</span><span class="token punctuation">(</span><span class="token class-name">LocalDateTime</span><span class="token punctuation">.</span><span class="token function">now</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token class-name">Result</span><span class="token punctuation">.</span><span class="token function">fail</span><span class="token punctuation">(</span><span class="token string">"秒杀已结束"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token comment">// 4. 判断库存是否充足</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>voucher<span class="token punctuation">.</span><span class="token function">getStock</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">&lt;</span> <span class="token number">1</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token class-name">Result</span><span class="token punctuation">.</span><span class="token function">fail</span><span class="token punctuation">(</span><span class="token string">"库存不足"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token comment">// 5. 扣减库存</span>
    <span class="token keyword">boolean</span> success <span class="token operator">=</span> seckillVoucherService<span class="token punctuation">.</span><span class="token function">update</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span>
            <span class="token function">setSql</span><span class="token punctuation">(</span><span class="token string">"stock = stock - 1"</span><span class="token punctuation">)</span><span class="token punctuation">.</span>
            <span class="token function">eq</span><span class="token punctuation">(</span><span class="token string">"voucher_id"</span><span class="token punctuation">,</span> voucherId<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">update</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>success<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token class-name">Result</span><span class="token punctuation">.</span><span class="token function">fail</span><span class="token punctuation">(</span><span class="token string">"库存不足"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token comment">// 6. 创建订单</span>
    <span class="token class-name">VoucherOrder</span> voucherOrder <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">VoucherOrder</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token comment">// 6.1 订单id</span>
    <span class="token keyword">long</span> orderId <span class="token operator">=</span> redisIdWorker<span class="token punctuation">.</span><span class="token function">nextId</span><span class="token punctuation">(</span><span class="token string">"order"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    voucherOrder<span class="token punctuation">.</span><span class="token function">setId</span><span class="token punctuation">(</span>orderId<span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token comment">// 6.2 用户id</span>
    <span class="token class-name">Long</span> userId <span class="token operator">=</span> <span class="token class-name">UserHolder</span><span class="token punctuation">.</span><span class="token function">getUser</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">getId</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    voucherOrder<span class="token punctuation">.</span><span class="token function">setUserId</span><span class="token punctuation">(</span>userId<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token comment">// 6.3 代金券id</span>
    voucherOrder<span class="token punctuation">.</span><span class="token function">setVoucherId</span><span class="token punctuation">(</span>voucherId<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token function">save</span><span class="token punctuation">(</span>voucherOrder<span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token comment">// 7 返回订单id</span>
    <span class="token keyword">return</span> <span class="token class-name">Result</span><span class="token punctuation">.</span><span class="token function">ok</span><span class="token punctuation">(</span>orderId<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><figure><img src="/assets/images/java/bussiness-design/秒杀优惠券并发问题.png" alt="秒杀优惠券并发不安全问题" width="500" tabindex="0" loading="lazy"><figcaption>秒杀优惠券并发不安全问题</figcaption></figure>
<h3 id="解决方案" tabindex="-1"><a class="header-anchor" href="#解决方案" aria-hidden="true">#</a> 解决方案</h3>
<h4 id="版本号法" tabindex="-1"><a class="header-anchor" href="#版本号法" aria-hidden="true">#</a> 版本号法</h4>
<figure><img src="/assets/images/java/bussiness-design/秒杀优惠券并发问题_乐观锁版本号法.png" alt="版本号法" width="500" tabindex="0" loading="lazy"><figcaption>版本号法</figcaption></figure>
<h4 id="compare-and-set" tabindex="-1"><a class="header-anchor" href="#compare-and-set" aria-hidden="true">#</a> Compare and Set</h4>
<figure><img src="/assets/images/java/bussiness-design/秒杀优惠券并发问题_CAS.png" alt="CAS" width="500" tabindex="0" loading="lazy"><figcaption>CAS</figcaption></figure>
<h3 id="悲观锁" tabindex="-1"><a class="header-anchor" href="#悲观锁" aria-hidden="true">#</a> 悲观锁</h3>
<h3 id="乐观锁" tabindex="-1"><a class="header-anchor" href="#乐观锁" aria-hidden="true">#</a> 乐观锁</h3>
</div></template>


