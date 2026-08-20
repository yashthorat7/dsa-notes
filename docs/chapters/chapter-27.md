# Chapter 27: Range Query Data Structures

---

## Binary Indexed Trees & Segment Trees

### Fenwick Trees (Binary Indexed Trees) & LSB Navigation

Let's stand at the whiteboard and explore Fenwick Trees (Binary Indexed Trees - BIT): supporting point updates and prefix sum queries in $O(\log N)$ time with zero tree pointer overhead.

Each index $i$ in a Fenwick Tree is responsible for an interval of length equal to its Least Significant Bit (LSB), calculated in C++ as `i & (-i)`.

```text
Index 1 (001): Covers [ 1 ... 1 ]  (LSB = 1)
Index 2 (010): Covers [ 1 ... 2 ]  (LSB = 2, includes index 1 and 2)
Index 3 (011): Covers [ 3 ... 3 ]  (LSB = 1)
Index 4 (100): Covers [ 1 ... 4 ]  (LSB = 4, includes indices 1..4)
Index 8 (1000):Covers [ 1 ... 8 ]  (LSB = 8, covers entire prefix!)
```

To update a value, we add LSB steps to propagate deltas to parent nodes; to query a prefix sum, we subtract LSB steps to aggregate disjoint blocks.

$$\text{Parent Update: } i \leftarrow i + (i \mathbin{\&} -i), \quad \text{Prefix Sum Query: } i \leftarrow i - (i \mathbin{\&} -i)$$

Let's implement the complete `FenwickTree` class with 1-based indexing in C++.

```cpp
// Fenwick Tree (Binary Indexed Tree): O(log N) Point Update & Prefix Query
class FenwickTree {
    int n;
    vector<long long> tree;
public:
    FenwickTree(int size) : n(size), tree(size + 1, 0) {}

    void add(int i, long long delta) {
        for (; i <= n; i += (i & -i)) {
            tree[i] += delta;
        }
    }

    long long query(int i) const {
        long long sum = 0;
        for (; i > 0; i -= (i & -i)) {
            sum += tree[i];
        }
        return sum;
    }

    long long range_query(int l, int r) const {
        return query(r) - query(l - 1);
    }
};
```

| Index $i$ | Binary Form | LSB Value `i & (-i)` | Interval Covered | Next Parent in Update ($i + \text{LSB}$) | Next Index in Query ($i - \text{LSB}$) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| $1$ | `001` | $1$ | `[1, 1]` | $2$ (`010`) | $0$ (Done) |
| $2$ | `010` | $2$ | `[1, 2]` | $4$ (`100`) | $0$ (Done) |
| $3$ | `011` | $1$ | `[3, 3]` | $4$ (`100`) | $2$ (`010`) |
| $6$ | `110` | $2$ | `[5, 6]` | $8$ (`1000`) | $4$ (`100`) |

```text
Query(7) = tree[7] (covers [7])
         + tree[6] (covers [5..6])
         + tree[4] (covers [1..4])
Total Prefix Sum [1..7] assembled in exactly 3 steps!
```

> [!WARNING]
> Fenwick Trees require 1-based indexing. Passing index `0` to `i & (-i)` evaluates to `0`, causing `i += 0` to spin in an infinite loop.

Let's now examine Segment Trees for generalized associative range queries.

#### Complexity Analysis
- **Time Complexity:** $\Theta(\log N)$ for both point updates and prefix range queries.
- **Auxiliary Space:** $O(N)$ memory to store the flat array buffer.

---

### Segment Trees — Array Storage & Divide-and-Conquer Queries

A Segment Tree is a full binary tree storing associative range aggregations (Sum, Min, Max, GCD) over arbitrary interval segments $[L, R]$.

Stored inside a flat 0-indexed array, a segment tree over $N$ leaf elements requires an array buffer of size at most $4N$.

