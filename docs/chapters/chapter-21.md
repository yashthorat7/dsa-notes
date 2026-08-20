# Chapter 21: Binary Trees & DFS

---


## Tree Topologies & Structural Properties


### Node Representations & Structural Symmetry Predicates

Let's stand at the whiteboard and establish the core definitions of tree topologies: Root (entry node), Leaves (nodes with zero children), Depth (edges from root), and Height (edges to deepest leaf).

A binary tree is Height-Balanced if for every node in the tree, the absolute difference between the heights of its left and right subtrees is at most $1$.

```text
Symmetric Mirror Tree:           Asymmetric Tree:
          [ 1 ]                             [ 1 ]
         /     \                           /     \
      [ 2 ]   [ 2 ]                     [ 2 ]   [ 2 ]
      /   \   /   \                       \       \
    [3]  [4] [4]  [3]                     [3]     [3]
Left mirror reflection of right!   Subtrees fail mirror reflection.
```

The mathematical predicate ensures that height balance is maintained recursively at every interior node.

$$\text{isBalanced}(u) \iff |\text{height}(u.L) - \text{height}(u.R)| \le 1 \land \text{isBalanced}(u.L) \land \text{isBalanced}(u.R)$$

Let's write `TreeNode` structs and the optimal $O(N)$ bottom-up height balance checker.

```cpp
// Binary Tree Node & O(N) Bottom-Up Balance Checker
struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

int check_height(TreeNode* root) {
    if (!root) return 0;

    int left_h = check_height(root->left);
    if (left_h == -1) return -1; // Left subtree is unbalanced

    int right_h = check_height(root->right);
    if (right_h == -1) return -1; // Right subtree is unbalanced

    if (abs(left_h - right_h) > 1) return -1; // Current node unbalanced

    return max(left_h, right_h) + 1;
}

bool is_balanced(TreeNode* root) {
    return check_height(root) != -1;
}
```

Now let's implement the Symmetric Mirror Tree validation routine.

```cpp
// Symmetric (Mirror) Tree Checker: O(N) Time, O(H) Space
bool is_mirror(TreeNode* t1, TreeNode* t2) {
    if (!t1 && !t2) return true;
    if (!t1 || !t2) return false;
    return (t1->val == t2->val) 
        && is_mirror(t1->left, t2->right) 
        && is_mirror(t1->right, t2->left);
}

bool is_symmetric(TreeNode* root) {
    return !root || is_mirror(root->left, root->right);
}
```

| Tree Classification | Node Count Formula (Height $H$) | Height Bounds ($N$ Nodes) | Structural Invariant |
| :--- | :--- | :--- | :--- |
| **Full Binary Tree** | $N = 2L - 1$ | $\log_2(N+1) \le H \le \frac{N+1}{2}$ | Every node has 0 or 2 children |
| **Complete Tree** | $2^H \le N < 2^{H+1}$ | $H = \lfloor \log_2 N \rfloor$ | All levels full except possibly last (left-aligned) |
| **Perfect Tree** | $N = 2^{H+1} - 1$ | $H = \log_2(N+1) - 1$ | All interior nodes have 2 children, leaves at same depth |
| **Degenerate Tree** | $N = H + 1$ | $H = N - 1$ | Every node has exactly 1 child (Skewed list) |

```text
Balanced Tree (H = log2 N):           Degenerate Skewed (H = N):
            (1)                               (1)
          /     \                               \
        (2)     (3)                             (2)
       /   \   /   \                              \
     (4)  (5) (6)  (7)                            (3) -> Search O(N)
Search Complexity: O(log N)
```

> [!IMPORTANT]
> Always guard recursive tree functions with null pointer checks (`if (!root) return ...;`) as the primary base case to avoid segmentation faults.

Let's now examine geometry, diameter, and complete tree node counting.

> [!WARNING]
> Top-down balance checking calculates `height(node)` repeatedly at every level, causing $O(N^2)$ time. Always use the bottom-up approach returning `-1` on imbalance to achieve $O(N)$ time.

Let's now examine depth-first search traversals and stack-based implementations.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ visiting each node once.
- **Auxiliary Space:** $O(H)$ recursion call stack memory, where $H$ is the tree height.

---


## Depth-First Search Traversals & Path Scans


### DFS Traversal Axioms — Preorder, Inorder, Postorder & Iterative Stacks

