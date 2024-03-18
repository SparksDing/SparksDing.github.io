---
title: spring整合consul
isTimeLine: true
date: 2024-03-17
category:
  - java
tag:
  - spring
  - consul
  - 注册中心
---


### 安装
```
brew tap hashicorp/tap
brew install hashicorp/tap/consul

To start hashicorp/tap/consul now and restart at login:
  brew services start hashicorp/tap/consul
Or, if you don't want/need a background service you can just run:
  /usr/local/opt/consul/bin/consul agent -dev -bind 127.0.0.1
```

### 参考文章

[安装consul](https://kingfree.gitbook.io/consul/getting-started/install)

[spring集成consul](https://blog.csdn.net/qq_37493888/article/details/124850972)


[consul源码分析](https://blog.csdn.net/qq_38658567/article/details/112478643)