# Chapter 19: Stacks & Queues

---


## Stack & Queue Architectures


### Stack Architecture — LIFO Semantics & Container Adapters

As explored in Chapter 5's call stack execution model, Last-In, First-Out (LIFO) semantics restrict element access so that insertions and removals occur exclusively at one designated boundary called the `top`.

```text
Push(10) -> Push(20) -> Push(30):

  |  30  |  <--- TOP (Most recently inserted element)
  |  20  |
  |  10  |
  +------+
Pop() extracts 30 first, leaving 20 as the new TOP in O(1) time.
```

Any arbitrary sequence of pushed values pops in exact reverse chronological order.

$$\text{Push: } \langle x_1, x_2, \dots, x_k \rangle \implies \text{Pop: } \langle x_k, \dots, x_2, x_1 \rangle$$

Let's write a dynamic array-backed stack class in C++.

```cpp
// Array-Backed Stack Implementation: O(1) Amortized Push/Pop
template <typename T>
class ArrayStack {
    vector<T> data;
public:
    void push(const T& val) {
        data.push_back(val); // Amortized O(1) time
    }

    void pop() {
        if (!empty()) data.pop_back();
    }

    T top() const {
        return data.back();
    }

    bool empty() const {
        return data.empty();
    }

    size_t size() const {
        return data.size();
    }
};
```

We can also implement a stack using a singly linked list, which guarantees worst-case $O(1)$ operations with zero resizing spikes.

```cpp
// Linked List Stack: Guaranteed O(1) Worst-Case Push/Pop
template <typename T>
class LinkedListStack {
    struct Node {
        T val;
        Node* next;
        Node(T v, Node* n) : val(v), next(n) {}
    };
    Node* head = nullptr;
    size_t count = 0;
public:
    void push(const T& val) {
        head = new Node(val, head);
        count++;
    }
    void pop() {
        if (head) {
            Node* tmp = head;
            head = head->next;
            delete tmp;
            count--;
        }
    }
    T top() const { return head->val; }
    bool empty() const { return head == nullptr; }
    size_t size() const { return count; }
};
```

| Metric | Dynamic Array Stack | Linked List Stack | `stack<T>` |
| :--- | :--- | :--- | :--- |
| **Push / Pop Time** | Amortized $O(1)$ | Guaranteed $O(1)$ | Amortized $O(1)$ |
| **Cache Locality** | Excellent (Contiguous) | Poor (Scattered heap nodes) | High (Paged chunks) |
| **Memory Overhead** | Unused vector capacity | 8-byte pointer per node | Small chunk map |

> [!NOTE]
> **C++ Architecture — Why Deque is the Default Adapter Backing:**
> In the C++ standard library, `stack<T>` and `queue<T>` default to wrapping `deque<T>` rather than `vector<T>`. A `deque` allocates memory in fixed-size chunks (pages), eliminating massive single-block reallocations and buffer copies when the stack grows, while maintaining $O(1)$ push and pop operations.

```text
[ Frame 3: helper()   ]  <--- Active execution frame
[ Frame 2: process()  ]
[ Frame 1: main()     ]
Functions push frames on invocation and pop frames upon return.
```

> [!WARNING]
> Calling `pop()` or `top()` on an empty `stack` triggers undefined behavior or segmentation faults in C++. Always guard accesses with `if (!s.empty())`.

Let's now examine First-In, First-Out (FIFO) queue semantics and circular ring buffers.


#### Complexity Analysis
- **Time Complexity:** $O(1)$ worst-case for linked list stack; amortized $O(1)$ for array stack.
- **Auxiliary Space:** $O(N)$ memory to store $N$ elements.

---


### Queue Architecture — FIFO Mechanics & Circular Ring Buffers

A queue enforces First-In, First-Out (FIFO) ordering: new elements enter at the `rear` and exit from the `front`.

Implementing a queue on a linear array causes "false overflow" as pointers march rightward; circular array ring buffers solve this via modulo arithmetic $(i + 1) \bmod N$.

```text
Array of size N = 6:
Slot 0: [ 30 ]  <-- Rear (Enqueued last)
Slot 1: [    ]
Slot 2: [    ]
Slot 3: [    ]
Slot 4: [ 10 ]  <-- Front (Dequeued next)
Slot 5: [ 20 ]
Modulo index wrapping allows infinite continuous streaming!
```

