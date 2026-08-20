# Chapter 33: Classic DP Problems

---




## Knapsack & Subset Sum Paradigms




### 0/1 Knapsack & The Subset Sum Reduction Family

The 0/1 Knapsack problem selects items with weights $w_i$ and values $v_i$ to maximize total value without exceeding capacity $W$.

In the equal payload partition problem, we check if a set of data chunks can be bisected into two disjoint subsets of equal weight $\text{target} = \text{TotalSum} / 2$.

```text
Target Quota = 11,  Current Item Weight = 5
Scan backward from 11 down to 5:
dp[11] = dp[11] || dp[11 - 5] = dp[11] || dp[6]
Backward scan prevents counting the SAME item multiple times!
```

The single-array space optimization recurrence runs right-to-left:

$$dp[w] = dp[w] \lor dp[w - \text{chunk}[i]] \quad (\text{for } w = \text{target} \dots \text{chunk}[i])$$

Let's implement server payload bisection in C++.

```cpp
// Server Payload Bisection: O(N * Target) Time, O(Target) Space
bool can_bisect_server_payloads(const vector<int>& chunk_weights) {
    int total_sum = 0;
    for (int w : chunk_weights) total_sum += w;

    if (total_sum % 2 != 0) return false; // Odd sum cannot be bisected equally
    int target = total_sum / 2;

    vector<bool> dp(target + 1, false);
    dp[0] = true; // Base case: sum 0 is always achievable

    for (int weight : chunk_weights) {
        for (int w = target; w >= weight; --w) {
            dp[w] = dp[w] || dp[w - weight];
        }
    }
    return dp[target];
}
```

> [!IMPORTANT]
> **Direction Invariant: 0/1 vs Unbounded Knapsack Loop Direction:**
> - **0/1 Knapsack (Reverse Loop):** Running the inner loop backwards (`w = W down to weight`) Running the inner loop backwards ensures that state $dp[w]$ queries values from the *previous* item's calculation, guaranteeing each item is selected at most once.
> - **Unbounded Knapsack (Forward Loop):** Running the inner loop forwards (`w = weight up to W`) Running the inner loop forwards allows state $dp[w]$ to build upon updated values from the *current* item pass, enabling unlimited item reuse.

#### Complexity Analysis
- **Time Complexity:** $\Theta(N \cdot W)$ pseudo-polynomial time.
- **Auxiliary Space:** $O(W)$ memory using a single 1D capacity buffer.

---




### Unbounded Knapsack & Resource Package Dispensation

Unbounded knapsack problems allow an infinite supply of each item type, meaning each resource package size can be used repeatedly.

When calculating the minimum packages to dispense exact quota $Q$, we iterate package weights in forward ascending order, allowing multiple uses of the same package size.

```text
Quota Q = 7,  Package Size = 3
Forward scan from 3 up to 7:
dp[3] = 1 + dp[0] = 1,  dp[6] = 1 + dp[3] = 2 (Uses package 3 TWICE!)
Forward scan naturally allows unbounded item reuse!
```

The minimum package recurrence is:

$$dp[w] = \min(dp[w], \; 1 + dp[w - \text{pkg}[i]]) \quad (\text{for } w = \text{pkg}[i] \dots Q)$$

Let's implement minimum package dispensation and combination counting in C++.

```cpp
// Minimum Resource Packages Dispensed: O(N * Quota) Time, O(Quota) Space
int min_resource_packages_dispensed(const vector<int>& package_sizes, int quota) {
    vector<int> dp(quota + 1, 1e9);
    dp[0] = 0;

    for (int pkg : package_sizes) {
        for (int w = pkg; w <= quota; ++w) {
            if (dp[w - pkg] != 1e9) {
                dp[w] = min(dp[w], 1 + dp[w - pkg]);
            }
        }
    }
    return (dp[quota] == 1e9) ? -1 : dp[quota];
}

// Total Unique Package Dispensation Combinations: O(N * Quota) Time
int total_package_dispensation_combinations(int quota, const vector<int>& package_sizes) {
    vector<int> dp(quota + 1, 0);
    dp[0] = 1;

    for (int pkg : package_sizes) {
        for (int w = pkg; w <= quota; ++w) {
            dp[w] += dp[w - pkg];
        }
    }
    return dp[quota];
}
```


#### Complexity Analysis
- **Time Complexity:** $\Theta(N \cdot W)$ pseudo-polynomial time.
- **Auxiliary Space:** $O(W)$ memory using a 1D capacity buffer.

---




## Subsequence & String Alignment Families




