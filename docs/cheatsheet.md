# DSA Master Cheat Sheet

## 1. Complexity Quick Reference

### Data Structure Operations

| Data Structure | Access | Search | Insertion | Deletion | Auxiliary Space | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Array / Vector** | $\Theta(1)$ | $O(N)$ | $O(1)$ amortized (end) / $O(N)$ (mid) | $O(1)$ (end) / $O(N)$ (mid) | $O(N)$ | Optimal cache spatial locality |
| **Singly Linked List** | $O(N)$ | $O(N)$ | $O(1)$ (head) / $O(N)$ (pos) | $O(1)$ (head) / $O(N)$ (pos) | $O(N)$ | 8-byte pointer overhead per node |
| **Doubly Linked List** | $O(N)$ | $O(N)$ | $O(1)$ (given node pointer) | $O(1)$ (given node pointer) | $O(N)$ | 16-byte pointer overhead per node |
| **Stack / Queue** | $O(1)$ (top/front)| $O(N)$ | $O(1)$ | $O(1)$ | $O(N)$ | Default adapter wraps `deque` |
| **Hash Table** | N/A | $\Theta(1)$ avg / $O(N)$ worst | $\Theta(1)$ avg / $O(N)$ worst | $\Theta(1)$ avg / $O(N)$ worst | $O(N)$ | Use `custom_hash` against DoS |
| **Binary Search Tree** | $O(H)$ | $O(H)$ | $O(H)$ | $O(H)$ | $O(N)$ | Height $H \in [\log_2 N, N]$ |
| **AVL / Red-Black Tree** | $O(\log N)$ | $O(\log N)$ | $O(\log N)$ | $O(\log N)$ | $O(N)$ | Backs `set` and `map` |
| **Binary Heap (PQ)** | $\Theta(1)$ (top) | $O(N)$ | $O(\log N)$ | $O(\log N)$ (pop) | $O(N)$ | $O(N)$ bottom-up build |
| **Trie (Prefix Tree)** | $O(L)$ | $O(L)$ | $O(L)$ | $O(L)$ | $O(N \cdot L \cdot \Sigma)$ | $L$ is string length, $\Sigma$ is alphabet |
| **Disjoint Set (DSU)** | N/A | $\Theta(\alpha(N))$ | $\Theta(\alpha(N))$ (unite) | N/A | $O(N)$ | Path compression + Union by rank |
| **Fenwick Tree (BIT)** | N/A | $O(\log N)$ (prefix) | $O(\log N)$ (point add) | N/A | $O(N)$ | 1-based indexing; $O(N)$ flat buffer |
| **Segment Tree** | N/A | $O(\log N)$ (range) | $O(\log N)$ (point/range) | N/A | $O(4N)$ | Handles non-invertible operators |

---

### Sorting Algorithms Comparison

| Algorithm | Best Time | Average Time | Worst Time | Space | Stable? | In-Place? | Key Paradigm |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Insertion Sort** | $O(N)$ | $O(N^2)$ | $O(N^2)$ | $O(1)$ | **Yes** | **Yes** | Adaptive; best for tiny arrays ($N < 16$) |
| **Selection Sort** | $O(N^2)$ | $O(N^2)$ | $O(N^2)$ | $O(1)$ | No | **Yes** | Minimizes total memory writes ($O(N)$ writes) |
| **Merge Sort** | $\Theta(N \log N)$ | $\Theta(N \log N)$ | $\Theta(N \log N)$ | $O(N)$ | **Yes** | No | Divide & Conquer; optimal for Linked Lists |
| **QuickSort** | $\Theta(N \log N)$ | $\Theta(N \log N)$ | $O(N^2)$ | $O(\log N)$ | No | **Yes** | Partitioning; randomized pivot avoids $O(N^2)$ |
| **HeapSort** | $\Theta(N \log N)$ | $\Theta(N \log N)$ | $\Theta(N \log N)$ | $O(1)$ | No | **Yes** | In-place selection via binary heap |
| **Counting Sort** | $\Theta(N + K)$ | $\Theta(N + K)$ | $\Theta(N + K)$ | $O(N + K)$ | **Yes** | No | Non-comparison; integer range $[0 \dots K]$ |
| **Radix Sort (LSD)** | $\Theta(d(N + b))$ | $\Theta(d(N + b))$ | $\Theta(d(N + b))$ | $O(N + b)$ | **Yes** | No | Digit-by-digit stable counting passes |

