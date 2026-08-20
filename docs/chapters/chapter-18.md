# Chapter 18: Advanced Linked Lists

---


## Cycle Analysis & Invariants


### Cycle Detection, Loop Entry Point, and In-Place Cycle Severing

While Chapter 9 and Chapter 17 established fast and slow pointer traversal, locating the exact cycle entry node requires geometric phase-2 analysis.

Suppose a list has a straight non-cyclic section of length $L$, a cycle entry node $E$, a loop length $C$, and pointers meet $k$ steps into the cycle.

```text
Head ----- L steps -----> [ Entry E ] ----- k steps -----> [ Meeting M ]
                              ^                                 |
                              +---------- (C - k) steps <-------+
Dist(Slow) = L + k
Dist(Fast) = L + k + m*C  (where m >= 1 complete loop laps)
Since Fast = 2*Slow:  2*(L + k) = L + k + m*C  ===>  L = m*C - k
Distance from Head to Entry (L) equals Distance from M to Entry!
```

When `slow` and `fast` collide, resetting one pointer to `head` and stepping both by $1$ causes them to meet precisely at cycle entry node $E$.

$$L = m \cdot C - k = (m - 1) \cdot C + (C - k)$$

Let's implement cycle detection, loop entry identification, and in-place loop severing.

```cpp
// Floyd Cycle Entry Finder & In-Place Cycle Severing
ListNode* detect_cycle_entry(ListNode* head) {
    ListNode *slow = head, *fast = head;

    // Phase 1: Detect loop presence via collision
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) break; // Collision point found
    }
    if (!fast || !fast->next) return nullptr; // No cycle

    // Phase 2: Find cycle entry node
    ListNode* entry = head;
    while (entry != slow) {
        entry = entry->next;
        slow = slow->next;
    }
    return entry;
}

void remove_cycle(ListNode* head) {
    ListNode* entry = detect_cycle_entry(head);
    if (!entry) return;

    // Find the tail node inside the loop whose next is entry
    ListNode* curr = entry;
    while (curr->next != entry) {
        curr = curr->next;
    }
    curr->next = nullptr; // Break the cycle in-place
}
```

| Step Index | `slow` Position | `fast` Position | Pointer Action | Event Logged |
| :--- | :--- | :--- | :--- | :--- |
| Step 0 | Head (Node 1) | Head (Node 1) | Start | - |
| Step 1 | Node 2 | Node 3 | Step $1$ / Step $2$ | - |
| Step 2 | Node 3 | Node 5 | Step $1$ / Step $2$ | - |
| Step 4 | Node 5 (Loop) | Node 5 (Loop) | Collision! | Phase 1 Complete |
| Phase 2 | Head $\to$ Node 3 | Node 5 $\to$ Node 3 | Both step by $1$ | **Entry Found at Node 3** |

```text
Before: ... -> [ Node A ] ---> [ Node B (Entry) ] <--- [ Tail Node ]
                                       |                     ^
                                       +--------> ... -------+
After finding Tail Node: execute Tail->next = nullptr
Restores standard linear null-terminated list!
```

> [!WARNING]
> When the cycle begins directly at the `head` node ($L = 0$), finding the last node in the cycle requires advancing `curr` until `curr->next == head` before breaking the pointer.

Let's now examine production cache structures with the Least Recently Used (LRU) Cache.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear time to detect, locate, and sever cycle.
- **Auxiliary Space:** $O(1)$ memory using two tracking pointers.

---


## Advanced Memory Structures & Caches


### LRU Cache Design — Doubly Linked List & Hash Map Integration

The Least Recently Used (LRU) cache evicts the least recently accessed item when capacity is exceeded, requiring strict $O(1)$ time for both `get` and `put`.

We achieve $O(1)$ operations by combining a Doubly Linked List (maintaining eviction order) with a Hash Map (storing direct pointers to list nodes).

```text
Hash Map: Key 1 -> NodeA,  Key 2 -> NodeB,  Key 3 -> NodeC

Doubly Linked List (Recency Order):
[ Dummy Head ] <===> [ NodeC ] <===> [ NodeA ] <===> [ Dummy Tail ]
(Most Recent)                                        (Least Recent)
```

Accessing or updating an item moves its node to the front in $O(1)$, while eviction removes the predecessor of `dummyTail` in $O(1)$.

