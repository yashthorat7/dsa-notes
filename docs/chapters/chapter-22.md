# Chapter 22: Tree Breadth-First Search

---


## Level-by-Level BFS Scans


### Level-Order Traversals & Queue Snapshot Mechanics

Level-order traversal visits nodes tier-by-tier from top to bottom, recording each horizontal depth tier as a distinct collection.

We use a FIFO queue with snapshot sizing: at the beginning of each level loop, `int level_size = q.size()` captures the exact number of nodes belonging strictly to the current depth level.

```text
Queue State at Level Start: [ Node A, Node B ]  (Snapshot Size = 2)
Process exact 2 iterations:
1. Pop Node A -> Push children (C, D)
2. Pop Node B -> Push child (E)
Level Complete! Result captures [A, B]. Next level has [C, D, E].
```

The snapshot invariant guarantees clean level isolation:

$$\text{for}(k = 0; k < \text{snapshot\_size}; ++k) \implies \text{Processes exactly current tier nodes}$$

Let's implement level-tier snapshot traversal in C++.

```cpp
// Organizational Hierarchy Depth Tier Grouping: O(N) Time, O(W) Space
vector<vector<int>> group_hierarchy_tiers(TreeNode* root) {
    if (!root) return {};

    vector<vector<int>> tiers;
    queue<TreeNode*> q;
    q.push(root);

    while (!q.empty()) {
        int level_size = q.size(); // Snapshot current tier node count
        vector<int> current_tier;
        current_tier.reserve(level_size);

        for (int i = 0; i < level_size; ++i) {
            TreeNode* curr = q.front();
            q.pop();
            current_tier.push_back(curr->val);

            if (curr->left) q.push(curr->left);
            if (curr->right) q.push(curr->right);
        }
        tiers.push_back(move(current_tier));
    }
    return tiers;
}
```

#### Memory Model Comparison: BFS Queue vs DFS Call Stack

| Dimension | BFS Level-Order Queue | DFS Preorder/Inorder Stack |
| :--- | :--- | :--- |
| **Memory Bottleneck** | Proportional to Tree **Width** $W$ | Proportional to Tree **Height** $H$ |
| **Balanced Tree ($N$ Nodes)** | $\Theta(N/2) = \Theta(N)$ nodes at leaf tier | $\Theta(\log N)$ stack frames |
| **Degenerate Tree ($N$ Nodes)**| $\Theta(1)$ single node per level | $\Theta(N)$ deep call stack recursion |
| **Preferred For** | Shortest path to target / level-wise stats | Path finding / exhaustive subtree validation |

#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ visiting every tree node once.
- **Auxiliary Space:** $O(W_{\max}) = O(N)$ queue memory storing the widest level.

---


### Zigzag (Spiral) Level Order Traversal Invariants

Zigzag Level Order Traversal alternates directions tier by tier: Left-to-Right on even levels ($0, 2, 4 \dots$) and Right-to-Left on odd levels ($1, 3, 5 \dots$).

Instead of reversing vectors after traversal, we can either place elements directly into pre-sized vectors by index or alternate between Two Stacks.

```text
Level 0 (L -> R):             [ 3 ]                   ===> [ 3 ]
                             /     \
Level 1 (R -> L):          [ 9 ]   [ 20 ]             ===> [ 20, 9 ]
                                   /    \
Level 2 (L -> R):                [ 15 ] [ 7 ]         ===> [ 15, 7 ]
```

The direction parity condition determines where each element is placed inside the level vector.

$$\text{Index Assignment: } \text{idx} = \text{leftToRight} \, ? \, i : (\text{level\_size} - 1 - i)$$

Let's implement the pre-indexed placement Zigzag traversal in C++.

```cpp
// Zigzag Level Order Traversal: O(N) Time, O(W) Space
vector<vector<int>> zigzag_level_order(TreeNode* root) {
    if (!root) return {};
    vector<vector<int>> result;
    queue<TreeNode*> q;
    q.push(root);
    bool left_to_right = true;

    while (!q.empty()) {
        int sz = q.size();
        vector<int> level(sz);

        for (int i = 0; i < sz; ++i) {
            TreeNode* node = q.front();
            q.pop();

            // Direct index placement eliminates O(K) reverse overhead
            int index = left_to_right ? i : (sz - 1 - i);
            level[index] = node->val;

            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
        result.push_back(level);
        left_to_right = !left_to_right; // Flip direction
    }
    return result;
}
```

