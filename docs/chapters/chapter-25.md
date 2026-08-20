# Chapter 25: Heaps & Priority Queues

---

## Binary Heap Architecture & Operations

### Binary Heap Array Invariants & O(N) Build-Heap Derivation

Let's start at the whiteboard by mapping a Complete Binary Tree into a 0-indexed contiguous array with zero pointer overhead.

For any element at array index $i$, its parent and children reside at mathematically fixed indices computed using integer division and multiplication.

```text
Tree:               [ 0: Val 10 ]
                  /               \
          [ 1: Val 20 ]       [ 2: Val 30 ]
          /           \
    [ 3: Val 40 ]   [ 4: Val 50 ]
Array Memory: [ 10, 20, 30, 40, 50 ]  (Contiguous 0-indexed memory!)
```

Index formulas calculate parent and child locations in constant time.

$$\text{parent}(i) = \left\lfloor\frac{i - 1}{2}\right\rfloor, \quad \text{left}(i) = 2i + 1, \quad \text{right}(i) = 2i + 2$$

Building a heap bottom-up runs in linear $\Theta(N)$ time because the vast majority of nodes reside near the bottom with minimal sift-down heights.

$$\sum_{h=0}^{\lfloor\log_2 N\rfloor} \frac{N}{2^{h+1}} \cdot O(h) = O\left( N \sum_{h=0}^\infty \frac{h}{2^h} \right) = O(2N) = \Theta(N)$$

Let's implement a `MinHeap` class in C++ with bottom-up `build_heap`.

```cpp
// Array-Backed Min-Heap: O(N) Build, O(log N) Push/Pop
class MinHeap {
    vector<int> heap;

    void sift_up(int i) {
        while (i > 0) {
            int p = (i - 1) / 2;
            if (heap[i] < heap[p]) {
                swap(heap[i], heap[p]);
                i = p;
            } else {
                break;
            }
        }
    }

    void sift_down(int i) {
        int n = heap.size();
        while (2 * i + 1 < n) {
            int smallest = i;
            int left = 2 * i + 1, right = 2 * i + 2;

            if (left < n && heap[left] < heap[smallest]) smallest = left;
            if (right < n && heap[right] < heap[smallest]) smallest = right;

            if (smallest != i) {
                swap(heap[i], heap[smallest]);
                i = smallest;
            } else {
                break;
            }
        }
    }
public:
    MinHeap() {}
    MinHeap(const vector<int>& arr) : heap(arr) {
        // Bottom-up linear build starting from last non-leaf parent
        for (int i = (int)heap.size() / 2 - 1; i >= 0; --i) {
            sift_down(i);
        }
    }
};
```

| Array Index $i$ | Node Element | Parent Index $(i-1)/2$ | Left Child $2i+1$ | Right Child $2i+2$ |
| :--- | :--- | :--- | :--- | :--- |
| `0` (Root) | `10` | - | `1` (`20`) | `2` (`30`) |
| `1` | `20` | `0` (`10`) | `3` (`40`) | `4` (`50`) |
| `2` | `30` | `0` (`10`) | - (Out of bounds) | - |

```text
Sifting starts at last non-leaf node: index = n/2 - 1
Leaves require 0 swaps; Layer above leaves requires <= 1 swap
Result: Tight O(N) construction time across all input arrays!
```

> [!WARNING]
> In 0-based indexing, root is `0` and children are `2i+1` and `2i+2`. In 1-based indexing, root is `1` and children are `2i` and `2i+1`. Mixing these formulas causes off-by-one corruption.

Let's now examine core heap mutations and in-place HeapSort mechanics.

#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ for bottom-up heap construction; $O(\log N)$ for `sift_up` and `sift_down`.
- **Auxiliary Space:** $O(1)$ auxiliary space for in-place array transformations.

---

### Core Heap Mutations & In-Place HeapSort Mechanics

The three fundamental heap mutations are `insert` (push to back and sift up), `extract_min` (swap root with tail, pop back, and sift down), and `decrease_key`.

In-place HeapSort transforms an array into a Max-Heap in $O(N)$ time, then repeatedly swaps the root with the active tail to build a sorted suffix in $O(1)$ auxiliary memory.

```text
[ Active Max-Heap (Size k) ] | [ Sorted Ascending Suffix (Size N-k) ]
1. Swap Root (Max element) with Active Tail at index k - 1:
2. Sift down new root into active heap of reduced size k - 1
3. Repeat until active heap shrinks to size 1
```

HeapSort guarantees log-linear time across all best, average, and worst cases with zero auxiliary memory.

