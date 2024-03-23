---
title: raft实验
isTimeLine: true
date: 2024-03-19
category:
  - distributed-system
tag:
  - raft
---

## Leader Election问题记录

```
                                                                                                                                                                   S3 NO PROBLEM                                        
                                                                                                             S2 term 0 isLeader false state FOLLOWER                                                                    
                                                       S1 term 0 isLeader false state FOLLOWER                                                                                                                          
S0 term 0 isLeader false state FOLLOWER                                                                                                                                                                                 
                                                       S1 term 0 from FOLLOWER to CANDIDATE                                                                                                                             
                                                       S1 term 0 isLeader false state CANDIDATE                                                                                                                         
                                                                                                             S2 term 1 isLeader false state FOLLOWER                                                                    
                                                       S1 term 1 from CANDIDATE to LEADER voteCount 2                                                                                                                   
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 1 isLeader false state FOLLOWER                                                                                                                                                                                 
S0 Receive Heartbeat MyTerm 1 HTerm 1                                                                                                                                                                                   
                                                                                                             S2 Receive Heartbeat MyTerm 1 HTerm 1                                                                      
S0 term 1 isLeader false state FOLLOWER                                                                                                                                                                                 
                                                                                                             S2 term 1 isLeader false state FOLLOWER                                                                    
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 Receive Heartbeat MyTerm 1 HTerm 1                                                                                                                                                                                   
S0 term 1 isLeader false state FOLLOWER                                                                                                                                                                                 
                                                                                                             S2 Receive Heartbeat MyTerm 1 HTerm 1                                                                      
                                                                                                             S2 term 1 isLeader false state FOLLOWER                                                                    
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 Receive Heartbeat MyTerm 1 HTerm 1                                                                      
                                                                                                             S2 term 1 isLeader false state FOLLOWER                                                                    
S0 Receive Heartbeat MyTerm 1 HTerm 1                                                                                                                                                                                   
S0 term 1 isLeader false state FOLLOWER                                                                                                                                                                                 
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 Receive Heartbeat MyTerm 1 HTerm 1                                                                                                                                                                                   
                                                                                                             S2 Receive Heartbeat MyTerm 1 HTerm 1                                                                      
S0 term 1 isLeader false state FOLLOWER                                                                                                                                                                                 
                                                                                                             S2 term 1 isLeader false state FOLLOWER                                                                    
                                                                                                                                                                   S3 DISCONNECT 1                                      
                                                                                                                                                                   S3 CONFIDENT                                         
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 1 from FOLLOWER to CANDIDATE                                                                                                                                                                                    
S0 term 1 isLeader false state CANDIDATE                                                                                                                                                                                
                                                                                                             S2 term 1 from FOLLOWER to CANDIDATE                                                                       
                                                                                                             S2 term 1 isLeader false state CANDIDATE                                                                   
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 3 isLeader false state CANDIDATE                                                                   
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 3 isLeader false state CANDIDATE                                                                   
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 3 isLeader false state CANDIDATE                                                                   
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 3 isLeader false state CANDIDATE                                                                   
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 3 isLeader false state CANDIDATE                                                                   
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER          
```


目前的问题是：S1被disconnect之后，S0和S2没有办法选举出leader，从LOG看他们都在发RequestVote


目前投票的核心代码如下：

```go
func (rf *Raft) RequestVote(args *RequestVoteArgs, reply *RequestVoteReply) {
	// Your code here (2A, 2B).
  rf.mu.Lock()
	defer rf.mu.Unlock()
	// 1. 如果任期比自己的任期小，返回自己的任期
	if args.Term <= rf.currentTerm {
		reply.VoteGranted = false
		reply.Term = rf.currentTerm
		return
	}

	// 2. 设置自身为FOLLOWER
	if rf.state != FOLLOWER {
		Debug(dVote, "S%d term %d from %v to %v", rf.me, rf.currentTerm, rf.enumToString(rf.state), rf.enumToString(FOLLOWER))
	}
	rf.state = FOLLOWER

	// 3. 设置任期为args中的任期
	rf.currentTerm = args.Term

	// 4. 投票
	reply.VoteGranted = true
	reply.Term = args.Term

	// 5. 清理timer
	rf.chanGrantVote <- true

	return
}

func (rf *Raft) sendRequestVote(server int, args *RequestVoteArgs, reply *RequestVoteReply) bool {
	rf.mu.Lock()
	defer rf.mu.Unlock()
	// Debug(dVote, "S%d term %d, SendRequestVote to %v", rf.me, rf.currentTerm, server)
	ok := rf.peers[server].Call("Raft.RequestVote", args, reply)

	if ok {
		// 1. 处理投票
		if reply.VoteGranted == true {
			rf.voteCount++
			// 2.2. 有超过半数的票
			if rf.voteCount >= len(rf.peers)/2+1 {
				if rf.state != LEADER {
					Debug(dVote, "S%d term %d from %v to %v voteCount %d", rf.me, rf.currentTerm, rf.enumToString(rf.state), rf.enumToString(LEADER), rf.voteCount)
				}
				rf.state = LEADER
				rf.chanWinElect <- true
			}
		} else {
			if rf.currentTerm < reply.Term {
				rf.currentTerm = reply.Term
			}
		}
	}

	return ok
}
```

