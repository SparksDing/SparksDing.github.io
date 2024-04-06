import{_ as e}from"./plugin-vue_export-helper-c27b6911.js";import{o as n,c as i,f as a}from"./app-d932bdb6.js";const d={},s=a(`<h2 id="安装golang" tabindex="-1"><a class="header-anchor" href="#安装golang" aria-hidden="true">#</a> 安装GOLANG</h2><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>wget -c https://dl.google.com/go/go1.14.2.linux-amd64.tar.gz -O - | sudo tar -xz -C /usr/local

vim ~/.bashrc
export GOROOT=/usr/local/go
export PATH=$PATH:$GOROOT/bin

source ~/.bashrc
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="安装ngrok" tabindex="-1"><a class="header-anchor" href="#安装ngrok" aria-hidden="true">#</a> 安装ngrok</h2><h3 id="下载" tabindex="-1"><a class="header-anchor" href="#下载" aria-hidden="true">#</a> 下载</h3><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>git clone 对应repo
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h3 id="生成证书" tabindex="-1"><a class="header-anchor" href="#生成证书" aria-hidden="true">#</a> 生成证书</h3><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>NGROK_DOMAIN=公网服务器ip

cd ~
openssl rand -writerand .rnd

openssl genrsa -out rootCA.key 2048
openssl genrsa -out device.key 2048

openssl req -new -key device.key -subj &quot;/CN=$NGROK_DOMAIN&quot; -out device.csr
openssl req -x509 -new -nodes -key rootCA.key -subj &quot;/CN=$NGROK_DOMAIN&quot; -days 5000 -out rootCA.pem

echo subjectAltName = IP:你的公网IP &gt; extfile.cnf
openssl x509 -req -in device.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -extfile extfile.cnf -out device.crt -days 5000

cp -r rootCA.pem assets/client/tls/ngrokroot.crt
cp -r device.crt assets/server/tls/snakeoil.crt
cp -r device.key assets/server/tls/snakeoil.key
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="编译服务端" tabindex="-1"><a class="header-anchor" href="#编译服务端" aria-hidden="true">#</a> 编译服务端</h3><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>GOOS=linux GOARCH=amd64 make release-server
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h3 id="运行服务端" tabindex="-1"><a class="header-anchor" href="#运行服务端" aria-hidden="true">#</a> 运行服务端</h3><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>./bin/ngrokd -domain=你的公网服务器ip -httpAddr=:8080 -tunnelAddr=:4443
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h3 id="编译客户端" tabindex="-1"><a class="header-anchor" href="#编译客户端" aria-hidden="true">#</a> 编译客户端</h3><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>GOOS=linux GOARCH=amd64 make release-client
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h3 id="客户端配置" tabindex="-1"><a class="header-anchor" href="#客户端配置" aria-hidden="true">#</a> 客户端配置</h3><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>server_addr: xx.xx.xx.xx:4443
trust_host_root_certs: false
tunnels:
  openapi1:
    remote_port: 9026
    proto:
      tcp: 8081

  openapi:
    remote_port: 9025
    proto:
      tcp: 8082
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>配置里的remote_port需要在公网服务器的防火墙和安全组中都打开</p><h3 id="运行客户端" tabindex="-1"><a class="header-anchor" href="#运行客户端" aria-hidden="true">#</a> 运行客户端</h3><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>./bin/ngrok -log=stdout -config ./bin/ngrok_http.cfg start openapi1 openapi
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div>`,18),r=[s];function l(t,c){return n(),i("div",null,r)}const u=e(d,[["render",l],["__file","ngrok部署.html.vue"]]);export{u as default};