$$\text{Time Complexity} = \Theta(N \log N), \quad \text{Auxiliary Space} = O(1)$$

Let's implement `extract_min` and full in-place `heapSort`.

```cpp
// In-Place HeapSort: O(N log N) Time, O(1) Auxiliary Space
void heapify_max(vector<int>& arr, int n, int i) {
    int largest = i;
    int left = 2 * i + 1, right = 2 * i + 2;

    if (left < n && arr[left] > arr[largest]) largest = left;
    if (right < n && arr[right] > arr[largest]) largest = right;

    if (largest != i) {
        swap(arr[i], arr[largest]);
        heapify_max(arr, n, largest);
    }
}

void heap_sort(vector<int>& arr) {
    int n = arr.size();

    // 1. Build Max-Heap in O(N) time
    for (int i = n / 2 - 1; i >= 0; --i) {
        heapify_max(arr, n, i);
    }

    // 2. Extract max elements into sorted suffix
    for (int i = n - 1; i > 0; --i) {
        swap(arr[0], arr[i]);   // Move largest element to sorted suffix
        heapify_max(arr, i, 0); // Restore Max-Heap on reduced size i
    }
}
```

| Iteration | Active Heap Size | Root Element | Swapped Target | Suffix State |
| :--- | :--- | :--- | :--- | :--- |
| Build | $5$ | `50` | - | `[]` |
| $i=4$ | $5 \to 4$ | `50` | `arr[4]` | `[ 50 ]` |
| $i=3$ | $4 \to 3$ | `40` | `arr[3]` | `[ 40, 50 ]` |
| $i=2$ | $3 \to 2$ | `30` | `arr[2]` | `[ 30, 40, 50 ]` |
| $i=1$ | $2 \to 1$ | `20` | `arr[1]` | `[ 10, 20, 30, 40, 50 ]` |

```text
[ 50, 40, 30, 20, 10 ] -> Swap 50 to back: [ 10, 40, 30, 20 | 50 ]
Sift down 10:          -> [ 40, 20, 30, 10 | 50 ]
Swap 40 to back:       -> [ 10, 20, 30 | 40, 50 ]
```

> [!TIP]
> HeapSort is an unstable sort; swapping the root with the tail element can invert the relative order of identical keys during extraction.

Let's now examine C++ Standard Library `priority_queue` and custom functors.

#### Complexity Analysis
- **Time Complexity:** $\Theta(N \log N)$ across all input distributions.
- **Auxiliary Space:** $O(1)$ strictly in-place memory.

---

## Priority Queues & Streaming Algorithms

### STL Priority Queues & Custom Weak-Order Functors

In C++, `priority_queue` is a container adapter that defaults to a Max-Heap backed by `vector<T>` and comparator `less<T>`.

To instantiate a Min-Heap, we provide `greater<T>` as the comparator, or define a custom functor struct satisfying strict weak ordering.

```text
Max-Heap (Default) : priority_queue<int>
Min-Heap           : priority_queue<int, vector<int>, greater<int>>
Custom Functor     : bool operator()(const T& a, const T& b)
                     return a.dist > b.dist;  (Produces Min-Heap!)
```

The functor ordering rule states that returning `a > b` places smaller elements on top.

$$\text{Min-Heap Functor Rule: } \text{operator}()(a, b) \implies a > b$$

> [!NOTE]
> **C++ Syntax — Why Greater-Than Creates a Min-Heap:**
> In C++, `priority_queue` defines `.top()` as the element that compares `false` against all other elements under its comparator. Because `greater(a, b)` returns `true` when $a > b$, the smallest element compares `false` against everything else and is placed at the top.

Let's implement custom struct comparators for task scheduling and graph algorithms.

```cpp
// Custom Struct Functors for Priority Queues
struct Task {
    int id;
    int priority;
    long long timestamp;
};

// Functor: Higher priority first; on tie, earlier timestamp first
struct CompareTask {
    bool operator()(const Task& a, const Task& b) const {
        if (a.priority != b.priority) {
            return a.priority < b.priority; // Larger priority pops first
        }
        return a.timestamp > b.timestamp;   // Smaller timestamp pops first
    }
};

void demonstrate_priority_queues() {
    // Min-Heap of integers
    priority_queue<int, vector<int>, greater<int>> min_pq;
    min_pq.push(30);
    min_pq.push(10);
    min_pq.push(20);
    // min_pq.top() is 10

    // Custom Task Priority Queue
    priority_queue<Task, vector<Task>, CompareTask> task_pq;
    task_pq.push({1, 5, 100});
    task_pq.push({2, 10, 50});
    // task_pq.top() has id 2 (Priority 10 > 5)
}
```

