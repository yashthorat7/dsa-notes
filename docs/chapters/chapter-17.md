# Chapter 17: Linked Lists

---


## Linked List Representations


### Node Memory Models — Singly, Doubly, and Circular Linked Lists

Building on Chapter 6's contiguous memory vs heap fragmentation model, linked lists trade cache locality for dynamic $O(1)$ pointer-based splicing.

Linked list nodes are allocated independently on the heap and connected via memory address pointers rather than physical memory adjacency.

```text
Contiguous Array: [ 10 ][ 20 ][ 30 ][ 40 ] (Address: 0x100 - 0x10F)

Linked List Heap:
[ 10 | 0x480 ] ----> [ 20 | 0x120 ] ----> [ 30 | 0x900 ] ----> NULL
(Addr: 0x300)        (Addr: 0x480)        (Addr: 0x120)
```

On 64-bit systems, an 8-byte pointer accompanying a 4-byte integer incurs significant memory overhead and destroys CPU cache prefetching.

$$\text{Pointer Overhead} = \frac{\text{sizeof}(\text{pointer})}{\text{sizeof}(\text{val}) + \text{sizeof}(\text{pointer})} = \frac{8}{4 + 8} = 66.7\% \text{ overhead}$$

Let's write the C++ struct definitions for Singly and Doubly linked list nodes.

```cpp
// Singly and Doubly Linked List Node Structs
struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(nullptr) {}
};

struct DoublyListNode {
    int val;
    DoublyListNode* prev;
    DoublyListNode* next;
    DoublyListNode(int x) : val(x), prev(nullptr), next(nullptr) {}
};
```

In a circular linked list, the tail node's `next` pointer loops back to the `head` node instead of terminating at `nullptr`.

```cpp
// Circular Linked List Loop Detector
bool is_circular(ListNode* head) {
    if (!head) return false;
    ListNode* curr = head->next;
    while (curr && curr != head) {
        curr = curr->next;
    }
    return curr == head;
}
```

| Structure | Predecessor Access | Memory per Node | Cache Locality | Random Access ($O(1)$) |
| :--- | :--- | :--- | :--- | :--- |
| **Array / Vector** | $O(1)$ by index | $0$ pointer overhead | Excellent (Contiguous) | Yes |
| **Singly Linked List** | $O(N)$ traversal | 1 pointer ($8$ bytes) | Poor (Scattered) | No ($O(N)$ sequential) |
| **Doubly Linked List** | $O(1)$ via `prev` | 2 pointers ($16$ bytes) | Poor (Scattered) | No ($O(N)$ sequential) |
| **Circular List** | $O(N)$ wrap around | 1 pointer ($8$ bytes) | Poor (Scattered) | No ($O(N)$ sequential) |

```text
Singly Linked:  [ A ] ------> [ B ] ------> [ C ] ------> NULL
Doubly Linked:  [ A ] <=====> [ B ] <=====> [ C ] <=====> NULL
Circular List:  [ A ] ------> [ B ] ------> [ C ]
                  ^                          |
```

> [!WARNING]
> When deleting nodes manually, always save `ListNode* next_node = curr->next` before calling `delete curr`. Deleting `curr` first causes an illegal use-after-free error when reading `curr->next`.

Let's now examine structural node insertions and deletions.


#### Complexity Analysis
- **Time Complexity:** $O(1)$ insertion/deletion at known node pointer; $O(N)$ to access index $k$.
- **Auxiliary Space:** $O(1)$ memory per operation.

---


## Core Operations & Traversal Tricks


### Structural Node Mutations — Insertions, Deletions, and Node Reference Pruning

Inserting or deleting a node in a linked list requires updating pointer links in a specific order to avoid losing access to the rest of the chain.

To insert a new node after `curr`, we first point `newNode->next` to `curr->next`, and only then update `curr->next` to point to `newNode`.

```text
Initial: [ curr ] ------------------------------> [ next_node ]
Step 1 : [ newNode ] --------> [ next_node ]      (Set newNode->next)
Step 2 : [ curr ] -----------> [ newNode ]        (Set curr->next)
New Chain: [ curr ] -> [ newNode ] -> [ next_node ]
```