```text
Root Node 0:                    [ 0 ... 7 ]
                              /             \
Node 1:             [ 0 ... 3 ]             [ 4 ... 7 ]  (Node 2)
                    /         \             /         \
Node 3:         [ 0..1 ]    [ 2..3 ]    [ 4..5 ]    [ 6..7 ] (Node 6)
Left Child = 2*node + 1,        Right Child = 2*node + 2
```

Any arbitrary range query $[q_L, q_R]$ decomposes into at most $O(\log N)$ canonical disjoint tree nodes.

$$\text{Build Time} = O(N), \quad \text{Point Update} = O(\log N), \quad \text{Range Query} = O(\log N)$$

Let's implement the full `SegmentTree` class supporting range sum and point updates.

```cpp
// Segment Tree: O(N) Build, O(log N) Point Update & Range Query
class SegmentTree {
    int n;
    vector<long long> tree;

    void build(const vector<int>& arr, int node, int l, int r) {
        if (l == r) {
            tree[node] = arr[l];
            return;
        }
        int mid = l + (r - l) / 2;
        build(arr, 2 * node + 1, l, mid);
        build(arr, 2 * node + 2, mid + 1, r);
        tree[node] = tree[2 * node + 1] + tree[2 * node + 2];
    }

    void update(int node, int l, int r, int idx, int val) {
        if (l == r) {
            tree[node] = val;
            return;
        }
        int mid = l + (r - l) / 2;
        if (idx <= mid) update(2 * node + 1, l, mid, idx, val);
        else update(2 * node + 2, mid + 1, r, idx, val);
        tree[node] = tree[2 * node + 1] + tree[2 * node + 2];
    }

    long long query(int node, int l, int r, int ql, int qr) {
        if (ql <= l && r <= qr) return tree[node]; // Complete overlap
        if (r < ql || l > qr) return 0;           // Disjoint
        int mid = l + (r - l) / 2;
        return query(2 * node + 1, l, mid, ql, qr) 
             + query(2 * node + 2, mid + 1, r, ql, qr);
    }
public:
    SegmentTree(const vector<int>& arr) : n(arr.size()), tree(4 * arr.size(), 0) {
        if (n > 0) build(arr, 0, 0, n - 1);
    }
    void update(int idx, int val) { update(0, 0, n - 1, idx, val); }
    long long query(int ql, int qr) { return query(0, 0, n - 1, ql, qr); }
};
```

| Node Span $[l, r]$ | Query Range $[q_L, q_R]$ | Overlap Classification | Action Taken |
| :--- | :--- | :--- | :--- |
| `[2, 3]` | `[2, 5]` | **Total Overlap** | Return `tree[node]` immediately |
| `[0, 1]` | `[2, 5]` | **Disjoint** | Return identity ($0$) |
| `[0, 7]` | `[2, 5]` | **Partial Overlap** | Recurse into left and right children |

```text
Query [ 2 ... 5 ] on an 8-element tree:
Segment [ 2..3 ] (Complete overlap) -> Returns sum of [2..3]
Segment [ 4..5 ] (Complete overlap) -> Returns sum of [4..5]
Sums combine in O(log N) operations!
```

> [!TIP]
> Segment Trees support ANY associative operation $(a \odot b) \odot c = a \odot (b \odot c)$ with an identity element, such as Min ($\infty$), Max ($-\infty$), Sum ($0$), or GCD ($0$).

Let's now examine Lazy Propagation for interval range updates.

#### Complexity Analysis
- **Time Complexity:** $O(N)$ construction; $O(\log N)$ for point updates and range queries.
- **Auxiliary Space:** $4N$ elements ($O(N)$ space) for the flat tree array.

---

## Lazy Propagation & Static Queries

### Lazy Propagation — Range Updates & Deferred Delta Pushdowns

Updating every element in a range $[L, R]$ with value $+V$ naively takes $O(N \log N)$ by performing $N$ point updates.

Lazy Propagation defers updating children by storing a pending delta tag `lazy[u]` on the node, pushing the tag downward only when a query visits that node.

