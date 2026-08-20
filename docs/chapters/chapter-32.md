# Chapter 32: Dynamic Programming Basics

---






## Dynamic Programming Foundations






### Dynamic Programming Axioms — Memoization vs Tabulation & Space Optimization

Let's stand at the whiteboard and define the two foundational prerequisites for Dynamic Programming: Overlapping Subproblems and Optimal Substructure.

Top-Down Memoization uses lazy recursion with a lookup cache table, while Bottom-Up Tabulation evaluates states iteratively in strict dependency order.

```text
Naive Exponential Tree (2^N calls):
                    fib(5)
                  /        \
              fib(4)        fib(3)
              /    \        /    \
           fib(3)  fib(2) fib(2) fib(1)  <-- fib(3) recomputed twice!

Memoized / Tabulated DAG (N linear states):
fib(0) ---> fib(1) ---> fib(2) ---> fib(3) ---> fib(4) ---> fib(5)
```

Memoization or Tabulation collapses exponential $O(2^N)$ tree recursion into linear $O(N)$ directed acyclic graph evaluations.

$$\text{Naive Recursion} = \Theta(2^N) \quad \xrightarrow{\text{Memoization / Tabulation}} \quad \Theta(N) \text{ Linear Time}$$

Let's implement Top-Down Memoization, Bottom-Up Tabulation, and $O(1)$ Space State Reduction in C++.

```cpp
// Top-Down, Bottom-Up, and O(1) Space-Optimized DP
int fib_memo_helper(int n, vector<int>& memo) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];
    return memo[n] = fib_memo_helper(n - 1, memo) + fib_memo_helper(n - 2, memo);
}

int fib_tabulation(int n) {
    if (n <= 1) return n;
    vector<int> dp(n + 1);
    dp[0] = 0; dp[1] = 1;

    for (int i = 2; i <= n; ++i) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
}

int fib_space_optimized(int n) {
    if (n <= 1) return n;
    int prev2 = 0, prev1 = 1;

    for (int i = 2; i <= n; ++i) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
```

| Dimension | Top-Down (Memoization) | Bottom-Up (Tabulation) | Space-Optimized Tabulation |
| :--- | :--- | :--- | :--- |
| **Approach** | Recursive (Lazy evaluation) | Iterative (Eager filling) | Iterative (Rolling variables) |
| **Call Stack** | $O(N)$ recursion depth | $O(1)$ zero recursion stack | $O(1)$ zero recursion stack |
| **Auxiliary Memory**| $O(N)$ table $+ O(N)$ stack | $O(N)$ table | $\Theta(1)$ constant variables |
| **Unvisited States** | Evaluates only needed states | Evaluates all table cells | Evaluates all required cells |

```text
prev2 = 0, prev1 = 1
Step 2: curr = 0 + 1 = 1  -> prev2 = 1, prev1 = 1
Step 3: curr = 1 + 1 = 2  -> prev2 = 1, prev1 = 2
Step 4: curr = 1 + 2 = 3  -> prev2 = 2, prev1 = 3
Eliminates full vector array storage entirely!
```

> [!IMPORTANT]
> **Topological State Evaluation Ordering:**
> When writing bottom-up tabulation, loop indices must follow a topological sort of the subproblem dependency DAG. A state $dp[i]$ or $dp[i][j]$ can only be evaluated after all subproblem states it references (such as $dp[i-1]$ or $dp[i][j-1]$) have already been computed.

> [!WARNING]
> Deep Top-Down recursion triggers a Stack Overflow crash for $N > 10^5$. Always convert deep recursive states into iterative Bottom-Up Tabulation.

Let's now examine linear step recurrences and cost path traversals.






#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear time.
- **Auxiliary Space:** $O(1)$ auxiliary space for space-optimized tabulation.

---






## Linear Recurrence Sequences






### Linear State Transitions — Step Recurrences & Fibonacci Ladders

Building on Chapter 2's dynamic programming principles, linear state transitions compute outcomes by accumulating overlapping subproblems.

For example, when ascending an $N$-step ladder with 1-step or 2-step leaps, step $N$ is reached strictly from $N-1$ or $N-2$, giving the linear recurrence $dp[N] = dp[N-1] + dp[N-2]$.

```text
To reach step N:
Option 1: Leap 1 step from step (N-1) -> dp[N-1] ways
Option 2: Leap 2 steps from step (N-2) -> dp[N-2] ways
Total ways: dp[N] = dp[N-1] + dp[N-2]  (Fibonacci recurrence)
```

Memory drops from $O(N)$ down to $O(1)$ by maintaining only the previous two scalar values:

$$dp[i] = dp[i - 1] + dp[i - 2], \quad dp[1] = 1, \; dp[2] = 2$$

Let's implement step trajectory counting and minimum toll ascent in C++.