To delete an interior node, we reroute the predecessor node's `next` pointer to bypass the target node.

$$\text{curr}\to\text{next} = \text{curr}\to\text{next}\to\text{next}$$

Let's implement insertion and deletion routines with memory management.

```cpp
// Linked List Insertion and Deletion Subroutines
void insert_after(ListNode* curr, int val) {
    if (!curr) return;
    ListNode* new_node = new ListNode(val);
    new_node->next = curr->next;
    curr->next = new_node;
}

void delete_after(ListNode* curr) {
    if (!curr || !curr->next) return;
    ListNode* to_delete = curr->next;
    curr->next = to_delete->next;
    delete to_delete;
}

// Delete Node Given ONLY Pointer to Target (Not Head)
void delete_node_without_head(ListNode* node) {
    // Copy data from next node and bypass it
    ListNode* next_node = node->next;
    node->val = next_node->val;
    node->next = next_node->next;
    delete next_node;
}
```

| Operation | Pointer Manipulations | Memory Freed? | Edge Case Caution |
| :--- | :--- | :--- | :--- |
| **Insert Head** | `newNode->next = head; head = newNode;` | No (Allocates) | Update `head` pointer |
| **Insert Interior** | `newNode->next = curr->next; curr->next = newNode;` | No (Allocates) | Order of pointer writes |
| **Delete Interior** | `temp = curr->next; curr->next = temp->next; delete temp;` | Yes (`delete temp`) | Check `curr->next != nullptr` |
| Delete Without Head | `node->val = next->val; node->next = next->next;` | Yes (`delete next`) | Cannot delete tail node! |

```text
Target: Node with value 'B'
List  : [ A ] ----> [ B ] ----> [ C ] ----> [ D ]
Step 1: Copy value 'C' into target node: [ B ] becomes [ C ]
Step 2: Bypass real node 'C': [ C (old B) ] ----> [ D ]
Step 3: Deallocate original node 'C' from heap memory
```

> [!CAUTION]
> The `deleteNodeWithoutHead` trick copies the successor's data and bypasses it. This trick CANNOT delete the tail node of a singly linked list because there is no successor node to copy data from.

Let's now examine sentinel dummy nodes and fast/slow pointer navigation.


#### Complexity Analysis
- **Time Complexity:** $O(1)$ for direct pointer mutations; $O(N)$ if searching for target value first.
- **Auxiliary Space:** $O(1)$ scalar pointers.

---


### Traversal Patterns — Sentinel Nodes & Tortoise-Hare Navigation

Managing special-case logic for mutating the `head` node often leads to cluttered code with repeated `if (head == nullptr)` checks.

A Sentinel Dummy Node sits immediately before `head`, ensuring that every real list node—including the first element—always has a non-null predecessor.

```text
[ Dummy Node (0) ] ------> [ Head Node (10) ] ------> [ Node (20) ]
        ^
        |
Operating on dummy->next unifies head insertions and deletions!
Return dummy.next as the final valid head of the modified list.
```

Floyd's Tortoise and Hare algorithm uses two pointers moving at different speeds: `slow` advances 1 step while `fast` advances 2 steps.

$$\text{Speed Ratio: } v_{\text{fast}} = 2 \cdot v_{\text{slow}} \implies \text{When } \text{fast reaches end}, \; \text{slow is at } \lfloor N/2 \rfloor$$

Let's implement sorted list insertion with a dummy head alongside Floyd's midpoint and cycle detectors.

```cpp
// Dummy Sentinel Head and Tortoise-Hare Algorithms
ListNode* insert_sorted(ListNode* head, int val) {
    ListNode dummy(0); // Stack-allocated sentinel dummy
    dummy.next = head;
    ListNode* curr = &dummy;

    while (curr->next && curr->next->val < val) {
        curr = curr->next;
    }
    ListNode* new_node = new ListNode(val);
    new_node->next = curr->next;
    curr->next = new_node;
    return dummy.next;
}

ListNode* find_middle_node(ListNode* head) {
    ListNode* slow = head;
    ListNode* fast = head;
    while (fast && fast->next) {
        slow = slow->next;       // 1 step
        fast = fast->next->next; // 2 steps
    }
    return slow; // Points to middle node
}

bool has_cycle(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true; // Cycle detected
    }
    return false;
}
```