```text
Update +5 on range [ 0 ... 7 ]:
Root [ 0..7 ] gets updated: tree[0] += 5 * 8 = +40
Tag pending update on children: lazy[left] += 5, lazy[right] += 5
Stop here! Children subtrees are not traversed until future queries.
```

The pushdown invariant applies deferred updates to node totals and forwards the tags to children.

$$\text{tree}[u] \mathrel{+}= \text{lazy}[u] \times (r - l + 1), \quad \text{lazy}[\text{child}] \mathrel{+}= \text{lazy}[u]$$

Let's implement the full `LazySegmentTree` in C++.

```cpp
// Lazy Segment Tree: O(log N) Range Update & Range Query
class LazySegmentTree {
    int n;
    vector<long long> tree, lazy;

    void push_down(int node, int l, int r) {
        if (lazy[node] != 0) {
            int mid = l + (r - l) / 2;
            int left = 2 * node + 1, right = 2 * node + 2;

            tree[left] += lazy[node] * (mid - l + 1);
            lazy[left] += lazy[node];

            tree[right] += lazy[node] * (r - mid);
            lazy[right] += lazy[node];

            lazy[node] = 0; // Clear parent tag
        }
    }
public:
    LazySegmentTree(int size) : n(size), tree(4 * size, 0), lazy(4 * size, 0) {}

    void range_update(int node, int l, int r, int ql, int qr, long long val) {
        if (ql <= l && r <= qr) {
            tree[node] += val * (r - l + 1);
            lazy[node] += val;
            return;
        }
        push_down(node, l, r);
        int mid = l + (r - l) / 2;
        if (ql <= mid) range_update(2 * node + 1, l, mid, ql, qr, val);
        if (qr > mid) range_update(2 * node + 2, mid + 1, r, ql, qr, val);
        tree[node] = tree[2 * node + 1] + tree[2 * node + 2];
    }

    long long range_query(int node, int l, int r, int ql, int qr) {
        if (ql <= l && r <= qr) return tree[node];
        push_down(node, l, r);
        int mid = l + (r - l) / 2;
        long long sum = 0;
        if (ql <= mid) sum += range_query(2 * node + 1, l, mid, ql, qr);
        if (qr > mid) sum += range_query(2 * node + 2, mid + 1, r, ql, qr);
        return sum;
    }
};
```

| Operation | Range Updated | Node Tagged | Pending Tag Value | Tree Sum Adjusted |
| :--- | :--- | :--- | :--- | :--- |
| `add(0, 3, +10)` | `[0, 3]` | Node `1` (`[0..3]`) | `lazy[1] = 10` | $+10 \times 4 = +40$ |
| `query(0, 1)` | `[0, 1]` | Push down Node `1` | `lazy[3]=10, lazy[4]=10` | Evaluates cleanly |

```text
Query visits node with lazy != 0:
1. Apply lazy to left child: tree[L] += lazy * len(L); lazy[L] += lazy
2. Apply lazy to right child:tree[R] += lazy * len(R); lazy[R] += lazy
3. Set lazy[parent] = 0. Cleanly proceed downward!
```

> [!IMPORTANT]
> Always call `push_down(node, l, r)` at the beginning of BOTH `range_update` and `range_query` before branching to children.

Let's now examine Sparse Tables for static $O(1)$ Range Minimum Queries.

#### Complexity Analysis
- **Time Complexity:** $O(\log N)$ for both range updates and range queries.
- **Auxiliary Space:** $O(N)$ memory storing tree and lazy tag arrays.

---

### Sparse Tables & Constant-Time Idempotent RMQ

A Sparse Table precomputes power-of-two range intervals to answer static Range Minimum/Maximum Queries in deterministic $O(1)$ time.

This relies on Idempotency: for operations where $x \odot x = x$ (such as $\min, \max, \gcd$), overlapping query blocks do not distort the result.