Circular queue pointer transitions wrap around the array boundaries in constant time.

$$\text{rear} = (\text{rear} + 1) \bmod N, \quad \text{front} = (\text{front} + 1) \bmod N, \quad \text{size} = (\text{rear} - \text{front} + N) \bmod N$$

Let's implement a production-ready `CircularQueue` in C++.

```cpp
// Circular Ring Buffer Queue: O(1) Enqueue and Dequeue
class CircularQueue {
    vector<int> buffer;
    int front_idx = 0;
    int rear_idx = 0;
    int count = 0;
    int capacity;
public:
    CircularQueue(int k) : capacity(k), buffer(k, 0) {}

    bool enqueue(int value) {
        if (is_full()) return false;
        buffer[rear_idx] = value;
        rear_idx = (rear_idx + 1) % capacity;
        count++;
        return true;
    }

    bool dequeue() {
        if (is_empty()) return false;
        front_idx = (front_idx + 1) % capacity;
        count--;
        return true;
    }

    int front() const { return is_empty() ? -1 : buffer[front_idx]; }
    int rear() const { return is_empty() ? -1 : buffer[(rear_idx - 1 + capacity) % capacity]; }
    bool is_empty() const { return count == 0; }
    bool is_full() const { return count == capacity; }
};
```

| Operation | `front_idx` | `rear_idx` | `count` | Buffer State ($N=3$) |
| :--- | :--- | :--- | :--- | :--- |
| `enqueue(10)` | $0$ | $1$ | $1$ | `[10, _, _]` |
| `enqueue(20)` | $0$ | $2$ | $2$ | `[10, 20, _]` |
| `dequeue()` | $1$ | $2$ | $1$ | `[_, 20, _]` |
| `enqueue(30)` | $1$ | $0$ (wraps!) | $2$ | `[_, 20, 30]` |

```text
When rear_idx reaches index N-1, the next enqueue steps to index 0:
rear_idx = (2 + 1) % 3 = 0 (Wraps around to front slot!)
```

> [!TIP]
> Tracking an explicit `count` variable cleanly disambiguates the "Full" vs "Empty" state when `front_idx == rear_idx`, allowing all $N$ slots to be utilized.

Let's now examine double-ended queues and paged block memory allocation.


#### Complexity Analysis
- **Time Complexity:** $\Theta(1)$ constant time for enqueue, dequeue, front, and rear.
- **Auxiliary Space:** $\Theta(K)$ fixed buffer memory.

---


### Double-Ended Queues (Deque) & Paged Block Allocation

A Double-Ended Queue (Deque) supports constant-time insertions and removals at both ends (`push_front`, `push_back`, `pop_front`, `pop_back`).

In standard C++, `deque` uses a two-level paged memory architecture: a central map array of pointers pointing to fixed-size contiguous chunk buffers.

```text
Central Pointer Map: [ Ptr0 | Ptr1 | Ptr2 | Ptr3 ]
                        |      |      |
                        v      v      v
Chunks (512 bytes):   [Page0][Page1][Page2]
Expanding at front or back allocates a new chunk without copying!
```

Deque random access computes the target chunk index and internal offset via division and modulo arithmetic.

$$\text{Chunk} = \frac{\text{Index} + \text{Offset}}{\text{CHUNK\_SIZE}}, \quad \text{Offset} = (\text{Index} + \text{Offset}) \bmod \text{CHUNK\_SIZE}$$

Let's write a custom bidirectional ring buffer deque.

```cpp
// Custom Array Deque: O(1) Operations at Both Ends
class CustomDeque {
    vector<int> buffer;
    int head, tail, count, cap;
public:
    CustomDeque(int size) : cap(size), buffer(size, 0), head(0), tail(0), count(0) {}

    void push_back(int val) {
        if (count == cap) return;
        buffer[tail] = val;
        tail = (tail + 1) % cap;
        count++;
    }

    void push_front(int val) {
        if (count == cap) return;
        head = (head - 1 + cap) % cap;
        buffer[head] = val;
        count++;
    }

    void pop_front() {
        if (count == 0) return;
        head = (head + 1) % cap;
        count--;
    }

    void pop_back() {
        if (count == 0) return;
        tail = (tail - 1 + cap) % cap;
        count--;
    }
};
```

