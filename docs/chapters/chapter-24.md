# Chapter 24: Binary Search Trees

---

## BST Architecture & Core Mutations

### Binary Search Tree Invariants — Search & Insertion Mechanics

Let's stand at the whiteboard and formalize the core invariant that defines a Binary Search Tree (BST): for every node $u$, all keys in its left subtree are strictly smaller, and all keys in its right subtree are strictly larger.

Because of this ordering invariant, performing an Inorder traversal on a BST yields keys in strictly non-decreasing sorted numerical order.

```text
                              [ 8 ]
                            /       \
                        [ 3 ]       [ 10 ]
                       /     \            \
                     [ 1 ]   [ 6 ]        [ 14 ]

All keys in Left Subtree of 8 are < 8; Right Subtree keys are > 8.
Inorder Traversal: [ 1, 3, 6, 8, 10, 14 ] (Sorted Ascending!)
```

Searching or inserting a key follows a single downward branch path, halving the remaining search space at each comparison on a balanced tree.

$$\text{Balanced BST: } T(N) = O(\log N), \quad \text{Degenerate Skewed BST: } T(N) = O(N)$$

Let's implement both recursive and iterative search and insertion routines in C++.

```cpp
// Search and Insertion in BST: O(H) Time
struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

TreeNode* search_bst(TreeNode* root, int val) {
    while (root && root->val != val) {
        root = (val < root->val) ? root->left : root->right;
    }
    return root;
}

TreeNode* insert_into_bst(TreeNode* root, int val) {
    if (!root) return new TreeNode(val);
    TreeNode* curr = root;

    while (true) {
        if (val < curr->val) {
            if (!curr->left) {
                curr->left = new TreeNode(val);
                break;
            }
            curr = curr->left;
        } else {
            if (!curr->right) {
                curr->right = new TreeNode(val);
                break;
            }
            curr = curr->right;
        }
    }
    return root;
}
```

| Traversal Step | Node Key | Target Key | Comparison | Branching Direction |
| :--- | :--- | :--- | :--- | :--- |
| Step 0 | `8` (Root) | `6` | $6 < 8$ | Branch Left |
| Step 1 | `3` | `6` | $6 > 3$ | Branch Right |
| Step 2 | `6` | `6` | $6 == 6$ | **Target Found!** |

```text
Inserting 7 into tree above:
7 < 8 (Go Left to 3) -> 7 > 3 (Go Right to 6) -> 7 > 6 (Go Right)
Right child of 6 is null -> Attach new TreeNode(7) at 6->right!
```

> [!WARNING]
> Inserting sorted or nearly-sorted data into a naive unbalanced BST creates a degenerate, linked-list-like chain with $O(N)$ height and search time.

Let's now examine structural node deletion and two-child successor splicing.

#### Complexity Analysis
- **Time Complexity:** $O(H) = O(\log N)$ on balanced BST; $O(N)$ on degenerate skewed tree.
- **Auxiliary Space:** $O(1)$ auxiliary space for iterative implementations.

---

### Node Deletion Invariants & Two-Child Successor Splicing

Deleting a node from a BST must preserve the binary search ordering across all subtrees, dividing into three distinct structural cases.

If the node is a leaf, delete it immediately; if it has a single child, bypass the node to its child; if it has two children, replace it with its Inorder Successor.

```text
Deleting Node [ 3 ] (Has two children: Left 1, Right 6):
1. Find Inorder Successor: Leftmost node in Right Subtree = [ 4 ]
2. Copy successor value 4 into target node: [ 3 ] becomes [ 4 ]
3. Recursively delete original successor node [ 4 ] from right subtree
```

The Inorder Successor is the smallest key in the target node's right subtree.

$$\text{Successor}(u) = \text{argmin}_{v \in \text{Subtree}(u.R)} v.\text{val} \quad (\text{leftmost node in } u.R)$$

Let's implement the complete `deleteNode` function with memory deallocation.

