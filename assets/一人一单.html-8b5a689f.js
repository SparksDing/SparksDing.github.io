import{_ as n}from"./plugin-vue_export-helper-c27b6911.js";import{o as s,c as a,f as t}from"./app-0dea300a.js";const p={},e=t(`<div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token annotation punctuation">@Service</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">VoucherOrderServiceImpl</span> <span class="token keyword">extends</span> <span class="token class-name">ServiceImpl</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">VoucherOrderMapper</span><span class="token punctuation">,</span> <span class="token class-name">VoucherOrder</span><span class="token punctuation">&gt;</span></span> <span class="token keyword">implements</span> <span class="token class-name">IVoucherOrderService</span> <span class="token punctuation">{</span>


    <span class="token annotation punctuation">@Resource</span>
    <span class="token keyword">private</span> <span class="token class-name">ISeckillVoucherService</span> seckillVoucherService<span class="token punctuation">;</span>

    <span class="token annotation punctuation">@Resource</span>
    <span class="token keyword">private</span> <span class="token class-name">RedisIdWorker</span> redisIdWorker<span class="token punctuation">;</span>


    <span class="token annotation punctuation">@Resource</span>
    <span class="token class-name">IVoucherOrderService</span> voucherOrderService<span class="token punctuation">;</span>


    <span class="token annotation punctuation">@Override</span>
    <span class="token keyword">public</span> <span class="token class-name">Result</span> <span class="token function">seckillVoucher</span><span class="token punctuation">(</span><span class="token class-name">Long</span> voucherId<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token comment">// 1. 查询优惠券</span>
        <span class="token class-name">SeckillVoucher</span> voucher <span class="token operator">=</span> seckillVoucherService<span class="token punctuation">.</span><span class="token function">getById</span><span class="token punctuation">(</span>voucherId<span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token comment">// 2. 判断秒杀是否开发</span>
        <span class="token keyword">if</span><span class="token punctuation">(</span>voucher<span class="token punctuation">.</span><span class="token function">getBeginTime</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">isAfter</span><span class="token punctuation">(</span><span class="token class-name">LocalDateTime</span><span class="token punctuation">.</span><span class="token function">now</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">return</span> <span class="token class-name">Result</span><span class="token punctuation">.</span><span class="token function">fail</span><span class="token punctuation">(</span><span class="token string">&quot;秒杀未开始&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>

        <span class="token comment">// 3. 判断秒杀是否已经结束</span>
        <span class="token keyword">if</span><span class="token punctuation">(</span>voucher<span class="token punctuation">.</span><span class="token function">getBeginTime</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">isBefore</span><span class="token punctuation">(</span><span class="token class-name">LocalDateTime</span><span class="token punctuation">.</span><span class="token function">now</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">return</span> <span class="token class-name">Result</span><span class="token punctuation">.</span><span class="token function">fail</span><span class="token punctuation">(</span><span class="token string">&quot;秒杀已结束&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>

        <span class="token comment">// 4. 判断库存是否充足</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>voucher<span class="token punctuation">.</span><span class="token function">getStock</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">&lt;</span> <span class="token number">1</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">return</span> <span class="token class-name">Result</span><span class="token punctuation">.</span><span class="token function">fail</span><span class="token punctuation">(</span><span class="token string">&quot;库存不足&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>

        <span class="token class-name">Long</span> userId <span class="token operator">=</span> <span class="token class-name">UserHolder</span><span class="token punctuation">.</span><span class="token function">getUser</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">getId</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token keyword">synchronized</span> <span class="token punctuation">(</span>userId<span class="token punctuation">.</span><span class="token function">toString</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">intern</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">return</span> voucherOrderService<span class="token punctuation">.</span><span class="token function">createVoucherOrder</span><span class="token punctuation">(</span>voucherId<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
    <span class="token punctuation">}</span>

    <span class="token annotation punctuation">@Transactional</span>
    <span class="token keyword">public</span> <span class="token class-name">Result</span> <span class="token function">createVoucherOrder</span><span class="token punctuation">(</span><span class="token class-name">Long</span> voucherId<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token comment">// 5. 一人一单</span>
        <span class="token class-name">Long</span> userId <span class="token operator">=</span> <span class="token class-name">UserHolder</span><span class="token punctuation">.</span><span class="token function">getUser</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">getId</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token comment">// 5.1 查询订单</span>
        <span class="token keyword">int</span> count <span class="token operator">=</span> <span class="token function">query</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">eq</span><span class="token punctuation">(</span><span class="token string">&quot;user_id&quot;</span><span class="token punctuation">,</span> userId<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">eq</span><span class="token punctuation">(</span><span class="token string">&quot;voucher_id&quot;</span><span class="token punctuation">,</span> voucherId<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">count</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token comment">// 5.2 判断是否存在</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>count <span class="token operator">&gt;</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">return</span> <span class="token class-name">Result</span><span class="token punctuation">.</span><span class="token function">fail</span><span class="token punctuation">(</span><span class="token string">&quot;用户已购买&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>

        <span class="token comment">// 6. 扣减库存</span>
        <span class="token keyword">boolean</span> success <span class="token operator">=</span> seckillVoucherService<span class="token punctuation">.</span><span class="token function">update</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span>
                <span class="token function">setSql</span><span class="token punctuation">(</span><span class="token string">&quot;stock = stock - 1&quot;</span><span class="token punctuation">)</span>
                <span class="token punctuation">.</span><span class="token function">eq</span><span class="token punctuation">(</span><span class="token string">&quot;voucher_id&quot;</span><span class="token punctuation">,</span> voucherId<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">eq</span><span class="token punctuation">(</span><span class="token string">&quot;stock&quot;</span><span class="token punctuation">,</span> <span class="token number">0</span><span class="token punctuation">)</span>
                <span class="token punctuation">.</span><span class="token function">update</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>success<span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">return</span> <span class="token class-name">Result</span><span class="token punctuation">.</span><span class="token function">fail</span><span class="token punctuation">(</span><span class="token string">&quot;库存不足&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>

        <span class="token comment">// 7. 创建订单</span>
        <span class="token class-name">VoucherOrder</span> voucherOrder <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">VoucherOrder</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token comment">// 7.1 订单id</span>
        <span class="token keyword">long</span> orderId <span class="token operator">=</span> redisIdWorker<span class="token punctuation">.</span><span class="token function">nextId</span><span class="token punctuation">(</span><span class="token string">&quot;order&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        voucherOrder<span class="token punctuation">.</span><span class="token function">setId</span><span class="token punctuation">(</span>orderId<span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token comment">// 7.2 用户id</span>
        voucherOrder<span class="token punctuation">.</span><span class="token function">setUserId</span><span class="token punctuation">(</span>userId<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token comment">// 7.3 代金券id</span>
        voucherOrder<span class="token punctuation">.</span><span class="token function">setVoucherId</span><span class="token punctuation">(</span>voucherId<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token function">save</span><span class="token punctuation">(</span>voucherOrder<span class="token punctuation">)</span><span class="token punctuation">;</span>

        <span class="token comment">// 8 返回订单id</span>
        <span class="token keyword">return</span> <span class="token class-name">Result</span><span class="token punctuation">.</span><span class="token function">ok</span><span class="token punctuation">(</span>orderId<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,1),c=[e];function o(u,l){return s(),a("div",null,c)}const r=n(p,[["render",o],["__file","一人一单.html.vue"]]);export{r as default};
