<template><div><h3 id="推断构造方法" tabindex="-1"><a class="header-anchor" href="#推断构造方法" aria-hidden="true">#</a> 推断构造方法</h3>
<ul>
<li>有无参构造方法则用无参构造方法</li>
<li>没有无参构造方法
<ul>
<li>存在多个构造方法-&gt;异常</li>
<li>存在一个-&gt;Spring查找参数中的对象是否存在(byType,byName)-&gt;不存在则异常</li>
</ul>
</li>
</ul>
<h3 id="beannameaware-beanfactoryaware-applicationcontextaware" tabindex="-1"><a class="header-anchor" href="#beannameaware-beanfactoryaware-applicationcontextaware" aria-hidden="true">#</a> BeanNameAware, BeanFactoryAware, ApplicationContextAware</h3>
<table>
<thead>
<tr>
<th style="text-align:center">实现接口</th>
<th style="text-align:center">作用</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align:center">BeanNameAware</td>
<td style="text-align:center">重写setBeanName方法</td>
</tr>
<tr>
<td style="text-align:center">BeanFactoryAware</td>
<td style="text-align:center">重写setBeanFactory获取beanFactory</td>
</tr>
<tr>
<td style="text-align:center">ApplicationContextAware</td>
<td style="text-align:center">重写setApplicationContext获取applicationContext</td>
</tr>
</tbody>
</table>
</div></template>