$$\text{Operation Time: } \text{Get}(k) = O(1), \quad \text{Put}(k, v) = O(1), \quad \text{Eviction} = O(1)$$

Let's implement the complete `LRUCache` class.

```cpp
// Production LRU Cache: O(1) Get and Put Operations
struct DNode {
    int key, val;
    DNode *prev, *next;
    DNode(int k, int v) : key(k), val(v), prev(nullptr), next(nullptr) {}
};

class LRUCache {
    int capacity;
    unordered_map<int, DNode*> cache;
    DNode *head, *tail;

    void remove(DNode* node) {
        node->prev->next = node->next;
        node->next->prev = node->prev;
    }

    void add_to_head(DNode* node) {
        node->next = head->next;
        node->prev = head;
        head->next->prev = node;
        head->next = node;
    }
public:
    LRUCache(int cap) : capacity(cap) {
        head = new DNode(0, 0);
        tail = new DNode(0, 0);
        head->next = tail;
        tail->prev = head;
    }

    int get(int key) {
        if (cache.find(key) == cache.end()) return -1;
        DNode* node = cache[key];
        remove(node);
        add_to_head(node); // Mark as most recently used
        return node->val;
    }

    void put(int key, int value) {
        if (cache.find(key) != cache.end()) {
            DNode* node = cache[key];
            node->val = value;
            remove(node);
            add_to_head(node);
        } else {
            if (cache.size() == capacity) {
                DNode* lru = tail->prev;
                cache.erase(lru->key);
                remove(lru);
                delete lru;
            }
            DNode* new_node = new DNode(key, value);
            cache[key] = new_node;
            add_to_head(new_node);
        }
    }
};
```

| Operation | Cache State (MRU $\to$ LRU) | Action Taken | Evicted Key |
| :--- | :--- | :--- | :--- |
| `put(1, 1)` | `[1]` | Insert node at head | None |
| `put(2, 2)` | `[2, 1]` | Insert node at head | None |
| `get(1)` | `[1, 2]` | Move node 1 to head | None |
| `put(3, 3)` (Cap = 2) | `[3, 1]` | Evict node 2; insert node 3 | **Key 2 evicted** |

```text
1. Unlink node: node->prev->next = node->next;
                node->next->prev = node->prev;
2. Insert at head: node->next = head->next; node->prev = head;
                   head->next->prev = node; head->next = node;
```

> [!TIP]
> Using dummy `head` and `tail` sentinel nodes completely eliminates edge-case checks for empty lists or single-element boundary updates.

Let's now examine frequency-based caching with the Least Frequently Used (LFU) Cache.


#### Complexity Analysis
- **Time Complexity:** $O(1)$ worst-case for both `get` and `put`.
- **Auxiliary Space:** $\Theta(\text{Capacity})$ for hash table entries and doubly linked list nodes.

---


### LFU Cache Architecture — Frequency Buckets & O(1) Eviction

The Least Frequently Used (LFU) cache evicts the item accessed the fewest times, breaking frequency ties by evicting the least recently used element.

To achieve $O(1)$ time across all operations, we maintain three data structures: a key-to-node table, a frequency-to-doubly-linked-list table, and a `min_freq` integer.

```text
min_freq = 1
Freq 1 Bucket : [ Head ] <===> [ Key 3 ] <===> [ Tail ] (LRU in Freq 1)
Freq 2 Bucket : [ Head ] <===> [ Key 1 ] <===> [ Tail ]
Freq 5 Bucket : [ Head ] <===> [ Key 2 ] <===> [ Tail ]
When key 3 is accessed, it promotes from Freq 1 to Freq 2 in O(1)!
```

Accessing a key increments its frequency and relocates its node to the next frequency bucket in constant time.

$$\text{Frequency Promotion: } f(k) \to f(k) + 1 \implies \text{Relocate from } \text{Bucket}[f] \text{ to } \text{Bucket}[f+1]$$

Let's implement the complete $O(1)$ `LFUCache` class.