| Container | Push Front | Push Back | Random Access | Memory Invalidation |
| :--- | :--- | :--- | :--- | :--- |
| `vector` | $O(N)$ (Shifts all) | Amortized $O(1)$ | $O(1)$ direct | Reallocation invalidates all |
| `list` | $O(1)$ pointer update | $O(1)$ pointer update | $O(N)$ traversal | Pointers remain valid |
| `deque` | $O(1)$ chunk map | $O(1)$ chunk map | $O(1)$ two-level | Pointers to elements valid |

```text
Push Front: Prepend chunks to top of central map
Push Back : Append chunks to bottom of central map
Zero element copying during growth!
```

> [!TIP]
> `deque` is the default underlying container for both `stack` and `queue` because it expands dynamically without massive vector reallocation copies.

Let's now study container inter-conversions between stacks and queues.


#### Complexity Analysis
- **Time Complexity:** $O(1)$ for front/back push/pop; $O(1)$ random access indexing.
- **Auxiliary Space:** $O(N)$ chunk memory.

---


## Container Inter-Conversions & Layouts


### Data Structure Inter-Conversions (Stack-via-Queues & Dual-Stack Queues)

A classic interview problem involves implementing a FIFO Queue using two LIFO Stacks, and vice-versa.

In a Dual-Stack Queue, we use an `inbox` stack for enqueuing and an `outbox` stack for dequeuing, transferring elements only when `outbox` becomes completely empty.

```text
Inbox Stack (Push elements here):    [ 3, 2, 1 ]
                                          |
When Outbox is empty, pour Inbox -> Outbox:
                                          v
Outbox Stack (Pop elements here):    [ 1, 2, 3 ] (Order Inverted!)
Pop extracts '1' first -> Restores FIFO order in O(1) amortized time!
```

Because every element is pushed twice and popped twice across its lifecycle, the amortized cost is strictly constant.

$$\text{Amortized Cost per Operation} = \frac{4N \text{ total stack ops}}{N \text{ queue ops}} = O(1)$$

Let's implement the dual-stack queue alongside the single-queue stack.

```cpp
// Queue using Two Stacks (Amortized O(1)) & Stack using Single Queue
class MyQueue {
    stack<int> inbox, outbox;

    void transfer() {
        if (outbox.empty()) {
            while (!inbox.empty()) {
                outbox.push(inbox.top());
                inbox.pop();
            }
        }
    }
public:
    void push(int x) { inbox.push(x); }

    int pop() {
        transfer();
        int val = outbox.top();
        outbox.pop();
        return val;
    }

    int peek() {
        transfer();
        return outbox.top();
    }

    bool empty() { return inbox.empty() && outbox.empty(); }
};

class MyStack {
    queue<int> q;
public:
    void push(int x) {
        q.push(x);
        // Rotate all previous elements behind the newly added element
        for (size_t i = 0; i < q.size() - 1; ++i) {
            q.push(q.front());
            q.pop();
        }
    }
    int pop() { int val = q.front(); q.pop(); return val; }
    int top() { return q.front(); }
    bool empty() { return q.empty(); }
};
```

| Operation | `inbox` State | `outbox` State | Transfer Fired? | Output |
| :--- | :--- | :--- | :--- | :--- |
| `push(1)` | `[1]` | `[]` | No | - |
| `push(2)` | `[1, 2]` | `[]` | No | - |
| `pop()` | `[]` | `[2]` | **Yes (poured 1, 2)** | Returns $1$ |
| `push(3)` | `[3]` | `[2]` | No | - |
| `pop()` | `[3]` | `[]` | No (pops from outbox) | Returns $2$ |

```text
First Stack Push  : Reverses arrival order
Second Stack Push : Reverses order again -> (Reverse of Reverse = FIFO)
```

> [!CAUTION]
> Never transfer elements from `inbox` to `outbox` unless `outbox` is completely empty. Transferring while `outbox` contains elements will corrupt the FIFO order.

Let's now examine expression parsing and balanced parentheses validation.