心跳的核心代码如下：

```go
func (rf *Raft) InstallSnapshot(args *InstallSnapshotArgs, reply *InstallSnapshotReply) {
	rf.mu.Lock()
	defer rf.mu.Unlock()

	Debug(dVote, "S%d Receive Heartbeat MyTerm %d HTerm %d", rf.me, rf.currentTerm, args.Term)

	// 1. 如果任期比自己的任期小，返回自己的任期
	if args.Term < rf.currentTerm {
		reply.Term = rf.currentTerm
		return
	}

	if args.Term > rf.currentTerm && rf.state == LEADER {
		if rf.state != FOLLOWER {
			Debug(dVote, "S%d term %d from %v to %v", rf.me, rf.currentTerm, rf.enumToString(rf.state), rf.enumToString(FOLLOWER))
		}
		rf.state = FOLLOWER
		return
	}

	rf.currentTerm = args.Term

	// 2. heartbeat
	rf.chanHeartbeat <- true

}

func (rf *Raft) sendInstallSnapshot(server int, args *InstallSnapshotArgs, reply *InstallSnapshotReply) bool {
	// Debug(dLeader, "S%d term %d, SendHeartbeat to %v", rf.me, rf.currentTerm, server)
	ok := rf.peers[server].Call("Raft.InstallSnapshot", args, reply)
	rf.mu.Lock()
	defer rf.mu.Unlock()

	if ok {
		// 1. 任期比自己大
		if reply.Term > rf.currentTerm {
			if rf.state != FOLLOWER {
				Debug(dVote, "S%d term %d from %v to %v", rf.me, rf.currentTerm, rf.enumToString(rf.state), rf.enumToString(FOLLOWER))
			}
			rf.state = FOLLOWER
		}
	}

	return ok
}
```

主逻辑如下
```go
func (rf *Raft) ticker() {
	for rf.killed() == false {
		_, isLeader := rf.GetState()
		Debug(dVote, "S%d term %d isLeader %v state %v", rf.me, rf.currentTerm, isLeader, rf.enumToString(rf.state))
		// Your code here (2A)
		// Check if a leader election should be started.
		switch rf.state {
		case FOLLOWER:
			select {
			case <-rf.chanGrantVote:
			case <-rf.chanHeartbeat:
			case <-time.After(time.Millisecond * time.Duration(rand.Intn(300)+200)):
				rf.mu.Lock()
				if rf.state != CANDIDATE {
					Debug(dVote, "S%d term %d from %v to %v", rf.me, rf.currentTerm, rf.enumToString(rf.state), rf.enumToString(CANDIDATE))
				}
				rf.state = CANDIDATE
				rf.mu.Unlock()
			}

		case CANDIDATE:
			go rf.broadcastRequestVote()
			select {
			case <-rf.chanWinElect:
			case <-rf.chanHeartbeat:
				rf.mu.Lock()
				if rf.state != FOLLOWER {
					Debug(dVote, "S%d term %d from %v to %v", rf.me, rf.currentTerm, rf.enumToString(rf.state), rf.enumToString(FOLLOWER))
				}
				rf.state = FOLLOWER
				rf.mu.Unlock()
			case <-rf.chanGrantVote:
				rf.mu.Lock()
				if rf.state != FOLLOWER {
					Debug(dVote, "S%d term %d from %v to %v", rf.me, rf.currentTerm, rf.enumToString(rf.state), rf.enumToString(FOLLOWER))
				}
				rf.state = FOLLOWER
				rf.mu.Unlock()
			case <-time.After(time.Millisecond * time.Duration(rand.Intn(300)+200)):
			}

		case LEADER:
			go rf.broadcastHeartbeat()
			time.Sleep(time.Millisecond * 60)
		}
	}
}
```

经过一段时间的debug，发现是出现了死锁，从Log中可以看到一直在before enter lock