```text
Query interval [ L ... R ] of length Len = R - L + 1:
Let k = floor(log2(Len)):
Block 1 (Starts at L)    : [ L ................. L + 2^k - 1 ]
Block 2 (Ends at R)      :           [ R - 2^k + 1 ................. R]
Overlapping union covers [L, R] completely -> min(Block1, Block2) = RMQ
```

The dynamic programming transition combines two half-sized blocks of length $2^{j-1}$.

$$M[i][j] = \min(M[i][j-1], M[i + 2^{j-1}][j-1]), \quad \text{RMQ}(L, R) = \min(M[L][k], M[R - 2^k + 1][k])$$

Let's implement the complete `SparseTable` class in C++.

```cpp
// Sparse Table: O(N log N) Build, O(1) Idempotent Range Minimum Query
class SparseTable {
    int n, k;
    vector<vector<int>> st;
    vector<int> log_table;
public:
    SparseTable(const vector<int>& arr) : n(arr.size()) {
        log_table.assign(n + 1, 0);
        for (int i = 2; i <= n; ++i) log_table[i] = log_table[i / 2] + 1;

        k = log_table[n] + 1;
        st.assign(n, vector<int>(k));

        for (int i = 0; i < n; ++i) st[i][0] = arr[i];

        for (int j = 1; j < k; ++j) {
            for (int i = 0; i + (1 << j) <= n; ++i) {
                st[i][j] = min(st[i][j - 1], st[i + (1 << (j - 1))][j - 1]);
            }
        }
    }

    int query_min(int l, int r) const {
        int j = log_table[r - l + 1];
        return min(st[l][j], st[r - (1 << j) + 1][j]);
    }
};
```

| Interval Length | Exponent $k = \lfloor\log_2(\text{len})\rfloor$ | Block 1 Covered | Block 2 Covered | Overlap? |
| :--- | :--- | :--- | :--- | :--- |
| $4$ | $k=2$ ($2^2 = 4$) | `[0, 3]` | `[0, 3]` | Exact match |
| $5$ | $k=2$ ($2^2 = 4$) | `[0, 3]` | `[1, 4]` | $3$ elements overlap |
| $7$ | $k=2$ ($2^2 = 4$) | `[0, 3]` | `[3, 6]` | $1$ element overlaps |

```text
Query Min on Range [ 1 ... 6 ] (Length 6):
k = log2(6) = 2 (Block length 2^2 = 4)
Block 1 = st[1][2] covers [ 1, 2, 3, 4 ]
Block 2 = st[3][2] covers [ 3, 4, 5, 6 ]
min(Block 1, Block 2) evaluates in exactly 2 lookups -> O(1) time!
```

> [!CAUTION]
> Sparse Tables only answer range queries in $O(1)$ time for IDEMPOTENT operations ($\min, \max, \gcd$). Non-idempotent operations like range sum require $O(\log N)$ disjoint power additions.

Let's now examine Dynamic Segment Trees and Coordinate Compression for sparse coordinates.

#### Complexity Analysis
- **Time Complexity:** $O(N \log N)$ precomputation time; strictly $O(1)$ per query.
- **Auxiliary Space:** $O(N \log N)$ memory for the table.

---

## Discretization & Advanced Tree Decompositions

### Coordinate Compression in Dynamic Range Queries

When query coordinates span $[-10^9, 10^9]$, allocating a static $4N$ array segment tree is impossible because $4 \times 10^9$ integers exceeds physical RAM.

We resolve this either by Coordinate Compression (for offline queries) or using a Dynamic (Implicit) Segment Tree that allocates nodes on demand using pointers.

```text
Domain [ 1 ... 10^9 ]:
Root Node: [ 1 ... 10^9 ]
Insert point 42:
Dynamically allocate: [ 1..5*10^8 ] -> [ 1..2.5*10^8 ] ... -> [ 42 ]
Creates only O(log(10^9)) ~ 30 nodes per insertion!
```

A Dynamic Segment Tree creates at most $O(Q \log(\text{Domain}))$ nodes across $Q$ operations.

