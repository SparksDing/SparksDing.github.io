---
title: ngrok部署
isTimeLine: true
date: 2024-03-26
category:
  - 反向穿透
tag:
  - ngrok
---


## 安装GOLANG

```
wget -c https://dl.google.com/go/go1.14.2.linux-amd64.tar.gz -O - | sudo tar -xz -C /usr/local

vim ~/.bashrc
export GOROOT=/usr/local/go
export PATH=$PATH:$GOROOT/bin

source ~/.bashrc
```


## 安装ngrok

### 下载
```
git clone 对应repo
```

### 生成证书

```
NGROK_DOMAIN=公网服务器ip

cd ~
openssl rand -writerand .rnd

openssl genrsa -out rootCA.key 2048
openssl genrsa -out device.key 2048

openssl req -new -key device.key -subj "/CN=$NGROK_DOMAIN" -out device.csr
openssl req -x509 -new -nodes -key rootCA.key -subj "/CN=$NGROK_DOMAIN" -days 5000 -out rootCA.pem

echo subjectAltName = IP:你的公网IP > extfile.cnf
openssl x509 -req -in device.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -extfile extfile.cnf -out device.crt -days 5000

cp -r rootCA.pem assets/client/tls/ngrokroot.crt
cp -r device.crt assets/server/tls/snakeoil.crt
cp -r device.key assets/server/tls/snakeoil.key
```

### 编译服务端
```
GOOS=linux GOARCH=amd64 make release-server
```


### 运行服务端

```
./bin/ngrokd -domain=你的公网服务器ip -httpAddr=:8080 -tunnelAddr=:4443
```

### 编译客户端
```
GOOS=linux GOARCH=amd64 make release-client
```


### 客户端配置
```
server_addr: xx.xx.xx.xx:4443
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
```

配置里的remote_port需要在公网服务器的防火墙和安全组中都打开


### 运行客户端
```
./bin/ngrok -log=stdout -config ./bin/ngrok_http.cfg start openapi1 openapi
```

