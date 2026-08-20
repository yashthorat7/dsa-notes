# Chapter 34: Advanced Dynamic Programming

---



## Interval & Matrix Partitioning DP



### Matrix Chain Multiplication (MCM) & Partitioning Invariants

Let's stand at the whiteboard and explore Interval Dynamic Programming: optimizing costs across contiguous subarrays $[i \dots j]$ by iterating over intermediate partition split points $k$.

In Matrix Chain Multiplication (MCM), we find the parenthesization of matrices $A_1 \times A_2 \times \dots \times A_N$ that requires the minimum total scalar multiplications.

```text
Interval [ i ... j ] partitioned at split point k:
( A_i * A_{i+1} * ... * A_k )  *  ( A_{k+1} * ... * A_j )
Total Cost = Cost(Left [i..k]) + Cost(Right [k+1..j])
           + Multiplication Cost: (p[i-1] * p[k] * p[j])
Minimize across all possible split choices: i <= k < j
```

The interval dynamic programming recurrence evaluates every partition split point $k$.

$$dp[i][j] = \min_{i \le k < j} \left( dp[i][k] + dp[k+1][j] + p[i-1] \cdot p[k] \cdot p[j] \right) \quad \text{with } dp[i][i] = 0$$

Let's implement Matrix Chain Multiplication and optimal parenthesization printing in C++.

```cpp
// Matrix Chain Multiplication: O(N^3) Time, O(N^2) Space
int matrix_chain_order(const vector<int>& p, vector<vector<int>>& split) {
    int n = p.size() - 1; // Number of matrices
    vector<vector<int>> dp(n + 1, vector<int>(n + 1, 0));
    split.assign(n + 1, vector<int>(n + 1, 0));

    // Iterate by chain length L = 2 to n
    for (int len = 2; len <= n; ++len) {
        for (int i = 1; i <= n - len + 1; ++i) {
            int j = i + len - 1;
            dp[i][j] = 1e9;

            for (int k = i; k < j; ++k) {
                int cost = dp[i][k] + dp[k + 1][j] + p[i - 1] * p[k] * p[j];
                if (cost < dp[i][j]) {
                    dp[i][j] = cost;
                    split[i][j] = k;
                }
            }
        }
    }
    return dp[1][n];
}

void print_parenthesis(int i, int j, const vector<vector<int>>& split, char& name, string& out) {
    if (i == j) {
        out += name++;
        return;
    }
    out += '(';
    print_parenthesis(i, split[i][j], split, name, out);
    print_parenthesis(split[i][j] + 1, j, split, name, out);
    out += ')';
}
```

| Dimensions `p` | Matrix Chain | Split Point $k$ | Min Multiplications | Optimal Parenthesization |
| :--- | :--- | :--- | :--- | :--- |
| `[10, 20, 30]` | $A_1 \times A_2$ | $k=1$ | $10 \times 20 \times 30 = 6,000$ | `(A1 A2)` |
| `[10, 20, 30, 40]` | $A_1 \dots A_3$ | $k=2$ | $18,000$ | `((A1 A2) A3)` |
| `[40, 20, 30, 10]` | $A_1 \dots A_3$ | $k=1$ | $26,000$ | `(A1 (A2 A3))` |

```text
Outer Loop: Chain Length L = 2, 3, ... N
Guarantees smaller subsegments are FULLY solved before larger ones!
```

> [!WARNING]
> Interval DP MUST iterate by interval **LENGTH** on the outside loop. Iterating standard row index $i$ then $j$ accesses uncomputed subproblems.

Let's now examine Palindrome Cuts and Boolean Parenthesization.



#### Complexity Analysis
- **Time Complexity:** $\Theta(N^3)$ cubic time across length, start index, and split point.
- **Auxiliary Space:** $O(N^2)$ table memory for $dp[i][j]$ and split markers.

---



### Interval DP — Symmetric Token Partitioning & Boolean Expressions

Interval DP solves problems by computing optimal costs over contiguous substrings $[i \dots j]$ of increasing lengths $L = 2 \dots N$.