```cpp
// BST Node Deletion: O(H) Time, O(H) Call Stack Space
TreeNode* find_min(TreeNode* node) {
    while (node && node->left) node = node->left;
    return node;
}

TreeNode* delete_node_bst(TreeNode* root, int key) {
    if (!root) return nullptr;

    if (key < root->val) {
        root->left = delete_node_bst(root->left, key);
    } else if (key > root->val) {
        root->right = delete_node_bst(root->right, key);
    } else {
        // Case 1 & 2: 0 or 1 child
        if (!root->left) {
            TreeNode* temp = root->right;
            delete root;
            return temp;
        } else if (!root->right) {
            TreeNode* temp = root->left;
            delete root;
            return temp;
        }

        // Case 3: 2 children -> Replace with Inorder Successor
        TreeNode* successor = find_min(root->right);
        root->val = successor->val; // Copy successor value
        root->right = delete_node_bst(root->right, successor->val);
    }
    return root;
}
```

| Deletion Case | Target Node State | Action Taken | Resulting Pointer |
| :--- | :--- | :--- | :--- |
| **0 Children (Leaf)** | `left == null && right == null` | Deallocate immediately | Return `nullptr` to parent |
| **1 Child** | One child is `nullptr` | Bypass to existing child | Return non-null child |
| **2 Children** | Both children present | Copy successor value, delete successor | Root retains balanced structure |

```text
Successor is guaranteed to have at most ONE child (Right child)!
Deleting the successor reduces Case 3 to Case 1 or Case 2 seamlessly.
```

> [!IMPORTANT]
> Copy the successor's data value into the target node, then delete the successor node from the right subtree. This preserves all incoming parent pointers without pointer rewiring bugs.

Let's now examine range queries, floor/ceil lookups, and branch pruning.

#### Complexity Analysis
- **Time Complexity:** $O(H)$ time to locate and splice nodes.
- **Auxiliary Space:** $O(H)$ recursion stack frames.

---

## BST Range & Position Queries

### Range Queries — Floor, Ceil, Range Sum & Successor Hunting

BST range queries exploit ordering to prune entire subtrees that cannot contain relevant values: if `root->val < low`, prune the entire left subtree; if `root->val > high`, prune the right subtree.

Floor finds the largest key in the BST $\le K$, while Ceil finds the smallest key in the BST $\ge K$.

```text
BST Keys: { 2, 4, 8, 10, 12 },  Target K = 7
Floor(7) = 4  (Largest key <= 7)
Ceil(7)  = 8  (Smallest key >= 7)
Both found in O(H) time by caching candidate nodes during descent!
```

The range sum pruning invariant skips subtrees outside the query interval $[L, R]$.

$$\text{RangeSum}(u, L, R) = \begin{cases} \text{RangeSum}(u.R, L, R) & \text{if } u.\text{val} < L \\ \text{RangeSum}(u.L, L, R) & \text{if } u.\text{val} > R \\ u.\text{val} + \text{RangeSum}(u.L) + \text{RangeSum}(u.R) & \text{otherwise} \end{cases}$$

Let's implement Floor, Ceil, Inorder Successor, and pruned Range Sum in C++.

```cpp
// Floor, Ceil, Inorder Successor & Pruned Range Sum
int find_floor(TreeNode* root, int key) {
    int floor_val = -1;
    while (root) {
        if (root->val == key) return root->val;
        if (root->val < key) {
            floor_val = root->val; // Candidate floor
            root = root->right;
        } else {
            root = root->left;
        }
    }
    return floor_val;
}

int find_ceil(TreeNode* root, int key) {
    int ceil_val = -1;
    while (root) {
        if (root->val == key) return root->val;
        if (root->val > key) {
            ceil_val = root->val; // Candidate ceil
            root = root->left;
        } else {
            root = root->right;
        }
    }
    return ceil_val;
}

int range_sum_bst(TreeNode* root, int low, int high) {
    if (!root) return 0;
    if (root->val < low) return range_sum_bst(root->right, low, high);   // Prune left
    if (root->val > high) return range_sum_bst(root->left, low, high);   // Prune right
    return root->val + range_sum_bst(root->left, low, high) 
                     + range_sum_bst(root->right, low, high);
}
```