### Shared Ancestry Sequence Alignment & Reconstruction (LCS)

Genetic shared ancestry alignment reconstructs the longest common nucleotide sequence present across both genome fragments $A$ and $B$ in $O(M \cdot N)$ time.

We construct a 2D matrix $dp[i][j]$ storing the LCS of prefixes $A[0 \dots i-1]$ and $B[0 \dots j-1]$, then backtrack from $(M, N)$ back to $(0, 0)$ to reconstruct the shared string.

```text
If A[i-1] == B[j-1]: dp[i][j] = 1 + dp[i-1][j-1] (Move Diagonally)
If A[i-1] != B[j-1]: dp[i][j] = max(dp[i-1][j], dp[i][j-1])
Backtrack: Follow matching diagonal cells to reconstruct characters!
```

The dynamic programming recurrence computes the shared nucleotide sequence length:

$$dp[i][j] = \begin{cases} 1 + dp[i-1][j-1] & \text{if } A[i-1] = B[j-1] \\ \max(dp[i-1][j], \; dp[i][j-1]) & \text{if } A[i-1] \ne B[j-1] \end{cases}$$

Let's implement LCS with full string reconstruction in C++.

```cpp
// Reconstruct Longest Shared DNA Subsequence: O(M * N) Time, O(M * N) Space
string reconstruct_longest_shared_dna_subsequence(const string& dna1, const string& dna2) {
    int m = dna1.size(), n = dna2.size();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));

    for (int i = 1; i <= m; ++i) {
        for (int j = 1; j <= n; ++j) {
            if (dna1[i - 1] == dna2[j - 1]) {
                dp[i][j] = 1 + dp[i - 1][j - 1];
            } else {
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Backtrack to extract reconstructed shared sequence
    string lcs_str = "";
    int i = m, j = n;
    while (i > 0 && j > 0) {
        if (dna1[i - 1] == dna2[j - 1]) {
            lcs_str.push_back(dna1[i - 1]);
            i--; j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }
    reverse(lcs_str.begin(), lcs_str.end());
    return lcs_str;
}
```

#### Complexity Analysis
- **Time Complexity:** $\Theta(M \cdot N)$ quadratic time.
- **Auxiliary Space:** $O(M \cdot N)$ for matrix reconstruction; $O(\min(M, N))$ for length-only.

---




### Shortest Common Supersequence & Palindromic Subsequences

The Shortest Common Supersequence (SCS) of strings $A$ and $B$ is the shortest string that contains both $A$ and $B$ as subsequences.

The SCS Length Theorem proves that the supersequence length equals the sum of both string lengths minus their LCS length, emitting common characters once.

```text
String A: "abac",  String B: "cab"
LCS(A, B) = "ab" (Length = 2)
Length of SCS = |A| + |B| - |LCS| = 4 + 3 - 2 = 5
SCS String = "cabac" (Contains "abac" and "cab" as subsequences!)
```

The mathematical relationships link supersequences and palindromes to LCS.

$$|SCS(A, B)| = |A| + |B| - |LCS(A, B)|, \quad |LPS(S)| = |LCS(S, \text{reverse}(S))|$$

Let's implement the Shortest Common Supersequence builder in C++.

```cpp
// Shortest Common Supersequence (SCS) String Reconstruction
string shortest_common_supersequence(const string& str1, const string& str2) {
    int m = str1.size(), n = str2.size();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));

    for (int i = 1; i <= m; ++i) {
        for (int j = 1; j <= n; ++j) {
            if (str1[i - 1] == str2[j - 1]) dp[i][j] = 1 + dp[i - 1][j - 1];
            else dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
        }
    }

    string scs = "";
    int i = m, j = n;
    while (i > 0 && j > 0) {
        if (str1[i - 1] == str2[j - 1]) {
            scs += str1[i - 1]; // Common character included once
            i--; j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            scs += str1[i - 1];
            i--;
        } else {
            scs += str2[j - 1];
            j--;
        }
    }
    while (i > 0) scs += str1[--i];
    while (j > 0) scs += str2[--j];

    reverse(scs.begin(), scs.end());
    return scs;
}
```

| String $S$ | Reversed String $\text{rev}(S)$ | $\text{LCS}(S, \text{rev}(S))$ | Longest Palindromic Subsequence | Minimum Insertions to Make Palindrome |
| :--- | :--- | :--- | :--- | :--- |
| `"bbbab"` | `"babbb"` | `"bbbb"` (Len 4) | `"bbbb"` | $|S| - 4 = 5 - 4 = 1$ (Insert `'a'`) |
| `"cbbd"` | `"dbbc"` | `"bb"` (Len 2) | `"bb"` | $|S| - 2 = 4 - 2 = 2$ |