Depth-First Search (DFS) explores tree nodes along three canonical traversal orders: Preorder (Root-Left-Right), Inorder (Left-Root-Right), and Postorder (Left-Right-Root).

On a Binary Search Tree (BST), Inorder traversal visits elements in strictly non-decreasing sorted numerical order.

```text
Trace the outer boundary perimeter of the tree:
- Visit Left side of node   ---> PREORDER  (Root, Left, Right)
- Visit Bottom of node      ---> INORDER   (Left, Root, Right)
- Visit Right side of node  ---> POSTORDER (Left, Right, Root)
```

All three traversal paradigms visit all $N$ nodes in linear time with recursion stack depth bounded by tree height $H$.

$$\text{Time Complexity} = \Theta(N), \quad \text{Call Stack Space} = O(H)$$

Let's implement recursive traversals alongside the iterative stack-based Inorder traversal.

```cpp
// Recursive & Iterative DFS Traversals
void inorder_recursive(TreeNode* root, vector<int>& res) {
    if (!root) return;
    inorder_recursive(root->left, res);
    res.push_back(root->val);
    inorder_recursive(root->right, res);
}

vector<int> inorder_iterative(TreeNode* root) {
    vector<int> result;
    stack<TreeNode*> st;
    TreeNode* curr = root;

    while (curr || !st.empty()) {
        // Step 1: Reach the leftmost node of the current subtree
        while (curr) {
            st.push(curr);
            curr = curr->left;
        }
        // Step 2: Visit root and move to right child
        curr = st.top();
        st.pop();
        result.push_back(curr->val);
        curr = curr->right;
    }
    return result;
}
```

Now let's examine the 1-stack iterative Postorder traversal using a `last_visited` pointer.

```cpp
// Iterative Postorder Traversal using 1 Stack: O(N) Time, O(H) Space
vector<int> postorder_iterative(TreeNode* root) {
    vector<int> result;
    stack<TreeNode*> st;
    TreeNode *curr = root, *last_visited = nullptr;

    while (curr || !st.empty()) {
        if (curr) {
            st.push(curr);
            curr = curr->left;
        } else {
            TreeNode* peek = st.top();
            if (peek->right && last_visited != peek->right) {
                curr = peek->right; // Move down right subtree
            } else {
                result.push_back(peek->val);
                last_visited = peek;
                st.pop();
            }
        }
    }
    return result;
}
```

| Traversal Type | Node Processing Order | Primary Use Case | Output on Tree `[1, 2, 3]` |
| :--- | :--- | :--- | :--- |
| **Preorder** | Root $\to$ Left $\to$ Right | Serialization / Copying | `[1, 2, 3]` |
| **Inorder** | Left $\to$ Root $\to$ Right | BST Sorted Extraction | `[2, 1, 3]` |
| **Postorder** | Left $\to$ Right $\to$ Root | Deletion / Bottom-Up DP | `[2, 3, 1]` |

```text
Tree:       [ 1 ]           Stack pushes: [1] -> [1, 2]
           /     \          Pop 2 -> Output: [2] -> Move right (null)
        [ 2 ]   [ 3 ]       Pop 1 -> Output: [2, 1] -> Move right: [3]
                            Pop 3 -> Output: [2, 1, 3]
```

> [!TIP]
> Postorder traversal processes child subtrees before visiting their parent, making it the required vehicle for memory deallocation and bottom-up tree dynamic programming.

Let's now examine root-to-leaf path tracking and backtracking search.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ visiting every node exactly once.
- **Auxiliary Space:** $O(H)$ stack frames, where $H$ is the tree height.

---


### Root-to-Leaf Path Aggregations & Backtracking Path Scans

Path aggregation passes running state downward along recursion and backtracks upon return, allowing us to find specific paths or aggregate leaf statistics.

A valid root-to-leaf path begins at the tree root and terminates strictly at a leaf node (`left == nullptr && right == nullptr`).

```text
Path Vector: Push node on entry, pop_back() on exit.
Root (5) -> [ 5 ]
Left (4) -> [ 5, 4 ]
Left (11) -> [ 5, 4, 11 ]
Leaf (2) -> [ 5, 4, 11, 2 ] -> Sum = 22 == Target! Record path!
Backtrack -> Pop 2 -> [ 5, 4, 11 ]
```