---

## 2. Essential C++ STL Idioms & Setup

### Fast I/O Boilerplate
```cpp
// Competitive Programming Setup (assumes using namespace std;)
void fast_io() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);
}
```

### High-Entropy Safe Hash Functor (Anti-DoS)
```cpp
struct custom_hash {
    static uint64_t splitmix64(uint64_t x) {
        x += 0x9e3779b97f4a7c15ULL;
        x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9ULL;
        x = (x ^ (x >> 27)) * 0x94d049bb133111ebULL;
        return x ^ (x >> 31);
    }
    size_t operator()(uint64_t x) const {
        static const uint64_t FIXED_RANDOM = 1999999973ULL;
        return splitmix64(x + FIXED_RANDOM);
    }
};
// Declaration: unordered_map<long long, int, custom_hash> safe_map;
```

### Priority Queue Comparators
```cpp
// 1. Max-Heap (Default)
priority_queue<int> max_pq;

// 2. Min-Heap
priority_queue<int, vector<int>, greater<int>> min_pq;

// 3. Custom Struct Comparator
struct Edge { int to, weight; };
struct CompareEdge {
    bool operator()(const Edge& a, const Edge& b) const {
        return a.weight > b.weight; // Min-Heap: smaller weight pops first
    }
};
priority_queue<Edge, vector<Edge>, CompareEdge> edge_pq;
```

### STL Algorithm Shortcuts
```cpp
// Binary search bounds on sorted containers
auto it1 = lower_bound(arr.begin(), arr.end(), target); // First element >= target
auto it2 = upper_bound(arr.begin(), arr.end(), target); // First element > target
int count = it2 - it1;                                  // Exact occurrence count

// In-place deduplication
sort(arr.begin(), arr.end());
arr.erase(unique(arr.begin(), arr.end()), arr.end());

// Min / Max element iterators
auto min_it = min_element(arr.begin(), arr.end());
auto max_it = max_element(arr.begin(), arr.end());

// Numeric aggregations
long long sum = accumulate(arr.begin(), arr.end(), 0LL);
vector<int> p(n);
iota(p.begin(), p.end(), 0); // Fills [0, 1, 2, ..., n-1]
```

---

## 3. Core Algorithmic Templates

### Bit Manipulation Essentials
```cpp
int get_lsb(int n)      { return n & (-n); }      // Isolates lowest set bit
int clear_lsb(int n)    { return n & (n - 1); }   // Clears lowest set bit
bool is_pow2(int n)     { return n > 0 && (n & (n - 1)) == 0; }
int count_bits(int n)   { return __builtin_popcount(n); }
int leading_zeros(int n){ return __builtin_clz(n); }

// Enumerate all submasks of a bitmask
for (int sub = mask; sub > 0; sub = (sub - 1) & mask) {
    // Process submask 'sub'
}
```

---

### Two Pointers & Sliding Window

#### Converging Pointers (Sorted Arrays)
```cpp
pair<int, int> two_sum_sorted(const vector<int>& arr, int target) {
    int left = 0, right = (int)arr.size() - 1;
    while (left < right) {
        int sum = arr[left] + arr[right];
        if (sum == target) return {left, right};
        else if (sum < target) left++;
        else right--;
    }
    return {-1, -1};
}
```