| Level Number | Direction Flag | Dequeue Order | Index Placement Order | Output Row |
| :--- | :--- | :--- | :--- | :--- |
| Level 0 | Left-to-Right | `3` | Index `0` | `[3]` |
| Level 1 | Right-to-Left | `9, 20` | Index `1`, then `0` | `[20, 9]` |
| Level 2 | Left-to-Right | `15, 7` | Index `0`, then `1` | `[15, 7]` |

```text
Level Size = 3, Direction = Right-to-Left:
1st dequeued node goes to level[2]
2nd dequeued node goes to level[1]
3rd dequeued node goes to level[0]
Zero reallocation and zero reversal copies!
```

> [!TIP]
> Pre-allocating `vector<int> level(sz)` and populating elements directly via `level[leftToRight ? i : sz - 1 - i]` avoids the performance penalty of `reverse`.

Let's now examine geometric exterior tree views and silhouettes.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear time.
- **Auxiliary Space:** $O(W_{\max})$ queue buffer memory.

---


## Geometric Tree Projections


### Tree Projections — Exterior Views & Boundary Silhouettes

Exterior views capture the visible boundary silhouette of a tree when viewed from the Left, Right, Top, and Bottom.

The Left and Right Views record the first and last nodes visible at each horizontal depth level during a level-order traversal.

```text
Left View Observer ->         [ 1 ]           <- Right View Observer
                             /     \
                           [ 2 ]   [ 3 ]
                             \       \
                             [ 4 ]   [ 5 ]
Left View : [ 1, 2, 4 ]               Right View : [ 1, 3, 5 ]
```

Top and Bottom Views project nodes onto horizontal column coordinates, recording the first and last node encountered in each column line.

$$\text{LeftView}[d] = \text{level}[0], \quad \text{RightView}[d] = \text{level}[\text{sz}-1]$$

Let's implement Left View, Right View, and Top View in C++.

```cpp
// Left View, Right View & Top View using BFS
vector<int> right_side_view(TreeNode* root) {
    if (!root) return {};
    vector<int> right_view;
    queue<TreeNode*> q;
    q.push(root);

    while (!q.empty()) {
        int sz = q.size();
        for (int i = 0; i < sz; ++i) {
            TreeNode* node = q.front();
            q.pop();

            if (i == sz - 1) right_view.push_back(node->val); // Last node in tier

            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
    }
    return right_view;
}

vector<int> top_view(TreeNode* root) {
    if (!root) return {};
    map<int, int> column_map; // Column -> First seen node value
    queue<pair<TreeNode*, int>> q; // {Node, Column}
    q.push({root, 0});

    while (!q.empty()) {
        auto [node, col] = q.front();
        q.pop();

        if (column_map.find(col) == column_map.end()) {
            column_map[col] = node->val; // Record first seen node in column
        }
        if (node->left) q.push({node->left, col - 1});
        if (node->right) q.push({node->right, col + 1});
    }

    vector<int> result;
    for (auto const& [col, val] : column_map) result.push_back(val);
    return result;
}
```

| View Type | Coordinate Axis | Selection Condition | Output on Tree `[1, 2, 3, null, 4]` |
| :--- | :--- | :--- | :--- |
| **Left View** | Vertical Row $d$ | First node at each depth level | `[1, 2, 4]` |
| **Right View** | Vertical Row $d$ | Last node at each depth level | `[1, 3, 4]` |
| **Top View** | Horizontal Col $c$ | First node seen at each column | `[2, 1, 3]` |
| **Bottom View** | Horizontal Col $c$ | Last node seen at each column | `[2, 4, 3]` |

```text
Column Line -1 : [ 2 ]
Column Line  0 : [ 1 ] (top), [ 4 ] (bottom)
Column Line +1 : [ 3 ]
Top View:    [ 2, 1, 3 ]
Bottom View: [ 2, 4, 3 ] (Overwrites slot 0 with node 4)
```

> [!IMPORTANT]
> For Top View, insert into the map only if the column key is NOT yet present; for Bottom View, overwrite the map entry on every encounter.

Let's now examine full 2D vertical grid traversals.