In the symmetric token stream partitioning problem, we find the minimum cuts needed to divide a token stream such that every segment is internally palindromic.

```text
is_sym[i][j] is true iff (S[i] == S[j] AND is_sym[i+1][j-1])
Cut Recurrence: cuts[i] = min_{0 <= j < i} (cuts[j] + 1)
Precomputing symmetry reduces cut minimization from O(N^3) to O(N^2)!
```

The cut optimization recurrence minimizes partitions over valid symmetric prefixes:

$$\text{cuts}[i] = \min_{0 \le j < i \land \text{is\_sym}[j+1][i]} (\text{cuts}[j] + 1)$$

Let's implement symmetric token stream cut minimization in C++.

```cpp
// Minimal Symmetric Stream Partitions: O(N^2) Time, O(N^2) Space
int min_symmetric_stream_partitions(const string& token_stream) {
    int n = token_stream.size();
    if (n <= 1) return 0;

    // 1. Precompute symmetry table for all intervals [i..j]
    vector<vector<bool>> is_pal(n, vector<bool>(n, false));
    for (int i = 0; i < n; ++i) is_pal[i][i] = true;

    for (int len = 2; len <= n; ++len) {
        for (int i = 0; i <= n - len; ++i) {
            int j = i + len - 1;
            if (token_stream[i] == token_stream[j]) {
                is_pal[i][j] = (len == 2) || is_pal[i + 1][j - 1];
            }
        }
    }

    // 2. Compute minimum cuts for prefix [0..i]
    vector<int> dp(n, 1e9);
    for (int i = 0; i < n; ++i) {
        if (is_pal[0][i]) {
            dp[i] = 0; // Entire prefix is symmetric; 0 cuts needed
        } else {
            for (int j = 0; j < i; ++j) {
                if (is_pal[j + 1][i]) {
                    dp[i] = min(dp[i], dp[j] + 1);
                }
            }
        }
    }
    return dp[n - 1];
}
```


#### Complexity Analysis
- **Time Complexity:** $\Theta(N^2)$ for Palindrome Cuts; $O(N^3)$ for Boolean Parenthesization.
- **Auxiliary Space:** $O(N^2)$ 2D matrix memory.

---



### Minimax Interval Searches — Threshold Probing & Binary Structural Matching

The Critical Threshold Probing problem (Egg Dropping) finds the minimum number of attempts to identify a critical threshold floor using $K$ items across $N$ floors in the worst case.

Testing floor $x$ creates two branches: if the item Breaks, we test $x - 1$ lower floors with $K - 1$ items; if it Survives, we test $N - x$ upper floors with $K$ items.

```text
Testing Floor x:
- Break   : dp(k - 1, x - 1)  (Increasing curve with x)
- Survive : dp(k, n - x)      (Decreasing curve with x)
Minimax Cost = 1 + min_{1 <= x <= n} max(Break(x-1), Survive(n-x))
Curves intersect at the optimal floor -> Find via Binary Search!
```

Because $\text{Break}(x)$ strictly increases and $\text{Survive}(x)$ strictly decreases, we find the minimax optimal point using Binary Search in $O(\log N)$ per state.

$$dp[k][n] = 1 + \min_{1 \le x \le n} \max(dp[k-1][x-1], \; dp[k][n-x]) \implies O(K \cdot N \log N)$$

Let's implement the Binary Search optimized Minimax Threshold solver in C++.