```cpp
// LFU Cache with O(1) Get and Put Operations
struct LFUNode {
    int key, val, freq;
    LFUNode(int k, int v) : key(k), val(v), freq(1) {}
};

class LFUCache {
    int capacity, min_freq;
    unordered_map<int, list<LFUNode>::iterator> key_map;
    unordered_map<int, list<LFUNode>> freq_map;

    void promote(list<LFUNode>::iterator it) {
        int f = it->freq;
        LFUNode node = *it;
        freq_map[f].erase(it);

        if (freq_map[f].empty() && min_freq == f) {
            min_freq++;
        }
        node.freq++;
        freq_map[node.freq].push_front(node);
        key_map[node.key] = freq_map[node.freq].begin();
    }
public:
    LFUCache(int cap) : capacity(cap), min_freq(0) {}

    int get(int key) {
        if (key_map.find(key) == key_map.end()) return -1;
        auto it = key_map[key];
        int val = it->val;
        promote(it);
        return val;
    }

    void put(int key, int value) {
        if (capacity <= 0) return;
        if (key_map.find(key) != key_map.end()) {
            auto it = key_map[key];
            it->val = value;
            promote(it);
            return;
        }

        if (key_map.size() == capacity) {
            auto& min_list = freq_map[min_freq];
            key_map.erase(min_list.back().key); // Evict LRU from min_freq bucket
            min_list.pop_back();
        }

        min_freq = 1;
        freq_map[1].push_front(LFUNode(key, value));
        key_map[key] = freq_map[1].begin();
    }
};
```

| Operation | Frequencies | `min_freq` | Eviction Candidate | Action Taken |
| :--- | :--- | :--- | :--- | :--- |
| `put(1, 1)` | `Key 1 (Freq: 1)` | $1$ | None | Added to Freq 1 |
| `put(2, 2)` | `Key 1 (1), Key 2 (1)` | $1$ | None | Added to Freq 1 |
| `get(1)` | `Key 1 (2), Key 2 (1)` | $1$ | Key 2 | Key 1 promoted to Freq 2 |
| `put(3, 3)` (Cap = 2) | `Key 1 (2), Key 3 (1)` | $1$ | Key 3 | **Key 2 evicted (Lowest freq)** |

```text
If multiple keys share the minimum frequency min_freq:
Evict the tail node of freq_map[min_freq] (Least Recently Used)!
New insertions reset min_freq = 1 because new items start at freq 1.
```

> [!IMPORTANT]
> When adding a new key, always set `min_freq = 1`. A newly inserted key always begins with frequency 1, regardless of how large previous frequencies have grown.

Let's now examine deep copying linked lists with random pointers.


#### Complexity Analysis
- **Time Complexity:** $O(1)$ worst-case for both `get` and `put`.
- **Auxiliary Space:** $O(\text{Capacity})$ auxiliary memory.

---


## Rearrangements, Deep Copies & Intersections


### Deep Copy with Random Pointers — Interleaving vs Hash Mapping

Cloning a linked list where each node contains both a `next` pointer and an arbitrary `random` pointer cannot be done in a single naive pass because random targets may not exist yet.

While a hash map solves this in $O(N)$ space, an optimal 3-pass Interleaving Algorithm solves it in $O(N)$ time and true $O(1)$ auxiliary space.

```text
Pass 1 (Clone & Interleave):
[ A ] ------> [ A' ] ------> [ B ] ------> [ B' ] ------> [ C ]

Pass 2 (Copy Random Links):
curr->next->random = curr->random ? curr->random->next : nullptr

Pass 3 (Decouple Chains):
Restore Original: [ A ] -> [ B ] -> [ C ]
Cloned Output   : [ A' ] -> [ B' ] -> [ C' ]
```

In Pass 2, the cloned node $A'$ directly accesses its cloned random target via $A\to\text{random}\to\text{next}$ in $O(1)$ time.

$$A'\to\text{random} = A\to\text{random}\to\text{next}$$

Let's implement the 3-pass interleaving algorithm.