```
S0 term 0 isLeader false state FOLLOWER                                                                                                                                                                                 
                                                                                                                                                                   S3 NO PROBLEM                                        
                                                                                                             S2 term 0 isLeader false state FOLLOWER                                                                    
                                                       S1 term 0 isLeader false state FOLLOWER                                                                                                                          
                                                       S1 term 0 from FOLLOWER to CANDIDATE                                                                                                                             
                                                       S1 term 0 isLeader false state CANDIDATE                                                                                                                         
                                                       S1 term 0, Before Enter Lock                                                                                                                                     
                                                       S1 term 1, broadcastRequestVote                                                                                                                                  
                                                                                                             S2 term 1 isLeader false state FOLLOWER                                                                    
                                                       S1 term 1 from CANDIDATE to LEADER voteCount 2                                                                                                                   
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 1 isLeader false state FOLLOWER                                                                                                                                                                                 
                                                                                                             S2 Receive Heartbeat MyTerm 1 HTerm 1                                                                      
                                                                                                             S2 term 1 isLeader false state FOLLOWER                                                                    
S0 Receive Heartbeat MyTerm 1 HTerm 1                                                                                                                                                                                   
S0 term 1 isLeader false state FOLLOWER                                                                                                                                                                                 
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 Receive Heartbeat MyTerm 1 HTerm 1                                                                      
                                                                                                             S2 term 1 isLeader false state FOLLOWER                                                                    
S0 Receive Heartbeat MyTerm 1 HTerm 1                                                                                                                                                                                   
S0 term 1 isLeader false state FOLLOWER                                                                                                                                                                                 
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 Receive Heartbeat MyTerm 1 HTerm 1                                                                      
                                                                                                             S2 term 1 isLeader false state FOLLOWER                                                                    
S0 Receive Heartbeat MyTerm 1 HTerm 1                                                                                                                                                                                   
S0 term 1 isLeader false state FOLLOWER                                                                                                                                                                                 
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 Receive Heartbeat MyTerm 1 HTerm 1                                                                      
                                                                                                             S2 term 1 isLeader false state FOLLOWER                                                                    
S0 Receive Heartbeat MyTerm 1 HTerm 1                                                                                                                                                                                   
S0 term 1 isLeader false state FOLLOWER                                                                                                                                                                                 
                                                                                                                                                                   S3 DISCONNECT 1                                      
                                                                                                                                                                   S3 CONFIDENT                                         
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 1 from FOLLOWER to CANDIDATE                                                                       
                                                                                                             S2 term 1 isLeader false state CANDIDATE                                                                   
                                                                                                             S2 term 1, Before Enter Lock                                                                               
                                                                                                             S2 term 2, broadcastRequestVote                                                                            
S0 term 1 from FOLLOWER to CANDIDATE                                                                                                                                                                                    
S0 term 1 isLeader false state CANDIDATE                                                                                                                                                                                
S0 term 1, Before Enter Lock                                                                                                                                                                                            
S0 term 2, broadcastRequestVote                                                                                                                                                                                         
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                                                                             S2 term 2, Before Enter Lock                                                                               
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
S0 term 2, Before Enter Lock                                                                                                                                                                                            
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                                                                             S2 term 2, Before Enter Lock                                                                               
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                                                                             S2 term 2, Before Enter Lock                                                                               
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
S0 term 2, Before Enter Lock                                                                                                                                                                                            
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                                                                             S2 term 2, Before Enter Lock                                                                               
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
S0 term 2, Before Enter Lock                                                                                                                                                                                            
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
S0 term 2, Before Enter Lock                                                                                                                                                                                            
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                                                                             S2 term 2, Before Enter Lock                                                                               
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
S0 term 2, Before Enter Lock                                                                                                                                                                                            
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                                                                             S2 term 2, Before Enter Lock                                                                               
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
S0 term 2, Before Enter Lock                                                                                                                                                                                            
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                                                                             S2 term 2, Before Enter Lock                                                                               
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                                                                             S2 term 2, Before Enter Lock                                                                               
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
S0 term 2, Before Enter Lock                                                                                                                                                                                            
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                                                                             S2 term 2, Before Enter Lock                                                                               
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
S0 term 2, Before Enter Lock                                                                                                                                                                                            
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                                                                             S2 term 2, Before Enter Lock                                                                               
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
S0 term 2, Before Enter Lock                                                                                                                                                                                            
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
S0 term 2, Before Enter Lock                                                                                                                                                                                            
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                                                                             S2 term 2, Before Enter Lock                                                                               
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
S0 term 2, Before Enter Lock                                                                                                                                                                                            
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                                                                             S2 term 2, Before Enter Lock                                                                               
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
S0 term 2, Before Enter Lock                                                                                                                                                                                            
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
S0 term 2 isLeader false state CANDIDATE                                                                                                                                                                                
S0 term 2, Before Enter Lock                                                                                                                                                                                            
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                                                                             S2 term 2 isLeader false state CANDIDATE                                                                   
                                                                                                             S2 term 2, Before Enter Lock                                                                               
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER                                                                                                                             
                                                       S1 term 1 isLeader true state LEADER
```

问题出在sendInstallSnapshot和sendRequestVote，应该在发RPC请求之后加锁。
如果在发RPC请求之前加锁，那么会出现S0向S1发了RPC请求，SO自身mu加锁了，此时S1再给S0发RPC请求，S1自身mu加锁，那么在S0和S1分别处理对方的RPC请求时就会发生死锁。

## 参考文章

[如何debug](https://blog.josejg.com/debugging-pretty/)