```cpp
// Critical Threshold Probing (Egg Dropping) with Binary Search: O(K * N log N)
int super_egg_drop(int k, int n) {
    vector<vector<int>> dp(k + 1, vector<int>(n + 1, 0));

    // Base Cases: 1 egg requires n linear drops; 0/1 floors require 0/1 drops
    for (int i = 1; i <= n; ++i) dp[1][i] = i;
    for (int i = 1; i <= k; ++i) { dp[i][0] = 0; dp[i][1] = 1; }

    for (int i = 2; i <= k; ++i) {
        for (int j = 2; j <= n; ++j) {
            int low = 1, high = j, optimal_attempts = j;

            // Binary search for minimax intersection point
            while (low <= high) {
                int mid = low + (high - low) / 2;
                int break_cost = dp[i - 1][mid - 1];
                int survive_cost = dp[i][j - mid];

                optimal_attempts = min(optimal_attempts, 1 + max(break_cost, survive_cost));

                if (break_cost < survive_cost) {
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }
            dp[i][j] = optimal_attempts;
        }
    }
    return dp[k][n];
}
```

| Items $K$ | Floors $N$ | Linear Probing ($K=1$) | Minimax Drop Strategy | Minimum Drops Needed |
| :--- | :--- | :--- | :--- | :--- |
| $1$ | $100$ | Drop $1, 2, 3 \dots 100$ | Linear search | $100$ |
| $2$ | $100$ | - | Drop $14, 27, 39, 50 \dots$ | **$14$ Drops** |
| $3$ | $100$ | - | Binary search threshold | **$9$ Drops** |

```text
Cost ^
     |    Break(x) [Increasing]       Survive(x) [Decreasing]
     |         \                     /
     |          \     Intersection  /
     |           \        (V)      /
     |            \_______/ \_____/
     +---------------------------------> Floor x
```

> [!IMPORTANT]
> Because the Break and Survive curves are strictly monotonic, replacing the inner linear scan over $x$ with Binary Search speeds up runtime from $O(K \cdot N^2)$ to $O(K \cdot N \log N)$.

Let's now examine Dynamic Programming on Tree topologies.



#### Complexity Analysis
- **Time Complexity:** $O(K \cdot N \log N)$ using binary search on transition floors.
- **Auxiliary Space:** $O(K \cdot N)$ state table memory.

---



## Tree Dynamic Programming



### Dynamic Programming on Trees — Subtree Aggregations & Diameters

Tree DP computes optimal metrics across subtrees in post-order DFS traversals, aggregating values from child nodes up to parents.

In the network relay flow path problem, any node can act as the highest turning pivot point where left and right branch paths merge.

```text
                     [ Node U (Val: 20) ]
                      /                \
         [ Left Gain: 15 ]          [ Right Gain: 7 ]
Path turning at Node U = 15 + 20 + 7 = 42
Single branch returned to parent = 20 + max(15, 7) = 35
```

The dual return/update invariant distinguishes local subtree turning paths from single-branch extensions:

$$\text{LocalPeak} = U.\text{val} + L + R, \quad \text{BranchGain} = U.\text{val} + \max(0, \max(L, R))$$

Let's implement network relay flow path optimization in C++.

```cpp
// Network Relay Peak Transfer Path: O(N) Time, O(H) Call Stack Space
int calculate_max_relay_gain(TreeNode* node, int& global_max) {
    if (!node) return 0;

    // Discard negative branch contributions by bounding with 0
    int left_gain = max(0, calculate_max_relay_gain(node->left, global_max));
    int right_gain = max(0, calculate_max_relay_gain(node->right, global_max));

    // Update global maximum with path turning through current node
    int current_turning_path = node->val + left_gain + right_gain;
    global_max = max(global_max, current_turning_path);

    // Return single best branch gain to parent
    return node->val + max(left_gain, right_gain);
}

int find_peak_network_relay_path(TreeNode* root) {
    int global_max = -1e9;
    calculate_max_relay_gain(root, global_max);
    return global_max;
}
```

#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear post-order DFS pass.
- **Auxiliary Space:** $O(H)$ recursion call stack memory.

---



## Exponential & Range Paradigms



### Bitmask Dynamic Programming & Traveling Salesperson

Bitmask Dynamic Programming represents subsets of $N$ items as integer bitmasks $(0 \dots 2^N - 1)$ for problems with small $N \le 20$.

In the Traveling Salesperson Problem (TSP), state $dp[\text{mask}][u]$ represents the minimum cost to visit all cities in `mask`, ending currently at city $u$.

