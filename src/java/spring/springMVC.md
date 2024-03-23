---
title: spring MVC原理解析
isTimeLine: true
date: 2024-03-21
category:
  - java
tag:
  - spring
  - springMVC
---


![tomcat架构](/assets/images/java/spring/tomcat架构.png =600x)


http://localhost:8080/SpringMVCTest_war_exploded/app/test


DispatcherServlet的父类FrameworkServlet中有Spring容器


![dispatch_servlet的IOC容器](/assets/images/java/spring/dispatch_servlet的IOC容器.png)


## 创建流程

1. 启动Tomcat
2. 创建DispatcherServlet
3. DispatcherServlet.init()--->创建Spring容器--->ContextRefreshedEvent--->onApplicationEvent()
4. onRefresh()
   1. 初始化HandlerMapping
      1. 创建RequestMappingHandlerMapping的Bean对象--->afterPropertiesSet()
      2. 创建BeanNameUrlHandlerMapping的Bean对象--->afterPropertiesSet()
   2. 初始化HandlerAdapter 

```
Handler
1. @RequestMapping注解的方法
2. Controller接口类型的Bean对象
3. HttpRequestHandler接口类型的Bean对象
4. RouterFunction类型的Bean对象
```


```
HandlerMapping<--->Map<Path, Handler对象>

1. RequestMappingHandlerMapping: 处理@RequestMapping注解的方法
2. BeanNameUrlHandlerMapping: 处理实现HttpRequestHandler接口类型的Bean对象
3. RouterFunctionMapping: 处理RouterFunction


```



## 对应源码

```java
public abstract class HttpServletBean extends HttpServlet implements EnvironmentCapable, EnvironmentAware {

  @Override
	public final void init() throws ServletException {

		// Set bean properties from init parameters.
		PropertyValues pvs = new ServletConfigPropertyValues(getServletConfig(), this.requiredProperties);
		if (!pvs.isEmpty()) {
			try {
				BeanWrapper bw = PropertyAccessorFactory.forBeanPropertyAccess(this);
				ResourceLoader resourceLoader = new ServletContextResourceLoader(getServletContext());
				bw.registerCustomEditor(Resource.class, new ResourceEditor(resourceLoader, getEnvironment()));
				initBeanWrapper(bw);
				bw.setPropertyValues(pvs, true);
			}
			catch (BeansException ex) {
				if (logger.isErrorEnabled()) {
					logger.error("Failed to set bean properties on servlet '" + getServletName() + "'", ex);
				}
				throw ex;
			}
		}

		// Let subclasses do whatever initialization they like.
		initServletBean();
	}

}
```

FrameworkServlet initServletBean中创建Spring容器

```java
public abstract class FrameworkServlet extends HttpServletBean implements ApplicationContextAware {

  @Override
	protected final void initServletBean() throws ServletException {
		getServletContext().log("Initializing Spring " + getClass().getSimpleName() + " '" + getServletName() + "'");
		if (logger.isInfoEnabled()) {
			logger.info("Initializing Servlet '" + getServletName() + "'");
		}
		long startTime = System.currentTimeMillis();

		try {
			this.webApplicationContext = initWebApplicationContext();
			initFrameworkServlet();
		}
		catch (ServletException | RuntimeException ex) {
			logger.error("Context initialization failed", ex);
			throw ex;
		}

		if (logger.isDebugEnabled()) {
			String value = this.enableLoggingRequestDetails ?
					"shown which may lead to unsafe logging of potentially sensitive data" :
					"masked to prevent unsafe logging of potentially sensitive data";
			logger.debug("enableLoggingRequestDetails='" + this.enableLoggingRequestDetails +
					"': request parameters and headers will be " + value);
		}

		if (logger.isInfoEnabled()) {
			logger.info("Completed initialization in " + (System.currentTimeMillis() - startTime) + " ms");
		}
	}

}
```


ContextRefreshedEvent--->onApplicationEvent()--->onRefresh()


```java
public class DispatcherServlet extends FrameworkServlet {

  protected void initStrategies(ApplicationContext context) {
      this.initMultipartResolver(context);
      this.initLocaleResolver(context);
      this.initThemeResolver(context);
      this.initHandlerMappings(context);
      this.initHandlerAdapters(context);
      this.initHandlerExceptionResolvers(context);
      this.initRequestToViewNameTranslator(context);
      this.initViewResolvers(context);
      this.initFlashMapManager(context);
  }

  protected void onRefresh(ApplicationContext context) {
      this.initStrategies(context);
  }
}
```


## SpringMVC处理请求流程