#### Complexity Analysis
- **Time Complexity:** Amortized $O(1)$ for Dual-Stack Queue; $O(N)$ push / $O(1)$ pop for Queue-Stack.
- **Auxiliary Space:** $O(N)$ storage.

---


## Stack & Queue Algorithms


### Balanced Delimiters & Scope Hierarchy Validation

A sequence of scoped brackets and code delimiters is well-formed if every opening symbol is matched with its corresponding closing symbol in proper LIFO nested order.

When an opening bracket (`(`, `{`, `[`) is encountered, we push it onto the stack. When a closing bracket is seen, the stack top must match its corresponding partner.

```text
Input: " { [ ( ) ] } "
Step 1: '{' -> Push -> Stack: [ { ]
Step 2: '[' -> Push -> Stack: [ {, [ ]
Step 3: '(' -> Push -> Stack: [ {, [, ( ]
Step 4: ')' -> Top '(' matches -> Pop!  Stack: [ {, [ ]
Step 5: ']' -> Top '[' matches -> Pop!  Stack: [ { ]
Step 6: '}' -> Top '{' matches -> Pop!  Stack: [ Empty ] -> Valid!
```

The stack matching invariant verifies scope nesting correctness:

$$\text{is_closing}(c) \implies (\neg \text{empty}(\text{stack}) \land \text{matches}(\text{top}(\text{stack}), c))$$

Let's implement scope nesting validation in C++.

```cpp
// Validate Scoped Scope Nesting: O(N) Time, O(N) Space
bool validate_scope_nesting(const string& code_expression) {
    stack<char> st;

    for (char c : code_expression) {
        if (c == '(' || c == '{' || c == '[') {
            st.push(c);
        } else if (c == ')' || c == '}' || c == ']') {
            if (st.empty()) return false; // Unmatched closing delimiter

            char top = st.top();
            st.pop();

            if ((c == ')' && top != '(') ||
                (c == '}' && top != '{') ||
                (c == ']' && top != '[')) {
                return false; // Mismatched delimiter types
            }
        }
    }
    return st.empty(); // All opened scopes must be closed
}
```

#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ single pass over input string.
- **Auxiliary Space:** $O(N)$ stack memory.

---


### Multiple Stacks (K-Stacks) in a Single Array

Implementing $K$ independent stacks within a single 1D array of size $N$ with $100\%$ space efficiency uses a Free-List linked structure.

We maintain four arrays: `arr[N]` (data), `top[K]` (stack heads), `next[N]` (linked list pointers / free slots), and scalar `free_top`.

```text
arr[]     : [ ValA | ValB | ValC |   |   ]
top[]     : Stack 0 -> idx 0, Stack 1 -> idx 1, Stack 2 -> idx 2
next[]    : Stores previous node index in stack OR next free slot
free_top  : Points to next available unallocated index in arr[]
```

The free list recycles slots in $O(1)$ time, allowing stacks to grow dynamically until the entire array fills up.

$$\text{Push Invariant: } i = \text{free\_top}, \quad \text{free\_top} = \text{next}[i], \quad \text{next}[i] = \text{top}[\text{sn}], \quad \text{top}[\text{sn}] = i$$

Let's implement the `KStacks` class.

```cpp
// K-Stacks in a Single Array: O(1) Push/Pop with 100% Space Utilization
class KStacks {
    int *arr, *top, *next;
    int n, k, free_top;
public:
    KStacks(int k1, int n1) : k(k1), n(n1), free_top(0) {
        arr = new int[n];
        top = new int[k];
        next = new int[n];
        for (int i = 0; i < k; ++i) top[i] = -1;
        for (int i = 0; i < n - 1; ++i) next[i] = i + 1;
        next[n - 1] = -1;
    }

    void push(int item, int sn) {
        if (free_top == -1) return; // Array full
        int i = free_top;
        free_top = next[i];
        next[i] = top[sn];
        top[sn] = i;
        arr[i] = item;
    }

    int pop(int sn) {
        if (top[sn] == -1) return -1; // Stack empty
        int i = top[sn];
        top[sn] = next[i];
        next[i] = free_top;
        free_top = i;
        return arr[i];
    }
};
```