The mathematical recurrence verifies whether a target path sum exists.

$$\text{hasPathSum}(u, S) \iff (u \text{ is leaf} \land u.\text{val} == S) \lor \text{hasPathSum}(u.L, S - u.\text{val}) \lor \text{hasPathSum}(u.R, S - u.\text{val})$$

Let's write Path Sum verification and decimal digit root-to-leaf accumulation.

```cpp
// Path Sum Validation & Decimal Digit Path Accumulator
bool has_path_sum(TreeNode* root, int target_sum) {
    if (!root) return false;
    if (!root->left && !root->right) {
        return root->val == target_sum;
    }
    return has_path_sum(root->left, target_sum - root->val) 
        || has_path_sum(root->right, target_sum - root->val);
}

void collect_all_paths(TreeNode* root, int sum, vector<int>& path, vector<vector<int>>& all_paths) {
    if (!root) return;
    path.push_back(root->val);

    if (!root->left && !root->right && root->val == sum) {
        all_paths.push_back(path);
    }
    collect_all_paths(root->left, sum - root->val, path, all_paths);
    collect_all_paths(root->right, sum - root->val, path, all_paths);

    path.pop_back(); // Backtrack step
}

int sum_numbers_helper(TreeNode* root, int current_val) {
    if (!root) return 0;
    current_val = current_val * 10 + root->val;
    if (!root->left && !root->right) return current_val;
    return sum_numbers_helper(root->left, current_val) 
         + sum_numbers_helper(root->right, current_val);
}

int sum_root_to_leaf_numbers(TreeNode* root) {
    return sum_numbers_helper(root, 0);
}
```

| Node Visited | Path State | Current Target Remaining | Leaf Reached? | Action Taken |
| :--- | :--- | :--- | :--- | :--- |
| `5` (Root) | `[5]` | $22 - 5 = 17$ | No | Recur left |
| `4` | `[5, 4]` | $17 - 4 = 13$ | No | Recur left |
| `11` | `[5, 4, 11]` | $13 - 11 = 2$ | No | Recur left |
| `2` (Leaf) | `[5, 4, 11, 2]` | $2 - 2 = 0$ | **Yes** | **Target Path Found!** |

```text
Tree:        [ 1 ]             Path 1: 1 -> 2 ===> 12
            /     \            Path 2: 1 -> 3 ===> 13
         [ 2 ]   [ 3 ]         Total Sum = 12 + 13 = 25
```

> [!CAUTION]
> A path terminates strictly at a leaf node where both `left` and `right` children are null. Do NOT check for zero remainder at intermediate non-leaf nodes.

Let's now examine in-place tree mutations and BST flattening to Doubly Linked Lists.


#### Complexity Analysis
- **Time Complexity:** $O(N)$ for single pass; $O(N \cdot H)$ if copying full path vectors at every leaf.
- **Auxiliary Space:** $O(H)$ recursion stack memory.

---


## Tree Transformations & Tree Dynamic Programming


### In-Place Tree Mutations — Mirror Inversion, Merging & DLL Flattening

Tree mutation algorithms modify node pointers in-place to transform tree structures without allocating new nodes.

Mirror inversion converts a binary tree reflectively such that every left child pointer becomes the right child pointer and vice versa across all subtrees.

```text
Original:               [ 4 ]                  Mirror Inverted:
                      /       \
                   [ 2 ]     [ 7 ]                 [ 4 ]
                   /   \     /   \               /       \
                 [ 1 ] [ 3 ] [ 6 ] [ 9 ]       [ 7 ]     [ 2 ]
                                               /   \     /   \
                                             [ 9 ] [ 6 ] [ 3 ] [ 1 ]
```

The recursive inversion swap swaps left and right subtrees post-order:

$$\text{invert}(T) \implies \text{swap}(T\to\text{left}, T\to\text{right}), \; \text{invert}(T\to\text{left}), \; \text{invert}(T\to\text{right})$$

Let's implement reflective tree inversion in C++.

```cpp
// Reflective Mirror Inversion on Binary Tree: O(N) Time, O(H) Call Stack Space
TreeNode* mirror_invert_tree(TreeNode* root) {
    if (!root) return nullptr;

    // Swap left and right child pointers
    TreeNode* temp = root->left;
    root->left = mirror_invert_tree(root->right);
    root->right = mirror_invert_tree(temp);

    return root;
}
```