```cpp
// Deep Copy with Random Pointers: O(N) Time, O(1) Auxiliary Space
struct Node {
    int val;
    Node* next;
    Node* random;
    Node(int v) : val(v), next(nullptr), random(nullptr) {}
};

Node* copy_random_list_interleaving(Node* head) {
    if (!head) return nullptr;

    // Pass 1: Clone nodes and interleave (A -> A' -> B -> B')
    Node* curr = head;
    while (curr) {
        Node* clone = new Node(curr->val);
        clone->next = curr->next;
        curr->next = clone;
        curr = clone->next;
    }

    // Pass 2: Connect random pointers for cloned nodes
    curr = head;
    while (curr) {
        if (curr->random) {
            curr->next->random = curr->random->next;
        }
        curr = curr->next->next;
    }

    // Pass 3: Decouple original list and cloned list
    curr = head;
    Node* cloned_head = head->next;
    Node* clone_curr = cloned_head;

    while (curr) {
        curr->next = curr->next->next;
        clone_curr->next = clone_curr->next ? clone_curr->next->next : nullptr;
        curr = curr->next;
        clone_curr = clone_curr->next;
    }
    return cloned_head;
}
```

| Pass Number | Target Operation | Pointers Modified | Memory Overhead |
| :--- | :--- | :--- | :--- |
| **Pass 1** | Duplicate nodes inline | `curr->next = clone` | $0$ auxiliary hash memory |
| **Pass 2** | Assign random targets | `clone->random = orig->random->next` | $0$ auxiliary memory |
| **Pass 3** | Unweave lists | Restore original `curr->next` | $0$ auxiliary memory |

```text
Original Node A has random pointing to Node C
Cloned Node A' is at A->next
Cloned Node C' is at C->next
Therefore: A'->random = A->random->next = C->next = C'
```

> [!CAUTION]
> In Pass 3, you MUST properly restore the original list's `next` pointers. Failing to restore the original list leaves the caller with corrupted input data.

Let's now study palindrome validation and odd-even node segregation.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ across three sequential passes.
- **Auxiliary Space:** $O(1)$ extra space beyond allocating the cloned nodes.

---


### Structure Checking & Segregation — Symmetry and Alternating Partition

Checking whether a chained sequence of data tokens is symmetric requires testing whether the first half matches the reversed second half.

We find the midpoint using fast/slow pointers, reverse the second half in-place, compare both halves element-by-element, and restore the list structure before returning.

```text
Original:    [ 1 ] -> [ 2 ] -> [ 2 ] -> [ 1 ]
Step 1: Slow/Fast pointers find midpoint -> [ 1 -> 2 ], [ 2 -> 1 ]
Step 2: Reverse 2nd half in-place        -> [ 1 -> 2 ], [ 1 -> 2 ]
Step 3: Compare both halves simultaneously -> 1==1, 2==2 (Match!)
Step 4: Re-reverse 2nd half to restore original list topology!
```

List segregation restructures node linkages to group alternating priority nodes together in $O(N)$ time and $O(1)$ space.

$$\text{odd}\to\text{next} = \text{even}\to\text{next}, \quad \text{even}\to\text{next} = \text{odd}\to\text{next}\to\text{next}$$

Let's implement chained sequence symmetry validation and alternating tier partitioning in C++.

```cpp
// Check Token Chain Symmetry: O(N) Time, O(1) Extra Space
bool is_symmetric_token_chain(ListNode* head) {
    if (!head || !head->next) return true;

    // 1. Find midpoint
    ListNode* slow = head;
    ListNode* fast = head;
    while (fast->next && fast->next->next) {
        slow = slow->next;
        fast = fast->next->next;
    }

    // 2. Reverse second half
    ListNode* prev = nullptr;
    ListNode* curr = slow->next;
    while (curr) {
        ListNode* next_node = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next_node;
    }

    // 3. Compare first and reversed second halves
    ListNode* p1 = head;
    ListNode* p2 = prev;
    bool is_symmetric = true;
    while (p2) {
        if (p1->val != p2->val) {
            is_symmetric = false;
            break;
        }
        p1 = p1->next;
        p2 = p2->next;
    }

    // 4. Restore original list structure
    curr = prev;
    prev = nullptr;
    while (curr) {
        ListNode* next_node = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next_node;
    }
    slow->next = prev;

    return is_symmetric;
}

// Partition Alternating Priority Nodes: O(N) Time, O(1) Space
ListNode* demux_alternating_priority(ListNode* head) {
    if (!head || !head->next) return head;

    ListNode* odd = head;
    ListNode* even = head->next;
    ListNode* even_head = even;

    while (even && even->next) {
        odd->next = even->next;
        odd = odd->next;
        even->next = odd->next;
        even = even->next;
    }
    odd->next = even_head; // Connect odd tail to even head
    return head;
}
```

