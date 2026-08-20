# Chapter 23: Lowest Common Ancestor

---

## LCA Concepts & Path Comparisons

### Lowest Common Ancestor Axioms & Path-Tracing Comparisons

Let's stand at the whiteboard and formalize the Lowest Common Ancestor (LCA) of two nodes $u$ and $v$: the deepest shared ancestor node present in both ancestor paths.

The classic path-comparison approach traces the root-to-node path for $u$ and the root-to-node path for $v$, finding the last common node before the paths diverge.

```text
Path to Node 4: [ Root (1) -> Node 2 -> Node 4 ]
Path to Node 5: [ Root (1) -> Node 2 -> Node 5 ]
Common Prefix : [ Root (1), Node 2 ]
Last Common Node before divergence = Node 2 ===> LCA(4, 5) = Node 2
```

The mathematical definition selects the shared ancestor residing at maximum depth from the root.

$$\text{LCA}(u, v) = \text{argmax}_{w \in \text{Anc}(u) \cap \text{Anc}(v)} \text{depth}(w)$$

Let's implement path tracing and prefix comparison in C++.

```cpp
// Path-Tracing LCA Algorithm: O(N) Time, O(H) Auxiliary Space
struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

bool find_path(TreeNode* root, TreeNode* target, vector<TreeNode*>& path) {
    if (!root) return false;
    path.push_back(root);

    if (root == target) return true;
    if (find_path(root->left, target, path) || find_path(root->right, target, path)) {
        return true;
    }

    path.pop_back(); // Backtrack
    return false;
}

TreeNode* lca_path_trace(TreeNode* root, TreeNode* p, TreeNode* q) {
    vector<TreeNode*> path_p, path_q;
    if (!find_path(root, p, path_p) || !find_path(root, q, path_q)) return nullptr;

    TreeNode* lca = nullptr;
    int n = min(path_p.size(), path_q.size());
    for (int i = 0; i < n; ++i) {
        if (path_p[i] == path_q[i]) {
            lca = path_p[i]; // Last matching ancestor
        } else {
            break;
        }
    }
    return lca;
}
```

| Traversal Step | Node in `path_p` | Node in `path_q` | Match Status | LCA Candidate |
| :--- | :--- | :--- | :--- | :--- |
| Index $0$ | Node $1$ (Root) | Node $1$ (Root) | Match | Node $1$ |
| Index $1$ | Node $2$ | Node $2$ | Match | **Node 2** |
| Index $2$ | Node $4$ | Node $5$ | **Divergence!** | Loop breaks |

```text
Root (1) ====> Node 2 ======> Fork: Node 4 (Left)
                                    Node 5 (Right)
Node 2 is the exact junction where paths separate!
```

> [!WARNING]
> Storing full root-to-node path vectors consumes $O(H)$ extra memory per query, which becomes inefficient when handling thousands of online queries.

Let's now examine the clean single-pass postorder recursive LCA algorithm.

#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear time to traverse paths.
- **Auxiliary Space:** $O(H)$ memory to store path vectors and recursion frames.

---

## Linear & Logarithmic LCA Algorithms

### Postorder Recursive LCA for Binary Trees

The single-pass Postorder recursive algorithm evaluates subtrees from the bottom up, bubbling non-null node signals upward to their lowest common junction.

If the current node matches $p$ or $q$, we return it; if both left and right child calls return non-null pointers, the current node is the LCA.

```text
                              [ Node 2 ]  <--- LCA Hub!
                             /          \
      Left Call returns [ Node 4 ]     Right Call returns [ Node 5 ]

Both left and right subtrees returned non-null -> Node 2 IS the LCA!
```

The recursive return function determines which signal to propagate upward.

$$\text{LCA}(r, p, q) = (r \in \{p, q, \emptyset\}) \, ? \, r : (\text{left} \land \text{right} \, ? \, r : (\text{left} \, ? \, \text{left} : \text{right}))$$

Let's implement single-pass recursive LCA alongside LCA with Parent Pointers.