#### Sliding Window: Longest Valid Subarray
```cpp
int longest_valid_window(const vector<int>& nums) {
    int left = 0, max_len = 0;
    for (int right = 0; right < (int)nums.size(); ++right) {
        // 1. Expand: absorb nums[right] into state
        
        // 2. Shrink while window violates constraints
        while (/* window is invalid */) {
            // Remove nums[left] from state
            left++;
        }
        // 3. Update answer
        max_len = max(max_len, right - left + 1);
    }
    return max_len;
}
```

#### Sliding Window: Shortest Goal Subarray
```cpp
int min_window_meeting_target(const vector<int>& nums, int target) {
    int left = 0, current_sum = 0, min_len = 1e9;
    for (int right = 0; right < (int)nums.size(); ++right) {
        current_sum += nums[right];
        while (current_sum >= target) {
            min_len = min(min_len, right - left + 1);
            current_sum -= nums[left++];
        }
    }
    return (min_len == 1e9) ? 0 : min_len;
}
```

---

### Prefix Sums & Kadane's Algorithm

#### Kadane's Maximum Contiguous Subarray Sum
```cpp
int kadane(const vector<int>& arr) {
    int current_max = arr[0], max_so_far = arr[0];
    for (size_t i = 1; i < arr.size(); ++i) {
        current_max = max(arr[i], current_max + arr[i]);
        max_so_far = max(max_so_far, current_max);
    }
    return max_so_far;
}
```

#### 2D Prefix Sum Matrix
```cpp
class PrefixSum2D {
    vector<vector<long long>> pref;
public:
    PrefixSum2D(const vector<vector<int>>& mat) {
        int R = mat.size(), C = mat[0].size();
        pref.assign(R + 1, vector<long long>(C + 1, 0));
        for (int r = 0; r < R; ++r) {
            for (int c = 0; c < C; ++c) {
                pref[r + 1][c + 1] = mat[r][c] + pref[r][c + 1] + pref[r + 1][c] - pref[r][c];
            }
        }
    }
    // O(1) Query subgrid sum from (r1, c1) to (r2, c2) inclusive
    long long query(int r1, int c1, int r2, int c2) const {
        return pref[r2 + 1][c2 + 1] - pref[r1][c2 + 1] - pref[r2 + 1][c1] + pref[r1][c1];
    }
};
```

---

### Binary Search Templates

#### Closed Interval `[low, high]`
```cpp
int binary_search_closed(const vector<int>& arr, int target) {
    int low = 0, high = (int)arr.size() - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}
```

#### Binary Search on Monotonic Predicate (Answer Optimization)
```cpp
bool check(int candidate_val, const vector<int>& data);

int binary_search_predicate(int min_bound, int max_bound, const vector<int>& data) {
    int low = min_bound, high = max_bound, ans = -1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (check(mid, data)) {
            ans = mid;         // Record candidate
            high = mid - 1;    // Minimize answer: explore left
        } else {
            low = mid + 1;     // Infeasible: explore right
        }
    }
    return ans;
}
```

---

### Monotonic Structures

#### Monotonic Stack (Next Greater Element)
```cpp
vector<int> next_greater_element(const vector<int>& arr) {
    int n = arr.size();
    vector<int> nge(n, -1);
    stack<int> st; // Stores indices, values monotonic decreasing

    for (int i = n - 1; i >= 0; --i) {
        while (!st.empty() && arr[st.top()] <= arr[i]) {
            st.pop();
        }
        if (!st.empty()) nge[i] = arr[st.top()];
        st.push(i);
    }
    return nge;
}
```

#### Monotonic Deque (Sliding Window Maximum)
```cpp
vector<int> sliding_window_max(const vector<int>& arr, int k) {
    deque<int> dq; // Indices with values in strictly decreasing order
    vector<int> result;

    for (int i = 0; i < (int)arr.size(); ++i) {
        // Remove indices outside the active window [i - k + 1, i]
        if (!dq.empty() && dq.front() <= i - k) dq.pop_front();

        // Maintain monotonic decreasing order
        while (!dq.empty() && arr[dq.back()] <= arr[i]) dq.pop_back();

        dq.push_back(i);
        if (i >= k - 1) result.push_back(arr[dq.front()]);
    }
    return result;
}
```