```text
Visited Mask: 0b0011 (Visited cities 0 and 1, currently at city 1)
Next city v = 2 (Unvisited! Bit 2 is 0):
Next Mask = mask | (1 << 2) = 0b0111
Transition: dp[mask | (1 << v)][v] + dist[u][v]
```

The Bellman-Held-Karp recurrence solves TSP in $O(N^2 2^N)$ time instead of $O(N!)$.

$$dp[\text{mask}][u] = \min_{v \notin \text{mask}} \left( dp[\text{mask} \mid (1 \ll v)][v] + \text{dist}[u][v] \right)$$

Let's implement the Bitmask TSP solver in C++.

```cpp
// Traveling Salesperson Problem: O(N^2 * 2^N) Time, O(N * 2^N) Space
int tsp_memo(int mask, int u, int n, const vector<vector<int>>& dist, vector<vector<int>>& memo) {
    // All cities visited: return cost to return to origin city 0
    if (mask == (1 << n) - 1) return dist[u][0];
    if (memo[mask][u] != -1) return memo[mask][u];

    int min_cost = 1e9;
    for (int v = 0; v < n; ++v) {
        if (!(mask & (1 << v))) { // City v not yet visited
            int cost = dist[u][v] + tsp_memo(mask | (1 << v), v, n, dist, memo);
            min_cost = min(min_cost, cost);
        }
    }
    return memo[mask][u] = min_cost;
}

int solve_tsp(int n, const vector<vector<int>>& dist) {
    vector<vector<int>> memo(1 << n, vector<int>(n, -1));
    return tsp_memo(1, 0, n, dist, memo); // Start at city 0 with mask 0001
}
```

| Subset Mask | Binary Form | Visited Cities | Current City $u$ | Next Unvisited Candidates |
| :--- | :--- | :--- | :--- | :--- |
| $1$ | `0b0001` | `{0}` | City $0$ | Cities $1, 2, 3$ |
| $3$ | `0b0011` | `{0, 1}` | City $1$ | Cities $2, 3$ |
| $7$ | `0b0111` | `{0, 1, 2}` | City $2$ | City $3$ |
| $15$ | `0b1111` | `{0, 1, 2, 3}` | City $3$ | Return to origin $0$ |

```text
N = 10 -> 2^10 = 1,024 states
N = 20 -> 2^20 = 1,048,576 states (~4 MB RAM)
Bitmask DP fits perfectly within 256 MB RAM and 1.0s time limits!
```

> [!TIP]
> Bitmask DP is strictly applicable when $N \le 20$. For $N = 20$, $2^{20} \approx 10^6$ states, fitting comfortably within memory and execution limits.

> [!WARNING]
> **Operator Precedence Caution in Bitmask DP:**
> In C++, addition and subtraction have higher operator precedence than bit-shift operators (`<<` and `>>`). An unparenthesized expression `1 << n - 1` evaluates as `1 << (n - 1)`, NOT `(1 << n) - 1`. Always wrap bit shifts in explicit parentheses: `(1 << n) - 1`.

Let's now examine Digit Dynamic Programming for range constraint counting.



#### Complexity Analysis
- **Time Complexity:** $\Theta(N^2 \cdot 2^N)$ state transitions.
- **Auxiliary Space:** $O(N \cdot 2^N)$ memoization table memory.

---



### Digit Dynamic Programming & Range Constraint Counting

Digit Dynamic Programming counts numbers in a range $[L, R]$ satisfying specific digit properties (such as no consecutive matching digits or digit sum equals $S$).

Using the Range Subtraction Identity, we convert range queries into two independent prefix evaluations: $\text{Count}([L, R]) = \text{Solve}(R) - \text{Solve}(L - 1)$.

```text
Counting numbers <= 352:
Digit 1: If we pick '3' -> tight remains 1 (Next digit limit is 5)
         If we pick '0', '1', or '2' -> tight drops to 0 (Unbounded!)
When tight = 0: All subsequent digits can freely choose 0 through 9!
```

