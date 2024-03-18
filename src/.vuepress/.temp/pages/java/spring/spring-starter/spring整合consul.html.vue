<template><div><h3 id="安装" tabindex="-1"><a class="header-anchor" href="#安装" aria-hidden="true">#</a> 安装</h3>
<div class="language-text line-numbers-mode" data-ext="text"><pre v-pre class="language-text"><code>brew tap hashicorp/tap
brew install hashicorp/tap/consul

To start hashicorp/tap/consul now and restart at login:
  brew services start hashicorp/tap/consul
Or, if you don't want/need a background service you can just run:
  /usr/local/opt/consul/bin/consul agent -dev -bind 127.0.0.1
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="参考文章" tabindex="-1"><a class="header-anchor" href="#参考文章" aria-hidden="true">#</a> 参考文章</h3>
<p><a href="https://kingfree.gitbook.io/consul/getting-started/install" target="_blank" rel="noopener noreferrer">安装consul<ExternalLinkIcon/></a></p>
<p><a href="https://blog.csdn.net/qq_37493888/article/details/124850972" target="_blank" rel="noopener noreferrer">spring集成consul<ExternalLinkIcon/></a></p>
<p><a href="https://blog.csdn.net/qq_38658567/article/details/112478643" target="_blank" rel="noopener noreferrer">consul源码分析<ExternalLinkIcon/></a></p>
</div></template>