| Container | Push Complexity | Top Element | Pop Complexity | Memory Invalidation |
| :--- | :--- | :--- | :--- | :--- |
| `priority_queue` | $O(\log N)$ | $O(1)$ top | $O(\log N)$ | Reallocates underlying vector |
| `set` | $O(\log N)$ | $O(1)$ `*begin()` | $O(\log N)$ | Node pointers remain valid |
| `vector` (sorted) | $O(N)$ insertion | $O(1)$ `back()` | $O(1)$ `pop_back` | Reallocates contiguous memory |

```text
In sort:            a < b  ===> Ascending sorted order (1, 2, 3)
In priority_queue:  a < b  ===> MAX-HEAP (Largest on top!)
In priority_queue:  a > b  ===> MIN-HEAP (Smallest on top!)
```

> [!CAUTION]
> In `priority_queue`, returning `a > b` produces a Min-Heap (smallest element on top). This is the exact opposite of `sort`, where `a < b` produces ascending order.

Let's now apply priority queues to Top-K stream selection and K-way stream merging.

#### Complexity Analysis
- **Time Complexity:** $O(\log N)$ for `push` and `pop`; $O(1)$ for `top` and `size`.
- **Auxiliary Space:** $O(N)$ container vector memory.

---

### Top-K Patterns & K-Way Sorted Stream Merging

Selecting the Top-$K$ largest elements from an incoming stream of $N$ numbers is solved in optimal $O(N \log K)$ time and $O(K)$ space using a Min-Heap of size $K$.

Similarly, merging $K$ sorted streams feeds the current heads of all $K$ streams into a Min-Heap of size $K$, extracting the global minimum in $O(N_{\text{total}} \log K)$ total time.

```text
Stream 0: [ 1, 4, 7 ] ----> (Head: 1) ---\
Stream 1: [ 2, 5, 8 ] ----> (Head: 2) -----> [ Min-Heap Size K ] ===>
Stream 2: [ 3, 6, 9 ] ----> (Head: 3) ---/        | (Pops global min)
                                                  v
Result Output Stream: [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
```

Each element enters and exits the size-$K$ heap exactly once across the merge lifecycle.

$$\text{Total Time} = O(N_{\text{total}} \log K), \quad \text{Auxiliary Space} = O(K)$$

Let's implement Top-K Frequent Elements and K-Way stream merging in C++.

```cpp
// Top-K Frequent Elements & K-Way Sorted Stream Merging
vector<int> top_k_frequent(const vector<int>& nums, int k) {
    unordered_map<int, int> freq;
    for (int n : nums) freq[n]++;

    // Min-Heap storing {frequency, value} pairs
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> min_heap;

    for (const auto& [val, count] : freq) {
        min_heap.push({count, val});
        if (min_heap.size() > k) {
            min_heap.pop(); // Evict smallest frequency element
        }
    }

    vector<int> result;
    while (!min_heap.empty()) {
        result.push_back(min_heap.top().second);
        min_heap.pop();
    }
    return result;
}

struct StreamNode {
    int val, stream_idx, elem_idx;
    bool operator>(const StreamNode& other) const { return val > other.val; }
};

vector<int> merge_k_sorted_vectors(const vector<vector<int>>& streams) {
    priority_queue<StreamNode, vector<StreamNode>, greater<StreamNode>> min_heap;
    for (int i = 0; i < streams.size(); ++i) {
        if (!streams[i].empty()) min_heap.push({streams[i][0], i, 0});
    }

    vector<int> merged;
    while (!min_heap.empty()) {
        auto [val, s_idx, e_idx] = min_heap.top();
        min_heap.pop();
        merged.push_back(val);

        if (e_idx + 1 < streams[s_idx].size()) {
            min_heap.push({streams[s_idx][e_idx + 1], s_idx, e_idx + 1});
        }
    }
    return merged;
}
```

| Stream Event | Extracted Min | Next Element Pushed | Heap Size | Merged Output |
| :--- | :--- | :--- | :--- | :--- |
| Init | - | Stream heads `1, 2, 3` | $3$ | `[]` |
| Step 1 | `1` (Stream 0) | `4` (Stream 0) | $3$ | `[1]` |
| Step 2 | `2` (Stream 1) | `5` (Stream 1) | $3$ | `[1, 2]` |
| Step 3 | `3` (Stream 2) | `6` (Stream 2) | $3$ | `[1, 2, 3]` |

```text
To find Top-K LARGEST items -> Maintain a MIN-HEAP of size K!
When size exceeds K: min_heap.pop() discards the smallest element.
Remaining K elements in the heap are guaranteed to be the K largest!
```