| Node Val | Target Interval $[7, 15]$ | Action Taken | Pruned Branch | Accumulated Sum |
| :--- | :--- | :--- | :--- | :--- |
| `10` (Root) | $7 \le 10 \le 15$ | Include $10$, visit both | None | $+10$ |
| `5` (Left) | $5 < 7$ | Prune left child | Left subtree of 5 pruned | $+0$ |
| `15` (Right) | $7 \le 15 \le 15$ | Include $15$, visit left | Right subtree of 15 pruned | $+15$ (Total 25) |

```text
Node 5 is < 7 -> All nodes in 5's left subtree are < 5 < 7!
Entire left branch discarded in O(1) comparison!
```

> [!TIP]
> Pruning subtrees outside $[L, R]$ reduces Range Sum BST runtime from $O(N)$ to $O(K + H)$, where $K$ is the count of nodes inside the interval.

Let's now examine BST structural validation and in-place recovery of swapped nodes.

#### Complexity Analysis
- **Time Complexity:** $O(H)$ for Floor/Ceil; $O(K + H)$ for pruned Range Sum.
- **Auxiliary Space:** $O(1)$ for iterative floor/ceil; $O(H)$ stack for range sum.

---

## BST Validation, Conversions & Recoveries

### BST Structural Validation, Inorder Recovery & Reconstructions

Validating a BST requires checking that every node satisfies global range constraints $(-\infty, +\infty)$ propagated down from ancestor nodes, rather than checking only immediate children.

If two nodes in a BST are accidentally swapped, an Inorder traversal will reveal one or two inverted pairs, which can be swapped back in $O(N)$ time.

```text
                [ 10 ]  Bounds: (-inf, +inf)
               /      \
[ 5 ] (-inf, 10)      [ 15 ] (10, +inf)
      /    \
( -inf, 5) ( 5, 10 ) <--- Right child of 5 MUST be in (5, 10)!
```

The mathematical validation invariant narrows bounding intervals recursively at each branch.

$$\text{isValid}(u, L, R) \iff L < u.\text{val} < R \land \text{isValid}(u.L, L, u.\text{val}) \land \text{isValid}(u.R, u.\text{val}, R)$$

Let's implement BST validation with 64-bit integer bounds alongside in-place Recover BST.

```cpp
// BST Validation & In-Place Swapped Node Recovery
bool validate_bst_helper(TreeNode* root, long long low, long long high) {
    if (!root) return true;
    if (root->val <= low || root->val >= high) return false;
    return validate_bst_helper(root->left, low, root->val) 
        && validate_bst_helper(root->right, root->val, high);
}

bool is_valid_bst(TreeNode* root) {
    return validate_bst_helper(root, -1e18, 1e18);
}

class RecoverBST {
    TreeNode *first = nullptr, *prev = nullptr, *second = nullptr;

    void inorder(TreeNode* curr) {
        if (!curr) return;
        inorder(curr->left);

        // Detect out-of-order Inorder anomaly
        if (prev && curr->val < prev->val) {
            if (!first) first = prev;
            second = curr;
        }
        prev = curr;

        inorder(curr->right);
    }
public:
    void recover_tree(TreeNode* root) {
        inorder(root);
        if (first && second) swap(first->val, second->val);
    }
};
```

| Inorder Traversal State | Values Visited | Anomaly Detected | Node Recorded |
| :--- | :--- | :--- | :--- |
| Sorted Target | `[ 1, 2, 3, 4, 5 ]` | None | - |
| Swapped Nodes 1 and 4 | `[ 4, 2, 3, 1, 5 ]` | First: $4 > 2$ | `first = Node(4)` |
| Second Inversion | `[ 4, 2, 3, 1, 5 ]` | Second: $3 > 1$ | `second = Node(1)` |