```text
S = "bbbab"  ===>  rev(S) = "babbb"
Running standard LCS against its reversed string computes LPS in O(N^2)
```

> [!IMPORTANT]
> The minimum number of insertions or deletions required to make a string $S$ a palindrome equals $|S| - \text{LPS}(S)$.

Let's now examine string alignment conversions and Single Mutation Distance.




#### Complexity Analysis
- **Time Complexity:** $\Theta(M \cdot N)$ quadratic time.
- **Auxiliary Space:** $O(M \cdot N)$ matrix memory.

---




## String Alignments & Multi-Agent Grid Walks




### String Alignment Conversions & Single Mutation Distance Extensions

Transforming String $A$ to String $B$ using only deletions and insertions reduces directly to finding their Longest Common Shared Subsequence.

We delete all characters in $A$ not present in the LCS and insert all characters in $B$ not present in the LCS.

```text
String A ("sea")  ---(Delete 's')---> LCS ("ea")
LCS ("ea")        ---(Insert 't')---> String B ("eat")
Total Deletions = |A| - |LCS| = 3 - 2 = 1
Total Insertions = |B| - |LCS| = 3 - 2 = 1
Total Operations = 1 + 1 = 2!
```

The conversion equation computes the total edit operations.

$$\text{Min Operations}(A \to B) = (|A| - \text{LCS}(A, B)) + (|B| - \text{LCS}(A, B)) = |A| + |B| - 2 \cdot \text{LCS}(A, B)$$

Let's implement Single Mutation Distance validation in linear $O(N)$ time.

```cpp
// Single Mutation Distance: O(N) Time, O(1) Space
bool is_one_edit_distance(const string& s, const string& t) {
    int m = s.size(), n = t.size();
    if (abs(m - n) > 1) return false;

    for (int i = 0; i < min(m, n); ++i) {
        if (s[i] != t[i]) {
            if (m == n) {
                // Replacement check
                return s.substr(i + 1) == t.substr(i + 1);
            } else if (m < n) {
                // Insertion into s (Deletion from t)
                return s.substr(i) == t.substr(i + 1);
            } else {
                // Deletion from s
                return s.substr(i + 1) == t.substr(i);
            }
        }
    }
    return abs(m - n) == 1; // Difference is the trailing character
}
```

| Source $A$ | Target $B$ | Length Diff $|A| - |B|$ | Operation Identified | Is Single Mutation Valid? |
| :--- | :--- | :--- | :--- | :--- |
| `"ab"` | `"acb"` | $-1$ | Insert `'c'` at index 1 | `true` |
| `"cab"` | `"ad"` | $+1$ | Multiple mismatches | `false` |
| `"1203"` | `"1213"` | $0$ | Replace `'0'` with `'1'` | `true` |

```text
Compare characters until first mismatch at index i:
If lengths equal  : Check if s[i+1..] == t[i+1..] (Single replace)
If lengths differ : Check if s[i..] == t[i+1..]   (Single insert)
```

> [!TIP]
> When only insert and delete operations are permitted, total mutation steps simplify to $|A| + |B| - 2 \cdot \text{LCS}(A, B)$.

Let's now study simultaneous multi-agent grid traversals.




#### Complexity Analysis
- **Time Complexity:** $O(\min(M, N))$ linear scan for Single Mutation Distance.
- **Auxiliary Space:** $O(1)$ constant space.

---




### Grid Path Optimizations — Weights, Obstacles & Simultaneous Walks

In Cherry Pickup / Multi-Agent Grid Walks, two agents walk simultaneously from $(0, 0)$ to $(N-1, N-1)$ to collect maximum values without double-counting shared cells.

Independent greedy passes fail because path 1 can greedily claim cells that block a globally superior combined path 2.

```text
Both agents move simultaneously at time step t = r1 + c1 = r2 + c2:
Coordinate r2 is derived implicitly: r2 = r1 + c1 - c2
If (r1 == r2 && c1 == c2) -> Add grid[r1][c1] ONCE (No double count!)
Reduces state space from 4D O(N^4) to 3D O(N^3)!
```

Deriving $r_2 = r_1 + c_1 - c_2$ allows us to represent the simultaneous state in 3D.

$$\text{Time Step Invariant: } r_1 + c_1 = r_2 + c_2 = t \implies r_2 = r_1 + c_1 - c_2$$

Let's implement the simultaneous two-agent Cherry Pickup solver in C++.

