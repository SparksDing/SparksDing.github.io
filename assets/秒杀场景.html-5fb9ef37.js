const n=JSON.parse('{"key":"v-571e5c82","path":"/java/bussiness-design/%E7%A7%92%E6%9D%80%E5%9C%BA%E6%99%AF.html","title":"秒杀场景","lang":"zh-CN","frontmatter":{"title":"秒杀场景","isTimeLine":true,"date":"2024-03-08T00:00:00.000Z","category":["java"],"tag":["design"],"description":"秒杀优惠券流程 @Override @Transactional public Result seckillVoucher(Long voucherId) { // 1. 查询优惠券 SeckillVoucher voucher = seckillVoucherService.getById(voucherId); // 2. 判断秒杀是否开发 if(voucher.getBeginTime().isAfter(LocalDateTime.now())) { return Result.fail(\\"秒杀未开始\\"); } // 3. 判断秒杀是否已经结束 if(voucher.getBeginTime().isBefore(LocalDateTime.now())) { return Result.fail(\\"秒杀已结束\\"); } // 4. 判断库存是否充足 if (voucher.getStock() &lt; 1) { return Result.fail(\\"库存不足\\"); } // 5. 扣减库存 boolean success = seckillVoucherService.update(). setSql(\\"stock = stock - 1\\"). eq(\\"voucher_id\\", voucherId).update(); if (!success) { return Result.fail(\\"库存不足\\"); } // 6. 创建订单 VoucherOrder voucherOrder = new VoucherOrder(); // 6.1 订单id long orderId = redisIdWorker.nextId(\\"order\\"); voucherOrder.setId(orderId); // 6.2 用户id Long userId = UserHolder.getUser().getId(); voucherOrder.setUserId(userId); // 6.3 代金券id voucherOrder.setVoucherId(voucherId); save(voucherOrder); // 7 返回订单id return Result.ok(orderId); }","head":[["meta",{"property":"og:url","content":"https://sparksding.github.io/blogs/java/bussiness-design/%E7%A7%92%E6%9D%80%E5%9C%BA%E6%99%AF.html"}],["meta",{"property":"og:site_name","content":"还不知道叫什么名字"}],["meta",{"property":"og:title","content":"秒杀场景"}],["meta",{"property":"og:description","content":"秒杀优惠券流程 @Override @Transactional public Result seckillVoucher(Long voucherId) { // 1. 查询优惠券 SeckillVoucher voucher = seckillVoucherService.getById(voucherId); // 2. 判断秒杀是否开发 if(voucher.getBeginTime().isAfter(LocalDateTime.now())) { return Result.fail(\\"秒杀未开始\\"); } // 3. 判断秒杀是否已经结束 if(voucher.getBeginTime().isBefore(LocalDateTime.now())) { return Result.fail(\\"秒杀已结束\\"); } // 4. 判断库存是否充足 if (voucher.getStock() &lt; 1) { return Result.fail(\\"库存不足\\"); } // 5. 扣减库存 boolean success = seckillVoucherService.update(). setSql(\\"stock = stock - 1\\"). eq(\\"voucher_id\\", voucherId).update(); if (!success) { return Result.fail(\\"库存不足\\"); } // 6. 创建订单 VoucherOrder voucherOrder = new VoucherOrder(); // 6.1 订单id long orderId = redisIdWorker.nextId(\\"order\\"); voucherOrder.setId(orderId); // 6.2 用户id Long userId = UserHolder.getUser().getId(); voucherOrder.setUserId(userId); // 6.3 代金券id voucherOrder.setVoucherId(voucherId); save(voucherOrder); // 7 返回订单id return Result.ok(orderId); }"}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2024-03-12T03:37:13.000Z"}],["meta",{"property":"article:author","content":"还不知道叫什么名字"}],["meta",{"property":"article:tag","content":"design"}],["meta",{"property":"article:published_time","content":"2024-03-08T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2024-03-12T03:37:13.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"秒杀场景\\",\\"image\\":[\\"\\"],\\"datePublished\\":\\"2024-03-08T00:00:00.000Z\\",\\"dateModified\\":\\"2024-03-12T03:37:13.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"还不知道叫什么名字\\",\\"url\\":\\"https://sparksding.github.io/blogs\\"}]}"]]},"headers":[{"level":3,"title":"解决方案","slug":"解决方案","link":"#解决方案","children":[]},{"level":3,"title":"悲观锁","slug":"悲观锁","link":"#悲观锁","children":[]},{"level":3,"title":"乐观锁","slug":"乐观锁","link":"#乐观锁","children":[]}],"git":{"createdTime":1710214633000,"updatedTime":1710214633000,"contributors":[{"name":"sparksd","email":"sparks23332@163.com","commits":1}]},"readingTime":{"minutes":0.91,"words":273},"filePathRelative":"java/bussiness-design/秒杀场景.md","localizedDate":"2024年3月8日","excerpt":"<figure><img src=\\"/assets/images/java/bussiness-design/秒杀优惠券.png\\" alt=\\"秒杀优惠券流程\\" width=\\"500\\" tabindex=\\"0\\" loading=\\"lazy\\"><figcaption>秒杀优惠券流程</figcaption></figure>\\n<div class=\\"language-java line-numbers-mode\\" data-ext=\\"java\\"><pre class=\\"language-java\\"><code><span class=\\"token annotation punctuation\\">@Override</span>\\n<span class=\\"token annotation punctuation\\">@Transactional</span>\\n<span class=\\"token keyword\\">public</span> <span class=\\"token class-name\\">Result</span> <span class=\\"token function\\">seckillVoucher</span><span class=\\"token punctuation\\">(</span><span class=\\"token class-name\\">Long</span> voucherId<span class=\\"token punctuation\\">)</span> <span class=\\"token punctuation\\">{</span>\\n    <span class=\\"token comment\\">// 1. 查询优惠券</span>\\n    <span class=\\"token class-name\\">SeckillVoucher</span> voucher <span class=\\"token operator\\">=</span> seckillVoucherService<span class=\\"token punctuation\\">.</span><span class=\\"token function\\">getById</span><span class=\\"token punctuation\\">(</span>voucherId<span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n\\n    <span class=\\"token comment\\">// 2. 判断秒杀是否开发</span>\\n    <span class=\\"token keyword\\">if</span><span class=\\"token punctuation\\">(</span>voucher<span class=\\"token punctuation\\">.</span><span class=\\"token function\\">getBeginTime</span><span class=\\"token punctuation\\">(</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">.</span><span class=\\"token function\\">isAfter</span><span class=\\"token punctuation\\">(</span><span class=\\"token class-name\\">LocalDateTime</span><span class=\\"token punctuation\\">.</span><span class=\\"token function\\">now</span><span class=\\"token punctuation\\">(</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">)</span> <span class=\\"token punctuation\\">{</span>\\n        <span class=\\"token keyword\\">return</span> <span class=\\"token class-name\\">Result</span><span class=\\"token punctuation\\">.</span><span class=\\"token function\\">fail</span><span class=\\"token punctuation\\">(</span><span class=\\"token string\\">\\"秒杀未开始\\"</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n    <span class=\\"token punctuation\\">}</span>\\n\\n    <span class=\\"token comment\\">// 3. 判断秒杀是否已经结束</span>\\n    <span class=\\"token keyword\\">if</span><span class=\\"token punctuation\\">(</span>voucher<span class=\\"token punctuation\\">.</span><span class=\\"token function\\">getBeginTime</span><span class=\\"token punctuation\\">(</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">.</span><span class=\\"token function\\">isBefore</span><span class=\\"token punctuation\\">(</span><span class=\\"token class-name\\">LocalDateTime</span><span class=\\"token punctuation\\">.</span><span class=\\"token function\\">now</span><span class=\\"token punctuation\\">(</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">)</span> <span class=\\"token punctuation\\">{</span>\\n        <span class=\\"token keyword\\">return</span> <span class=\\"token class-name\\">Result</span><span class=\\"token punctuation\\">.</span><span class=\\"token function\\">fail</span><span class=\\"token punctuation\\">(</span><span class=\\"token string\\">\\"秒杀已结束\\"</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n    <span class=\\"token punctuation\\">}</span>\\n\\n    <span class=\\"token comment\\">// 4. 判断库存是否充足</span>\\n    <span class=\\"token keyword\\">if</span> <span class=\\"token punctuation\\">(</span>voucher<span class=\\"token punctuation\\">.</span><span class=\\"token function\\">getStock</span><span class=\\"token punctuation\\">(</span><span class=\\"token punctuation\\">)</span> <span class=\\"token operator\\">&lt;</span> <span class=\\"token number\\">1</span><span class=\\"token punctuation\\">)</span> <span class=\\"token punctuation\\">{</span>\\n        <span class=\\"token keyword\\">return</span> <span class=\\"token class-name\\">Result</span><span class=\\"token punctuation\\">.</span><span class=\\"token function\\">fail</span><span class=\\"token punctuation\\">(</span><span class=\\"token string\\">\\"库存不足\\"</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n    <span class=\\"token punctuation\\">}</span>\\n\\n    <span class=\\"token comment\\">// 5. 扣减库存</span>\\n    <span class=\\"token keyword\\">boolean</span> success <span class=\\"token operator\\">=</span> seckillVoucherService<span class=\\"token punctuation\\">.</span><span class=\\"token function\\">update</span><span class=\\"token punctuation\\">(</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">.</span>\\n            <span class=\\"token function\\">setSql</span><span class=\\"token punctuation\\">(</span><span class=\\"token string\\">\\"stock = stock - 1\\"</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">.</span>\\n            <span class=\\"token function\\">eq</span><span class=\\"token punctuation\\">(</span><span class=\\"token string\\">\\"voucher_id\\"</span><span class=\\"token punctuation\\">,</span> voucherId<span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">.</span><span class=\\"token function\\">update</span><span class=\\"token punctuation\\">(</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n\\n    <span class=\\"token keyword\\">if</span> <span class=\\"token punctuation\\">(</span><span class=\\"token operator\\">!</span>success<span class=\\"token punctuation\\">)</span> <span class=\\"token punctuation\\">{</span>\\n        <span class=\\"token keyword\\">return</span> <span class=\\"token class-name\\">Result</span><span class=\\"token punctuation\\">.</span><span class=\\"token function\\">fail</span><span class=\\"token punctuation\\">(</span><span class=\\"token string\\">\\"库存不足\\"</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n    <span class=\\"token punctuation\\">}</span>\\n\\n    <span class=\\"token comment\\">// 6. 创建订单</span>\\n    <span class=\\"token class-name\\">VoucherOrder</span> voucherOrder <span class=\\"token operator\\">=</span> <span class=\\"token keyword\\">new</span> <span class=\\"token class-name\\">VoucherOrder</span><span class=\\"token punctuation\\">(</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n    <span class=\\"token comment\\">// 6.1 订单id</span>\\n    <span class=\\"token keyword\\">long</span> orderId <span class=\\"token operator\\">=</span> redisIdWorker<span class=\\"token punctuation\\">.</span><span class=\\"token function\\">nextId</span><span class=\\"token punctuation\\">(</span><span class=\\"token string\\">\\"order\\"</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n    voucherOrder<span class=\\"token punctuation\\">.</span><span class=\\"token function\\">setId</span><span class=\\"token punctuation\\">(</span>orderId<span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n\\n    <span class=\\"token comment\\">// 6.2 用户id</span>\\n    <span class=\\"token class-name\\">Long</span> userId <span class=\\"token operator\\">=</span> <span class=\\"token class-name\\">UserHolder</span><span class=\\"token punctuation\\">.</span><span class=\\"token function\\">getUser</span><span class=\\"token punctuation\\">(</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">.</span><span class=\\"token function\\">getId</span><span class=\\"token punctuation\\">(</span><span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n    voucherOrder<span class=\\"token punctuation\\">.</span><span class=\\"token function\\">setUserId</span><span class=\\"token punctuation\\">(</span>userId<span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n    <span class=\\"token comment\\">// 6.3 代金券id</span>\\n    voucherOrder<span class=\\"token punctuation\\">.</span><span class=\\"token function\\">setVoucherId</span><span class=\\"token punctuation\\">(</span>voucherId<span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n    <span class=\\"token function\\">save</span><span class=\\"token punctuation\\">(</span>voucherOrder<span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n\\n    <span class=\\"token comment\\">// 7 返回订单id</span>\\n    <span class=\\"token keyword\\">return</span> <span class=\\"token class-name\\">Result</span><span class=\\"token punctuation\\">.</span><span class=\\"token function\\">ok</span><span class=\\"token punctuation\\">(</span>orderId<span class=\\"token punctuation\\">)</span><span class=\\"token punctuation\\">;</span>\\n<span class=\\"token punctuation\\">}</span>\\n</code></pre><div class=\\"line-numbers\\" aria-hidden=\\"true\\"><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div><div class=\\"line-number\\"></div></div></div>","autoDesc":true}');export{n as data};