| Operation | `top[0]` | `top[1]` | `free_top` | Allocated Slot |
| :--- | :--- | :--- | :--- | :--- |
| `push(15, 0)` | $0$ | $-1$ | $1$ | `arr[0] = 15` |
| `push(45, 1)` | $0$ | $1$ | $2$ | `arr[1] = 45` |
| `push(17, 0)` | $2$ | $1$ | $3$ | `arr[2] = 17` |
| `pop(0)` | $0$ | $1$ | $2$ (Recycled!) | Returns $17$ |

```text
On Pop: The freed array index is prepended back to free_top:
next[freed_idx] = free_top; free_top = freed_idx;
Next push reuses this slot immediately in O(1) time!
```

> [!TIP]
> For $K=2$ stacks, grow Stack 1 from `0` rightward and Stack 2 from `N-1` leftward until their pointers meet, requiring zero extra arrays.

Let's now examine queue applications and the Gas Station circular tour.


#### Complexity Analysis
- **Time Complexity:** $O(1)$ worst-case for both `push` and `pop`.
- **Auxiliary Space:** $O(N + K)$ auxiliary integer arrays.

---


### Queue Applications & Gas Station Circular Tour

The Gas Station problem asks us to find a starting station to complete a circular circuit where station $i$ provides $\text{gas}[i]$ and costs $\text{cost}[i]$ to reach the next station.

If the total available fuel $\sum \text{gas}[i]$ is $\ge$ total cost $\sum \text{cost}[i]$, a valid starting station is guaranteed to exist.

```text
Net Fuel: gas[i] - cost[i]
Stations:     0      1      2      3      4
Net Delta:   -1     -2      3     -1      1
Running Fuel: -1 -> -3 (Deficit! Reset start to Station 2)
Running Fuel:  0 ->  3 ->   2 ->   3 (Completed full circle!)
```

If our running fuel drops below zero at station $i$, no station between the current start and $i$ can reach station $i+1$, so we advance the start candidate to $i+1$.

$$\text{Reset Rule: } \text{If } \text{curr\_fuel} < 0 \implies \text{start} = i + 1, \quad \text{curr\_fuel} = 0$$

Let's write the single-pass $O(N)$ Gas Station solver.

```cpp
// Gas Station Circular Tour: O(N) Time, O(1) Space
int can_complete_circuit(const vector<int>& gas, const vector<int>& cost) {
    int total_tank = 0;
    int curr_tank = 0;
    int start_station = 0;

    for (int i = 0; i < gas.size(); ++i) {
        int net = gas[i] - cost[i];
        total_tank += net;
        curr_tank += net;

        // If tank drops below zero, we cannot reach station i + 1
        if (curr_tank < 0) {
            start_station = i + 1; // Reset start candidate
            curr_tank = 0;         // Reset running tank
        }
    }
    return (total_tank >= 0) ? start_station : -1;
}
```

| Station $i$ | $\text{gas}[i]$ | $\text{cost}[i]$ | Net $\Delta$ | `curr_tank` | `start_station` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| $0$ | $1$ | $3$ | $-2$ | $-2 \to 0$ (Reset!) | $1$ |
| $1$ | $2$ | $4$ | $-2$ | $-2 \to 0$ (Reset!) | $2$ |
| $2$ | $3$ | $5$ | $-2$ | $-2 \to 0$ (Reset!) | $3$ |
| $3$ | $4$ | $1$ | $+3$ | $+3$ | $3$ |
| $4$ | $5$ | $2$ | $+3$ | $+6$ | **3 (Valid Start!)** |

```text
If total_tank >= 0: Total gas across entire circle >= Total cost.
The last start_station that never suffered a deficit is guaranteed to
complete the remaining wrap-around circuit!
```

> [!IMPORTANT]
> The total fuel check `total_tank >= 0` is both necessary and sufficient. If `total_tank < 0`, no starting station can ever complete the circuit.

Let's now study multithreaded lock-free stacks and queues.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ single pass over stations.
- **Auxiliary Space:** $O(1)$ scalar accumulators.

---


## Concurrency & Lock-Free Structures


### Concurrency & Lock-Free Data Structures (Treiber Stack & MPMC Queue)

In multithreaded systems, mutex locks cause thread contention, context switching overhead, and potential deadlocks under high load.