$$\text{Memory Overhead} = Q \cdot 2 \log_2(10^9) \approx 60Q \text{ nodes} \ll 4 \times 10^9$$

Let's implement a pointer-based `DynamicSegmentTree` supporting range updates over $[1, 10^9]$.

```cpp
// Dynamic (Implicit) Segment Tree over [1, 10^9] Domain
struct DynNode {
    long long sum = 0, lazy = 0;
    DynNode *left = nullptr, *right = nullptr;
};

class DynamicSegmentTree {
    DynNode* root;
    long long MAX_VAL = 1e9;

    void push_down(DynNode* node, long long l, long long r) {
        if (!node->left) node->left = new DynNode();
        if (!node->right) node->right = new DynNode();

        if (node->lazy != 0) {
            long long mid = l + (r - l) / 2;
            node->left->sum += node->lazy * (mid - l + 1);
            node->left->lazy += node->lazy;

            node->right->sum += node->lazy * (r - mid);
            node->right->lazy += node->lazy;

            node->lazy = 0;
        }
    }
public:
    DynamicSegmentTree() : root(new DynNode()) {}

    void update(DynNode* node, long long l, long long r, long long ql, long long qr, long long val) {
        if (ql <= l && r <= qr) {
            node->sum += val * (r - l + 1);
            node->lazy += val;
            return;
        }
        push_down(node, l, r);
        long long mid = l + (r - l) / 2;
        if (ql <= mid) update(node->left, l, mid, ql, qr, val);
        if (qr > mid) update(node->right, mid + 1, r, ql, qr, val);

        node->sum = (node->left ? node->left->sum : 0) 
                  + (node->right ? node->right->sum : 0);
    }
};
```

| Coordinate Space | Static Array Size | Dynamic Tree Nodes ($Q=10^4$) | Offline Alternative |
| :--- | :--- | :--- | :--- |
| $[1, 10^5]$ | $400,000$ ints ($\approx 1.6\text{ MB}$) | $300,000$ nodes | Static Segment Tree |
| $[1, 10^9]$ | Exceeds RAM ($16\text{ GB}$) | $300,000$ nodes ($\approx 7\text{ MB}$) | Coordinate Compression + BIT |

```text
Nodes materialize only along active query paths.
Vast empty coordinate intervals remain unallocated nullptrs!
```

> [!TIP]
> Coordinate Compression is best for offline batch queries, while Dynamic Segment Trees are required for online streaming queries over sparse $10^9$ domains.

Let's now examine Heavy-Light Decomposition and Centroid Decomposition.

#### Complexity Analysis
- **Time Complexity:** $O(\log(\text{Range}))$ per query / update ($30$ steps for $10^9$).
- **Auxiliary Space:** $O(Q \log(\text{Range}))$ dynamic pointer nodes.

---

### Heavy-Light Decomposition & Centroid Decomposition

Heavy-Light Decomposition (HLD) partitions tree edges into Heavy (leading to the child with largest subtree) and Light edges, decomposing any tree path into at most $O(\log N)$ contiguous segment tree intervals.

Centroid Decomposition recursively splits a tree at its Centroid (a node whose removal leaves subtrees of size $\le N/2$), constructing a balanced centroid tree of height $O(\log N)$.

```text
Heavy Edges (Thick Lines) form vertical segment tree highway chains.
Light Edges jump between distinct chains.
Any path between u and v crosses at most O(log N) Light Edges!
Path Query Time = O(log N light edges) * O(log N segtree) = O(log^2 N)
```

The Centroid theorem guarantees that every tree has a centroid dividing the tree into subtrees of at most half size.

$$\text{Subtree Size after Centroid Removal: } \forall C_i, \; |C_i| \le \lfloor N/2 \rfloor \implies \text{Centroid Tree Height} \le \log_2 N$$

Let's implement the two-pass DFS setup for Heavy-Light Decomposition.