```cpp
// Count Distinct Step Trajectories: O(N) Time, O(1) Space
int count_ascent_step_trajectories(int n) {
    if (n <= 2) return n;
    int prev2 = 1, prev1 = 2;

    for (int i = 3; i <= n; ++i) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}

// Minimum Toll Ascent Path: O(N) Time, O(1) Space
int min_toll_ascent_path(const vector<int>& checkpoint_tolls) {
    int n = checkpoint_tolls.size();
    int prev2 = 0, prev1 = 0;

    for (int i = 2; i <= n; ++i) {
        int curr = min(prev1 + checkpoint_tolls[i - 1], prev2 + checkpoint_tolls[i - 2]);
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
```





#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear single pass.
- **Auxiliary Space:** $O(1)$ constant rolling memory.

---






### Non-Adjacent Selection Invariants — Linear & Circular Configurations

The non-adjacent selection problem maximizes total value harvested from an array such that no two adjacent elements are chosen simultaneously.

At each element $i$, we make a binary choice: either skip element $i$ (retaining $dp[i-1]$), or pick element $i$ plus the best solution from $dp[i-2]$.

```text
At element i with value val[i]:
Choice 1 (Exclude): dp[i-1]
Choice 2 (Include): val[i] + dp[i-2]
Transition: dp[i] = max(dp[i-1], val[i] + dp[i-2])
```

For circular rings where index 0 and $N-1$ are adjacent, we evaluate two linear sub-ranges: $[0, N-2]$ and $[1, N-1]$, taking the maximum of both.

$$\text{MaxCircular} = \max(\text{Solve}(0, N - 2), \; \text{Solve}(1, N - 1))$$

Let's implement linear and circular transmitter power allocation in C++.

```cpp
// Linear Transmitter Power Selection: O(N) Time, O(1) Space
int max_linear_transmitter_power(const vector<int>& tower_power, int start, int end) {
    int prev2 = 0, prev1 = 0;

    for (int i = start; i <= end; ++i) {
        int curr = max(prev1, tower_power[i] + prev2);
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}

// Circular Ring Topology Selection: O(N) Time, O(1) Space
int max_circular_transmitter_power(const vector<int>& tower_power) {
    int n = tower_power.size();
    if (n == 1) return tower_power[0];

    int case1 = max_linear_transmitter_power(tower_power, 0, n - 2); // Exclude last tower
    int case2 = max_linear_transmitter_power(tower_power, 1, n - 1); // Exclude first tower
    return max(case1, case2);
}
```




#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear time.
- **Auxiliary Space:** $O(1)$ constant rolling memory.

---






## 2D Grid & String Alignment DP






### 2D Grid DP — Waypoint Counting & Obstacle Pruning

In 2D grid waypoint counting, an entity moves strictly Right and Down from top-left $(0, 0)$ to bottom-right $(M-1, N-1)$.

Because cell $(r, c)$ is reachable only from top neighbor $(r-1, c)$ and left neighbor $(r, c-1)$, the total paths equal the sum of paths to both adjacent neighbors, setting obstacle cells to 0.

```text
[ (0,0): 1 ] ---> [ (0,1): 1 ] ---> [ (0,2): 1 ]
     |                 |                 |
     v                 v                 v
[ (1,0): 1 ] ---> [ (1,1): OBSTACLE=0 ] -> [ (1,2): 1 ]
     |                                   |
     v                                   v
[ (2,0): 1 ] ---> [ (2,1): 1 ] --------> [ (2,2): 2 ] (Target!)
```

The dynamic programming recurrence evaluates cell reachability in $O(1)$ space per row:

$$dp[c] = (\text{grid}[r][c] == 1) \; ? \; 0 : (dp[c] + dp[c - 1])$$

Let's implement path counting with obstacle pruning using a 1D rolling row buffer.

```cpp
// Robot Grid Routing with Hazard Blocks: O(M * N) Time, O(N) Space
int count_robot_paths_with_hazards(const vector<vector<int>>& facility_grid) {
    int m = facility_grid.size(), n = facility_grid[0].size();
    if (facility_grid[0][0] == 1 || facility_grid[m - 1][n - 1] == 1) return 0;

    vector<long long> dp(n, 0);
    dp[0] = 1;

    for (int r = 0; r < m; ++r) {
        for (int c = 0; c < n; ++c) {
            if (facility_grid[r][c] == 1) {
                dp[c] = 0; // Hazard cell; no paths traverse through here
            } else if (c > 0) {
                dp[c] += dp[c - 1]; // Sum paths from left cell
            }
        }
    }
    return dp[n - 1];
}
```



#### Complexity Analysis
- **Time Complexity:** $\Theta(M \cdot N)$ visiting every grid cell once.
- **Auxiliary Space:** $O(N)$ memory for a single 1D row buffer.

---






### 2D Grid DP — Minimum Cost Matrix Traversal

Minimum cost matrix traversal finds a path from top-left $(0, 0)$ to bottom-right $(M-1, N-1)$ that minimizes the cumulative sum of visited cell weights.

At each cell $(r, c)$, we take the minimum of the accumulated costs from the top and left neighbors and add the current cell's weight.

```text
Matrix Cost Grid:                     Accumulated Min DP Grid:
[ 1,  3,  1 ]                         [ 1,  4,  5 ]
[ 1,  5,  1 ]   ------------------>   [ 2,  7,  6 ]
[ 4,  2,  1 ]                         [ 6,  8,  7 ] -> Min Cost = 7
```