| Step Count $t$ | `slow` Position | `fast` Position | Distance Closure in Cycle of Length $C$ |
| :--- | :--- | :--- | :--- |
| $0$ | Node $0$ | Node $0$ | Initial state |
| $1$ | Node $1$ | Node $2$ | Distance gap $= 1$ |
| $2$ | Node $2$ | Node $4$ | Distance gap $= 2$ |
| $k$ | Node $k$ | Node $2k$ | $2k - k = k \equiv 0 \pmod C \implies \text{Collision!}$ |

```text
Head ---- F steps ----> [ Cycle Entry ] ---- a steps ----> [ Meeting ]
                            ^                                   |
                            +-------------- b steps <-----------+
Distance Slow = F + a,  Distance Fast = F + a + k*C
2*(F + a) = F + a + k*C  ===>  F = k*C - a = b
Advancing one pointer from Head and one from Meeting meets at Entry!
```

> [!TIP]
> Use a stack-allocated sentinel `ListNode dummy(0); dummy.next = head;` and return `dummy.next`. This avoids dynamic heap allocation while simplifying head modifications.

Let's now examine pointer redirections, full list reversals, and $K$-group inversions.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear scan for midpoint and cycle detection.
- **Auxiliary Space:** $O(1)$ memory using two pointers.

---


## Classic List Algorithms & Sorting


### In-Place Pointer Redirections — Reversals, K-Group Inversion, and Swaps

Reversing a singly linked list in place requires three tracking pointers: `prev` (reversed prefix), `curr` (active node), and `next` (unreversed suffix).

At each node, we save `curr->next`, point `curr->next` backward to `prev`, and advance both pointers forward.

```text
[ Prev ]       [ Curr ] ------> [ Next ]
                 |
Step 1: next = curr->next
Step 2: curr->next = prev     (Reverse pointer backward)
Step 3: prev = curr; curr = next (Advance forward)
```

The loop invariant guarantees that at any step, `prev` points to the head of the fully reversed prefix.

$$\text{Invariant: } \text{ReversedPrefix} \leftarrow \text{prev}, \quad \text{curr} \to \text{UnreversedSuffix}$$

Let's implement iterative list reversal alongside Reverse Nodes in $K$-Group.

```cpp
// 3-Pointer List Reversal and Reverse Nodes in K-Group
ListNode* reverse_list(ListNode* head) {
    ListNode* prev = nullptr;
    ListNode* curr = head;

    while (curr) {
        ListNode* next_node = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next_node;
    }
    return prev; // New head of reversed list
}

ListNode* reverse_k_group(ListNode* head, int k) {
    ListNode dummy(0);
    dummy.next = head;
    ListNode* group_prev = &dummy;

    while (true) {
        // 1. Check if at least k nodes remain
        ListNode* kth = group_prev;
        for (int i = 0; i < k && kth; ++i) kth = kth->next;
        if (!kth) break;

        ListNode* group_next = kth->next;
        ListNode* prev = group_next;
        ListNode* curr = group_prev->next;

        // 2. Reverse k nodes in place
        while (curr != group_next) {
            ListNode* tmp = curr->next;
            curr->next = prev;
            prev = curr;
            curr = tmp;
        }

        // 3. Connect previous group tail to new group head
        ListNode* next_group_prev = group_prev->next;
        group_prev->next = kth;
        group_prev = next_group_prev;
    }
    return dummy.next;
}
```

| Iteration ($K=2$) | Group Probed | Subsegment Reversed | Stitch Action |
| :--- | :--- | :--- | :--- |
| Group 1 | `[1, 2]` | `[2, 1]` | `dummy->next = 2; 1->next = 3` |
| Group 2 | `[3, 4]` | `[4, 3]` | `1->next = 4; 3->next = 5` |
| Remaining | `[5]` (Length $< K$) | Left as `[5]` | `3->next = 5` (Done) |