#### Complexity Analysis
- **Time Complexity:** $O(N)$ for Left/Right views; $O(N \log W)$ for Top/Bottom views using sorted map.
- **Auxiliary Space:** $O(W)$ memory to store queue and column records.

---


### Vertical Grid Traversals & Horizontal Column Coordinates

Vertical Order Traversal projects each node onto a 2D coordinate plane $(\text{row}, \text{col})$, where the root sits at $(0, 0)$.

A left child shifts to $(\text{row}+1, \text{col}-1)$ and a right child shifts to $(\text{row}+1, \text{col}+1)$, grouping nodes by column from left to right.

```text
Col -2      Col -1          Col 0          Col +1        Col +2
              |             [ 3 ]            |             |
              |            (0, 0)            |             |
              |           /      \           |             |
            [ 9 ]        |        |        [ 20 ]          |
           (1, -1)       |        |        (1, +1)         |
                         |        |        /     \         |
                       [ 15 ]     |     [ 7 ]              |
                       (2, 0)     |    (2, +2)             |
```

Coordinate update rules maintain geometric alignment during BFS traversal.

$$(u.L.\text{row}, u.L.\text{col}) = (u.\text{row}+1, u.\text{col}-1), \quad (u.R.\text{row}, u.R.\text{col}) = (u.\text{row}+1, u.\text{col}+1)$$

Let's implement the complete Vertical Order Traversal with coordinate sorting.

```cpp
// Vertical Order Traversal with Multiset Coordinate Tie-Breaking
struct CoordNode {
    TreeNode* node;
    int row, col;
};

vector<vector<int>> vertical_traversal(TreeNode* root) {
    if (!root) return {};
    // map: col -> (map: row -> multiset: values)
    map<int, map<int, multiset<int>>> nodes;
    queue<CoordNode> q;
    q.push({root, 0, 0});

    while (!q.empty()) {
        auto [node, r, c] = q.front();
        q.pop();

        nodes[c][r].insert(node->val);

        if (node->left) q.push({node->left, r + 1, c - 1});
        if (node->right) q.push({node->right, r + 1, c + 1});
    }

    vector<vector<int>> result;
    for (auto const& [col, row_map] : nodes) {
        vector<int> col_vals;
        for (auto const& [row, values] : row_map) {
            col_vals.insert(col_vals.end(), values.begin(), values.end());
        }
        result.push_back(col_vals);
    }
    return result;
}
```

| Column $c$ | Row $r$ | Node Value | Sorted Column Output |
| :--- | :--- | :--- | :--- |
| $-1$ | $1$ | `9` | `[9]` |
| $0$ | $0, 2$ | `3, 15` | `[3, 15]` |
| $+1$ | $1$ | `20` | `[20]` |
| $+2$ | $2$ | `7` | `[7]` |

```text
Flattened Result: [ [9], [3, 15], [20], [7] ]
Automatically sorted by: Column -> Row -> Numerical Value on ties!
```

> [!TIP]
> Using `map<int, map<int, multiset<int>>>` automatically sorts by column first, then by row, and breaks identical $(r, c)$ coordinate ties in ascending numerical order.

Let's now examine radial BFS expansion and Distance-$K$ neighborhood scans.


#### Complexity Analysis
- **Time Complexity:** $O(N \log N)$ to traverse and sort nodes within coordinate buckets.
- **Auxiliary Space:** $O(N)$ memory storing 2D coordinate maps and queue items.

---


## Radial Searches & Tree Serialization


### Radial BFS Expansion & Distance-K Neighborhood Scans

Finding all nodes located at exact edge distance $K$ from a target node requires expanding the search radius in three directions: Left Child, Right Child, and Upward Parent.

Because standard tree nodes do not maintain parent pointers, we run an initial DFS pass to build a `parent_map`, effectively converting the tree into an undirected graph.

```text
                           [ Parent ]  <--- Upward Search
                               |
                            [ Target ]
                            /        \
            [ Left Child ] <          > [ Right Child ]
Radial BFS expands outward 1 distance layer at a time in all 3 paths!
```

Converting the tree into an undirected graph enables standard radius-$K$ BFS expansion in linear time.

$$\text{Distance Layers: } D_0 = \{\text{target}\}, \quad D_{t+1} = \text{Neighbors}(D_t) \setminus \text{Visited}$$

Let's implement the complete All Nodes Distance $K$ algorithm.

