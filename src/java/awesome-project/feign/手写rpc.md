---
title: 手写rpc
isTimeLine: true
date: 2024-03-17
category:
  - java
tag:
  - rpc
---

```
├── consumer
│   ├── pom.xml
│   └── src
│       ├── main
│       │   └── java
│       │       └── cn
│       │           └── sparks
│       │               └── Consumer.java #掉用方

├── dyqrpc
│   ├── pom.xml
│   └── src
│       ├── main
│       │   └── java
│       │       └── cn
│       │           └── sparks
│       │               ├── common
│       │               │   └── Invocation.java # 接口定义（可自定义如何序列化）
│       │               ├── protocol
│       │               │   ├── DispatchServlet.java # 自定义DispatchServlet
│       │               │   ├── HttpClient.java #  Client端，供调用方使用
│       │               │   ├── HttpServerHandler.java # 处理rpc调用请求
│       │               │   └── HttpServer.java # 这里用tomcat，也可以自己用Netty实现
│       │               └── register
│       │                   └── LocalRegister.java # 本地方法注册

├── pom.xml
├── producer
│   ├── pom.xml
│   └── src
│       ├── main
│       │   └── java
│       │       └── cn
│       │           └── sparks
│       │               ├── HelloServiceImpl.java
│       │               └── Provider.java # 服务提供方

├── producer-common
│   ├── pom.xml
│   └── src
│       ├── main
│       │   └── java
│       │       └── cn
│       │           └── sparks
│       │               └── HelloService.java # 服务提供方接口

```



RPC Client调用代码
```java
Invocation invocation = new Invocation(HelloService.class.getName(), "sayHello", new Class[]{String.class}, new Object[]{"dyq"});
HttpClient httpClient = new HttpClient();
String result = httpClient.send("localhost", 8080, invocation);
System.out.println(result);
```

RPC 框架提供的Client
```java
public class HttpClient {
    public String send(String hostname, Integer port, Invocation invocation) {
        // 用户的配置
        try {
            URL url = new URL("http", hostname, port, "/");
            HttpURLConnection httpURLConnection = (HttpURLConnection) url.openConnection();

            httpURLConnection.setRequestMethod("POST");
            httpURLConnection.setDoOutput(true);

            OutputStream outputStream = httpURLConnection.getOutputStream();
            ObjectOutputStream oos = new ObjectOutputStream(outputStream);

            oos.writeObject(invocation);
            oos.flush();
            oos.close();

            InputStream inputStream = httpURLConnection.getInputStream();
            String result = IOUtils.toString(inputStream);
            return result;
        } catch (MalformedURLException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }

        return null;
    }
}

```


RPC 框架的Handler
```java
public class HttpServerHandler {
    public void handler(HttpServletRequest req, HttpServletResponse resp) {
        // 处理请求 -- 接口、方法、方法参数
        // 
        try {
            Invocation invocation = (Invocation) new ObjectInputStream(req.getInputStream()).readObject();
            String interfaceName = invocation.getInterfaceName();
            System.out.println(interfaceName);
            Class classImpl = LocalRegister.get(interfaceName);
            System.out.println(classImpl);
            Method method = classImpl.getMethod(invocation.getMethodName(), invocation.getParameterTypes());
            String result = (String) method.invoke(classImpl.newInstance(), invocation.getParameters());
            
            IOUtils.write(result, resp.getOutputStream());
        } catch (IOException e) {
            e.printStackTrace();
        } catch (ClassNotFoundException e) {
            e.printStackTrace();    
        } catch (NoSuchMethodException e) {
            e.printStackTrace();
        } catch (InvocationTargetException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (InstantiationException e) {
            e.printStackTrace();
        }
    }
}
```