---

### Trees & Range Query Structures

#### Level-Order BFS Snapshot
```cpp
struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

vector<vector<int>> level_order(TreeNode* root) {
    if (!root) return {};
    vector<vector<int>> levels;
    queue<TreeNode*> q;
    q.push(root);

    while (!q.empty()) {
        int level_size = q.size();
        vector<int> tier;
        tier.reserve(level_size);

        for (int i = 0; i < level_size; ++i) {
            TreeNode* curr = q.front();
            q.pop();
            tier.push_back(curr->val);
            if (curr->left) q.push(curr->left);
            if (curr->right) q.push(curr->right);
        }
        levels.push_back(move(tier));
    }
    return levels;
}
```

#### Disjoint Set Union (DSU)
```cpp
class DisjointSetUnion {
    vector<int> parent, rank_val;
    int components;
public:
    DisjointSetUnion(int n) : parent(n), rank_val(n, 0), components(n) {
        for (int i = 0; i < n; ++i) parent[i] = i;
    }
    int find(int i) {
        if (parent[i] == i) return i;
        return parent[i] = find(parent[i]); // Path compression
    }
    bool unite(int i, int j) {
        int root_i = find(i), root_j = find(j);
        if (root_i == root_j) return false;
        if (rank_val[root_i] < rank_val[root_j]) parent[root_i] = root_j;
        else if (rank_val[root_i] > rank_val[root_j]) parent[root_j] = root_i;
        else { parent[root_j] = root_i; rank_val[root_i]++; }
        components--;
        return true;
    }
    int count() const { return components; }
};
```

#### Fenwick Tree (Binary Indexed Tree)
```cpp
class FenwickTree {
    int n;
    vector<long long> tree;
public:
    FenwickTree(int size) : n(size), tree(size + 1, 0) {}
    void add(int i, long long delta) {
        for (; i <= n; i += (i & -i)) tree[i] += delta;
    }
    long long query(int i) const {
        long long sum = 0;
        for (; i > 0; i -= (i & -i)) sum += tree[i];
        return sum;
    }
    long long range_query(int l, int r) const { return query(r) - query(l - 1); }
};
```

#### Segment Tree (Range Sum & Point Update)
```cpp
class SegmentTree {
    int n;
    vector<long long> tree;
    void build(const vector<int>& arr, int node, int l, int r) {
        if (l == r) { tree[node] = arr[l]; return; }
        int mid = l + (r - l) / 2;
        build(arr, 2 * node + 1, l, mid);
        build(arr, 2 * node + 2, mid + 1, r);
        tree[node] = tree[2 * node + 1] + tree[2 * node + 2];
    }
    void update(int node, int l, int r, int idx, int val) {
        if (l == r) { tree[node] = val; return; }
        int mid = l + (r - l) / 2;
        if (idx <= mid) update(2 * node + 1, l, mid, idx, val);
        else update(2 * node + 2, mid + 1, r, idx, val);
        tree[node] = tree[2 * node + 1] + tree[2 * node + 2];
    }
    long long query(int node, int l, int r, int ql, int qr) const {
        if (ql <= l && r <= qr) return tree[node];
        if (r < ql || l > qr) return 0;
        int mid = l + (r - l) / 2;
        return query(2 * node + 1, l, mid, ql, qr) + query(2 * node + 2, mid + 1, r, ql, qr);
    }
public:
    SegmentTree(const vector<int>& arr) : n(arr.size()), tree(4 * arr.size(), 0) {
        if (n > 0) build(arr, 0, 0, n - 1);
    }
    void update(int idx, int val) { update(0, 0, n - 1, idx, val); }
    long long query(int l, int r) const { return query(0, 0, n - 1, l, r); }
};
```