#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear time.
- **Auxiliary Space:** $O(H)$ recursion call stack memory.

---


### Geometry, Diameter & Complete Tree Node Counting

The Diameter of a binary tree is the length of the longest path between any two arbitrary nodes in the tree.

This longest path may or may not pass through the root node; at every node, the longest path turning at that node has length $\text{height}(L) + \text{height}(R)$.

```text
         [ 1 ]
        /     \
     [ 2 ]   [ 3 ]                 Path turns at Node 2:
    /     \                        Path: 4 -> 2 -> 5
  [ 4 ]  [ 5 ]                     Length in edges = 1 + 1 = 2
  /         \                      Diameter does NOT pass root!
[ 6 ]      [ 7 ]                   Path: 6 -> 4 -> 2 -> 5 -> 7
```

In a Complete Binary Tree, we can count total nodes in $O(\log^2 N)$ time by probing the leftmost and rightmost depths.

$$\text{If } \text{depth}(L) == \text{depth}(R) \implies \text{Count} = 2^{\text{depth}} - 1; \quad \text{Else } \implies 1 + \text{count}(L) + \text{count}(R)$$

Let's implement the single-pass Diameter calculator alongside $O(\log^2 N)$ Complete Tree Node Counting.

```cpp
// Tree Diameter & Complete Tree Node Counting
int calculate_diameter_helper(TreeNode* root, int& max_diameter) {
    if (!root) return 0;
    int left_h = calculate_diameter_helper(root->left, max_diameter);
    int right_h = calculate_diameter_helper(root->right, max_diameter);

    max_diameter = max(max_diameter, left_h + right_h);
    return max(left_h, right_h) + 1;
}

int tree_diameter(TreeNode* root) {
    int max_diameter = 0;
    calculate_diameter_helper(root, max_diameter);
    return max_diameter;
}

int count_complete_tree_nodes(TreeNode* root) {
    if (!root) return 0;
    int left_depth = 0, right_depth = 0;
    TreeNode *l = root, *r = root;

    while (l) { left_depth++; l = l->left; }
    while (r) { right_depth++; r = r->right; }

    // If sub-tree is full, apply 2^h - 1 closed-form formula
    if (left_depth == right_depth) {
        return (1 << left_depth) - 1;
    }
    return 1 + count_complete_tree_nodes(root->left) 
             + count_complete_tree_nodes(root->right);
}
```

| Node Probed | Left Depth | Right Depth | Tree Full? | Formula Applied |
| :--- | :--- | :--- | :--- | :--- |
| Root | $4$ | $3$ | No | Recur on left & right |
| Left Child | $3$ | $3$ | **Yes** | $2^3 - 1 = 7$ nodes |
| Right Child | $3$ | $2$ | No | Recur on subtrees |

```text
Depth of tree = O(log N)
At each level, exactly one subtree is full (O(1) calculation).
Total Work = O(log N) levels * O(log N) depth probes = O(log^2 N) ops!
```

> [!IMPORTANT]
> Diameter measured in **EDGES** is $\text{height}_L + \text{height}_R$; measured in **NODES** is $\text{height}_L + \text{height}_R + 1$. Always verify problem definitions.

Let's now conclude with Dynamic Programming on trees and 2-Pass Tree Rerooting.


#### Complexity Analysis
- **Time Complexity:** $O(N)$ for Tree Diameter; $O(\log^2 N)$ for Complete Tree Node Counting.
- **Auxiliary Space:** $O(H)$ recursion call stack memory.

---


### Dynamic Programming on Trees & Tree Rerooting

Dynamic Programming on Trees computes optimal subtree solutions bottom-up, passing aggregated state vectors up from children to parents.

In the Sum of Distances in Tree problem, a 2-pass Tree Rerooting algorithm computes distance sums for all $N$ nodes in $O(N)$ total time instead of $O(N^2)$.

```text
Moving root from Parent u to Child v:
- Subtree rooted at v moves 1 step CLOSER (saves size[v] edges).
- All remaining (N - size[v]) nodes move 1 step FARTHER away.
Core Rerooting Rule: ans[v] = ans[u] - size[v] + (N - size[v])
```

The rerooting formula updates the total distance sum in $O(1)$ time when transitioning root along an edge $(u, v)$.

