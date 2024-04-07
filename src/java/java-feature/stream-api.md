---
title: stream-api
isTimeLine: true
date: 2024-04-07
category:
  - java
tag:
  - java-feature
---


### filter

只保留满足特定条件的元素

示例
```java
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David", "Eva", "Frank");

        // 使用filter方法保留长度大于3的名字
        List<String> longNames = names.stream()
                .filter(name -> name.length() > 3)
                .collect(Collectors.toList());

        longNames.forEach(System.out::println);
    }
}
```


### collect
`collect` 是 Java Stream API 中的一个终端操作，用于将流中的元素收集到一个集合或其他数据结构中。通过 `collect` 方法，可以将流中的元素转换为一个列表、集合、映射等数据结构，以便于后续处理或操作。

下面是一些常见的 `collect` 方法的用法及示例：

1. 转换为 List：
```java
List<String> names = Stream.of("Alice", "Bob", "Charlie")
    .collect(Collectors.toList());
```

2. 转换为 Set：
```java
Set<String> nameSet = Stream.of("Alice", "Bob", "Charlie")
    .collect(Collectors.toSet());
```

3. 转换为 Map：
```java
Map<Integer, String> nameMap = Stream.of("Alice", "Bob", "Charlie")
    .collect(Collectors.toMap(String::length, s -> s));
```

4. 指定集合类型收集：
```java
LinkedList<String> nameList = Stream.of("Alice", "Bob", "Charlie")
    .collect(Collectors.toCollection(LinkedList::new));
```

5. 字符串连接：
```java
String result = Stream.of("Alice", "Bob", "Charlie")
    .collect(Collectors.joining(", "));
```

6. 分组：
```java
Map<Integer, List<String>> groupedByLength = Stream.of("Alice", "Bob", "Charlie")
    .collect(Collectors.groupingBy(String::length));
```

7. 统计汇总：
```java
IntSummaryStatistics stats = Stream.of(1, 2, 3, 4, 5)
    .collect(Collectors.summarizingInt(Integer::intValue));
```

这些示例展示了一些常见的 `collect` 方法的用法，可以将流中的元素收集到不同类型的集合或进行其他处理。



### flatMap

`flatMap` 是 Java Stream API 中的一个中间操作，它用于将流的每个元素映射为一个流，并将所有映射的流扁平化为单个流。这意味着它可以将一个元素映射为多个元素，然后将这些元素合并到一个流中。

以下是一些常见的 `flatMap` 方法的用法及示例：

1. 将列表转换为流：
```java
List<List<String>> list = Arrays.asList(
    Arrays.asList("a", "b"),
    Arrays.asList("c", "d"),
    Arrays.asList("e", "f")
);
List<String> result = list.stream()
    .flatMap(Collection::stream)
    .collect(Collectors.toList());
// 结果为 ["a", "b", "c", "d", "e", "f"]
```

2. 从对象中提取流：
```java
List<Person> persons = Arrays.asList(
    new Person("Alice", Arrays.asList("Java", "Python")),
    new Person("Bob", Arrays.asList("C++", "JavaScript"))
);
List<String> languages = persons.stream()
    .map(Person::getLanguages)
    .flatMap(List::stream)
    .collect(Collectors.toList());
// 结果为 ["Java", "Python", "C++", "JavaScript"]
```

3. 嵌套流扁平化：
```java
List<List<List<Integer>>> numbers = Arrays.asList(
    Arrays.asList(
        Arrays.asList(1, 2),
        Arrays.asList(3, 4)
    ),
    Arrays.asList(
        Arrays.asList(5, 6),
        Arrays.asList(7, 8)
    )
);
List<Integer> flattened = numbers.stream()
    .flatMap(List::stream)
    .flatMap(List::stream)
    .collect(Collectors.toList());
// 结果为 [1, 2, 3, 4, 5, 6, 7, 8]
```

这些示例展示了一些常见的 `flatMap` 方法的用法，它可以将嵌套的流扁平化为单个流，或者将对象中的集合提取为单个流。

