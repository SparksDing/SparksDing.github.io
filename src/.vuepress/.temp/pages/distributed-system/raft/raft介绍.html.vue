<template><div><h2 id="简介" tabindex="-1"><a class="header-anchor" href="#简介" aria-hidden="true">#</a> 简介</h2>
<figure><img src="/assets/images/distributed-system/raft/single_node.png" alt="单个服务节点" width="400" tabindex="0" loading="lazy"><figcaption>单个服务节点</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/single_node_demo.png" alt="服务节点可以是数据库" width="400" tabindex="0" loading="lazy"><figcaption>服务节点可以是数据库</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/client_single_node.png" alt="客户端" width="400" tabindex="0" loading="lazy"><figcaption>客户端</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/client_multiple_node.png" alt="分布式一致性" width="400" tabindex="0" loading="lazy"><figcaption>分布式一致性</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/node_init_state.png" alt="节点初始状态" width="400" tabindex="0" loading="lazy"><figcaption>节点初始状态</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/client_turn_to_candidate.png" alt="节点-&gt;候选者candidate" width="400" tabindex="0" loading="lazy"><figcaption>节点-&gt;候选者candidate</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/candidate_request_vote.png" alt="candidate发起投票" width="400" tabindex="0" loading="lazy"><figcaption>candidate发起投票</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/candidate_receive_reply.png" alt="candidate收到投票信息" width="400" tabindex="0" loading="lazy"><figcaption>candidate收到投票信息</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/client_send_data_to_leader.png" alt="客户端发送数据给leader" width="400" tabindex="0" loading="lazy"><figcaption>客户端发送数据给leader</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/leader_sync_log.png" alt="leader同步数据到follower" width="400" tabindex="0" loading="lazy"><figcaption>leader同步数据到follower</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/leader_receive_reply.png" alt="leader接收follower响应" width="400" tabindex="0" loading="lazy"><figcaption>leader接收follower响应</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/leader_sync_state.png" alt="leader同步节点状态" width="400" tabindex="0" loading="lazy"><figcaption>leader同步节点状态</figcaption></figure>
<h2 id="leader-election" tabindex="-1"><a class="header-anchor" href="#leader-election" aria-hidden="true">#</a> Leader Election</h2>
<figure><img src="/assets/images/distributed-system/raft/node_start_timer.png" alt="没有节点时，等待150~300ms转变为candidate" width="400" tabindex="0" loading="lazy"><figcaption>没有节点时，等待150~300ms转变为candidate</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/node_election_timeout.png" alt="超时问题" width="400" tabindex="0" loading="lazy"><figcaption>超时问题</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/node_election_timeout_condition.png" alt="超时条件" width="400" tabindex="0" loading="lazy"><figcaption>超时条件</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/node_turn_to_candidate_after_timeout.png" alt="超时后，follower-&gt;candidate" width="400" tabindex="0" loading="lazy"><figcaption>超时后，follower-&gt;candidate</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/node_send_vote_after_timeout.png" alt="转变为candidate的同时发送vote请求" width="400" tabindex="0" loading="lazy"><figcaption>转变为candidate的同时发送vote请求</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/node_reply_vote_to_candidate.png" alt="收到vote请求的节点返回vote信息" width="400" tabindex="0" loading="lazy"><figcaption>收到vote请求的节点返回vote信息</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/node_reset_election_timeout.png" alt="重置超时时间" width="400" tabindex="0" loading="lazy"><figcaption>重置超时时间</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/node_turn_to_leader.png" alt="candidate成为leader" width="400" tabindex="0" loading="lazy"><figcaption>candidate成为leader</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/leader_send_append_entry.png" alt="发送心跳信息" width="400" tabindex="0" loading="lazy"><figcaption>发送心跳信息</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/leader_heartbeat_timeout.png" alt="定时发送心跳信息" width="400" tabindex="0" loading="lazy"><figcaption>定时发送心跳信息</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/leader_receive_reply_from_follower.png" alt="follower返回确认心跳信息" width="400" tabindex="0" loading="lazy"><figcaption>follower返回确认心跳信息</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/send_reply_process.png" alt="重复一直到出现candidate" width="400" tabindex="0" loading="lazy"><figcaption>重复一直到出现candidate</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/split_node_example.png" alt="脑裂示例" width="400" tabindex="0" loading="lazy"><figcaption>脑裂示例</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/split_node_example_2.png" alt="发起投票" width="400" tabindex="0" loading="lazy"><figcaption>发起投票</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/split_node_example_3.png" alt="每个candidate只有半数票，无法成为leader" width="400" tabindex="0" loading="lazy"><figcaption>每个candidate只有半数票，无法成为leader</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/split_node_example_4.png" alt="重新发起选举" width="400" tabindex="0" loading="lazy"><figcaption>重新发起选举</figcaption></figure>
<h2 id="log-replication" tabindex="-1"><a class="header-anchor" href="#log-replication" aria-hidden="true">#</a> Log Replication</h2>
<figure><img src="/assets/images/distributed-system/raft/log_replication_1.png" alt="client发送变更到leader" width="400" tabindex="0" loading="lazy"><figcaption>client发送变更到leader</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/log_replication_2.png" alt="leader同步变更到follower" width="400" tabindex="0" loading="lazy"><figcaption>leader同步变更到follower</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/log_replication_3.png" alt="follower确认收到的变更" width="400" tabindex="0" loading="lazy"><figcaption>follower确认收到的变更</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/log_replication_4.png" alt="leader返回response给client" width="400" tabindex="0" loading="lazy"><figcaption>leader返回response给client</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/log_replication_5.png" alt="leader更新自身状态同时同步follower" width="400" tabindex="0" loading="lazy"><figcaption>leader更新自身状态同时同步follower</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/log_replication_6.png" alt="脑裂情况下的LogReplication" width="400" tabindex="0" loading="lazy"><figcaption>脑裂情况下的LogReplication</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/log_replication_7.png" alt="两个client分别发送变更给两个leader" width="400" tabindex="0" loading="lazy"><figcaption>两个client分别发送变更给两个leader</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/log_replication_8.png" alt="当网络屏障恢复" width="400" tabindex="0" loading="lazy"><figcaption>当网络屏障恢复</figcaption></figure>
<figure><img src="/assets/images/distributed-system/raft/log_replication_9.png" alt="少数节点会回滚自身状态，与多数节点保持一致" width="400" tabindex="0" loading="lazy"><figcaption>少数节点会回滚自身状态，与多数节点保持一致</figcaption></figure>
<p>该日志条目当前未提交，因此不会更新节点的值。</p>
<h2 id="参考文章" tabindex="-1"><a class="header-anchor" href="#参考文章" aria-hidden="true">#</a> 参考文章</h2>
<p><a href="http://thesecretlivesofdata.com/raft/" target="_blank" rel="noopener noreferrer">raft动画演示<ExternalLinkIcon/></a></p>
</div></template>