```cpp
// All Nodes Distance K in Binary Tree: O(N) Time, O(N) Space
class DistanceKFinder {
    unordered_map<TreeNode*, TreeNode*> parent_map;

    void build_parents(TreeNode* curr, TreeNode* parent) {
        if (!curr) return;
        if (parent) parent_map[curr] = parent;
        build_parents(curr->left, curr);
        build_parents(curr->right, curr);
    }
public:
    vector<int> distance_k(TreeNode* root, TreeNode* target, int k) {
        build_parents(root, nullptr);

        queue<TreeNode*> q;
        unordered_set<TreeNode*> visited;
        q.push(target);
        visited.insert(target);
        int current_dist = 0;

        while (!q.empty()) {
            if (current_dist == k) break;
            int sz = q.size();

            for (int i = 0; i < sz; ++i) {
                TreeNode* node = q.front();
                q.pop();

                // 1. Left child
                if (node->left && !visited.count(node->left)) {
                    visited.insert(node->left);
                    q.push(node->left);
                }
                // 2. Right child
                if (node->right && !visited.count(node->right)) {
                    visited.insert(node->right);
                    q.push(node->right);
                }
                // 3. Parent node
                if (parent_map.count(node) && !visited.count(parent_map[node])) {
                    visited.insert(parent_map[node]);
                    q.push(parent_map[node]);
                }
            }
            current_dist++;
        }

        vector<int> result;
        while (!q.empty()) {
            result.push_back(q.front()->val);
            q.pop();
        }
        return result;
    }
};
```

| Distance Layer | Nodes in Queue | Neighbors Explored | New Visited Nodes |
| :--- | :--- | :--- | :--- |
| $d=0$ | `[5]` (Target) | `5->left (6)`, `5->right (2)`, `Parent (3)` | `6, 2, 3` |
| $d=1$ | `[6, 2, 3]` | `2->left (7)`, `2->right (4)`, `3->right (1)` | `7, 4, 1` |
| $d=2$ ($K=2$) | `[7, 4, 1]` | - | **Final Answer:** `[7, 4, 1]` |

```text
Target = 5, K = 2:
Step 0: [ 5 ]
Step 1: [ 6, 2, 3 ]
Step 2: [ 7, 4, 1 ] ===> Nodes at distance K = 2
```

> [!CAUTION]
> Always track an `unordered_set<TreeNode*> visited` during radial BFS. Omitting the visited set causes infinite oscillation between parent and child nodes.

Let's now examine tree serialization and Euler Tour interval indexing.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear time to map parents and perform radial BFS.
- **Auxiliary Space:** $\Theta(N)$ auxiliary memory for parent map, visited set, and queue.

---


### Tree State Conversions — Serialization & Euler Tour Indexing

Tree Serialization encodes a binary tree into a string token stream, while Deserialization reconstructs the exact tree topology from that string.

Euler Tour Flattening records entrance and exit timestamps during DFS, mapping any node's subtree into a contiguous 1D range interval $[T_{\text{in}}[u], T_{\text{out}}[u]]$.

```text
Tree:        [ 1 ]            Token Stream:
            /     \           "1,2,X,X,3,4,X,X,5,X,X"
         [ 2 ]   [ 3 ]        (Where 'X' represents null pointer)
                 /   \
               [4]   [5]
```

The Euler Tour interval property confirms that all descendants of node $u$ fall within its entry and exit timestamp window.

$$v \in \text{Subtree}(u) \iff T_{\text{in}}[u] \le T_{\text{in}}[v] \le T_{\text{out}}[u]$$

Let's implement the BFS `Codec` class for tree serialization and deserialization.

```cpp
// Tree Serialization & Deserialization (Codec)
class Codec {
public:
    string serialize(TreeNode* root) {
        if (!root) return "X";
        string s = "";
        queue<TreeNode*> q;
        q.push(root);

        while (!q.empty()) {
            TreeNode* curr = q.front();
            q.pop();
            if (curr) {
                s += to_string(curr->val) + ",";
                q.push(curr->left);
                q.push(curr->right);
            } else {
                s += "X,";
            }
        }
        return s;
    }

    TreeNode* deserialize(string data) {
        if (data == "X" || data.empty()) return nullptr;
        stringstream ss(data);
        string item;
        getline(ss, item, ',');

        TreeNode* root = new TreeNode(stoi(item));
        queue<TreeNode*> q;
        q.push(root);

        while (!q.empty()) {
            TreeNode* curr = q.front();
            q.pop();

            if (getline(ss, item, ',') && item != "X") {
                curr->left = new TreeNode(stoi(item));
                q.push(curr->left);
            }
            if (getline(ss, item, ',') && item != "X") {
                curr->right = new TreeNode(stoi(item));
                q.push(curr->right);
            }
        }
        return root;
    }
};
```