```cpp
// Heavy-Light Decomposition (HLD) Setup
class HeavyLightDecomp {
    int n, timer = 0;
    vector<int> parent, depth, heavy, head, pos, sz;
    vector<vector<int>> adj;

    int dfs_size(int u, int p, int d) {
        sz[u] = 1; parent[u] = p; depth[u] = d;
        int max_c_size = 0;
        for (int v : adj[u]) {
            if (v != p) {
                int c_sz = dfs_size(v, u, d + 1);
                sz[u] += c_sz;
                if (c_sz > max_c_size) {
                    max_c_size = c_sz;
                    heavy[u] = v; // Heavy child
                }
            }
        }
        return sz[u];
    }

    void dfs_hld(int u, int h) {
        head[u] = h;
        pos[u] = ++timer; // Position in Segment Tree
        if (heavy[u] != -1) dfs_hld(heavy[u], h); // Continue heavy chain

        for (int v : adj[u]) {
            if (v != parent[u] && v != heavy[u]) {
                dfs_hld(v, v); // Start new light chain
            }
        }
    }
public:
    HeavyLightDecomp(int nodes, const vector<vector<int>>& graph) : n(nodes), adj(graph) {
        parent.assign(n, 0); depth.assign(n, 0); heavy.assign(n, -1);
        head.assign(n, 0); pos.assign(n, 0); sz.assign(n, 0);
        dfs_size(0, -1, 0);
        dfs_hld(0, 0);
    }
};
```

| Decomposition Method | Tree Height | Path Query Complexity | Primary Application |
| :--- | :--- | :--- | :--- |
| **Heavy-Light (HLD)** | $O(N)$ original | $O(\log^2 N)$ via SegTree | Path updates and path sum/max queries |
| **Centroid Decomposition** | Guaranteed $O(\log N)$ | $O(\log N)$ per level | All-paths distance problems with length $K$ |

```text
Full Tree (Size N)  -> Root Centroid C1 (Leaves components <= N/2)
                       /           \
Component 1 (Size <= N/2)         Component 2 (Size <= N/2)
-> Centroid C2                    -> Centroid C3
Centroid tree height is strictly bounded by log2(N)!
```

> [!IMPORTANT]
> HLD maps arbitrary tree path queries into $O(\log N)$ contiguous 1D subsegments, enabling standard Segment Trees to update and query tree paths in $O(\log^2 N)$ time.

This completes the Range Query Data Structures chapter, covering Fenwick Trees, Segment Trees, Lazy Propagation, Sparse Tables, Coordinate Compression, Dynamic Trees, and HLD/Centroid decompositions.

#### Complexity Analysis
- **Time Complexity:** $O(N \log N)$ for HLD and Centroid builds; $O(\log^2 N)$ for HLD path queries.
- **Auxiliary Space:** $O(N)$ tree and decomposition arrays.

---

## Cheat Sheet & Quick Reference

| Data Structure | Query Time | Update Time | Auxiliary Space | Supported Operations |
| :--- | :--- | :--- | :--- | :--- |
| **Fenwick Tree (BIT)** | $O(\log N)$ | $O(\log N)$ | $O(N)$ (Flat 1-based array) | Point update, Prefix sum |
| **Segment Tree** | $O(\log N)$ | $O(\log N)$ | $4N$ ($O(N)$ space) | Any associative operation |
| **Lazy Segment Tree** | $O(\log N)$ | $O(\log N)$ | $4N$ ($O(N)$ space) | Range update + Range query |
| **Sparse Table** | $\Theta(1)$ (Idempotent)| Static ($0$) | $O(N \log N)$ | Static RMQ, Range Max, GCD |
| **Dynamic Segment Tree**| $O(\log R)$ | $O(\log R)$ | $O(Q \log R)$ | Sparse domain $[1, 10^9]$ queries |
| **HLD** | $O(\log^2 N)$ | $O(\log^2 N)$ | $O(N)$ | Tree path updates & queries |
| **Centroid Decomp** | $O(\log N)$ | $O(N \log N)$ build | $O(N)$ | Tree path counting & distance metrics |