```text
Before: ... [ group_prev ] ---> [ 1 ] -> [ 2 ] ---> [ group_next ] ...
Reversal of [1, 2] yields:       [ 2 ] -> [ 1 ]
Reconnect:  group_prev->next = [ 2 ]
            [ 1 ]->next      = group_next
```

> [!WARNING]
> In $K$-Group Reversal, if the remaining tail has fewer than $K$ nodes, standard problem requirements leave them in their original order without reversing.

Let's now examine merging sorted linked lists.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear time to traverse and redirect pointers.
- **Auxiliary Space:** $O(1)$ memory using three scalar pointers.

---


### Merging Sorted Linked Lists — Iterative vs Recursive Approaches

Merging two sorted linked lists $L_1$ and $L_2$ into a single sorted list splices existing nodes together without creating new heap allocations.

The iterative approach uses a dummy head node and a `tail` pointer, repeatedly attaching the node with the smaller value and advancing forward.

```text
L1:   [ 1 ] ----> [ 3 ] ----> [ 5 ]
L2:   [ 2 ] ----> [ 4 ] ----> [ 6 ]
Spliced Chain:
[ Dummy ] -> [ 1 ] -> [ 2 ] -> [ 3 ] -> [ 4 ] -> [ 5 ] -> [ 6 ]
```

The merge loop performs at most $N + M$ comparisons, where $N$ and $M$ are the lengths of the lists.

$$\text{Total Comparisons} \le N + M = O(N + M)$$

Let's implement both the iterative and recursive merge algorithms.

```cpp
// Iterative vs Recursive List Merging: O(N + M) Time
ListNode* merge_two_lists_iterative(ListNode* l1, ListNode* l2) {
    ListNode dummy(0);
    ListNode* tail = &dummy;

    while (l1 && l2) {
        if (l1->val <= l2->val) {
            tail->next = l1;
            l1 = l1->next;
        } else {
            tail->next = l2;
            l2 = l2->next;
        }
        tail = tail->next;
    }
    // Attach remaining non-empty list
    tail->next = l1 ? l1 : l2;
    return dummy.next;
}

ListNode* merge_two_lists_recursive(ListNode* l1, ListNode* l2) {
    if (!l1) return l2;
    if (!l2) return l1;

    if (l1->val <= l2->val) {
        l1->next = merge_two_lists_recursive(l1->next, l2);
        return l1;
    } else {
        l2->next = merge_two_lists_recursive(l1, l2->next);
        return l2;
    }
}
```

| Step | $L_1$ Value | $L_2$ Value | Selected Node | `tail->next` Updated To |
| :--- | :--- | :--- | :--- | :--- |
| $1$ | $1$ | $2$ | $1$ (from $L_1$) | `tail->next = 1` |
| $2$ | $3$ | $2$ | $2$ (from $L_2$) | `tail->next = 2` |
| $3$ | $3$ | $4$ | $3$ (from $L_1$) | `tail->next = 3` |
| $4$ | $5$ | $4$ | $4$ (from $L_2$) | `tail->next = 4` |

```text
Instead of copying node data into a new vector, we splice existing
pointers directly in memory, achieving true O(1) auxiliary space!
```

> [!CAUTION]
> The recursive merge allocates $O(N + M)$ stack frames. For large lists ($N > 100,000$), recursion triggers a stack overflow crash. Always prefer the iterative merge in production.

Let's now examine list arithmetic and Merge Sort on linked lists.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N + M)$ linear time.
- **Auxiliary Space:** $O(1)$ for iterative merge; $O(N + M)$ stack space for recursive merge.

---


### Linked List Math & Merge Sort on Linked Lists

Linked lists represent arbitrary-precision integers by storing digits sequentially across node chains.

When adding two large integer node streams, we traverse both lists simultaneously, computing the column sum along with any running carry digit.

```text
List 1 (342 as reverse digits):  (2) -> (4) -> (3)
List 2 (465 as reverse digits):  (5) -> (6) -> (4)
Addition:
Col 0: 2 + 5 + carry(0) = 7,  carry = 0 -> Node(7)
Col 1: 4 + 6 + carry(0) = 10, carry = 1 -> Node(0)
Col 2: 3 + 4 + carry(1) = 8,  carry = 0 -> Node(8)
Result List (807 as reverse):    (7) -> (0) -> (8)
```