> [!IMPORTANT]
> To find the Top-$K$ **LARGEST** elements, maintain a **MIN-HEAP** of size $K$. To find the Top-$K$ **SMALLEST** elements, maintain a **MAX-HEAP** of size $K$.

Let's now study dual-heap architectures for continuous running median tracking.

#### Complexity Analysis
- **Time Complexity:** $O(N \log K)$ for Top-K items; $O(N_{\text{total}} \log K)$ for K-Way merge.
- **Auxiliary Space:** $O(K)$ heap memory.

---

## Advanced Dual-Heap & Multi-Dimensional Selection

### Dual-Heap Architecture & Continuous Median Maintenance

Calculating the running median of a live data stream naively requires continuous sorting in $O(N \log N)$ or insertion in $O(N)$ time per number.

The Dual-Heap framework splits elements into two balanced halves: a `max_heap` storing the smaller half and a `min_heap` storing the larger half, computing medians in $O(1)$ time.

```text
Lower Half (Max-Heap): [ 1, 3, (5) ]  <--- max_heap.top() = 5

Upper Half (Min-Heap): [ (8), 10, 12 ] <--- min_heap.top() = 8
Median is calculated directly from top elements in O(1) time!
Odd total elements:  max_heap.top()
Even total elements: (max_heap.top() + min_heap.top()) / 2.0
```

The dual-heap invariants guarantee that both halves remain ordered and balanced in size.

$$\forall x \in \text{left}, \; y \in \text{right} \implies x \le y \quad \land \quad 0 \le |\text{left}| - |\text{right}| \le 1$$

Let's implement the `ContinuousMedianTracker` class in C++.

```cpp
// Continuous Running Median: O(log N) Insert, O(1) Get Median
class ContinuousMedianTracker {
    priority_queue<int> max_heap; // Lower half
    priority_queue<int, vector<int>, greater<int>> min_heap; // Upper half
public:
    void add_num(int num) {
        // Step 1: Insert into appropriate heap
        if (max_heap.empty() || num <= max_heap.top()) {
            max_heap.push(num);
        } else {
            min_heap.push(num);
        }

        // Step 2: Rebalance heaps to maintain size invariant
        if (max_heap.size() > min_heap.size() + 1) {
            min_heap.push(max_heap.top());
            max_heap.pop();
        } else if (min_heap.size() > max_heap.size()) {
            max_heap.push(min_heap.top());
            min_heap.pop();
        }
    }

    double find_median() const {
        if (max_heap.size() > min_heap.size()) {
            return max_heap.top();
        }
        return (max_heap.top() + min_heap.top()) / 2.0;
    }
};
```

| Incoming Number | `max_heap` State | `min_heap` State | Balance Action | Current Median |
| :--- | :--- | :--- | :--- | :--- |
| `add(5)` | `{5}` | `{}` | Base insertion | $5.0$ |
| `add(15)` | `{5}` | `{15}` | Added to upper | $(5+15)/2 = 10.0$ |
| `add(1)` | `{5, 1}` | `{15}` | Added to lower | $5.0$ |
| `add(3)` | `{3, 1}` | `{15, 5}` | Transferred $5$ to upper | $(3+5)/2 = 4.0$ |

```text
If max_heap has size N+2: Transfer top to min_heap
If min_heap has size N+1: Transfer top to max_heap
Rebalancing takes O(log N) time per insert!
```

> [!TIP]
> Maintain `max_heap.size() == min_heap.size()` for even counts, or `max_heap.size() == min_heap.size() + 1` for odd counts.

Let's now examine finding the $K$-th smallest element in multi-dimensional sorted grids.

#### Complexity Analysis
- **Time Complexity:** $O(\log N)$ per insertion; $\Theta(1)$ for median retrieval.
- **Auxiliary Space:** $O(N)$ heap memory.

---

### K-th Element Grid Search & Multi-Dimensional Selection

Finding the $K$-th smallest element in an $N \times N$ matrix where rows and columns are sorted in ascending order can be solved using a Min-Heap frontier search or Binary Search on Value Range.

For $K \ll N^2$, a Min-Heap frontier search expands cells like Dijkstra's algorithm in $O(K \log N)$ time. For large $K$, Binary Search on value range counts elements in $O(N \log(\max - \min))$ time.

```text
Matrix: [  1,  5,  9 ]        Min-Heap initial state: Row heads (1, 10, 12)
        [ 10, 11, 13 ]        Pop 1 -> Enqueue next in row (5)
        [ 12, 13, 15 ]        Pop 5 -> Enqueue next in row (9)
Pop K times to extract the K-th smallest element!
```