```cpp
// Postorder Single-Pass Recursive LCA: O(N) Time, O(H) Space
TreeNode* lowest_common_ancestor(TreeNode* root, TreeNode* p, TreeNode* q) {
    if (!root || root == p || root == q) return root;

    TreeNode* left = lowest_common_ancestor(root->left, p, q);
    TreeNode* right = lowest_common_ancestor(root->right, p, q);

    if (left && right) return root; // Both found in separate subtrees
    return left ? left : right;     // Propagate the non-null signal
}

// LCA with Parent Pointers: O(H) Time, O(1) Auxiliary Space
struct ParentNode {
    int val;
    ParentNode *left, *right, *parent;
};

ParentNode* lca_with_parents(ParentNode* p, ParentNode* q) {
    ParentNode *a = p, *b = q;
    // 2-pointer boundary alignment equalizes path lengths
    while (a != b) {
        a = (a == nullptr) ? q : a->parent;
        b = (b == nullptr) ? p : b->parent;
    }
    return a; // Returns LCA node
}
```

| Node Processed | Left Return | Right Return | Evaluation | Value Returned Up |
| :--- | :--- | :--- | :--- | :--- |
| `Node 4` | - | - | Matches $p$ | Returns `Node 4` |
| `Node 5` | - | - | Matches $q$ | Returns `Node 5` |
| `Node 2` | `Node 4` | `Node 5` | Both non-null! | **Returns Node 2 (LCA)** |
| `Node 1` (Root) | `Node 2` | `nullptr` | Only left valid | Returns `Node 2` |

```text
Subtree signals travel up to root:
Signal(4) and Signal(5) converge at Node 2
Node 2 returns itself upward; Root 1 forwards Node 2 as final result!
```

> [!CAUTION]
> If node $p$ is an ancestor of node $q$, the recursive algorithm returns $p$ immediately without visiting $q$'s subtree. This is valid only if both nodes are guaranteed to exist in the tree.

Let's now study Binary Lifting for $O(\log N)$ online LCA queries.

#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ visiting every node in the binary tree.
- **Auxiliary Space:** $O(H)$ recursion call stack memory.

---

### Binary Lifting LCA & Dynamic Jump Tables (O(log N) Queries)

Binary Lifting precomputes $2^k$-th ancestors for every node, enabling any LCA query in a tree of size $N$ to be answered in logarithmic $O(\log N)$ time.

Jumping $2^k$ steps is equivalent to jumping $2^{k-1}$ steps to an intermediate ancestor, then jumping another $2^{k-1}$ steps from there.

```text
up[u][0] = 2^0 ancestor = parent[u]
up[u][1] = 2^1 ancestor = up[ up[u][0] ][0] (Grandparent)
up[u][2] = 2^2 ancestor = up[ up[u][1] ][1] (4th ancestor)
up[u][k] = 2^k ancestor = up[ up[u][k-1] ][k-1] (2^k ancestor)
```

The dynamic programming recurrence builds the ancestor jump table in $O(N \log N)$ time.

$$\text{up}[u][k] = \text{up}[\text{up}[u][k-1]][k-1] \quad \text{with base case } \text{up}[u][0] = \text{parent}[u]$$

Let's implement the complete `TreeLCA` binary lifting class.

```cpp
// Binary Lifting LCA: O(N log N) Precomputation, O(log N) Query
class TreeLCA {
    int n, log_n;
    vector<int> depth;
    vector<vector<int>> up;

    void dfs(int u, int p, int d, const vector<vector<int>>& adj) {
        depth[u] = d;
        up[u][0] = p;
        for (int k = 1; k < log_n; ++k) {
            up[u][k] = (up[u][k - 1] != -1) ? up[up[u][k - 1]][k - 1] : -1;
        }
        for (int v : adj[u]) {
            if (v != p) dfs(v, u, d + 1, adj);
        }
    }
public:
    TreeLCA(int num_nodes, int root, const vector<vector<int>>& adj) : n(num_nodes) {
        log_n = 20; // 2^20 > 10^6 nodes
        depth.assign(n, 0);
        up.assign(n, vector<int>(log_n, -1));
        dfs(root, -1, 0, adj);
    }

    int get_lca(int u, int v) {
        if (depth[u] < depth[v]) swap(u, v);

        // Phase 1: Lift deeper node u to match depth of v
        for (int k = log_n - 1; k >= 0; --k) {
            if (depth[u] - (1 << k) >= depth[v]) {
                u = up[u][k];
            }
        }
        if (u == v) return u;

        // Phase 2: Jump both nodes simultaneously
        for (int k = log_n - 1; k >= 0; --k) {
            if (up[u][k] != up[v][k]) {
                u = up[u][k];
                v = up[v][k];
            }
        }
        return up[u][0]; // Parent of u is the LCA
    }
};
```