```cpp
// Simultaneous Two-Agent Grid Walk (Cherry Pickup): O(N^3) Time, O(N^3) Space
int memo_two_agents(int r1, int c1, int c2, int n, const vector<vector<int>>& grid, vector<vector<vector<int>>>& memo) {
    int r2 = r1 + c1 - c2;
    // Boundary and obstacle guards
    if (r1 >= n || c1 >= n || r2 >= n || c2 >= n || grid[r1][c1] == -1 || grid[r2][c2] == -1) {
        return -1e9;
    }
    if (r1 == n - 1 && c1 == n - 1) return grid[r1][c1]; // Destination reached
    if (memo[r1][c1][c2] != -1) return memo[r1][c1][c2];

    int cherries = (r1 == r2 && c1 == c2) ? grid[r1][c1] : (grid[r1][c1] + grid[r2][c2]);

    // 4 Simultaneous Transitions: (Down, Down), (Down, Right), (Right, Down), (Right, Right)
    int max_next = max({
        memo_two_agents(r1 + 1, c1, c2, n, grid, memo),     // Down, Down
        memo_two_agents(r1 + 1, c1, c2 + 1, n, grid, memo), // Down, Right
        memo_two_agents(r1, c1 + 1, c2, n, grid, memo),     // Right, Down
        memo_two_agents(r1, c1 + 1, c2 + 1, n, grid, memo)  // Right, Right
    });

    return memo[r1][c1][c2] = (max_next < 0 ? -1e9 : cherries + max_next);
}

int cherry_pickup(const vector<vector<int>>& grid) {
    int n = grid.size();
    vector<vector<vector<int>>> memo(n, vector<vector<int>>(n, vector<int>(n, -1)));
    int res = memo_two_agents(0, 0, 0, n, grid, memo);
    return max(0, res);
}
```

| Step $t = r + c$ | Agent 1 $(r_1, c_1)$ | Agent 2 $(r_2, c_2)$ | Same Cell? | Cherries Collected |
| :--- | :--- | :--- | :--- | :--- |
| $t=0$ | $(0, 0)$ | $(0, 0)$ | **Yes** | `grid[0][0]` (Counted once) |
| $t=1$ | $(1, 0)$ | $(0, 1)$ | No | `grid[1][0] + grid[0][1]` |
| $t=2$ | $(1, 1)$ | $(1, 1)$ | **Yes** | `grid[1][1]` (Counted once) |

```text
Agent 1 Moves: [ Down | Right ]
Agent 2 Moves: [ Down | Right ]
2 x 2 = 4 simultaneous branching transitions explored per step!
```

> [!CAUTION]
> If both agents land on the exact same cell $(r_1 == r_2 \land c_1 == c_2)$, collect the cell's value only once to prevent double-counting.

This completes the Classic DP Problems chapter, establishing comprehensive mastery over 0/1 and unbounded knapsacks, LCS/SCS supersequences, string conversion metrics, and multi-agent 3D grid pathfinding.




#### Complexity Analysis
- **Time Complexity:** $O(N^3)$ states with constant 4 transitions per state.
- **Auxiliary Space:** $O(N^3)$ 3D memoization memory.

---




## Cheat Sheet & Quick Reference

| DP Pattern | Loop Direction / Order | Invariant Formula | Space Complexity |
| :--- | :--- | :--- | :--- |
| **0/1 Knapsack** | $w = W \dots \text{wt}[i]$ **(Backwards)**| $dp[w] = \max(dp[w], v + dp[w - w_i])$ | $O(W)$ |
| **Unbounded Knapsack**| $w = \text{wt}[i] \dots W$ **(Forwards)** | $dp[w] = \max(dp[w], v + dp[w - w_i])$ | $O(W)$ |
| **Coin Combinations** | Denomination loop **OUTSIDE** | $dp[w] += dp[w - c]$ | $O(W)$ |
| **LCS** | $i = 1 \dots M, j = 1 \dots N$ | Match: $1 + dp[i-1][j-1]$; Else $\max$ | $O(\min(M, N))$ |
| **SCS Length** | Formula calculation | $|A| + |B| - \text{LCS}(A, B)$ | $O(M \cdot N)$ |
| **LPS** | Reversed string LCS | $\text{LCS}(S, \text{reverse}(S))$ | $O(N)$ |
| **Single Mutation Distance** | Linear two-pointer scan | Compare suffixes after first mismatch | $O(1)$ |
| **Simultaneous Walk** | $t = r_1 + c_1 = r_2 + c_2$ | $r_2 = r_1 + c_1 - c_2$; 4 transitions | $O(N^3)$ |