The binary search approach counts elements $\le \text{mid}$ in $O(N)$ time using a two-pointer staircase traversal.

$$\text{Count}(M) = \sum_{r=0}^{N-1} \text{count\_in\_row}(r, M) \le K$$

Let's implement both the Min-Heap and Binary Search matrix solvers in C++.

```cpp
// K-th Smallest in Sorted Matrix: Min-Heap & Binary Search
int kth_smallest_matrix_heap(const vector<vector<int>>& matrix, int k) {
    int n = matrix.size();
    // Tuple: {value, row, col}
    priority_queue<tuple<int, int, int>, vector<tuple<int, int, int>>, greater<tuple<int, int, int>>> min_heap;

    for (int r = 0; r < min(n, k); ++r) {
        min_heap.push({matrix[r][0], r, 0});
    }

    int val = 0;
    while (k--) {
        auto [v, r, c] = min_heap.top();
        min_heap.pop();
        val = v;

        if (c + 1 < n) {
            min_heap.push({matrix[r][c + 1], r, c + 1});
        }
    }
    return val;
}

int count_less_equal(const vector<vector<int>>& matrix, int target) {
    int n = matrix.size(), count = 0, c = n - 1;
    for (int r = 0; r < n; ++r) {
        while (c >= 0 && matrix[r][c] > target) c--;
        count += (c + 1);
    }
    return count;
}

int kth_smallest_matrix_bs(const vector<vector<int>>& matrix, int k) {
    int n = matrix.size();
    int low = matrix[0][0], high = matrix[n - 1][n - 1];
    int ans = low;

    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (count_less_equal(matrix, mid) >= k) {
            ans = mid;
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }
    return ans;
}
```

| Step $k$ | Min-Heap Top `(val, r, c)` | Next Enqueued Cell | Current Value |
| :--- | :--- | :--- | :--- |
| $k=1$ | `(1, 0, 0)` | `(5, 0, 1)` | $1$ |
| $k=2$ | `(5, 0, 1)` | `(9, 0, 2)` | $5$ |
| $k=3$ | `(9, 0, 2)` | None (Row 0 end) | $9$ |
| $k=4$ | `(10, 1, 0)` | `(11, 1, 1)` | **10 (4th Smallest)** |

```text
Target mid = 11:
Row 0: [ 1, 5, 9 ]     -> 3 elements <= 11
Row 1: [ 10, 11 ] | 13 -> 2 elements <= 11
Row 2: [ ] | 12, 13, 15 -> 0 elements <= 11
Total Count = 3 + 2 + 0 = 5 elements in O(N) staircase scan!
```

> [!TIP]
> Initializing the Min-Heap with only the first element of each row and advancing column indices `(r, c + 1)` prevents enqueuing duplicate coordinates without needing a `visited` set.

This completes the Heaps and Priority Queues chapter, covering complete tree indexing, $O(N)$ build-heap derivations, custom STL functors, Top-K selections, dual-heap medians, and matrix range searches.

#### Complexity Analysis
- **Time Complexity:** $O(K \log N)$ for Min-Heap; $O(N \log(\max - \min))$ for Binary Search.
- **Auxiliary Space:** $O(N)$ for Min-Heap; $O(1)$ for Binary Search.

---

## Cheat Sheet & Quick Reference

| Heap Technique | Primary Goal | Core Invariant / Mechanism | Complexity |
| :--- | :--- | :--- | :--- |
| **Bottom-Up Build Heap**| $O(N)$ construction | Sift down from `n/2 - 1` down to root | $\Theta(N)$ / $O(1)$ Space |
| **In-Place HeapSort** | Guaranteed log-linear | Max-heap + repeated root-tail swap | $\Theta(N \log N)$ / $O(1)$ Space |
| **STL Min-Heap** | Priority queue adapter | `priority_queue<T, vector<T>, greater<T>>` | $O(\log N)$ push/pop |
| **Top-K Largest** | Stream filtering | Maintain **Min-Heap** of size $K$; pop excess | $O(N \log K)$ / $O(K)$ Space |
| **K-Way Stream Merge** | Multi-stream sort | Min-Heap of size $K$ holding stream heads | $O(N_{\text{total}} \log K)$ / $O(K)$ |
| **Dual-Heap Median** | Live stream median | `max_heap` (lower) + `min_heap` (upper) | $O(\log N)$ insert / $O(1)$ median |
| **Matrix K-th Smallest**| Grid order statistic | Min-Heap frontier OR Staircase binary search | $O(K \log N)$ / $O(N \log R)$ |