| Node $u$ | $2^0$ Ancestor ($k=0$) | $2^1$ Ancestor ($k=1$) | $2^2$ Ancestor ($k=2$) |
| :--- | :--- | :--- | :--- |
| `Node 6` (Depth 3) | `Node 4` | `Node 2` | `Node 1` |
| `Node 4` (Depth 2) | `Node 2` | `Node 1` | `-1` (None) |
| `Node 2` (Depth 1) | `Node 1` | `-1` | `-1` |

```text
Depth(u) = 7, Depth(v) = 3 -> Difference = 4
Difference 4 in binary is 0b100 (Single 2^2 jump!)
u = up[u][2] lifts node u 4 levels up in O(1) jump!
```

> [!IMPORTANT]
> Allocate the jump table width as $K = \lceil \log_2 N \rceil \approx 20$. A fixed width of 20 handles trees with up to $1,000,000$ nodes safely.

Let's now examine Euler Tour reductions for static $O(1)$ LCA queries.

#### Complexity Analysis
- **Time Complexity:** $O(N \log N)$ precomputation time; $O(\log N)$ per LCA query.
- **Auxiliary Space:** $O(N \log N)$ jump table memory.

---

## Specialized Tree & Static LCA Structures

### Euler Tour + RMQ Reduction (Tarjan's Static O(1) LCA)

The Euler Tour + Range Minimum Query (RMQ) reduction enables static LCA queries to be answered in strictly $O(1)$ time after $O(N \log N)$ precomputation.

During an Euler Tour that records node visits, the Lowest Common Ancestor of $u$ and $v$ is the node with the minimum depth visited between the first appearance of $u$ and the first appearance of $v$.

```text
Euler Tour: [ 1, 2, 4, 2, 5, 2, 1, 3 ]
Depths    : [ 0, 1, 2, 1, 2, 1, 0, 1 ]
Query LCA(4, 5):
First occurrence of 4 is at idx 2 (Depth 2)
First occurrence of 5 is at idx 4 (Depth 2)
Range [ 2 ... 4 ] depths: [ 2, 1, 2 ] -> Minimum depth is 1 at Node 2!
LCA(4, 5) = Node 2!
```

The mathematical reduction equates LCA to an $O(1)$ Range Minimum Query over the depth array.

$$\text{LCA}(u, v) = \text{node}(\text{RMQ}_{\text{depth}}(\text{first}[u], \text{first}[v]))$$

Let's implement the static $O(1)$ LCA solver using a Sparse Table.

```cpp
// Static O(1) LCA via Euler Tour + Sparse Table RMQ
class StaticLCA {
    vector<int> euler_nodes, euler_depths, first_pos;
    vector<vector<int>> st;
    vector<int> log_table;

    void dfs(TreeNode* u, int d) {
        if (!u) return;
        first_pos[u->val] = euler_nodes.size();
        euler_nodes.push_back(u->val);
        euler_depths.push_back(d);

        if (u->left) {
            dfs(u->left, d + 1);
            euler_nodes.push_back(u->val);
            euler_depths.push_back(d);
        }
        if (u->right) {
            dfs(u->right, d + 1);
            euler_nodes.push_back(u->val);
            euler_depths.push_back(d);
        }
    }
public:
    StaticLCA(TreeNode* root, int max_val) {
        first_pos.assign(max_val + 1, -1);
        dfs(root, 0);

        int m = euler_depths.size();
        log_table.assign(m + 1, 0);
        for (int i = 2; i <= m; ++i) log_table[i] = log_table[i / 2] + 1;

        int k = log_table[m] + 1;
        st.assign(m, vector<int>(k));
        for (int i = 0; i < m; ++i) st[i][0] = i;

        for (int j = 1; j < k; ++j) {
            for (int i = 0; i + (1 << j) <= m; ++i) {
                int left_idx = st[i][j - 1];
                int right_idx = st[i + (1 << (j - 1))][j - 1];
                st[i][j] = (euler_depths[left_idx] <= euler_depths[right_idx]) ? left_idx : right_idx;
            }
        }
    }

    int query(int u, int v) {
        int l = first_pos[u], r = first_pos[v];
        if (l > r) swap(l, r);
        int j = log_table[r - l + 1];
        int idx1 = st[l][j];
        int idx2 = st[r - (1 << j) + 1][j];
        int min_idx = (euler_depths[idx1] <= euler_depths[idx2]) ? idx1 : idx2;
        return euler_nodes[min_idx];
    }
};
```