$$\text{ans}[v] = \text{ans}[u] - \text{size}[v] + (N - \text{size}[v])$$

Let's implement 2-pass Tree Rerooting for Sum of Distances in Tree.

```cpp
// 2-Pass Tree Rerooting DP: O(N) Time, O(N) Space
class TreeRerooting {
    int N;
    vector<vector<int>> adj;
    vector<int> count, ans;

    void dfs_bottom_up(int u, int parent) {
        count[u] = 1;
        for (int v : adj[u]) {
            if (v != parent) {
                dfs_bottom_up(v, u);
                count[u] += count[v];
                ans[u] += ans[v] + count[v];
            }
        }
    }

    void dfs_top_down(int u, int parent) {
        for (int v : adj[u]) {
            if (v != parent) {
                // Rerooting transition formula
                ans[v] = ans[u] - count[v] + (N - count[v]);
                dfs_top_down(v, u);
            }
        }
    }
public:
    vector<int> sum_of_distances_in_tree(int n, const vector<vector<int>>& edges) {
        N = n;
        adj.assign(n, vector<int>());
        for (const auto& e : edges) {
            adj[e[0]].push_back(e[1]);
            adj[e[1]].push_back(e[0]);
        }
        count.assign(n, 0);
        ans.assign(n, 0);

        dfs_bottom_up(0, -1); // Pass 1: Subtree sizes & Root 0 distance
        dfs_top_down(0, -1);   // Pass 2: Reroot to all other nodes
        return ans;
    }
};
```

| Node $v$ | Parent $u$ | Subtree Size `count[v]` | $\Delta$ Distance Adjustment | Final Distance Sum `ans[v]` |
| :--- | :--- | :--- | :--- | :--- |
| $0$ (Root) | - | $6$ (Full tree) | Base computation | `ans[0] = 8` |
| $1$ | $0$ | $1$ | $-1 + (6 - 1) = +4$ | $8 + 4 = 12$ |
| $2$ | $0$ | $4$ | $-4 + (6 - 4) = -2$ | $8 - 2 = 6$ |

```text
Pass 1 (Bottom-Up Postorder): Aggregate subtree sizes & base answer
Pass 2 (Top-Down Preorder)  : Broadcast rerooted solutions to children
Converts brute-force O(N^2) search into optimal O(N) algorithm!
```

> [!TIP]
> Tree Rerooting DP is the universal template for calculating all-pairs tree metrics (sum of distances, tree centers, maximum path sums) in strictly linear $O(N)$ time.

This completes the Binary Trees & DFS chapter, covering structural symmetry, iterative traversals, path backtracking, DLL transformations, diameter/counting algorithms, and tree rerooting DP.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ across two linear tree traversals.
- **Auxiliary Space:** $O(N)$ to store adjacency lists, subtree counts, and answer arrays.

---


## Cheat Sheet & Quick Reference

| Tree Technique | Purpose | Core Invariant / Formula | Complexity |
| :--- | :--- | :--- | :--- |
| **Bottom-Up Balance** | Height balance check | Return $-1$ if $|h_L - h_R| > 1$ | $\Theta(N)$ / $O(H)$ Space |
| **Symmetric Tree** | Mirror check | `t1->val == t2->val && mirror(t1->L, t2->R)` | $\Theta(N)$ / $O(H)$ Space |
| **Iterative Inorder** | Sorted BST traversal | Push left chain onto stack; pop and move right | $\Theta(N)$ / $O(H)$ Space |
| **Path Backtracking** | Root-to-leaf paths | `path.push_back(val); recur; path.pop_back();` | $O(N \cdot H)$ / $O(H)$ Space |
| **BST to Doubly List** | In-place flattening | Inorder: `prev->right = curr; curr->left = prev;` | $\Theta(N)$ / $O(H)$ Space |
| **Tree Diameter** | Longest path | $\max(\text{diam}, h_L + h_R)$ in bottom-up pass | $\Theta(N)$ / $O(H)$ Space |
| **Complete Tree Count** | Fast node counting | If $d_L == d_R \implies 2^d - 1$; else recur | $O(\log^2 N)$ / $O(\log N)$ |
| **Tree Rerooting DP** | All-nodes tree metric | `ans[v] = ans[u] - size[v] + (N - size[v])` | $\Theta(N)$ / $O(N)$ Space |