```text
Swapping first->val and second->val restores valid sorted ordering:
[ 4, 2, 3, 1, 5 ] ===> [ 1, 2, 3, 4, 5 ]
```

> [!CAUTION]
> Always use 64-bit `long long` bounds ($[-10^{18}, 10^{18}]$) for validation. Using `INT_MIN` / `INT_MAX` fails when a tree node legitimately holds `INT_MIN` or `INT_MAX`.

Let's now study $K$-th order statistics and constructing BSTs from preorder traversals.

#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear time.
- **Auxiliary Space:** $O(H)$ recursion call stack memory.

---

### K-th Smallest / Largest Element & Preorder Reconstructions

Because an Inorder traversal visits nodes in ascending sorted order, finding the $K$-th smallest element requires stepping through the Inorder sequence and terminating when counter reaches $K$.

Constructing a BST from its Preorder traversal can be completed in $O(N)$ time by passing an upper bound constraint downward during reconstruction.

```text
Inorder Stream: [ 1,  2,  3,  4,  5,  6 ]
Target K = 3  :   ^   ^   ^
                  1   2   3 ===> Found 3rd smallest = 3!
Terminate traversal immediately without visiting remaining nodes!
```

Constructing a BST from preorder uses an upper bound constraint to decide whether each incoming value belongs in the current subtree.

$$\text{Build Invariant: } \text{If } \text{idx} < N \land \text{preorder}[\text{idx}] < \text{upper\_bound} \implies \text{Node belongs in subtree}$$

Let's implement the $K$-th smallest finder alongside $O(N)$ Preorder reconstruction.

```cpp
// K-th Smallest in BST & O(N) Preorder BST Construction
int kth_smallest_helper(TreeNode* root, int& k) {
    if (!root) return -1;
    int left = kth_smallest_helper(root->left, k);
    if (left != -1) return left;

    k--;
    if (k == 0) return root->val; // K-th smallest node reached

    return kth_smallest_helper(root->right, k);
}

int kth_smallest(TreeNode* root, int k) {
    return kth_smallest_helper(root, k);
}

TreeNode* bst_from_preorder_helper(const vector<int>& preorder, int& idx, int upper_bound) {
    if (idx >= preorder.size() || preorder[idx] > upper_bound) {
        return nullptr;
    }

    TreeNode* root = new TreeNode(preorder[idx++]);
    root->left = bst_from_preorder_helper(preorder, idx, root->val);
    root->right = bst_from_preorder_helper(preorder, idx, upper_bound);
    return root;
}

TreeNode* bst_from_preorder(const vector<int>& preorder) {
    int idx = 0;
    return bst_from_preorder_helper(preorder, idx, 1e9);
}
```

| Preorder Value | Current Upper Bound | Valid for Subtree? | Attachment Location |
| :--- | :--- | :--- | :--- |
| `8` | $\infty$ | **Yes** | Root of tree |
| `5` | $8$ | **Yes** | Left child of `8` |
| `1` | $5$ | **Yes** | Left child of `5` |
| `7` | $5$ | **No ($7 > 5$)** | Return to right child of `5` with bound $8$ |

```text
Preorder: [ 8, 5, 1, 7, 10, 12 ]
Build 8 -> Left bound 8 (Build 5 -> Left bound 5 (Build 1))
Value 7 > 5 -> Placed at 5->right (Bound 8)
Linear O(N) single-pass tree construction!
```

> [!TIP]
> Constructing a BST from preorder using upper bounds runs in $O(N)$ time with a single index pointer, vastly outperforming repeated insertion which takes $O(N \log N)$ or $O(N^2)$.

Let's now examine self-balancing AVL Trees and tree rotations.

#### Complexity Analysis
- **Time Complexity:** $O(H + K)$ for $K$-th smallest; $\Theta(N)$ for preorder construction.
- **Auxiliary Space:** $O(H)$ recursion call stack memory.

---

## Self-Balancing BSTs & Rotations

### Self-Balancing BSTs — AVL Rotations & Balance Factors