---

### Graph Algorithms

#### Dijkstra's Single-Source Shortest Path
```cpp
vector<long long> dijkstra(int start, int n, const vector<vector<pair<int, int>>>& adj) {
    vector<long long> dist(n, 1e18);
    // Min-heap storing {distance, vertex}
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<pair<long long, int>>> pq;

    dist[start] = 0;
    pq.push({0, start});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();

        if (d > dist[u]) continue; // Lazy deletion guard

        for (auto const& [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}
```

#### Topological Sort (Kahn's In-Degree BFS)
```cpp
vector<int> topological_sort_kahn(int n, const vector<vector<int>>& adj) {
    vector<int> in_degree(n, 0);
    for (int u = 0; u < n; ++u) {
        for (int v : adj[u]) in_degree[v]++;
    }

    queue<int> q;
    for (int i = 0; i < n; ++i) {
        if (in_degree[i] == 0) q.push(i);
    }

    vector<int> topo_order;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        topo_order.push_back(u);

        for (int v : adj[u]) {
            if (--in_degree[v] == 0) q.push(v);
        }
    }
    return (topo_order.size() == (size_t)n) ? topo_order : vector<int>{}; // Empty if cyclic
}
```

---

### Dynamic Programming Idioms

#### 0/1 Knapsack (Reverse Inner Loop)
```cpp
int knapsack_01(int W, const vector<int>& weights, const vector<int>& values) {
    vector<int> dp(W + 1, 0);
    for (size_t i = 0; i < weights.size(); ++i) {
        for (int w = W; w >= weights[i]; --w) { // REVERSE loop prevents reuse
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i]);
        }
    }
    return dp[W];
}
```

#### Unbounded Knapsack (Forward Inner Loop)
```cpp
int knapsack_unbounded(int W, const vector<int>& weights, const vector<int>& values) {
    vector<int> dp(W + 1, 0);
    for (size_t i = 0; i < weights.size(); ++i) {
        for (int w = weights[i]; w <= W; ++w) { // FORWARD loop enables reuse
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i]);
        }
    }
    return dp[W];
}
```

#### Longest Increasing Subsequence ($O(N \log N)$ via Patience Sorting)
```cpp
int length_of_lis(const vector<int>& nums) {
    vector<int> tails;
    for (int x : nums) {
        auto it = lower_bound(tails.begin(), tails.end(), x);
        if (it == tails.end()) tails.push_back(x);
        else *it = x;
    }
    return tails.size();
}
```

---

## 4. Common Pitfalls & Language Gotchas

| Category | Buggy Code | Safe Idiom | Root Cause |
| :--- | :--- | :--- | :--- |
| **Modular Arithmetic** | `(a - b) % m` | `(a - b + m) % m` | C++ `%` returns negative remainders for negative operands |
| **Integer Overflow** | `(low + high) / 2` | `low + (high - low) / 2` | `low + high` overflows $2^{31}-1$ when large |
| **Comparator UB** | `bool cmp(a, b) { return a <= b; }` | `bool cmp(a, b) { return a < b; }` | Strict weak ordering requires `cmp(x, x) == false` (irreflexivity) |
| **Bitwise Precedence**| `1 << n - 1` | `(1 << n) - 1` | Addition/subtraction binds tighter than shift operators |
| **Signed Char Index**| `freq[s[i]]++` | `freq[(unsigned char)s[i]]++` | Extended ASCII negative `char` values cause segfaults |
| **Fenwick 0-Index** | `fenwick.add(0, val)` | `fenwick.add(idx + 1, val)` | `0 & -0 == 0` causes `i += (i & -i)` to loop infinitely |
| **Vector Reference** | `vector<vector<int>> m` (param) | `const vector<vector<int>>& m` | Pass-by-value triggers an expensive $O(R \cdot C)$ deep copy |