| Step Index | Tour Node Visited | Node Depth | `first_pos` Recorded |
| :--- | :--- | :--- | :--- |
| $0$ | `Node 1` | $0$ | `first[1] = 0` |
| $1$ | `Node 2` | $1$ | `first[2] = 1` |
| $2$ | `Node 4` | $2$ | `first[4] = 2` |
| $3$ | `Node 2` (Return) | $1$ | - |
| $4$ | `Node 5` | $2$ | `first[5] = 4` |

```text
Query interval [ L ... R ] covered by two 2^k power blocks:
Block 1: [ L ................. L + 2^k - 1 ]
Block 2: [ R - 2^k + 1 ................. R ]
Constant time min(Block1, Block2) evaluates in O(1) operations!
```

> [!TIP]
> An Euler Tour on a binary tree with $N$ nodes contains exactly $2N - 1$ steps. Pre-allocate the arrays of size $2N$ to avoid dynamic resizings.

Let's now conclude with optimizing LCA on Binary Search Trees.

#### Complexity Analysis
- **Time Complexity:** $O(N \log N)$ precomputation time; strictly $O(1)$ per LCA query.
- **Auxiliary Space:** $O(N \log N)$ Sparse Table memory.

---

### BST LCA Value Boundary Comparison (O(H) Time, O(1) Space)

On a Binary Search Tree (BST), node keys are strictly sorted: values in the left subtree are smaller than `root->val`, and values in the right subtree are larger.

We find the LCA without searching full subtrees: if both keys are smaller than `root`, move left; if both are larger, move right; if keys split on either side, `root` is the LCA.

```text
BST Root = 6, Target p = 2, Target q = 8
Node 2 < 6 and Node 8 > 6
Targets split on opposite sides of Root 6 ===> LCA IS Node 6!
If both were < 6 -> Branch Left; If both > 6 -> Branch Right.
```

The split condition guarantees that the current root is the lowest common ancestor.

$$\min(p.\text{val}, q.\text{val}) \le \text{root}.\text{val} \le \max(p.\text{val}, q.\text{val}) \implies \text{root is LCA}$$

Let's implement the iterative $O(1)$ space BST LCA solver.

```cpp
// BST Lowest Common Ancestor: O(H) Time, O(1) Space
TreeNode* lowest_common_ancestor_bst(TreeNode* root, TreeNode* p, TreeNode* q) {
    int p_val = p->val, q_val = q->val;

    while (root) {
        if (p_val < root->val && q_val < root->val) {
            root = root->left;  // Both targets in left subtree
        } else if (p_val > root->val && q_val > root->val) {
            root = root->right; // Both targets in right subtree
        } else {
            return root;        // Bifurcation point found!
        }
    }
    return nullptr;
}
```

| Current Node Value | $p=2$ Comparison | $q=4$ Comparison | Branching Decision |
| :--- | :--- | :--- | :--- |
| `6` (Root) | $2 < 6$ | $4 < 6$ | Both smaller $\to$ Branch Left |
| `2` | $2 == 2$ | $4 > 2$ | **Split / Match $\to$ Node 2 is LCA!** |

```text
Starts at root -> Descents strictly down 1 branch path
Number of steps = Height of Tree H = O(log N) for balanced BST
Zero stack overhead and zero auxiliary memory allocations!
```

> [!IMPORTANT]
> The iterative BST LCA solver runs in $O(H)$ time and strictly $O(1)$ auxiliary memory with zero recursion stack overhead.

This completes the Lowest Common Ancestor chapter, covering path tracing, postorder bubbling, binary lifting jump tables, Euler Tour RMQ reductions, and BST value bifurcation searches.

#### Complexity Analysis
- **Time Complexity:** $O(H) = O(\log N)$ on balanced BST; $O(N)$ on skewed tree.
- **Auxiliary Space:** $O(1)$ strictly in-place iterative pointer loop.

---

## Cheat Sheet & Quick Reference

| LCA Technique | Tree Type | Precomputation | Query Time | Space Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **Path Tracing** | Binary Tree | None ($0$) | $O(N)$ | $O(H)$ vector storage |
| **Postorder Recursion**| Binary Tree | None ($0$) | $O(N)$ | $O(H)$ call stack |
| **Parent Pointers** | Parent Tree | None ($0$) | $O(H)$ | $O(1)$ dual pointers |
| **Binary Lifting** | General Tree | $O(N \log N)$ | $O(\log N)$ | $O(N \log N)$ table |
| **Euler Tour + RMQ** | Static Tree | $O(N \log N)$ | $\Theta(1)$ | $O(N \log N)$ table |
| **BST Bifurcation** | BST | None ($0$) | $O(H)$ | $\Theta(1)$ in-place |
