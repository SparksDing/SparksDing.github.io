---
title: tomcat概述
isTimeLine: true
date: 2024-03-09
category:
  - java
tag:
  - tomcat
---


> Tomcat 是 Servlet容器。


Tomcat 是如何处理一个请求的？


### Tomcat xml配置样例
```xml
<?xml version='1.0' encoding='utf-8'?>
<Server port="8005" shutdown="SHUTDOWN">
  <Listener className="org.apache.catalina.core.AprLifecycleListener" SSLEngine="on" />
  <Listener className="org.apache.catalina.core.JasperListener" />
  <Listener className="org.apache.catalina.core.JreMemoryLeakPreventionListener" />
  <Listener className="org.apache.catalina.mbeans.GlobalResourcesLifecycleListener" />
  <Listener className="org.apache.catalina.core.ThreadLocalLeakPreventionListener" />
  <GlobalNamingResources>
    <Resource name="UserDatabase" auth="Container"
              type="org.apache.catalina.UserDatabase"
              description="User database that can be updated and saved"
              factory="org.apache.catalina.users.MemoryUserDatabaseFactory"
              pathname="conf/tomcat-users.xml" />
  </GlobalNamingResources>
  <Service name="Catalina">
    <Connector port="8080" protocol="HTTP/1.1"
              connectionTimeout="20000"
              redirectPort="8443" />
    <Connector port="8009" protocol="AJP/1.3" redirectPort="8443" />
    <Engine name="Catalina" defaultHost="localhost">
      <Realm className="org.apache.catalina.realm.LockOutRealm">
        <Realm className="org.apache.catalina.realm.UserDatabaseRealm"
                resourceName="UserDatabase"/>
      </Realm>
      <Host name="localhost"  appBase="webapps"
              unpackWARs="true" autoDeploy="true">
        <Context path="/zhouyu" docBase="/ideaProjects/HelloServelet/target/HelloServlet-1.0-SNAPSHOT" >
        <Valve className="org.apache.catalina.valves.AccessLogValve" directory="logs"
                prefix="localhost_access_log." suffix=".txt"
                pattern="%h %l %u %t &quot;%r&quot; %s %b" />
      </Host>
    </Engine>
  </Service>
</Server>
```


### Engine

Engine<--->集群

```java
List<Host> hosts
```

### Host

Host<--->虚拟主机

```java
List<Context> contexts
```

### Context

Context<--->应用 

```java
List<Wrapper> wrappers
```


### Wrapper

Wrapper<--->Servlet类型

```java
List<Servlet> servlets
```

### Tomcat处理一次http请求

![Tomcat处理http请求](/assets/images/java/awesome-project/tomcat/tomcat处理一次请求.png =700x)


### 参考文章

[Tomcat视角看一次http请求](https://www.cnblogs.com/runnable/p/12905401.html)

[聊聊Tomcat的架构设计](https://objcoding.com/2019/05/30/tomcat-architecture/)

[SpringBoot 系列-内嵌 Tomcat 的实现原理解析](https://juejin.cn/post/6844903957752446984)