#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear time.
- **Auxiliary Space:** $O(1)$ memory using two pointers.

---


### List Intersection Search — Two-Pointer Boundary Alignment

Finding the intersection point of two singly linked lists that merge into a shared tail can be solved without measuring lengths using pointer switching.

When pointer $A$ reaches the end of list $A$, it redirects to the head of list $B$; similarly, pointer $B$ redirects to the head of list $A$.

```text
List A: [ a1 ] -> [ a2 ] -----------> [ c1 ] -> [ c2 ] -> [ c3 ]
List B: [ b1 ] -> [ b2 ] -> [ b3 ] -> [ c1 ] -> [ c2 ] -> [ c3 ]

Pointer A path: len(A) + len(B) = (a + c) + (b + c)
Pointer B path: len(B) + len(A) = (b + c) + (a + c)
Both pointers traverse identical total distance and meet at c1!
```

Because both pointers traverse exactly $a + b + c$ nodes, they arrive at the intersection node at the exact same step.

$$\text{Total Steps: } D_A = a + c + b = D_B = b + c + a$$

Let's write the wrap-around intersection finder.

```cpp
// Intersection of Two Linked Lists: O(N + M) Time, O(1) Space
ListNode* get_intersection_node(ListNode* headA, ListNode* headB) {
    if (!headA || !headB) return nullptr;
    ListNode *pA = headA, *pB = headB;

    // Both pointers traverse A + B total nodes
    while (pA != pB) {
        pA = (pA == nullptr) ? headB : pA->next;
        pB = (pB == nullptr) ? headA : pB->next;
    }
    return pA; // Returns intersection node or nullptr if disjoint
}
```

| Step | Pointer `pA` Position | Pointer `pB` Position | Switch Event |
| :--- | :--- | :--- | :--- |
| Step 0 | $A_1$ | $B_1$ | Initial positions |
| Step 2 | $A_2$ | $B_3$ | Advancing |
| Step 3 | $C_1$ | End of $B$ $\to$ switches to $A_1$ | `pB` switches to `headA` |
| Step 5 | End of $A$ $\to$ switches to $B_1$ | $A_2$ | `pA` switches to `headB` |
| Step 8 | $C_1$ | $C_1$ | **Collision at intersection node $C_1$!** |

```text
If lists do NOT intersect:
Pointer A traverses |A| + |B| steps and hits nullptr
Pointer B traverses |B| + |A| steps and hits nullptr
Loop terminates cleanly with pA == pB == nullptr!
```

> [!IMPORTANT]
> If the two lists do not share an intersection, both pointers reach `nullptr` simultaneously on their second pass, terminating the loop safely without an infinite cycle.

This completes the Advanced Linked Lists chapter, covering cycle severing, LRU/LFU caches, random pointer deep copies, palindrome verification, odd-even segregations, and dual-pointer intersection alignments.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N + M)$ linear time across both lists.
- **Auxiliary Space:** $O(1)$ space using two pointers.

---


## Cheat Sheet & Quick Reference

| Advanced Technique | Core Data Structure | Key Invariant / Mechanism | Complexity |
| :--- | :--- | :--- | :--- |
| **Floyd Cycle Severing** | 2-Pointer Tortoise/Hare | $L = mC - k$; find tail and set `next = nullptr` | $\Theta(N)$ / $O(1)$ Space |
| **LRU Cache** | Hash Map + Doubly List | Relocate to head on access; evict tail predecessor | $O(1)$ Get & Put |
| **LFU Cache** | Key Map + Freq Map | Multi-bucket frequency lists + `min_freq` tracking | $O(1)$ Get & Put |
| **Random Copy (Interleave)**| 3-Pass Inline Nodes | `clone->random = orig->random->next` | $O(N)$ / $O(1)$ Aux Space |
| **Palindrome List** | Fast/Slow + Half Reversal | Invert second half in-place; compare inward | $\Theta(N)$ / $O(1)$ Space |
| **Odd-Even Partition** | Dual Pointer Leap | `odd->next = even->next; even->next = odd->next` | $\Theta(N)$ / $O(1)$ Space |
| **List Intersection** | 2-Pointer Wrap Switch | `pA = (pA ? pA->next : headB)` | $\Theta(N+M)$ / $O(1)$ Space |