The transition equation determines minimal cost in $O(N)$ memory:

$$dp[c] = \text{grid}[r][c] + \min(dp[c], \; dp[c - 1])$$

Let's implement minimum energy terrain traversal using a 1D rolling array.

```cpp
// Topographical Minefield Traversal: O(M * N) Time, O(N) Space
int min_energy_terrain_traversal(const vector<vector<int>>& elevation_grid) {
    int m = elevation_grid.size(), n = elevation_grid[0].size();
    vector<int> dp(n, 1e9);
    dp[0] = 0;

    for (int r = 0; r < m; ++r) {
        dp[0] += elevation_grid[r][0]; // First column can only come from top
        for (int c = 1; c < n; ++c) {
            dp[c] = elevation_grid[r][c] + min(dp[c], dp[c - 1]);
        }
    }
    return dp[n - 1];
}
```


#### Complexity Analysis
- **Time Complexity:** $\Theta(M \cdot N)$ linear grid pass.
- **Auxiliary Space:** $O(N)$ row memory.

---






### String Alignment DP — Sequence Mutation Distance

Sequence mutation distance calculates the minimum number of single-character operations (Insert, Delete, Substitute) needed to convert string $A$ into string $B$.

When characters match ($A[i-1] == B[j-1]$), cost is zero ($dp[i-1][j-1]$). When characters mismatch, we take the minimum of Insert, Delete, and Substitute plus 1.

```text
Alignment State dp[i][j]:
Match:     A[i-1] == B[j-1] -> dp[i-1][j-1] (Zero added cost)
Mismatch:  1 + min of:
  - Insert:     dp[i][j-1]     (Add character from B)
  - Delete:     dp[i-1][j]     (Drop character from A)
  - Substitute: dp[i-1][j-1]   (Replace A[i-1] with B[j-1])
```

The dynamic programming recurrence captures all three editing actions:

$$dp[i][j] = \begin{cases} dp[i-1][j-1] & \text{if } A[i-1] = B[j-1] \\ 1 + \min(dp[i-1][j], \; dp[i][j-1], \; dp[i-1][j-1]) & \text{otherwise} \end{cases}$$

Let's implement sequence mutation distance with $O(N)$ space in C++.

```cpp
// Transcript Mutation Distance: O(M * N) Time, O(N) Space
int min_mutation_alignment_distance(const string& raw_text, const string& target_text) {
    int m = raw_text.size(), n = target_text.size();
    vector<int> dp(n + 1);

    for (int j = 0; j <= n; ++j) dp[j] = j;

    for (int i = 1; i <= m; ++i) {
        int prev_diagonal = dp[0];
        dp[0] = i; // Cost of deleting all characters from raw_text[0..i-1]

        for (int j = 1; j <= n; ++j) {
            int temp = dp[j];
            if (raw_text[i - 1] == target_text[j - 1]) {
                dp[j] = prev_diagonal;
            } else {
                dp[j] = 1 + min({dp[j], dp[j - 1], prev_diagonal});
            }
            prev_diagonal = temp;
        }
    }
    return dp[n];
}
```

#### Complexity Analysis
- **Time Complexity:** $\Theta(|A| \cdot |B|)$ quadratic time.
- **Auxiliary Space:** $O(|B|)$ using two 1D row buffers.

---






## Cheat Sheet & Quick Reference

| DP Problem | Recurrence State Formulation | Base Cases | Complexity |
| :--- | :--- | :--- | :--- |
| **Fibonacci / Steps** | $dp[i] = dp[i-1] + dp[i-2]$ | $dp[0]=0, dp[1]=1$ | $\Theta(N)$ / $O(1)$ Space |
| **Min Cost Stairs** | $dp[i] = \min(dp[i-1]+c_{i-1}, dp[i-2]+c_{i-2})$ | $dp[0]=0, dp[1]=0$ | $\Theta(N)$ / $O(1)$ Space |
| **Non-Adjacent Choice**| $dp[i] = \max(dp[i-1], \; \text{val}[i] + dp[i-2])$ | $dp[0]=v_0, dp[1]=\max(v_0, v_1)$ | $\Theta(N)$ / $O(1)$ Space |
| **Circular Selection** | $\max(\text{Rob}(0 \dots N-2), \; \text{Rob}(1 \dots N-1))$ | Split into 2 linear passes | $\Theta(N)$ / $O(1)$ Space |
| **Unique Grid Paths** | $dp[r][c] = dp[r-1][c] + dp[r][c-1]$ | $dp[0]=1$; 0 if obstacle | $\Theta(M \cdot N)$ / $O(N)$ Space |
| **Min Path Sum** | $dp[r][c] = \text{grid}[r][c] + \min(dp_{\text{top}}, dp_{\text{left}})$ | Boundary prefixes | $\Theta(M \cdot N)$ / $O(N)$ Space |
| **Mutation Distance** | Match: $dp[i-1][j-1]$; Else $1 + \min(\text{Ins}, \text{Del}, \text{Rep})$| $dp[i][0]=i, dp[0][j]=j$ | $\Theta(M \cdot N)$ / $O(N)$ Space |