An AVL Tree is a strictly self-balancing BST where the Balance Factor $\text{BF}(u) = \text{height}(u_L) - \text{height}(u_R)$ is maintained within $\{-1, 0, +1\}$ at all times.

Whenever an insertion or deletion causes $|\text{BF}(u)| > 1$, we restore balance in $O(1)$ time using one of four rotation cases: Left-Left (LL), Right-Right (RR), Left-Right (LR), or Right-Left (RL).

```text
Before Rotation (Imbalance at z):        After Right Rotation:
            [ z ]                                 [ y ]
           /     \                               /     \
        [ y ]    [ T3 ]      =====>           [ x ]   [ z ]
       /     \                               /     \ /     \
     [ x ]   [ T2 ]                        [T1]  [T2][T3]  [T4]
```

The AVL balance invariant guarantees that tree height never exceeds $1.44 \log_2 N$.

$$\text{AVL Height Bound: } H < 1.44 \log_2(N + 2) \implies \text{Guaranteed } O(\log N) \text{ Operations}$$

Let's implement the four AVL rotation cases and self-balancing insertion in C++.

```cpp
// AVL Tree Self-Balancing Insertion: Guaranteed O(log N)
struct AVLNode {
    int val, height;
    AVLNode *left, *right;
    AVLNode(int k) : val(k), height(1), left(nullptr), right(nullptr) {}
};

int get_height(AVLNode* n) { return n ? n->height : 0; }
int get_balance(AVLNode* n) { return n ? get_height(n->left) - get_height(n->right) : 0; }

AVLNode* right_rotate(AVLNode* y) {
    AVLNode* x = y->left;
    AVLNode* T2 = x->right;
    x->right = y;
    y->left = T2;
    y->height = max(get_height(y->left), get_height(y->right)) + 1;
    x->height = max(get_height(x->left), get_height(x->right)) + 1;
    return x;
}

AVLNode* left_rotate(AVLNode* x) {
    AVLNode* y = x->right;
    AVLNode* T2 = y->left;
    y->left = x;
    x->right = T2;
    x->height = max(get_height(x->left), get_height(x->right)) + 1;
    y->height = max(get_height(y->left), get_height(y->right)) + 1;
    return y;
}

AVLNode* insert_avl(AVLNode* node, int key) {
    if (!node) return new AVLNode(key);
    if (key < node->val) node->left = insert_avl(node->left, key);
    else if (key > node->val) node->right = insert_avl(node->right, key);
    else return node;

    node->height = 1 + max(get_height(node->left), get_height(node->right));
    int balance = get_balance(node);

    // 4 Rotation Cases
    if (balance > 1 && key < node->left->val) return right_rotate(node); // LL
    if (balance < -1 && key > node->right->val) return left_rotate(node); // RR
    if (balance > 1 && key > node->left->val) { // LR
        node->left = left_rotate(node->left);
        return right_rotate(node);
    }
    if (balance < -1 && key < node->right->val) { // RL
        node->right = right_rotate(node->right);
        return left_rotate(node);
    }
    return node;
}
```

| Imbalance Case | Balance Factor | Child Key Comparison | Rotation Applied |
| :--- | :--- | :--- | :--- |
| **Left-Left (LL)** | $\text{BF} > 1$ | $\text{key} < \text{node.left.val}$ | Single Right Rotate (`right_rotate(node)`) |
| **Right-Right (RR)** | $\text{BF} < -1$ | $\text{key} > \text{node.right.val}$ | Single Left Rotate (`left_rotate(node)`) |
| **Left-Right (LR)** | $\text{BF} > 1$ | $\text{key} > \text{node.left.val}$ | Double Rotate: Left Rotate child, then Right Rotate node |
| **Right-Left (RL)** | $\text{BF} < -1$ | $\text{key} < \text{node.right.val}$ | Double Rotate: Right Rotate child, then Left Rotate node |

```text
Step 1: Left Rotate on left child -> Transforms LR into LL
Step 2: Right Rotate on parent     -> Restores balanced tree height
```