Lock-Free data structures use atomic CPU primitives like Compare-And-Swap (CAS) `compare_exchange_weak` to update pointers without taking locks.

```text
1. Read current head: expected = head.load()
2. Create new node:   new_node->next = expected
3. Atomic CAS:        head.compare_exchange_weak(expected, new_node)
If another thread updated head first -> CAS fails, retry loop!
If no conflict -> CAS swaps head atomically in hardware!
```

The CAS operation updates a shared pointer if and only if its value matches the expected snapshot.

$$\text{CAS}(\& \text{ptr}, \text{expected}, \text{desired}) = \begin{cases} \text{true} \ (\text{ptr} \leftarrow \text{desired}) & \text{if } \text{ptr} == \text{expected} \\ \text{false} \ (\text{expected} \leftarrow \text{ptr}) & \text{otherwise} \end{cases}$$

Let's implement a lock-free Treiber Stack in C++.

```cpp
// Treiber Lock-Free Stack using atomic and CAS
template <typename T>
class LockFreeStack {
    struct Node {
        T val;
        Node* next;
        Node(T v) : val(v), next(nullptr) {}
    };
    atomic<Node*> head{nullptr};
public:
    void push(T val) {
        Node* new_node = new Node(val);
        new_node->next = head.load();
        // CAS retry loop: atomically update head if undisturbed
        while (!head.compare_exchange_weak(new_node->next, new_node)) {
            // new_node->next is automatically updated with latest head
        }
    }

    bool pop(T& result) {
        Node* old_head = head.load();
        while (old_head && !head.compare_exchange_weak(old_head, old_head->next)) {
            // old_head is refreshed on collision
        }
        if (!old_head) return false;
        result = old_head->val;
        return true;
    }
};
```

| Architecture | Contention Behavior | Deadlock Risk | Memory Reclamation |
| :--- | :--- | :--- | :--- |
| **Mutex-Protected** | Threads sleep / block | High (Lock inversion) | Standard `delete` |
| **Lock-Free CAS** | Threads spin / retry | Zero (Lock-free) | Hazard Pointers / RCU |

```text
Thread 1 reads Head = A. Preempted.
Thread 2 pops A, pops B, and pushes A back (recycled memory address).
Thread 1 resumes: CAS sees Head == A (True!) and corrupts list!
Solution: Use tagged pointer version counters or hazard pointers.
```

> [!WARNING]
> The ABA Problem occurs when memory is freed and reallocated at the same address. In production lock-free systems, always use Hazard Pointers or version-tagged pointers.

This completes the Stacks and Queues chapter, covering LIFO/FIFO architectures, deques, dual-stack conversions, balanced parsing, K-stacks, gas station tours, and lock-free concurrency.


#### Complexity Analysis
- **Time Complexity:** $O(1)$ amortized CAS retry time under low-to-medium contention.
- **Auxiliary Space:** $O(N)$ atomic node memory.

---


## Cheat Sheet & Quick Reference

| Container / Technique | Principle | Invariant / Key Method | Complexity |
| :--- | :--- | :--- | :--- |
| **Array Stack** | LIFO | `push_back` / `pop_back` | Amortized $O(1)$ / $O(1)$ Space |
| **Circular Queue** | FIFO | `(rear + 1) % N`, `(front + 1) % N` | $\Theta(1)$ / $O(N)$ Space |
| **Double-Ended Queue** | Bidirectional | 2-level paged memory chunks | $O(1)$ front/back |
| **Dual-Stack Queue** | FIFO via Stacks | Transfer `inbox -> outbox` when outbox empty | Amortized $O(1)$ |
| **Balanced Parentheses**| Expression check | Stack stores open brackets; pops on match | $\Theta(N)$ / $O(N)$ Space |
| **K-Stacks in 1 Array** | Space sharing | Free-list linking via `next[]` array | $O(1)$ Push & Pop |
| **Gas Station Tour** | Circular greedy | `curr_tank < 0 => start = i + 1` | $\Theta(N)$ / $O(1)$ Space |
| **Lock-Free Stack** | CAS concurrency | `head.compare_exchange_weak(node->next, node)` | Lock-Free $O(1)$ |
