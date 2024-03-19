---
title: raft介绍
isTimeLine: true
date: 2024-03-19
category:
  - distributed-system
tag:
  - raft
---

## 简介



![单个服务节点](/assets/images/distributed-system/raft/single_node.png =400x)

![服务节点可以是数据库](/assets/images/distributed-system/raft/single_node_demo.png =400x)

![客户端](/assets/images/distributed-system/raft/client_single_node.png =400x)

![分布式一致性](/assets/images/distributed-system/raft/client_multiple_node.png =400x)

![节点初始状态](/assets/images/distributed-system/raft/node_init_state.png =400x)

![节点->候选者candidate](/assets/images/distributed-system/raft/client_turn_to_candidate.png =400x)

![candidate发起投票](/assets/images/distributed-system/raft/candidate_request_vote.png =400x)

![candidate收到投票信息](/assets/images/distributed-system/raft/candidate_receive_reply.png =400x)


![客户端发送数据给leader](/assets/images/distributed-system/raft/client_send_data_to_leader.png =400x)

![leader同步数据到follower](/assets/images/distributed-system/raft/leader_sync_log.png =400x)

![leader接收follower响应](/assets/images/distributed-system/raft/leader_receive_reply.png =400x)

![leader同步节点状态](/assets/images/distributed-system/raft/leader_sync_state.png =400x)



## Leader Election

![没有节点时，等待150~300ms转变为candidate](/assets/images/distributed-system/raft/node_start_timer.png =400x)

![超时问题](/assets/images/distributed-system/raft/node_election_timeout.png =400x)

![超时条件](/assets/images/distributed-system/raft/node_election_timeout_condition.png =400x)

![超时后，follower->candidate](/assets/images/distributed-system/raft/node_turn_to_candidate_after_timeout.png =400x)

![转变为candidate的同时发送vote请求](/assets/images/distributed-system/raft/node_send_vote_after_timeout.png =400x)

![收到vote请求的节点返回vote信息](/assets/images/distributed-system/raft/node_reply_vote_to_candidate.png =400x)

![重置超时时间](/assets/images/distributed-system/raft/node_reset_election_timeout.png =400x)

![candidate成为leader](/assets/images/distributed-system/raft/node_turn_to_leader.png =400x)

![发送心跳信息](/assets/images/distributed-system/raft/leader_send_append_entry.png =400x)

![定时发送心跳信息](/assets/images/distributed-system/raft/leader_heartbeat_timeout.png =400x)

![follower返回确认心跳信息](/assets/images/distributed-system/raft/leader_receive_reply_from_follower.png =400x)


![重复一直到出现candidate](/assets/images/distributed-system/raft/send_reply_process.png =400x)

![脑裂示例](/assets/images/distributed-system/raft/split_node_example.png =400x)


![发起投票](/assets/images/distributed-system/raft/split_node_example_2.png =400x)

![每个candidate只有半数票，无法成为leader](/assets/images/distributed-system/raft/split_node_example_3.png =400x)

![重新发起选举](/assets/images/distributed-system/raft/split_node_example_4.png =400x)

## Log Replication


![client发送变更到leader](/assets/images/distributed-system/raft/log_replication_1.png =400x)

![leader同步变更到follower](/assets/images/distributed-system/raft/log_replication_2.png =400x)

![follower确认收到的变更](/assets/images/distributed-system/raft/log_replication_3.png =400x)

![leader返回response给client](/assets/images/distributed-system/raft/log_replication_4.png =400x)

![leader更新自身状态同时同步follower](/assets/images/distributed-system/raft/log_replication_5.png =400x)

![脑裂情况下的LogReplication](/assets/images/distributed-system/raft/log_replication_6.png =400x)

![两个client分别发送变更给两个leader](/assets/images/distributed-system/raft/log_replication_7.png =400x)

![当网络屏障恢复](/assets/images/distributed-system/raft/log_replication_8.png =400x)

![少数节点会回滚自身状态，与多数节点保持一致](/assets/images/distributed-system/raft/log_replication_9.png =400x)

该日志条目当前未提交，因此不会更新节点的值。


## 参考文章

[raft动画演示](http://thesecretlivesofdata.com/raft/)