The 4D state vector tracks progress through the digit sequence from MSB to LSB.

$$dp[\text{idx}][\text{tight}][\text{leading\_zero}][\text{sum}] \implies \text{Count}([L, R]) = \text{Solve}(R) - \text{Solve}(L - 1)$$

Let's implement the Digit DP template counting numbers with digit sum equal to $S$.

```cpp
// Digit DP: Count integers in [0, N] with digit sum == target_sum
int digit_dp_helper(int idx, int tight, int current_sum, int target_sum, 
                    const string& num_str, vector<vector<vector<int>>>& memo) {
    if (current_sum > target_sum) return 0;
    if (idx == num_str.size()) return current_sum == target_sum ? 1 : 0;

    if (!tight && memo[idx][current_sum][0] != -1) {
        return memo[idx][current_sum][0];
    }

    int limit = tight ? (num_str[idx] - '0') : 9;
    int total_count = 0;

    for (int d = 0; d <= limit; ++d) {
        int next_tight = tight && (d == limit);
        total_count += digit_dp_helper(idx + 1, next_tight, current_sum + d, 
                                       target_sum, num_str, memo);
    }

    if (!tight) memo[idx][current_sum][0] = total_count;
    return total_count;
}

int count_digit_sum(long long n, int target_sum) {
    string num_str = to_string(n);
    vector<vector<vector<int>>> memo(20, vector<vector<int>>(180, vector<int>(2, -1)));
    return digit_dp_helper(0, 1, 0, target_sum, num_str, memo);
}
```

| Digit Index | Active `tight` | Digit Limit | Digit Chosen | Next `tight` State |
| :--- | :--- | :--- | :--- | :--- |
| `0` (MSB) | `1` (Tight) | $3$ | `'3'` | `1` (Tight) |
| `0` (MSB) | `1` (Tight) | $3$ | `'2'` | `0` **(Unbounded!)** |
| `1` | `0` (Unbounded) | $9$ | `'9'` | `0` (Unbounded) |

```text
Only memoize when tight == 0!
States with tight == 1 are restricted to the prefix of N and cannot
be reused across other general branches.
```

> [!IMPORTANT]
> Do NOT memoize states when `tight == 1` because choices are constrained by the specific prefix of $N$. Memoize strictly when `tight == 0`.

Let's now examine Probability DP and Markov expected value transitions.



#### Complexity Analysis
- **Time Complexity:** $O(\text{Digits} \cdot 10 \cdot \text{Sum}) \approx O(18 \times 10 \times 160) = O(10^4)$ operations.
- **Auxiliary Space:** $O(\text{Digits} \cdot \text{Sum})$ memoization table memory.

---



### Probability DP & Expected Value Markov Transitions

Probability Dynamic Programming computes exact probabilities and expected values over discrete stochastic processes and Markov chains.

In Knight Probability on a Chessboard, each move branches uniformly into 8 possible directions with probability $1/8$, accumulating survival chances after $K$ moves.

```text
From cell (r, c), knight can leap into 8 moves with prob = 1/8:
P_{t+1}(r, c) = sum_{(dr, dc)} (1/8) * P_t(r + dr, c + dc)
Moves that land off the board have probability 0 (Knight dies).
```

The probability state transition equation aggregates probabilities from neighboring cells.

$$P_{t+1}(r, c) = \sum_{(dr, dc)} \frac{1}{8} \cdot P_t(r + dr, c + dc) \quad \text{with } P(r', c') = 0 \text{ if off board}$$

Let's implement the Knight Probability calculator in C++.

