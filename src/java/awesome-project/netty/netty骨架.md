---
title: netty骨架(自己实现的netty)
isTimeLine: true
date: 2024-03-09
category:
  - java
tag:
  - netty
---




![netty线程模型](/assets/images/java/awesome-project/netty/netty_workflow.png =700x)


![register时序](/assets/images/java/awesome-project/netty/SingleThreadEventLoop_register.png =500x)

doStartThread方法会将SingleThreadEventExecutor.this.run()提交到线程池中执行，而该run方法由NioEventLoop负责实现。


### 各个类的功能

|类|功能|
|:-:|:-:|
|NioEventLoop|事件循环---专注于处理事件(定义了处理事件的逻辑)，与如何运行、如何调度无关|
|NioEventLoopGroup|NioEventLoop的管理器|
|EventLoop|任务执行器|
|EventLoopGroup|EventLoop的管理器|
|EventExecutor|任务调度器|
|EventExecutorGroup|管理EventExecutor|
|MultithreadEventExecutorGroup|EventExecutorGroup的实现类|
|SingleThreadEventLoop|任务执行器的实现|
|SingleThreadEventExecutor|任务调度器的实现|


![EventExecutor](/assets/images/java/awesome-project/netty/netty_event_executor.png =700x)


### Channel

```java
public interface Channel {

    //该方法很重要，我们都知道，一个selector可以注册多个channel，但是一个channel只能对应
    //一个selector，一个selector对应着一个单线程执行器，所以一个channel就会对应一个单线程执行器
    //该方法就是用来得到该channel对应的单线程执行器
    EventLoop eventLoop();

    /**
     * @Author: PP-jessica
     * @Description:该方法并不在此接口，而是在ChannelOutboundInvoker接口，现在先放在这里
     */
    ChannelFuture close();

    /**
     * @Author: PP-jessica
     * @Description:该方法并不在此接口，而是在ChannelOutboundInvoker接口，现在先放在这里
     */
    void bind(SocketAddress localAddress, ChannelPromise promise);

    /**
     * @Author: PP-jessica
     * @Description:该方法并不在此接口，而是在ChannelOutboundInvoker接口，现在先放在这里
     */
    void connect(SocketAddress remoteAddress, final SocketAddress localAddress,ChannelPromise promise);


    //新增加的方法
    public final void register(EventLoop eventLoop);

}
```


![Channel实现类以及子类](/assets/images/java/awesome-project/netty/netty_channel.png =500x)



### 参考文章
[Netty之EventLoop](https://www.cnblogs.com/sfnz/p/15138279.html)