```java
public class DispatcherServlet extends FrameworkServlet {
  protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
      HttpServletRequest processedRequest = request;
      HandlerExecutionChain mappedHandler = null;
      boolean multipartRequestParsed = false;
      WebAsyncManager asyncManager = WebAsyncUtils.getAsyncManager(request);

      try {
          try {
              ModelAndView mv = null;
              Exception dispatchException = null;

              try {
                  processedRequest = this.checkMultipart(request);
                  multipartRequestParsed = processedRequest != request;
                  mappedHandler = this.getHandler(processedRequest);
                  if (mappedHandler == null) {
                      this.noHandlerFound(processedRequest, response);
                      return;
                  }

                  HandlerAdapter ha = this.getHandlerAdapter(mappedHandler.getHandler());
                  String method = request.getMethod();
                  boolean isGet = HttpMethod.GET.matches(method);
                  if (isGet || HttpMethod.HEAD.matches(method)) {
                      long lastModified = ha.getLastModified(request, mappedHandler.getHandler());
                      if ((new ServletWebRequest(request, response)).checkNotModified(lastModified) && isGet) {
                          return;
                      }
                  }

                  if (!mappedHandler.applyPreHandle(processedRequest, response)) {
                      return;
                  }

                  mv = ha.handle(processedRequest, response, mappedHandler.getHandler());
                  if (asyncManager.isConcurrentHandlingStarted()) {
                      return;
                  }

                  this.applyDefaultViewName(processedRequest, mv);
                  mappedHandler.applyPostHandle(processedRequest, response, mv);
              } catch (Exception var20) {
                  dispatchException = var20;
              } catch (Throwable var21) {
                  dispatchException = new NestedServletException("Handler dispatch failed", var21);
              }

              this.processDispatchResult(processedRequest, response, mappedHandler, mv, (Exception)dispatchException);
          } catch (Exception var22) {
              this.triggerAfterCompletion(processedRequest, response, mappedHandler, var22);
          } catch (Throwable var23) {
              this.triggerAfterCompletion(processedRequest, response, mappedHandler, new NestedServletException("Handler processing failed", var23));
          }

      } finally {
          if (asyncManager.isConcurrentHandlingStarted()) {
              if (mappedHandler != null) {
                  mappedHandler.applyAfterConcurrentHandlingStarted(processedRequest, response);
              }
          } else if (multipartRequestParsed) {
              this.cleanupMultipart(processedRequest);
          }

      }
  }
}
```

|adapter|对应handler|
|:-:|:-:|
|HttpRequestHandlerAdapter|HttpRequestHandler|
|SimpleControllerHandlerAdapter|Controller|
|RequestMappingHandlerAdapter|HandlerMethod|
|HandlerFunctionAdapter|RouterFunction|


getHandler方法从初始化建立的Map中找到对应的handler

getHandlerAdapter方法查看handler实现了哪个adapter的接口

执行adapter的handle方法

handle方法前面还有参数解析的过程

```java
public class RequestMappingHandlerAdapter extends AbstractHandlerMethodAdapter
		implements BeanFactoryAware, InitializingBean {

  private List<HandlerMethodArgumentResolver> getDefaultArgumentResolvers() {
		List<HandlerMethodArgumentResolver> resolvers = new ArrayList<>(30);

		// Annotation-based argument resolution
		resolvers.add(new RequestParamMethodArgumentResolver(getBeanFactory(), false));
		resolvers.add(new RequestParamMapMethodArgumentResolver());
		resolvers.add(new PathVariableMethodArgumentResolver());
		resolvers.add(new PathVariableMapMethodArgumentResolver());
		resolvers.add(new MatrixVariableMethodArgumentResolver());
		resolvers.add(new MatrixVariableMapMethodArgumentResolver());
		resolvers.add(new ServletModelAttributeMethodProcessor(false));
		resolvers.add(new RequestResponseBodyMethodProcessor(getMessageConverters(), this.requestResponseBodyAdvice));
		resolvers.add(new RequestPartMethodArgumentResolver(getMessageConverters(), this.requestResponseBodyAdvice));
		resolvers.add(new RequestHeaderMethodArgumentResolver(getBeanFactory()));
		resolvers.add(new RequestHeaderMapMethodArgumentResolver());
		resolvers.add(new ServletCookieValueMethodArgumentResolver(getBeanFactory()));
		resolvers.add(new ExpressionValueMethodArgumentResolver(getBeanFactory()));
		resolvers.add(new SessionAttributeMethodArgumentResolver());
		resolvers.add(new RequestAttributeMethodArgumentResolver());

		// Type-based argument resolution
		resolvers.add(new ServletRequestMethodArgumentResolver());
		resolvers.add(new ServletResponseMethodArgumentResolver());
		resolvers.add(new HttpEntityMethodProcessor(getMessageConverters(), this.requestResponseBodyAdvice));
		resolvers.add(new RedirectAttributesMethodArgumentResolver());
		resolvers.add(new ModelMethodProcessor());
		resolvers.add(new MapMethodProcessor());
		resolvers.add(new ErrorsMethodArgumentResolver());
		resolvers.add(new SessionStatusMethodArgumentResolver());
		resolvers.add(new UriComponentsBuilderMethodArgumentResolver());
		if (KotlinDetector.isKotlinPresent()) {
			resolvers.add(new ContinuationHandlerMethodArgumentResolver());
		}

		// Custom arguments
		if (getCustomArgumentResolvers() != null) {
			resolvers.addAll(getCustomArgumentResolvers());
		}

		// Catch-all
		resolvers.add(new PrincipalMethodArgumentResolver());
		resolvers.add(new RequestParamMethodArgumentResolver(getBeanFactory(), true));
		resolvers.add(new ServletModelAttributeMethodProcessor(true));

		return resolvers;
	}

}
```



### 参考网页

[IDEA2022 搭建SpringMVC最新教程](https://blog.csdn.net/LiuNengJing/article/details/125888494)