```cpp
// Knight Probability on Chessboard: O(K * N^2) Time, O(N^2) Space
double knight_probability(int n, int k, int row, int column) {
    int dr[] = {-2, -2, -1, -1, 1, 1, 2, 2};
    int dc[] = {-1, 1, -2, 2, -2, 2, -1, 1};

    vector<vector<double>> dp(n, vector<double>(n, 0.0));
    dp[row][column] = 1.0; // Initial starting probability

    for (int step = 1; step <= k; ++step) {
        vector<vector<double>> next_dp(n, vector<double>(n, 0.0));

        for (int r = 0; r < n; ++r) {
            for (int c = 0; c < n; ++c) {
                if (dp[r][c] > 0.0) {
                    for (int d = 0; d < 8; ++d) {
                        int nr = r + dr[d], nc = c + dc[d];
                        if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
                            next_dp[nr][nc] += dp[r][c] / 8.0;
                        }
                    }
                }
            }
        }
        dp = next_dp;
    }

    double total_survival_prob = 0.0;
    for (int r = 0; r < n; ++r) {
        for (int c = 0; c < n; ++c) total_survival_prob += dp[r][c];
    }
    return total_survival_prob;
}
```

| Move Step | Board State `dp` | Off-Board Leaps | Remaining Survival Probability |
| :--- | :--- | :--- | :--- |
| Step 0 | `dp[0][0] = 1.0` | None | $1.0000$ |
| Step 1 | $2$ valid moves (`(1,2), (2,1)`) | $6$ moves off board | $2 \times \frac{1}{8} = 0.2500$ |
| Step 2 | Dispersed across board | Additional off-board | $0.0625$ |

```text
Use double or long double for probability calculations to prevent
catastrophic floating-point cancellation across repeated steps!
```

> [!WARNING]
> Use `double` or `long double` for probability accumulators to prevent precision loss across multiple compounding steps.

Let's now conclude with asymptotic DP optimizations: the Convex Hull Trick and Knuth's Optimization.



#### Complexity Analysis
- **Time Complexity:** $\Theta(K \cdot N^2)$ across $K$ step transitions on an $N \times N$ board.
- **Auxiliary Space:** $O(N^2)$ memory for 2D probability buffers.

---



## Asymptotic DP Optimizations



### Advanced DP Optimizations — Convex Hull Trick & Knuth's Optimization

Asymptotic Dynamic Programming optimizations reduce polynomial runtimes, transforming quadratic $O(N^2)$ recurrences into $O(N)$ or $O(N \log N)$ time.

The Convex Hull Trick (CHT) optimizes linear transitions $dp[i] = \min_{j < i} (dp[j] + m_j \cdot x_i + c_j)$ by maintaining the lower envelope of lines $y = m x + c$.

```text
Line 1: y = m1 * x + c1
Line 2: y = m2 * x + c2
Lower envelope forms a convex hull of line segments.
Finding min at query point x_i takes O(log N) via Binary Search!
Overall DP runtime drops from O(N^2) to O(N log N)!
```

Knuth's Optimization reduces interval DP $dp[i][j] = \min_k (dp[i][k] + dp[k+1][j]) + w(i, j)$ from $O(N^3)$ to $O(N^2)$ when the optimal split point is monotonic: $\text{opt}[i][j-1] \le \text{opt}[i][j] \le \text{opt}[i+1][j]$.

$$\text{Knuth Search Bound: } \text{opt}[i][j-1] \le k \le \text{opt}[i+1][j] \implies \text{Total Time} = \Theta(N^2)$$

Let's implement Knuth's Optimization for Matrix Partitioning in C++.

```cpp
// Knuth's Optimization Template: Reduces Interval DP from O(N^3) to O(N^2)
int knuth_interval_dp(int n, const vector<int>& weights) {
    vector<vector<int>> dp(n, vector<int>(n, 0));
    vector<vector<int>> opt(n, vector<int>(n, 0));

    // Base case: length 1 intervals
    for (int i = 0; i < n; ++i) opt[i][i] = i;

    // Iterate over interval length L = 2 to n
    for (int len = 2; len <= n; ++len) {
        for (int i = 0; i <= n - len; ++i) {
            int j = i + len - 1;
            dp[i][j] = 1e9;

            // Search space for k is tightly clamped by Knuth's bounds!
            int k_start = opt[i][j - 1];
            int k_end = min(j - 1, opt[i + 1][j]);

            for (int k = k_start; k <= k_end; ++k) {
                int cost = dp[i][k] + dp[k + 1][j] + (weights[j] - (i > 0 ? weights[i - 1] : 0));
                if (cost < dp[i][j]) {
                    dp[i][j] = cost;
                    opt[i][j] = k;
                }
            }
        }
    }
    return dp[0][n - 1];
}
```