> [!IMPORTANT]
> In Double Rotations (LR and RL), always perform the rotation on the child node first before executing the counter-rotation on the parent node.

Let's now examine Red-Black Trees and C++ STL associative containers.

#### Complexity Analysis
- **Time Complexity:** $O(\log N)$ guaranteed worst-case for search, insert, and delete.
- **Auxiliary Space:** $O(\log N)$ recursion stack space.

---

### Red-Black Trees & C++ STL Associative Containers

Red-Black Trees are self-balancing BSTs that use node color bits (Red / Black) and relaxed height constraints to reduce the number of rotations needed during insertions and deletions.

The 5 Red-Black Invariants guarantee that the longest path from the root to any leaf is at most twice as long as the shortest path, ensuring $O(\log N)$ operations.

```text
1. Every node is either RED or BLACK.
2. The ROOT is always BLACK.
3. All LEAVES (NIL sentinels) are BLACK.
4. If a node is RED, both of its children must be BLACK (No Red-Red).
5. Every path from root to NIL leaf has the SAME count of Black nodes.
```

Because of invariant 5, the tree height is strictly bounded by $2 \log_2(N + 1)$.

$$\text{Red-Black Height Bound: } H \le 2 \log_2(N + 1) \implies O(\log N) \text{ Operations}$$

In C++, associative containers `set`, `map`, `multiset`, and `multimap` are implemented using Red-Black Trees.

```cpp
// C++ STL Set & Map Usage (Underlying Red-Black Tree)
struct CustomKey {
    int id;
    string category;
    bool operator<(const CustomKey& other) const {
        return (id != other.id) ? (id < other.id) : (category < other.category);
    }
};

void demonstrate_rb_tree_containers() {
    set<int> rb_set = {10, 20, 30, 40, 50};

    // Range Queries in O(log N) Time
    auto lb = rb_set.lower_bound(25); // Points to 30 (>= 25)
    auto ub = rb_set.upper_bound(40); // Points to 50 (> 40)

    // Iterating in O(1) amortized step time
    for (auto it = lb; it != ub; ++it) {
        // Visits 30 and 40 in sorted order
    }
}
```

| Feature | AVL Tree | Red-Black Tree (`set` / `map`) |
| :--- | :--- | :--- |
| **Height Bound** | Strictly $1.44 \log_2 N$ | Relaxed $2.0 \log_2 N$ |
| **Lookup Speed** | Faster (Tighter height) | Slightly slower |
| **Insertion / Deletion** | More rotations | Faster (Fewer rotations: at most 2 for insert) |
| **Real-World Usage** | Read-intensive lookups | General-purpose STL containers and Linux kernel |

```text
Shortest Path: Root --Black--> Node --Black--> NIL (Len = 2)
Longest Path : Root --Black--> Red --Black--> Red --Black (Len = 4)
Longest path <= 2 * Shortest path ===> Guarantees logarithmic bounds!
```

> [!TIP]
> Iterators in `set` and `map` perform $O(1)$ amortized Inorder stepping (`++it`) using internal parent pointers stored in each Red-Black tree node.

Let's now conclude with storage engine indexing, B-Trees, and LSM-Trees.

#### Complexity Analysis
- **Time Complexity:** $O(\log N)$ for search, insertion, and deletion.
- **Auxiliary Space:** $O(N)$ memory storing color flags and tree node pointers.

---

## Storage Indexing & Distributed Structures

### System Design & Storage Indexing — B-Trees & LSM-Trees

When data exceeds RAM capacity and resides on disk, binary search trees fail because fetching a single node requires a slow random disk I/O seek ($10\text{ ms}$).

B-Trees and B+ Trees solve this with wide branching factors ($M \approx 1000$) matching hardware page sizes (4KB / 8KB), reducing disk seeks from $30$ down to $3$.

```text
Internal Nodes (Page size = 4KB, M = 1000 keys):
[ Key 100 | Key 200 | Key 300 ] -> Routes traffic to children pages

Leaf Nodes (Linked horizontally for O(1) range scans):
[ Page 1: 1..99 ] <===> [ Page 2: 100..199 ] <===> [ Page 3: 200..299]
```

