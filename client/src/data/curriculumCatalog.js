/**
 * Comprehensive University Curriculum Topic Catalog
 * Provides maximum topic suggestions across all standard engineering, computer science,
 * and university courses for instant 0-latency syllabus population.
 */

export const CURRICULUM_CATALOG = [
  // 1. Operating Systems
  {
    keys: ['os', 'operating system', 'operating systems', 'linux', 'unix'],
    subjectName: 'Operating Systems',
    topics: [
      {
        name: 'Operating System Architectures & System Calls',
        difficulty: 'EASY',
        estimated_minutes: 40,
        description: 'Monolithic vs Microkernel, dual-mode operation, trap instructions and user vs kernel space'
      },
      {
        name: 'Process Management: States, PCB & Context Switching',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Process life cycle, process control block, context switch overhead and fork() operations'
      },
      {
        name: 'CPU Scheduling: FCFS, SJF, SRTF & Priority',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Preemptive vs non-preemptive scheduling, turnaround time and waiting time calculations'
      },
      {
        name: 'CPU Scheduling: Round Robin & Multilevel Queues',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Time quantum trade-offs, multilevel feedback queues and real-time scheduling'
      },
      {
        name: 'Inter-Process Communication (IPC): Pipes, Shared Memory & Queues',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Message passing, shared memory architecture, anonymous pipes and sockets'
      },
      {
        name: 'Process Synchronization & Critical Section Problem',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Mutual exclusion, progress, bounded waiting, Peterson algorithm and hardware atomic instructions'
      },
      {
        name: 'Semaphores, Mutex Locks & Classic IPC Problems',
        difficulty: 'HARD',
        estimated_minutes: 60,
        description: 'Counting semaphores, Producer-Consumer, Readers-Writers and Dining Philosophers problem'
      },
      {
        name: 'Monitors & Condition Variables',
        difficulty: 'HARD',
        estimated_minutes: 45,
        description: 'High-level synchronization constructs, condition variables, wait and signal semantics'
      },
      {
        name: 'Deadlock Characterization & Prevention',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Four Coffman conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait'
      },
      {
        name: 'Deadlock Avoidance & Banker Algorithm',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Resource allocation graph, Banker safety algorithm and resource-request algorithm'
      },
      {
        name: 'Deadlock Detection, Recovery & Ostrich Algorithm',
        difficulty: 'MEDIUM',
        estimated_minutes: 35,
        description: 'Wait-for graphs, cycle detection, process termination and resource preemption'
      },
      {
        name: 'Main Memory: Contiguous Allocation & Fragmentation',
        difficulty: 'EASY',
        estimated_minutes: 35,
        description: 'Fixed and dynamic partitioning, first-fit, best-fit, worst-fit and external fragmentation'
      },
      {
        name: 'Paging Hardware & Translation Lookaside Buffer (TLB)',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'Page tables, frame mapping, TLB hit ratio and effective memory access time (EMAT)'
      },
      {
        name: 'Multi-Level Paging, Inverted Page Tables & Segmentation',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Hierarchical paging, hashing page tables, segment tables and pure segmentation'
      },
      {
        name: 'Virtual Memory & Demand Paging',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Page fault handling routine, valid-invalid bit, swap space and dirty bits'
      },
      {
        name: 'Page Replacement Algorithms (FIFO, LRU, Optimal & Belady)',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'FIFO anomaly (Belady), LRU stack implementation, Clock algorithm and optimal replacement'
      },
      {
        name: 'Thrashing, Working Set Model & Page Fault Frequency',
        difficulty: 'HARD',
        estimated_minutes: 45,
        description: 'Locality of reference, working-set strategy, page-fault frequency control and CPU utilization collapse'
      },
      {
        name: 'File System Architecture & Inode Structures',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Directory structures, contiguous/linked/indexed allocation and Unix inode organization'
      },
      {
        name: 'Disk Scheduling Algorithms (FCFS, SSTF, SCAN, C-SCAN)',
        difficulty: 'EASY',
        estimated_minutes: 35,
        description: 'Disk arm movement calculations, LOOK, C-LOOK and rotational latency'
      },
      {
        name: 'RAID Levels & Storage Redundancy',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Striping, mirroring, parity (RAID 0, 1, 5, 6, 10) and fault tolerance trade-offs'
      }
    ]
  },

  // 2. Database Management Systems (DBMS)
  {
    keys: ['dbms', 'database', 'sql', 'rdbms', 'relational database', 'databases'],
    subjectName: 'Database Management Systems',
    topics: [
      {
        name: 'Database Architecture: 3-Schema Architecture & Data Independence',
        difficulty: 'EASY',
        estimated_minutes: 35,
        description: 'Physical, conceptual, and external schema levels, logical and physical data independence'
      },
      {
        name: 'Entity-Relationship (ER) Modeling & Crow Foot Notation',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Entities, weak entities, attributes, primary keys and relationship cardinality/participation'
      },
      {
        name: 'Relational Model & ER to Relational Schema Mapping',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Schema decomposition, foreign keys, referential integrity and mapping N:M relationships'
      },
      {
        name: 'Relational Algebra: Core Selection, Projection & Join Operators',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Select, project, Cartesian product, theta join, natural join and division operator'
      },
      {
        name: 'Tuple & Domain Relational Calculus',
        difficulty: 'HARD',
        estimated_minutes: 45,
        description: 'Non-procedural declarative query logic, existential/universal quantifiers and domain safety'
      },
      {
        name: 'SQL Fundamentals: DDL, DML, DCL & Integrity Constraints',
        difficulty: 'EASY',
        estimated_minutes: 40,
        description: 'CREATE, ALTER, DROP, TRUNCATE, primary keys, check constraints and cascade deletes'
      },
      {
        name: 'Advanced SQL: Aggregations, Group By, Having & Subqueries',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Correlated subqueries, EXISTS, IN, GROUP BY multi-column grouping and HAVING filters'
      },
      {
        name: 'Complex SQL Joins & Window Analytic Functions',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Inner/Outer/Self/Cross joins, OVER, PARTITION BY, ROW_NUMBER, RANK, DENSE_RANK'
      },
      {
        name: 'Functional Dependencies & Armstrong Axioms',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Reflexivity, augmentation, transitivity, attribute closure and canonical cover derivation'
      },
      {
        name: 'Database Normalization: 1NF, 2NF & 3NF',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'Atomic attributes, partial dependency elimination, transitive dependency removal'
      },
      {
        name: 'Boyce-Codd Normal Form (BCNF) & Lossless Decomposition',
        difficulty: 'HARD',
        estimated_minutes: 60,
        description: 'Superkey condition for functional dependencies, lossless join property and dependency preservation'
      },
      {
        name: 'Higher Normal Forms: 4NF (Multivalued) & 5NF (Join Dependencies)',
        difficulty: 'HARD',
        estimated_minutes: 45,
        description: 'Multivalued dependencies (MVDs), Fagin theorem, project-join normal form'
      },
      {
        name: 'File Organization & Dense vs Sparse Indexing',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Primary index, clustering index, secondary index and multi-level indexing structures'
      },
      {
        name: 'B-Trees and B+ Trees Index Structures',
        difficulty: 'HARD',
        estimated_minutes: 60,
        description: 'Node search, dynamic insertion, node splitting, deletion rebalancing and range query speed'
      },
      {
        name: 'Hashing Techniques: Static vs Extendible & Linear Hashing',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Hash collision resolution, directory expansion, global/local depth in extendible hashing'
      },
      {
        name: 'Query Processing & Cost-Based Relational Optimization',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Query parsing, relational algebra equivalence rules, join order estimation and execution plans'
      },
      {
        name: 'Transaction Management & ACID Properties',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Atomicity, Consistency, Isolation, Durability and transaction state transitions'
      },
      {
        name: 'Conflict & View Serializability Testing',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Precedence graphs (serialization graph), topological sorting and conflict equivalence'
      },
      {
        name: 'Concurrency Control: Two-Phase Locking (2PL & Strict 2PL)',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'Growing phase, shrinking phase, shared/exclusive locks, cascading rollbacks prevention'
      },
      {
        name: 'Timestamp Ordering & Deadlock Prevention (Wait-Die & Wound-Wait)',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Thomas write rule, read/write timestamps, non-preemptive wait-die vs preemptive wound-wait'
      },
      {
        name: 'Crash Recovery: Write-Ahead Logging (WAL) & ARIES Algorithm',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'Log-based recovery, check-pointing, undo/redo phase and database buffer flushing'
      },
      {
        name: 'NoSQL Architectures, CAP Theorem & Distributed DBs',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Document, Key-Value, Columnar and Graph stores, Consistency vs Availability vs Partition tolerance'
      }
    ]
  },

  // 3. Computer Networks (CN)
  {
    keys: ['network', 'cn', 'computer network', 'computer networks', 'networking'],
    subjectName: 'Computer Networks',
    topics: [
      {
        name: 'Network Topologies & Switching (Circuit vs Packet vs Message)',
        difficulty: 'EASY',
        estimated_minutes: 35,
        description: 'Star, Mesh, Ring, Bus topologies, connection-oriented vs connectionless packet forwarding'
      },
      {
        name: 'OSI 7-Layer vs TCP/IP 4-Layer Architecture',
        difficulty: 'EASY',
        estimated_minutes: 35,
        description: 'Layer responsibilities, PDUs, encapsulation, decapsulation and header overhead'
      },
      {
        name: 'Physical Layer: Nyquist Limit, Shannon Capacity & Transmission Media',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Noiseless vs noisy channel bit rate calculations, attenuation, twisted pair, fiber optics'
      },
      {
        name: 'Data Link Layer: Framing & Bit/Byte Stuffing',
        difficulty: 'EASY',
        estimated_minutes: 35,
        description: 'Character count, flag bytes with byte stuffing, bit-oriented framing with bit stuffing'
      },
      {
        name: 'Error Detection: Parity, Checksum & Cyclic Redundancy Check (CRC)',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Modulo-2 polynomial division, generator polynomials and Hamming distance for error correction'
      },
      {
        name: 'Flow Control Protocols: Stop-and-Wait, Go-Back-N & Selective Repeat',
        difficulty: 'HARD',
        estimated_minutes: 60,
        description: 'Sliding window concept, sequence numbers, sender/receiver buffer sizes and link utilization'
      },
      {
        name: 'Medium Access Control (MAC): ALOHA, Slotted ALOHA & CSMA',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Pure ALOHA vs Slotted ALOHA throughput analysis, 1-persistent, non-persistent, p-persistent CSMA'
      },
      {
        name: 'CSMA/CD (Ethernet) & Exponential Binary Backoff',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Collision detection conditions, minimum frame size formula (2 * propagation delay) and slot time'
      },
      {
        name: 'IPv4 Addressing, Subnetting & CIDR (VLSM)',
        difficulty: 'HARD',
        estimated_minutes: 60,
        description: 'Classful vs classless addressing, slash notation, subnet mask calculations and host capacity'
      },
      {
        name: 'IPv6 Header Format, Dual-Stack & Transition Mechanisms',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: '128-bit address representation, header simplification, tunneling and NAT64'
      },
      {
        name: 'Address Resolution: ARP, RARP, DHCP & ICMP Protocols',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'MAC-IP resolution, ARP cache poisoning, DHCP DORA process and ping/traceroute mechanics'
      },
      {
        name: 'Network Address Translation (NAT) & Private IP Spaces',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'RFC 1918 private ranges, SNAT, DNAT, Port Address Translation (PAT) and connection tracking'
      },
      {
        name: 'Routing Algorithms: Distance Vector & Count-to-Infinity Problem',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Bellman-Ford equation, RIP protocol, split horizon and poison reverse solutions'
      },
      {
        name: 'Link State Routing & Dijkstra Algorithm (OSPF)',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'Link state advertisements (LSA), flooding, shortest path tree generation and OSPF area hierarchy'
      },
      {
        name: 'Border Gateway Protocol (BGP) & Inter-Domain Path Vector Routing',
        difficulty: 'HARD',
        estimated_minutes: 45,
        description: 'Autonomous Systems (AS), eBGP vs iBGP, AS-PATH attribute and policy-based routing'
      },
      {
        name: 'Transport Layer: UDP Datagrams vs TCP Segment Structure',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Connectionless vs connection-oriented, multiplexing, port numbers and pseudo-headers'
      },
      {
        name: 'TCP 3-Way Handshake, Connection Teardown & State Diagram',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'SYN, SYN-ACK, ACK sequence numbers, TIME_WAIT state, FIN, ACK and reset flags'
      },
      {
        name: 'TCP Congestion Control: Slow Start, Congestion Avoidance & AIMD',
        difficulty: 'HARD',
        estimated_minutes: 60,
        description: 'Congestion window (cwnd), ssthresh, additive increase multiplicative decrease, fast retransmit'
      },
      {
        name: 'Domain Name System (DNS): Hierarchy & Iterative vs Recursive Queries',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Root, TLD, authoritative servers, resource records (A, CNAME, MX, TXT) and DNS caching'
      },
      {
        name: 'Application Protocols: HTTP/1.1, HTTP/2, HTTP/3 (QUIC) & WebSockets',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Pipelining, HOL blocking, binary framing, multiplexing, UDP-based QUIC and full-duplex sockets'
      },
      {
        name: 'Network Security: SSL/TLS Handshake, RSA/AES & Firewalls',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'Symmetric/asymmetric crypto, TLS session keys, certificate authorities, packet filters and stateful inspection'
      }
    ]
  },

  // 4. Data Structures & Algorithms (DSA)
  {
    keys: ['dsa', 'data structure', 'data structures', 'algorithm', 'algorithms', 'problem solving'],
    subjectName: 'Data Structures & Algorithms',
    topics: [
      {
        name: 'Asymptotic Analysis: Big-O, Big-Omega, Big-Theta & Master Theorem',
        difficulty: 'EASY',
        estimated_minutes: 40,
        description: 'Time and space complexity bounds, recurrence relations and divide-and-conquer master method'
      },
      {
        name: 'Arrays, Two Pointers & Sliding Window Technique',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Subarray problems, prefix sum arrays, Dutch National Flag and variable-size sliding windows'
      },
      {
        name: 'Linked Lists: Singly, Doubly, Circular & Fast/Slow Pointer',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Reversing lists in-place, Floyd cycle detection, intersection points and merge sort on lists'
      },
      {
        name: 'Stacks: Infix to Postfix Conversion & Monotonic Stacks',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Shunting-yard algorithm, postfix evaluation, Next Greater Element and largest rectangle in histogram'
      },
      {
        name: 'Queues: Circular Queue, Deque & Monotonic Queues',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'FIFO buffers, double-ended queues, sliding window maximum and circular buffer boundary checks'
      },
      {
        name: 'Binary Trees: Recursive & Iterative Traversals (In/Pre/Post/Level)',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'DFS traversals with stacks, BFS level-order using queues, maximum depth, diameter and view problems'
      },
      {
        name: 'Binary Search Trees (BST): Insertion, Deletion & LCA',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'BST validation, inorder successor/predecessor, 3-case node deletion and lowest common ancestor'
      },
      {
        name: 'Self-Balancing Trees: AVL Trees & Rotations (LL, RR, LR, RL)',
        difficulty: 'HARD',
        estimated_minutes: 60,
        description: 'Balance factor maintenance, single and double tree rotations, search and insertion time guarantees'
      },
      {
        name: 'Red-Black Trees & B-Tree Fundamentals',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Red-black coloring invariants, black height, multi-way search trees and disk block alignments'
      },
      {
        name: 'Binary Heaps, Priority Queues & Heap Sort',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Min-heap, max-heap representation in arrays, O(N) build-heap algorithm and top-K elements'
      },
      {
        name: 'Hash Tables, Collision Resolution & Hash Functions',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Chaining vs Open Addressing (Linear, Quadratic, Double Hashing), load factors and rehashing'
      },
      {
        name: 'Graph Representations & Traversals: BFS and DFS',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Adjacency matrix vs adjacency list, connected components, bipartite graphs and cycle detection'
      },
      {
        name: 'Topological Sort: Kahn Algorithm & DFS Stack Method',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Directed Acyclic Graphs (DAG), in-degree tracking, task scheduling dependencies and alien dictionary'
      },
      {
        name: 'Shortest Paths: Dijkstra, Bellman-Ford & Floyd-Warshall',
        difficulty: 'HARD',
        estimated_minutes: 60,
        description: 'Greedy shortest path with priority queues, negative weight cycle detection, all-pairs shortest paths'
      },
      {
        name: 'Minimum Spanning Trees: Prim and Kruskal (Disjoint Set Union)',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Cut property, Union-Find with path compression and rank, greedy edge selection'
      },
      {
        name: 'Dynamic Programming: 1D Memoization & Tabulation',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'Overlapping subproblems, optimal substructure, Fibonacci, climbing stairs and House Robber'
      },
      {
        name: 'Dynamic Programming: 0/1 Knapsack & Unbounded Knapsack',
        difficulty: 'HARD',
        estimated_minutes: 60,
        description: 'State transitions, space optimization to 1D array, Coin Change, Subset Sum and Partition Equal'
      },
      {
        name: 'Dynamic Programming on Strings: LCS, LIS & Edit Distance',
        difficulty: 'HARD',
        estimated_minutes: 60,
        description: 'Longest Common Subsequence, Longest Increasing Subsequence (O(NlogN)), Levenshtein distance'
      },
      {
        name: 'Divide and Conquer: Merge Sort, Quick Sort & Quick Select',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Partition schemes (Hoare vs Lomuto), average vs worst-case complexity and randomized selection'
      },
      {
        name: 'Backtracking: N-Queens, Sudoku Solver & Subset Generation',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'State-space trees, constraint pruning, combinations, permutations and recursion call stack'
      },
      {
        name: 'Greedy Algorithms: Activity Selection, Huffman Coding & Fractional Knapsack',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Greedy-choice property, optimal prefix-free codes, tree compression and interval scheduling'
      },
      {
        name: 'Trie Data Structure & String Algorithms (KMP & Rabin-Karp)',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'Prefix tree for dictionary search, KMP failure function (LPS array) and rolling hash comparisons'
      }
    ]
  },

  // 5. Computer Organization & Architecture (COA)
  {
    keys: ['coa', 'computer architecture', 'computer organization', 'ca', 'microprocessor'],
    subjectName: 'Computer Organization & Architecture',
    topics: [
      {
        name: 'Number Systems & IEEE 754 Floating Point Representation',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Single and double precision formats, sign, biased exponent, mantissa and normalization'
      },
      {
        name: 'Instruction Set Architecture (ISA) & Addressing Modes',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Immediate, direct, indirect, register, register indirect, indexed and relative addressing modes'
      },
      {
        name: 'RISC vs CISC Architecture & Instruction Cycle',
        difficulty: 'EASY',
        estimated_minutes: 35,
        description: 'Load-store architecture, microcoded vs hardwired instructions, fetch-decode-execute cycle'
      },
      {
        name: 'Arithmetic Logic Unit (ALU) & Booth Multiplication Algorithm',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Signed binary multiplication, bit-pair recoding and restoring/non-restoring division'
      },
      {
        name: 'Control Unit Design: Hardwired vs Microprogrammed',
        difficulty: 'HARD',
        estimated_minutes: 45,
        description: 'State table, PLA, horizontal vs vertical microinstructions and control memory'
      },
      {
        name: 'Instruction Pipelining & CPI Calculations',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: '5-stage RISC pipeline (IF, ID, EX, MEM, WB), throughput, speedup and clock cycle efficiency'
      },
      {
        name: 'Pipeline Hazards: Structural, Data & Control Hazards',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'RAW, WAR, WAW dependencies, operand forwarding, pipeline stalls and branch prediction'
      },
      {
        name: 'Memory Hierarchy & Principle of Locality (Temporal & Spatial)',
        difficulty: 'EASY',
        estimated_minutes: 35,
        description: 'Access time, cost per bit, memory latency gap and cache block sizing considerations'
      },
      {
        name: 'Cache Memory Mapping: Direct, Fully Associative & Set Associative',
        difficulty: 'HARD',
        estimated_minutes: 60,
        description: 'Tag, index, block offset bit calculations, hit ratio and conflict/capacity misses'
      },
      {
        name: 'Cache Replacement Policies & Write Policies (Write-Through vs Write-Back)',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'LRU, FIFO, Random replacement, dirty bit, write allocate and write-no-allocate strategies'
      },
      {
        name: 'Virtual Memory Hardware, Translation Lookaside Buffer (TLB) & Page Faults',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Virtual-to-physical address translation, two-level page tables, TLB miss penalties'
      },
      {
        name: 'Input/Output Organization: Programmed I/O, Interrupt-Driven & DMA',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Polling overhead, interrupt handling routine, DMA controller, burst and cycle-stealing modes'
      },
      {
        name: 'Bus Architecture & Multi-Core Cache Coherence (MESI Protocol)',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Synchronous vs asynchronous buses, snooping protocols, Modified, Exclusive, Shared, Invalid states'
      },
      {
        name: 'Superscalar & Vector Processing Fundamentals',
        difficulty: 'HARD',
        estimated_minutes: 45,
        description: 'Instruction-level parallelism (ILP), out-of-order execution, SIMD and GPU vector architectures'
      }
    ]
  },

  // 6. Object-Oriented Programming (Java / C++ / Python)
  {
    keys: ['oop', 'oops', 'java', 'c++', 'python', 'object oriented'],
    subjectName: 'Object-Oriented Programming',
    topics: [
      {
        name: 'OOP Paradigms: Encapsulation, Abstraction, Inheritance & Polymorphism',
        difficulty: 'EASY',
        estimated_minutes: 35,
        description: 'Core principles of object-oriented design, real-world modeling and access modifiers'
      },
      {
        name: 'Constructors, Destructors & Memory Management',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Default, parameterized, copy constructors, constructor overloading and memory allocation'
      },
      {
        name: 'Inheritance Types & Diamond Problem Resolution',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Single, multilevel, hierarchical, multiple inheritance, interfaces and virtual base classes'
      },
      {
        name: 'Compile-Time Polymorphism: Method Overloading & Operator Overloading',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Function signature matching, return type rules and operator overloading semantics'
      },
      {
        name: 'Run-Time Polymorphism: Method Overriding & Virtual Functions',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Virtual method table (vtable), dynamic dispatch, late binding and abstract classes'
      },
      {
        name: 'Interfaces, Abstract Classes & Multiple Inheritance in Modern Languages',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Contract-based design, default methods, abstract methods and interface segregation'
      },
      {
        name: 'Exception Handling: Try, Catch, Finally & Custom Exceptions',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Checked vs unchecked exceptions, call stack unwinding, throw, throws and error boundaries'
      },
      {
        name: 'Generics, Templates & Type Safety',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Generic classes and methods, bounded type parameters, wildcard types and type erasure'
      },
      {
        name: 'Collections Framework: Lists, Sets, Maps & Iterators',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'ArrayList vs LinkedList, HashSet vs TreeSet, HashMap hashing and concurrency collections'
      },
      {
        name: 'Multithreading & Thread Synchronization',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'Thread lifecycle, synchronized blocks, wait/notify, volatile variables and thread pools'
      },
      {
        name: 'File I/O, Serialization & Deserialization',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Byte streams vs character streams, buffered I/O, serialVersionUID and transient fields'
      },
      {
        name: 'SOLID Design Principles & Clean Code Architecture',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion'
      }
    ]
  },

  // 7. Software Engineering & System Design
  {
    keys: ['software engineering', 'se', 'system design', 'software architecture'],
    subjectName: 'Software Engineering & System Design',
    topics: [
      {
        name: 'Software Development Life Cycle (SDLC) Models (Waterfall vs Agile)',
        difficulty: 'EASY',
        estimated_minutes: 35,
        description: 'Linear sequential, iterative, spiral model, risk management and agile development philosophy'
      },
      {
        name: 'Agile Methodology, Scrum Framework & User Stories',
        difficulty: 'EASY',
        estimated_minutes: 35,
        description: 'Sprints, sprint planning, daily standup, sprint retrospectives, story points and burndown charts'
      },
      {
        name: 'Requirements Engineering: SRS Document & Functional Requirements',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Elicitation, IEEE 830 standard, functional vs non-functional requirements and feasibility analysis'
      },
      {
        name: 'UML Structural Diagrams: Class & Object Diagrams',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Classes, associations, aggregations, compositions, generalisation and multiplicity'
      },
      {
        name: 'UML Behavioral Diagrams: Sequence, Use Case & State Diagrams',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Actors, use case boundaries, lifelines, synchronous messages and state transitions'
      },
      {
        name: 'Creational Design Patterns: Singleton, Factory, Builder & Prototype',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Object creation mechanisms, thread-safe singletons, factory method and fluent builders'
      },
      {
        name: 'Structural Design Patterns: Adapter, Decorator, Facade & Proxy',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Class wrapping, runtime feature extension, simplified subsystems and virtual/smart proxies'
      },
      {
        name: 'Behavioral Design Patterns: Observer, Strategy, Command & State',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Pub-Sub event notification, interchangeable algorithms, encapsulation of requests'
      },
      {
        name: 'Software Testing Methodologies: Black-Box vs White-Box Testing',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Equivalence partitioning, boundary value analysis, basis path testing and condition coverage'
      },
      {
        name: 'Code Metrics: Cyclomatic Complexity & Halstead Metrics',
        difficulty: 'MEDIUM',
        estimated_minutes: 35,
        description: 'Control flow graphs, McCabe complexity calculation (E - N + 2P) and maintainability index'
      },
      {
        name: 'CI/CD Pipelines, DevOps & Containerization Basics',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Automated test execution, build artifacts, Docker containers and blue-green deployments'
      },
      {
        name: 'System Design: Horizontal vs Vertical Scaling & Load Balancing',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'Stateless servers, round-robin, least connections, sticky sessions and health checks'
      },
      {
        name: 'System Design: Caching Strategies, CAP Theorem & Data Partitioning',
        difficulty: 'HARD',
        estimated_minutes: 60,
        description: 'Write-through, write-back, cache-aside, Redis, consistent hashing and database sharding'
      }
    ]
  },

  // 8. Theory of Computation / Automata (TOC / CD)
  {
    keys: ['toc', 'theory of computation', 'automata', 'flat', 'formal languages'],
    subjectName: 'Theory of Computation',
    topics: [
      {
        name: 'Deterministic Finite Automata (DFA): Design & Formal Definition',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: '5-tuple definition (Q, Sigma, delta, q0, F), transition tables and state diagrams'
      },
      {
        name: 'Non-Deterministic Finite Automata (NFA) & Subset Construction',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Non-deterministic choices, epsilon transitions and conversion of NFA to equivalent DFA'
      },
      {
        name: 'DFA Minimization: Myhill-Nerode & Table Filling Algorithm',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Distinguishable vs equivalent states, partition refinement and minimal state DFA synthesis'
      },
      {
        name: 'Regular Expressions & Arden Theorem',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Regular operators (union, concatenation, Kleene star) and conversion between RE and FA'
      },
      {
        name: 'Pumping Lemma for Regular Languages & Non-Regularity Proofs',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'Adversary game, decomposition w = xyz, pumping condition and proof by contradiction'
      },
      {
        name: 'Closure Properties of Regular Languages',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Union, intersection, complement, reversal, homomorphism and decision properties'
      },
      {
        name: 'Context-Free Grammars (CFG), Derivations & Ambiguity',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Leftmost/rightmost derivations, parse trees, inherently ambiguous grammars and disambiguation'
      },
      {
        name: 'Chomsky Normal Form (CNF) & Greibach Normal Form (GNF)',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Elimination of epsilon productions, unit productions, useless symbols and CNF conversion'
      },
      {
        name: 'Pushdown Automata (PDA): Acceptance by Final State & Empty Stack',
        difficulty: 'HARD',
        estimated_minutes: 60,
        description: 'Stack-based memory, instantaneous descriptions, deterministic (DPDA) vs non-deterministic (NPDA)'
      },
      {
        name: 'Pumping Lemma for Context-Free Languages (CFL)',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'Decomposition w = uvxyz, pumping conditions and proving languages non-CFL'
      },
      {
        name: 'Turing Machines (TM): Formal Definition & Instantaneous Descriptions',
        difficulty: 'HARD',
        estimated_minutes: 60,
        description: 'Read-write head, infinite tape, transition function and computational power of standard TM'
      },
      {
        name: 'Chomsky Hierarchy of Languages & Decidability',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Type 0, Type 1 (CSL), Type 2 (CFL), Type 3 (Regular) and linear-bounded automata'
      },
      {
        name: 'Halting Problem & Undecidability (Post Correspondence Problem)',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'Diagonalization language, Rice theorem, reduction techniques and uncomputability proofs'
      }
    ]
  },

  // 9. Machine Learning & Artificial Intelligence
  {
    keys: ['machine learning', 'ml', 'ai', 'artificial intelligence', 'data science'],
    subjectName: 'Machine Learning',
    topics: [
      {
        name: 'Supervised vs Unsupervised vs Reinforcement Learning',
        difficulty: 'EASY',
        estimated_minutes: 35,
        description: 'Taxonomy of machine learning paradigms, labeled vs unlabeled datasets and reward signals'
      },
      {
        name: 'Linear Regression, Cost Function & Gradient Descent',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Mean squared error (MSE), learning rate, batch vs stochastic vs mini-batch gradient descent'
      },
      {
        name: 'Logistic Regression & Binary Classification',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Sigmoid activation, log-loss function, odds ratio and decision boundaries'
      },
      {
        name: 'Bias-Variance Tradeoff & Regularization (L1 Lasso & L2 Ridge)',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Overfitting vs underfitting, L1 sparsity, L2 weight shrinkage and cross-validation'
      },
      {
        name: 'Decision Trees: Entropy, Information Gain & Gini Impurity',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'ID3, C4.5 and CART algorithms, recursive binary splitting and tree pruning strategies'
      },
      {
        name: 'Ensemble Learning: Random Forests & Bagging',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Bootstrap aggregating, out-of-bag error, feature sub-sampling and variance reduction'
      },
      {
        name: 'Boosting Algorithms: AdaBoost, Gradient Boosting & XGBoost',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'Sequential weak learner training, pseudo-residuals, shrinkage rate and tree depth limits'
      },
      {
        name: 'Support Vector Machines (SVM) & Kernel Trick',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'Maximal margin hyperplane, support vectors, slack variables, RBF and polynomial kernels'
      },
      {
        name: 'K-Nearest Neighbors (KNN) & Distance Metrics',
        difficulty: 'EASY',
        estimated_minutes: 35,
        description: 'Euclidean, Manhattan and Minkowski distances, choice of K and curse of dimensionality'
      },
      {
        name: 'Naive Bayes Classifier & Bayes Theorem',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Conditional independence assumption, Gaussian, Multinomial and Laplace smoothing'
      },
      {
        name: 'Evaluation Metrics: Confusion Matrix, ROC-AUC & F1-Score',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Precision, Recall, True Positive Rate, False Positive Rate and PR curves for imbalanced classes'
      },
      {
        name: 'Unsupervised Clustering: K-Means & Elbow Method',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Centroid initialization, Lloyd algorithm, within-cluster sum of squares (WCSS) and silhouette score'
      },
      {
        name: 'Dimensionality Reduction: Principal Component Analysis (PCA)',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Covariance matrix, eigenvalues, eigenvectors, variance explained and orthogonal projections'
      },
      {
        name: 'Artificial Neural Networks (ANN): Multi-Layer Perceptron & Backprop',
        difficulty: 'HARD',
        estimated_minutes: 60,
        description: 'Forward pass, ReLU/Sigmoid activations, chain rule gradient computation and weight updates'
      },
      {
        name: 'Convolutional Neural Networks (CNN): Convolutions & Pooling',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'Kernels, padding, stride, feature maps, max pooling and spatial hierarchy in image processing'
      },
      {
        name: 'Natural Language Processing: Word Embeddings & Transformers',
        difficulty: 'HARD',
        estimated_minutes: 60,
        description: 'Tokenization, TF-IDF, Word2Vec, self-attention mechanism and multi-head attention'
      }
    ]
  },

  // 10. Web Development & Full Stack
  {
    keys: ['web', 'web development', 'full stack', 'frontend', 'backend', 'mern', 'javascript', 'react', 'node'],
    subjectName: 'Web Technologies & Full Stack Development',
    topics: [
      {
        name: 'HTML5 Semantic Elements, Forms & Accessibility (a11y)',
        difficulty: 'EASY',
        estimated_minutes: 35,
        description: 'Semantic markup, ARIA roles, form validations and screen-reader accessibility'
      },
      {
        name: 'Modern CSS3: Flexbox Layout System',
        difficulty: 'EASY',
        estimated_minutes: 35,
        description: 'Flex container, flex-direction, justify-content, align-items, flex-grow and flex-shrink'
      },
      {
        name: 'Modern CSS3: CSS Grid & Responsive Media Queries',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Grid-template-columns, fr units, minmax, auto-fit/auto-fill and mobile-first responsive breakpoints'
      },
      {
        name: 'JavaScript: Scopes, Closures & Execution Context',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Call stack, memory heap, lexical scoping, closure data privacy and variable hoisting'
      },
      {
        name: 'JavaScript Asynchronous Programming: Promises & Async/Await',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Event loop, microtask vs macrotask queue, Promise.all, Promise.race and error handling'
      },
      {
        name: 'DOM Manipulation, Event Bubbling & Delegation',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Event propagation phases (capturing, target, bubbling), stopPropagation and event delegation'
      },
      {
        name: 'React Fundamentals: JSX, Component Lifecycle & Props',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Virtual DOM, reconciliation algorithm (Fiber), functional components and props immutability'
      },
      {
        name: 'React Hooks: useState, useEffect & useRef',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'State management, side effects dependency array, cleanup functions and mutable ref references'
      },
      {
        name: 'React Performance: useMemo, useCallback & React.memo',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Preventing unnecessary child re-renders, memoized values, stable function references and profiling'
      },
      {
        name: 'State Management: Context API vs Redux/Zustand',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Global state store, actions, reducers, selectors, context providers and re-render optimization'
      },
      {
        name: 'RESTful API Design Principles & HTTP Methods',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Resource naming, idempotency, status codes (200, 201, 400, 401, 403, 404, 500) and HATEOAS'
      },
      {
        name: 'Node.js Architecture: Event-Driven Non-Blocking I/O & Libuv',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Single-threaded event loop, worker thread pool, streams, buffers and process management'
      },
      {
        name: 'Express.js Framework: Middleware Architecture & Error Handling',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'App-level vs router-level middleware, next() chain, request validation and global error handling'
      },
      {
        name: 'Web Security: JWT Authentication, CORS, CSRF & XSS Prevention',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'Token signing, httpOnly cookies, Content Security Policy, input sanitization and secure headers'
      }
    ]
  },

  // 11. Discrete Mathematics
  {
    keys: ['math', 'discrete', 'mathematics', 'discrete mathematics', 'discrete structures'],
    subjectName: 'Discrete Mathematics',
    topics: [
      {
        name: 'Propositional Logic, Truth Tables & Logical Equivalences',
        difficulty: 'EASY',
        estimated_minutes: 35,
        description: 'Conjunction, disjunction, implications, biconditionals, De Morgan laws and tautology proofs'
      },
      {
        name: 'Predicate Logic, Quantifiers & Rules of Inference',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Universal and existential quantifiers, modus ponens, modus tollens and resolution'
      },
      {
        name: 'Set Theory: Subsets, Power Sets & Cartesian Products',
        difficulty: 'EASY',
        estimated_minutes: 35,
        description: 'Set operations, Venn diagrams, principle of inclusion-exclusion and disjoint sets'
      },
      {
        name: 'Relations: Equivalence Relations & Partial Orders (Posets)',
        difficulty: 'HARD',
        estimated_minutes: 45,
        description: 'Reflexive, symmetric, transitive, antisymmetric relations, Hasse diagrams and topological sorting'
      },
      {
        name: 'Functions: Injective (1-to-1), Surjective (Onto) & Bijective',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Domain, codomain, range, inverse functions, composition and Pigeonhole Principle applications'
      },
      {
        name: 'Mathematical Induction: Weak, Strong & Well-Ordering Principle',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Base case, induction hypothesis, inductive step and structural induction'
      },
      {
        name: 'Recurrence Relations & Characteristic Equation Method',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Linear homogeneous and non-homogeneous recurrence relations, generating functions'
      },
      {
        name: 'Combinatorics: Permutations, Combinations & Binomial Theorem',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Arrangements with repetition, stars-and-bars method, Pascal triangle and binomial coefficients'
      },
      {
        name: 'Graph Theory: Paths, Cycles, Euler & Hamiltonian Graphs',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Degrees, Handshaking lemma, Euler path criteria, Dirac theorem for Hamiltonian cycles'
      },
      {
        name: 'Trees, Spanning Trees & Graph Isomorphism',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Tree properties (N-1 edges), rooted trees, binary trees and adjacency matrix equivalence'
      },
      {
        name: 'Group Theory: Groups, Subgroups, Monoids & Semigroups',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Closure, associativity, identity, invertibility, abelian groups, Lagrange theorem and cosets'
      },
      {
        name: 'Boolean Algebra & Lattice Theory',
        difficulty: 'HARD',
        estimated_minutes: 45,
        description: 'Partially ordered sets, meet and join operators, complemented and distributive lattices'
      }
    ]
  },

  // 12. Cyber Security & Cryptography
  {
    keys: ['security', 'cyber security', 'information security', 'cryptography', 'network security'],
    subjectName: 'Cyber Security & Cryptography',
    topics: [
      {
        name: 'Security Foundations: CIA Triad & Threat Modeling',
        difficulty: 'EASY',
        estimated_minutes: 35,
        description: 'Confidentiality, Integrity, Availability, non-repudiation, STRIDE threat model'
      },
      {
        name: 'Classical Ciphers: Caesar, Vigenere & Playfair',
        difficulty: 'EASY',
        estimated_minutes: 35,
        description: 'Substitution ciphers, transposition ciphers, polyalphabetic ciphers and frequency analysis'
      },
      {
        name: 'Symmetric Cryptography: DES, Triple DES & AES',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Feistel cipher network, AES substitution-permutation network, block cipher modes (ECB, CBC, GCM)'
      },
      {
        name: 'Asymmetric Cryptography: RSA Algorithm & Prime Generation',
        difficulty: 'HARD',
        estimated_minutes: 55,
        description: 'Euler totient function, modular exponentiation, public/private keys and prime factorisation security'
      },
      {
        name: 'Diffie-Hellman Key Exchange & Discrete Logarithm Problem',
        difficulty: 'HARD',
        estimated_minutes: 45,
        description: 'Shared secret generation, Man-in-the-Middle vulnerabilities and elliptic curve Diffie-Hellman'
      },
      {
        name: 'Cryptographic Hash Functions: SHA-256 & MD5 Collision Resistance',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'One-way property, avalanche effect, birthday attack and Merkle-Damgard construction'
      },
      {
        name: 'Digital Signatures, HMAC & Public Key Infrastructure (PKI)',
        difficulty: 'HARD',
        estimated_minutes: 50,
        description: 'Authentication, non-repudiation, X.509 digital certificates and certificate authority (CA) chains'
      },
      {
        name: 'Common Web Attacks: SQL Injection, XSS & CSRF',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'Payload injection, parameterized queries, cross-site scripting (stored/reflected) and CSRF tokens'
      },
      {
        name: 'Network Attacks: DoS, DDoS, ARP Spoofing & DNS Poisoning',
        difficulty: 'MEDIUM',
        estimated_minutes: 45,
        description: 'SYN flood, amplification attacks, packet sniffing and cache poisoning mitigation'
      },
      {
        name: 'Firewalls, Intrusion Detection (IDS) & Prevention Systems (IPS)',
        difficulty: 'MEDIUM',
        estimated_minutes: 40,
        description: 'Packet filtering, stateful inspection, signature-based vs anomaly-based detection'
      }
    ]
  }
];