| Optimization Technique | Applicable Recurrence Pattern | Prerequisite Condition | Complexity Reduction |
| :--- | :--- | :--- | :--- |
| **Convex Hull Trick (CHT)** | $dp[i] = \min_j (dp[j] + m_j x_i + c_j)$ | Monotonic slopes $m_j$ / queries $x_i$ | $O(N^2) \to O(N)$ or $O(N \log N)$ |
| **Knuth's Optimization** | $dp[i][j] = \min_k (dp[i][k] + dp[k+1][j]) + w$ | Quadrangle Inequality on $w(i, j)$ | $O(N^3) \to O(N^2)$ |
| **Divide & Conquer DP** | $dp[i][j] = \min_k (dp[i-1][k] + \text{cost}(k, j))$ | Monotonic split $\text{opt}[i][j] \le \text{opt}[i][j+1]$ | $O(K \cdot N^2) \to O(K \cdot N \log N)$ |

```text
Clamping k between opt[i][j-1] and opt[i+1][j] ensures that across all
intervals of length L, the total iterations of k sum to O(N)!
```

> [!IMPORTANT]
> Knuth's optimization strictly requires the cost function $w(i, j)$ to satisfy the Quadrangle Inequality: $w(a, c) + w(b, d) \le w(a, d) + w(b, c)$ for all $a \le b \le c \le d$.

This completes the Advanced Dynamic Programming chapter, establishing comprehensive mastery over interval partitioning, tree DPs, bitmask TSPs, digit counting, probability Markov chains, and Convex Hull / Knuth asymptotic optimizations.



#### Complexity Analysis
- **Time Complexity:** $O(N^2)$ for Knuth's Optimization; $O(N \log N)$ for general Convex Hull Trick.
- **Auxiliary Space:** $O(N^2)$ memory for table and split matrices.

---



## Cheat Sheet & Quick Reference

| Advanced DP Pattern | Recurrence Equation / Strategy | Domain Constraint | Complexity |
| :--- | :--- | :--- | :--- |
| **Matrix Chain (MCM)** | $\min_k (dp[i][k] + dp[k+1][j] + p_{i-1} p_k p_j)$ | Length loop outer | $\Theta(N^3)$ / $O(N^2)$ |
| **Palindrome Cuts** | Precompute `is_pal[i][j]`; 1D DP cut loop | 2D boolean table | $\Theta(N^2)$ / $O(N^2)$ |
| **Egg Drop Minimax** | $1 + \min_x \max(\text{Break}(x-1), \text{Survive}(n-x))$| Binary search over $x$ | $O(K N \log N)$ |
| **Tree Max Path Sum** | $\text{gain} = \max(0, u + \max(g_L, g_R))$ | Postorder DFS | $\Theta(N)$ / $O(H)$ |
| **Bitmask TSP** | $dp[\text{mask}][u] = \min_v (dp[\text{mask} \mid (1 \ll v)][v] + d_{uv})$ | Small $N \le 20$ | $O(N^2 \cdot 2^N)$ |
| **Digit DP** | $dp[\text{idx}][\text{tight}][\text{leadZero}][\text{sum}]$ | Memoize when `tight==0` | $O(\text{Digits} \cdot \text{Sum})$ |
| **Probability DP** | $P_{t+1}(r, c) = \sum \frac{1}{|\text{moves}|} P_t(\text{adj})$ | Floating-point DP | $O(K \cdot N^2)$ |
| **Knuth's Opt** | Split clamped: $\text{opt}[i][j-1] \le k \le \text{opt}[i+1][j]$ | Quadrangle inequality | $O(N^3) \to O(N^2)$ |