A B+ Tree reduces disk seeks exponentially compared to binary trees.

$$\text{Disk Seeks} = \log_M N \ll \log_2 N \quad (\text{for } 10^9 \text{ rows: } \log_{1000} 10^9 = 3 \text{ seeks vs } \log_2 10^9 \approx 30 \text{ seeks})$$

Log-Structured Merge-Trees (LSM-Trees) optimize for write-heavy workloads by buffering writes in an in-memory `MemTable` (Red-Black tree) before appending sequentially to disk `SSTables`.

```cpp
// Simulated B-Tree Node Structure for Page-Aligned Storage
template <int M> // M is branching degree (e.g. 1024)
struct BTreeNode {
    int num_keys;
    int keys[M - 1];
    BTreeNode* children[M];
    bool is_leaf;

    int find_key_index(int k) {
        int idx = 0;
        while (idx < num_keys && keys[idx] < k) ++idx;
        return idx;
    }
};
```

| Indexing Engine | Primary Optimization | Point Read Latency | Write Throughput | Production System |
| :--- | :--- | :--- | :--- | :--- |
| **B+ Tree** | Read-Heavy & Range Scans | $O(\log_M N)$ ($\approx 3$ seeks) | Slower (Random page writes) | MySQL InnoDB, PostgreSQL |
| **LSM-Tree** | Write-Heavy Ingestion | Slower (Multiple SSTables) | Exceptional (Sequential writes)| RocksDB, Apache Cassandra |

```text
Write -> Append to WAL (Disk log) -> Insert into MemTable (RAM RB-Tree)
When MemTable fills -> Flush sequentially to SSTable Level 0 (Disk)
Background Compaction -> Merges and deduplicates SSTables into Level 1
```

> [!IMPORTANT]
> B+ Trees optimize for point and range reads through shallow, page-aligned tree depth; LSM-Trees maximize write throughput by converting random writes into sequential disk flushes.

This completes the Binary Search Trees chapter, covering BST mutations, range queries, structural recoveries, order statistics, AVL/Red-Black balancing, and database B-Tree/LSM storage engines.

#### Complexity Analysis
- **Time Complexity:** $O(\log_M N)$ for B+ Tree disk reads; $O(1)$ amortized for LSM-Tree RAM writes.
- **Auxiliary Space:** $O(N)$ page-aligned storage buffers.

---

## Cheat Sheet & Quick Reference

| BST Concept / Structure | Key Principle | Core Invariant / Method | Complexity |
| :--- | :--- | :--- | :--- |
| **Standard BST** | Left $<$ Root $<$ Right | Inorder traversal yields sorted order | $O(H)$ / $O(1)$ Space |
| **Node Deletion** | 2-Child replacement | Copy Inorder Successor; delete successor node | $O(H)$ / $O(H)$ Stack |
| **Range Sum Pruning** | Interval checks | Prune left if $u < L$; prune right if $u > R$ | $O(K + H)$ / $O(H)$ |
| **BST Validation** | Global bounds | Propagate `(low, high)` range down recursion | $\Theta(N)$ / $O(H)$ Space |
| **Preorder to BST** | Upper-bound bounds | Attach node if `val < upper_bound` | $\Theta(N)$ / $O(H)$ Space |
| **AVL Tree** | Strict balance | $|\text{BF}| \le 1$; 4 rotation cases (LL, RR, LR, RL) | Guaranteed $O(\log N)$ |
| **Red-Black Tree** | Relaxed color balancing | Black-height equality; used in `set`/`map` | Guaranteed $O(\log N)$ |
| **B+ Tree** | High-branching disk index| Node size matches hardware 4KB/8KB disk page | $O(\log_M N)$ Disk Seeks |
| **LSM-Tree** | Sequential append writes | MemTable (RAM) $\to$ SSTable flush $\to$ Compaction | $O(1)$ RAM writes |