/**
 * Returns pre-curated topics matching a subject name via keyword matching.
 * Filters out topics that already exist in the user's syllabus.
 * @param {string} subjectName
 * @param {string[]} existingTopicNames
 * @returns {Array} Array of topic objects
 */
export function getCuratedTopics(subjectName, existingTopicNames = []) {
  if (!subjectName || typeof subjectName !== 'string') return [];

  const lowerName = subjectName.toLowerCase().trim();
  const existingSet = new Set(
    (existingTopicNames || []).map((t) => (typeof t === 'string' ? t.toLowerCase().trim() : ''))
  );

  // Normalize search tokens
  const cleanTokens = lowerName
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  // Find matching catalog entry
  const matchedCatalog = CURRICULUM_CATALOG.find((entry) => {
    // Exact or inclusion match on keys
    if (entry.keys.some((k) => lowerName.includes(k) || k.includes(lowerName))) {
      return true;
    }
    // Token-based matching
    return entry.keys.some((k) => cleanTokens.some((tok) => tok === k || k.includes(tok)));
  });

  if (!matchedCatalog) {
    return [];
  }

  // Return all topics from catalog, marking if already added
  return matchedCatalog.topics.map((t) => ({
    ...t,
    isAlreadyAdded: existingSet.has(t.name.toLowerCase().trim())
  }));
}