```text
List:       (4) ----> (2) ----> (1) ----> (3) ----> NULL
Pointers:  head      slow      mid       fast
Sever:     slow->next = nullptr
Left Half:  (4) ----> (2) ----> NULL
Right Half: (1) ----> (3) ----> NULL  (Now recursively sort & merge!)
```

The column sum recurrence propagates the carry digit forward to higher-order places:

$$\text{sum} = \text{val}_1 + \text{val}_2 + \text{carry}, \quad \text{digit} = \text{sum} \bmod 10, \quad \text{carry} = \lfloor \text{sum} / 10 \rfloor$$

Let's implement big-integer node addition alongside full Merge Sort on linked lists.

```cpp
// Add Two Big-Integer Node Chains: O(max(N, M)) Time, O(max(N, M)) Space
ListNode* add_digit_node_chains(ListNode* l1, ListNode* l2) {
    ListNode dummy(0);
    ListNode* curr = &dummy;
    int carry = 0;

    while (l1 != nullptr || l2 != nullptr || carry != 0) {
        int sum = carry;
        if (l1 != nullptr) {
            sum += l1->val;
            l1 = l1->next;
        }
        if (l2 != nullptr) {
            sum += l2->val;
            l2 = l2->next;
        }

        carry = sum / 10;
        curr->next = new ListNode(sum % 10);
        curr = curr->next;
    }
    return dummy.next;
}

// Split and Merge Sort Linked List in O(N log N) Time
ListNode* merge_sorted_chains(ListNode* l1, ListNode* l2) {
    ListNode dummy(0);
    ListNode* tail = &dummy;

    while (l1 && l2) {
        if (l1->val <= l2->val) {
            tail->next = l1;
            l1 = l1->next;
        } else {
            tail->next = l2;
            l2 = l2->next;
        }
        tail = tail->next;
    }
    tail->next = l1 ? l1 : l2;
    return dummy.next;
}

ListNode* sort_linked_list(ListNode* head) {
    if (!head || !head->next) return head;

    // Fast and slow pointers to find midpoint
    ListNode* slow = head;
    ListNode* fast = head->next;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
    }

    ListNode* mid = slow->next;
    slow->next = nullptr; // Disconnect into two halves

    ListNode* left = sort_linked_list(head);
    ListNode* right = sort_linked_list(mid);
    return merge_sorted_chains(left, right);
}
```

#### Complexity Analysis
- **Time Complexity:** $\Theta(N \log N)$ for Merge Sort; $\Theta(\max(N, M))$ for Big-Integer Chain Addition.
- **Auxiliary Space:** $O(\log N)$ stack space for Merge Sort; $O(\max(N, M))$ output nodes for Big-Integer Chain Addition.

---


## Cheat Sheet & Quick Reference

| Technique | Goal | Core Invariant / Mechanism | Complexity |
| :--- | :--- | :--- | :--- |
| **Sentinel Dummy Head** | Simplify edge cases | `ListNode dummy(0); dummy.next = head;` | $O(1)$ / $O(1)$ Space |
| **Delete Without Head** | $O(1)$ node removal | Copy data from next node and bypass it | $O(1)$ / $O(1)$ Space |
| **Floyd's Tortoise & Hare**| Midpoint / Cycle check | `slow` (1 step), `fast` (2 steps) | $\Theta(N)$ / $O(1)$ Space |
| **Cycle Entry Point** | Find loop start | Reset 1 pointer to head after collision | $\Theta(N)$ / $O(1)$ Space |
| **3-Pointer Reversal** | In-place list invert | `next = curr->next; curr->next = prev;` | $\Theta(N)$ / $O(1)$ Space |
| **Reverse in K-Group** | Subsegment inversion | Reverse chunks of $K$; stitch boundary links | $\Theta(N)$ / $O(1)$ Space |
| **Merge Two Lists** | Interleave sorted nodes | Dummy head + tail pointer splice | $\Theta(N+M)$ / $O(1)$ Space |
| **Linked List Merge Sort**| In-place list sorting | Bisect with Tortoise-Hare; sever and merge | $\Theta(N \log N)$ / $O(\log N)$ |