Now let's implement Euler Tour subtree flattening for 1D range queries.

```cpp
// Euler Tour Subtree Interval Flattening
class EulerTour {
    int timer = 0;
    vector<int> tin, tout, flat_nodes;

    void dfs(TreeNode* u) {
        if (!u) return;
        tin[u->val] = ++timer;
        flat_nodes.push_back(u->val);

        dfs(u->left);
        dfs(u->right);

        tout[u->val] = timer;
    }
public:
    EulerTour(TreeNode* root, int max_nodes) {
        tin.assign(max_nodes + 1, 0);
        tout.assign(max_nodes + 1, 0);
        dfs(root);
    }

    pair<int, int> get_subtree_range(int node_val) {
        return {tin[node_val], tout[node_val]};
    }
};
```

| Node ID | Entry Timestamp $T_{\text{in}}$ | Exit Timestamp $T_{\text{out}}$ | Subtree 1D Interval Span |
| :--- | :--- | :--- | :--- |
| `1` (Root) | $1$ | $5$ | `[1, 5]` (Full tree) |
| `2` | $2$ | $2$ | `[2, 2]` (Leaf singleton) |
| `3` | $3$ | $5$ | `[3, 5]` (Nodes 3, 4, 5) |
| `4` | $4$ | $4$ | `[4, 4]` (Leaf singleton) |
| `5` | $5$ | $5$ | `[5, 5]` (Leaf singleton) |

```text
Flattened Sequence: [ Node 1,  Node 2,  Node 3,  Node 4,  Node 5 ]
Subtree of Node 3:  Range [ 3 ... 5 ] covers { 3, 4, 5 }!
Converts tree subtree sums into 1D Fenwick / Segment Tree queries!
```

> [!TIP]
> Euler Tour flattening maps hierarchical subtree queries into contiguous 1D range queries $[T_{\text{in}}[u], T_{\text{out}}[u]]$, enabling $O(\log N)$ subtree range updates via Segment Trees.

This completes the Tree Breadth-First Search chapter, covering level snapshots, zigzag traversals, exterior/vertical projections, radial distance-K searches, string serializations, and Euler Tour interval mappings.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear time to serialize, deserialize, and flatten.
- **Auxiliary Space:** $\Theta(N)$ token strings, queues, and timestamp arrays.

---


## Cheat Sheet & Quick Reference

| BFS Technique | Primary Mechanism | Core Invariant / Formula | Complexity |
| :--- | :--- | :--- | :--- |
| **Level Order Snapshot** | Queue size capture | `sz = q.size(); for(i=0; i<sz; ++i)` | $\Theta(N)$ / $O(W)$ Space |
| **Zigzag Traversal** | Parity index assign | `level[LtoR ? i : sz - 1 - i] = val` | $\Theta(N)$ / $O(W)$ Space |
| **Left / Right View** | First / Last tier node | First node `i == 0` / Last node `i == sz - 1` | $\Theta(N)$ / $O(W)$ Space |
| **Top / Bottom View** | Horizontal column hash | Top: First in col / Bottom: Overwrite col | $O(N \log W)$ / $O(W)$ Space |
| **Vertical Traversal** | 2D Coordinate Grid | Left: `(r+1, c-1)`, Right: `(r+1, c+1)` | $O(N \log N)$ / $O(N)$ Space |
| **Radial Distance-K** | Graph parent mapping | Radial BFS outward from target in 3 paths | $\Theta(N)$ / $O(N)$ Space |
| **Tree Serialization** | BFS token stream | Level-order CSV with `'X'` sentinels | $\Theta(N)$ / $O(N)$ Space |
| **Euler Tour Indexing** | DFS entry/exit timer | Subtree span $= [T_{\text{in}}[u], T_{\text{out}}[u]]$ | $\Theta(N)$ / $O(N)$ Space |
