# Chapter 11: Subarrays & Prefix Sums

---


## Subarray Segment Math


### Subarray vs Subsequence vs Subset Structural Invariants

Let's step up to the whiteboard and clarify three terms that candidates mix up constantly during technical interviews: subarrays, subsequences, and subsets.

A subarray is a contiguous slice, a subsequence preserves original relative order while dropping elements, and a subset is an arbitrary unordered collection.

```text
Contiguous Slice (Subarray)     : [ B, C ]      (Contiguous & Ordered)
Sparse Order (Subsequence)      : [ A, C, D ]   (Sparse & Ordered)
Unordered Selection (Subset)    : { D, A }      (Arbitrary & Set)
```

An array of size $N$ yields quadratically many subarrays, exponentially many subsequences, and an identical power set of subsets.

$$N_{\text{subarrays}} = \frac{N(N+1)}{2} = \Theta(N^2), \quad N_{\text{subsequences}} = 2^N - 1 = \Theta(2^N), \quad N_{\text{subsets}} = 2^N = \Theta(2^N)$$

Let's write generator routines contrasting polynomial contiguous slices against exponential bitmask selections.

```cpp
// Generate all contiguous subarrays: O(N^2) Time, O(1) Aux Space
void print_all_subarrays(const vector<int>& arr) {
    int n = arr.size();
    for (int start = 0; start < n; ++start) {
        for (int end = start; end < n; ++end) {
            // arr[start..end] is a valid contiguous slice
        }
    }
}

// Generate all subsets via bitmask: O(N * 2^N) Time, O(1) Aux Space
void print_all_subsets(const vector<int>& arr) {
    int n = arr.size();
    int total_masks = 1 << n;
    for (int mask = 0; mask < total_masks; ++mask) {
        for (int i = 0; i < n; ++i) {
            if (mask & (1 << i)) {
                // arr[i] included in current subset
            }
        }
    }
}
```

We can also generate subsequences recursively by branching on whether we include or skip each element.

```cpp
// Recursive subsequence generation preserving relative order
void generate_subsequences(const vector<int>& arr, int idx, vector<int>& current) {
    if (idx == arr.size()) {
        // current holds a complete subsequence
        return;
    }
    // Choice 1: Pick current element
    current.push_back(arr[idx]);
    generate_subsequences(arr, idx + 1, current);
    current.pop_back();

    // Choice 2: Skip current element
    generate_subsequences(arr, idx + 1, current);
}
```

| Structure Type | Contiguity Required? | Relative Order Preserved? | Total Count for Size $N$ | Enumeration Time |
| :--- | :--- | :--- | :--- | :--- |
| **Subarray** | Yes (Strictly adjacent) | Yes | $\frac{N(N+1)}{2}$ | $O(N^2)$ |
| **Subsequence** | No (Gaps allowed) | Yes | $2^N - 1$ (non-empty) | $O(2^N)$ |
| **Subset** | No (Arbitrary grouping) | No (Order irrelevant) | $2^N$ | $O(2^N)$ |

```text
End \ Start   0       1       2       3
  0         [0,0]
  1         [0,1]   [1,1]
  2         [0,2]   [1,2]   [2,2]
  3         [0,3]   [1,3]   [2,3]   [3,3]
Total Cells = 1 + 2 + 3 + ... + N = N*(N+1)/2
```

> [!WARNING]
> Algorithms requiring contiguity like Kadane's or Sliding Window fail completely if applied to non-contiguous subsequences.

Let's now investigate Kadane's optimal strategy for finding the maximum contiguous subarray sum.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N^2)$ for generating all subarrays, $\Theta(2^N)$ for subsequences and subsets.
- **Auxiliary Space:** $O(1)$ for iterative generation, $O(N)$ recursion depth for subsequences.

---


### Kadane's Algorithm & Maximum Contiguous Accumulation

Imagine you are tracking continuous sensor flux variations with mixed positive gains and negative drops, looking for the single most productive continuous interval.

Kadane's algorithm makes an optimal greedy choice at each element: either append the current element to our running accumulator, or dump the past and start a fresh interval.

```text
If running_sum + A[i] > A[i]  ---> EXTEND existing interval
If A[i] >= running_sum + A[i] ---> RESTART new interval at index i
Core Rule: running_sum = max(A[i], running_sum + A[i])
```

The dynamic programming recurrence establishes the maximum contiguous sum ending precisely at index $i$:

$$dp[i] = \max(A[i], \; dp[i - 1] + A[i])$$

Because $dp[i]$ depends solely on $dp[i-1]$, space drops from $O(N)$ down to $O(1)$ using a scalar accumulator.

```text
Array:        [ -5,   -2,   -8,   -1,   -4 ]
current_max:  [ -5 ] [-2]   [-8]  [-1]  [-4]  (Restart at every step)
max_so_far:   [ -5 ] [-2]   [-2]  [-1]  [-1]  (Correct answer: -1)
Rule: Initializing to 0 fails on all-negative inputs; use arr[0]!
```

```cpp
// Maximum Net Energy Gain Window with Boundary Indices: O(N) Time, O(1) Space
int max_net_energy_gain(const vector<int>& energy_deltas, int& best_l, int& best_r) {
    int n = energy_deltas.size();
    int max_so_far = energy_deltas[0];
    int current_max = energy_deltas[0];

    int temp_l = 0;
    best_l = 0;
    best_r = 0;

    for (int i = 1; i < n; ++i) {
        if (energy_deltas[i] > current_max + energy_deltas[i]) {
            current_max = energy_deltas[i]; // Start new window
            temp_l = i;
        } else {
            current_max += energy_deltas[i]; // Extend existing window
        }

        if (current_max > max_so_far) {
            max_so_far = current_max;
            best_l = temp_l;
            best_r = i;
        }
    }
    return max_so_far;
}
```

#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ single pass through the array.
- **Auxiliary Space:** $O(1)$ scalar variables for tracking sums and indices.

---


## Prefix Sum Operations


### 1D Prefix Sums & O(1) Range Sum Queries

When our application handles thousands of range sum requests over static array intervals, querying each range naively in $O(N)$ time causes unacceptable latency.

By building a prefix sum array in a single $O(N)$ pass, we precalculate cumulative totals and answer any subsequent range sum in deterministic $O(1)$ time.

```text
Original:  [ A0,   A1,   A2,   A3,   A4,   A5 ]
Query range:              [<--- L to R --->]
Prefix[R]: [===============================]
Prefix[L-1]:[===========]
Result:    Prefix[R] - Prefix[L-1] = [ A2 + A3 + A4 + A5 ]
```

The mathematical identity defines prefix values and isolates any interval sum in constant time.

$$P[i] = \sum_{k=0}^i A[k], \quad \text{Sum}(L, R) = P[R] - P[L-1] \quad (\text{with } P[-1] = 0)$$

Contrasting an un-indexed $O(N)$ query loop against prefix sums demonstrates why prefix table precomputation is essential for repeated queries.

```cpp
// Naive Range Sum Query: O(N) Time per Query
long long query_naive(const vector<int>& arr, int L, int R) {
    long long total = 0;
    for (int i = L; i <= R; ++i) {
        total += arr[i];
    }
    return total;
}
```

Let's build a production-ready `NumArray` class using 1-based indexing to eliminate boundary checks.

```cpp
// 1-Based Prefix Sum Structure: O(N) Build, O(1) Query
class NumArray {
    vector<long long> prefix;
public:
    NumArray(const vector<int>& nums) {
        int n = nums.size();
        prefix.assign(n + 1, 0);
        for (int i = 0; i < n; ++i) {
            prefix[i + 1] = prefix[i] + nums[i];
        }
    }

    long long sum_range(int left, int right) const {
        // Query [left, right] mapped into 1-based prefix table
        return prefix[right + 1] - prefix[left];
    }
};
```

| Index $i$ (0-based) | Array $A[i]$ | 1-Based Prefix Index | Prefix Value $P[i+1]$ | Evaluated Range Query |
| :--- | :--- | :--- | :--- | :--- |
| - | - | $0$ | $0$ | Baseline zero |
| $0$ | $3$ | $1$ | $0 + 3 = 3$ | $\text{Query}(0,0) = 3 - 0 = 3$ |
| $1$ | $2$ | $2$ | $3 + 2 = 5$ | $\text{Query}(0,1) = 5 - 0 = 5$ |
| $2$ | $-1$ | $3$ | $5 - 1 = 4$ | $\text{Query}(1,2) = 4 - 3 = 1$ |
| $3$ | $6$ | $4$ | $4 + 6 = 10$ | $\text{Query}(1,3) = 10 - 3 = 7$ |
| $4$ | $4$ | $5$ | $10 + 4 = 14$ | $\text{Query}(2,4) = 14 - 5 = 9$ |

```text
Height
14 |                                       +----+ (P[5] = 14)
10 |                             +----+----+
 4 |                   +----+----+
 5 |         +----+----+
 3 |----+----+
 0 +----+----+----+----+----+----+----+----+----+---> Prefix Index
      0    1    2    3    4    5
Range [2, 4] = Height(5) - Height(2) = 14 - 5 = 9
```

> [!CAUTION]
> Cumulative prefix sums readily exceed the 32-bit signed integer limit ($2 \times 10^9$) on large arrays. Always use `long long` for prefix tables.

Let's now apply modular arithmetic to prefix sums to find subarrays divisible by $K$.


#### Complexity Analysis
- **Time Complexity:** $O(N)$ preprocessing time; $O(1)$ worst-case time per range sum query.
- **Auxiliary Space:** $O(N)$ auxiliary space to store the prefix array.

---


### Modular Prefix Sums & Subarrays Divisible by K

Suppose you need to count all contiguous subarrays whose element sum is perfectly divisible by an integer $K$.

Two prefix indices $i < j$ share identical remainder values modulo $K$ if and only if the intervening subarray sum $A[i+1 \dots j]$ is a multiple of $K$.

```text
Prefix Sum P[j] = q2 * K + r
Prefix Sum P[i] = q1 * K + r
Subarray Sum = P[j] - P[i] = (q2 - q1) * K + (r - r) = Q * K
Remainder matches -> Subarray between them is perfectly divisible!
```

The modular congruence formula validates this prefix property.

$$\sum_{m=i+1}^j A[m] \equiv 0 \pmod K \iff P[j] \equiv P[i] \pmod K$$

Let's look at the naive quadratic check first.

```cpp
// Naive Subarrays Divisible by K: O(N^2) Time, O(1) Space
int count_divisible_naive(const vector<int>& nums, int k) {
    int n = nums.size(), count = 0;
    for (int i = 0; i < n; ++i) {
        long long current_sum = 0;
        for (int j = i; j < n; ++j) {
            current_sum += nums[j];
            if (current_sum % k == 0) count++;
        }
    }
    return count;
}
```

Now let's build the optimal $O(N)$ solver using a frequency map and normalized remainder math.

```cpp
// Subarrays Divisible by K: O(N) Time, O(K) Space
int subarrays_div_by_k(const vector<int>& nums, int k) {
    vector<int> remainder_count(k, 0);
    remainder_count[0] = 1; // Base case: prefix sum 0 has remainder 0

    long long running_sum = 0;
    int total_subarrays = 0;

    for (int num : nums) {
        running_sum += num;
        // Normalize C++ negative modulo to valid range [0, k-1]
        int rem = ((running_sum % k) + k) % k;

        total_subarrays += remainder_count[rem];
        remainder_count[rem]++;
    }
    return total_subarrays;
}
```

| Step $i$ | Num $A[i]$ | Running Sum $P[i]$ | Remainder $R = (P \bmod 5 + 5) \bmod 5$ | Pairs Added | Total Subarrays |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Init | - | $0$ | $0$ | - | $0$ |
| $0$ | $4$ | $4$ | $4$ | $0$ | $0$ |
| $1$ | $5$ | $9$ | $4$ | $+1$ (matches step 0) | $1$ |
| $2$ | $0$ | $9$ | $4$ | $+2$ (matches init & 1) | $3$ |
| $3$ | $-2$ | $7$ | $2$ | $0$ | $3$ |
| $4$ | $-3$ | $4$ | $4$ | $+3$ (matches 0, 1, 2) | $6$ |
| $5$ | $1$ | $5$ | $0$ | $+1$ (matches init) | **7** |

```text
Bucket Rem 0: [ Init, Step 5 ]       ---> Pairs: C(2, 2) = 1
Bucket Rem 2: [ Step 3 ]             ---> Pairs: C(1, 2) = 0
Bucket Rem 4: [ Step 0, 1, 2, 4 ]    ---> Pairs: C(4, 2) = 6
Total Divisible Subarrays = 1 + 0 + 6 = 7
```

> [!WARNING]
> In C++, the `%` operator preserves the sign of negative dividends (e.g. `-7 % 5 = -2`). Always use `((val % k) + k) % k` to prevent negative array indexing.

Let's now expand prefix sum techniques into two-dimensional matrices.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear pass over the input array.
- **Auxiliary Space:** $O(K)$ array or hash table to store remainder frequencies.

---


### 2D Prefix Sums & Matrix Region Sums (Inclusion-Exclusion Principle)

Imagine querying the total pixel brightness across thousands of arbitrary rectangular screen regions in a high-performance graphics engine.

By computing a 2D prefix table using the Principle of Inclusion-Exclusion, any arbitrary rectangular subgrid sum can be evaluated in exactly 4 memory lookups.

```text
(0,0)--------------+-------------------+
  |  Top-Left (D)  |      Top (B)      |
  |  [r1-1, c1-1]  |    [r1-1, c2]     |
  +----------------+-------------------+
  |  Left (C)      | TARGET REGION (A) |
  |  [r2, c1-1]    |    [r2, c2]       |
  +----------------+-------------------+
Area(A) = Pref[r2][c2] - Pref[r1-1][c2] - Pref[r2][c1-1] + Pref[r1-1][c1-1]
```

The 2D prefix precomputation and region query formulas apply inclusion-exclusion symmetrically.

$$P[r][c] = A[r][c] + P[r-1][c] + P[r][c-1] - P[r-1][c-1]$$

$$\text{RegionSum}(r_1, c_1, r_2, c_2) = P[r_2][c_2] - P[r_1-1][c_2] - P[r_2][c_1-1] + P[r_1-1][c_1-1]$$

Let's implement the complete `NumMatrix` class with safe 1-based indexing.

```cpp
// 2D Prefix Sum Matrix: O(R * C) Precomputation, O(1) Query
class NumMatrix {
    vector<vector<long long>> pref;
public:
    NumMatrix(const vector<vector<int>>& matrix) {
        if (matrix.empty() || matrix[0].empty()) return;
        int R = matrix.size(), C = matrix[0].size();
        pref.assign(R + 1, vector<long long>(C + 1, 0));

        for (int r = 0; r < R; ++r) {
            for (int c = 0; c < C; ++c) {
                pref[r + 1][c + 1] = matrix[r][c] 
                                   + pref[r][c + 1] 
                                   + pref[r + 1][c] 
                                   - pref[r][c];
            }
        }
    }

    long long sum_region(int r1, int c1, int r2, int c2) const {
        return pref[r2 + 1][c2 + 1] 
             - pref[r1][c2 + 1] 
             - pref[r2 + 1][c1] 
             + pref[r1][c1];
    }
};
```

| Region $(r_1, c_1) \to (r_2, c_2)$ | Positive Terms | Subtracted Terms | Re-added Corner | Final Region Sum |
| :--- | :--- | :--- | :--- | :--- |
| $(0, 0) \to (1, 1)$ | $P[2][2] = 18$ | $P[0][2]=0, P[2][0]=0$ | $P[0][0] = 0$ | $18$ |
| $(1, 1) \to (2, 2)$ | $P[3][3] = 45$ | $P[1][3]=12, P[3][1]=15$ | $P[1][1] = 4$ | $45 - 12 - 15 + 4 = 22$ |
| $(0, 1) \to (2, 2)$ | $P[3][3] = 45$ | $P[0][3]=0, P[3][1]=15$ | $P[0][1] = 0$ | $45 - 15 = 30$ |

```text
Step 1: Take full bottom-right bounding box: +Pref[r2][c2]
Step 2: Subtract entire top slab:            -Pref[r1-1][c2]
Step 3: Subtract entire left slab:           -Pref[r2][c1-1]
Step 4: Add back corner subtracted twice:    +Pref[r1-1][c1-1]
```

> [!TIP]
> Always size the 2D prefix table as $(R+1) \times (C+1)$ with zero-initialized borders to completely avoid branching checks on grid boundaries.

Let's now invert prefix summation into difference arrays to handle batch range updates in $O(1)$ time.


#### Complexity Analysis
- **Time Complexity:** $O(R \cdot C)$ constructor precomputation; $O(1)$ per rectangular subgrid query.
- **Auxiliary Space:** $O(R \cdot C)$ auxiliary memory to store the 2D prefix table.

---


## Difference Array Techniques


### Difference Arrays & Static Range Updates

Suppose you need to execute thousands of interval updates of the form "add value $V$ to all elements from index $L$ to $R$" on an array of size $N$.

Instead of updating all elements naively in $O(N)$ time per query, a difference array applies two boundary adjustments in $O(1)$ time and reconstructs the array in a single final pass.

```text
Operation: Add +V across index range [ L ... R ]
Diff Array:  D[L] += V                (Step UP creates plateau)
             D[R+1] -= V              (Step DOWN ends plateau)
Prefix Sum:  ... 0, 0, V, V, V, V, 0, 0 ...
                       ^           ^
                       L          R+1
```

The differential invariant confirms that prefix integrating the difference array reproduces the updated values.

$$D[i] = A[i] - A[i-1] \implies \text{PrefixSum}(D)[k] = A[k]$$

$$D[L] \mathrel{+}= V, \quad D[R+1] \mathrel{-}= V \implies \Delta(\text{PrefixSum})[k] = V \quad \forall k \in [L, R]$$

Let's build a clean `DifferenceArray` class.

```cpp
// 1D Difference Array: O(1) Range Update, O(N) Reconstruction
class DifferenceArray {
    int n;
    vector<long long> diff;
public:
    DifferenceArray(const vector<int>& initial) {
        n = initial.size();
        diff.assign(n + 1, 0);
        diff[0] = initial[0];
        for (int i = 1; i < n; ++i) {
            diff[i] = initial[i] - initial[i - 1];
        }
    }

    void add_range(int L, int R, long long val) {
        diff[L] += val;
        if (R + 1 < n) diff[R + 1] -= val;
    }

    vector<long long> reconstruct() {
        vector<long long> result(n);
        result[0] = diff[0];
        for (int i = 1; i < n; ++i) {
            result[i] = result[i - 1] + diff[i];
        }
        return result;
    }
};
```

| Index $i$ | Initial Array $A[i]$ | Query 1: $+5$ on $[1,3]$ | Query 2: $+2$ on $[2,4]$ | Final Reconstructed Value |
| :--- | :--- | :--- | :--- | :--- |
| $0$ | $10$ | No change | No change | $10$ |
| $1$ | $10$ | $+5$ applied | No change | $10 + 5 = 15$ |
| $2$ | $10$ | $+5$ maintained | $+2$ applied | $10 + 5 + 2 = 17$ |
| $3$ | $10$ | $+5$ maintained | $+2$ maintained | $10 + 5 + 2 = 17$ |
| $4$ | $10$ | $-5$ canceled | $+2$ maintained | $10 + 2 = 12$ |

```text
Diff Array D:   [ +10,   +5,   +2,    0,   -5,   -2 ]
                  |       |     |     |     |     |
Prefix Sum  :     10  -> 15 -> 17 -> 17 -> 12 -> 10
Final Array :   [ 10,    15,   17,   17,   12,   10 ]
```

> [!WARNING]
> Always verify that $R + 1 < N$ before decrementing `diff[R+1]`. Writing to index $N$ when $R = N-1$ requires sizing the buffer to at least $N+1$.

Let's now generalize the difference technique to two-dimensional grids.


#### Complexity Analysis
- **Time Complexity:** $O(1)$ per range update; $O(N)$ for full array reconstruction.
- **Auxiliary Space:** $O(N)$ memory to maintain the difference array buffer.

---


### 2D Difference Arrays & Grid Range Updates

When applying batch modifications to 2D matrices—such as incrementing rectangular subgrids—applying updates naively takes $O(R \cdot C)$ per operation.

A 2D difference array applies 4 corner delta adjustments in $O(1)$ time, allowing all updates to be accumulated and restored in a single $O(R \cdot C)$ prefix sweep.

```text
(r1, c1) : +V  (Start row & col)     (r1, c2+1)   : -V  (End col)
(r2+1, c1): -V (End row)             (r2+1, c2+1) : +V  (Corner fix)
```

The 4-corner formula ensures that standard 2D prefix integration produces a uniform $+V$ plateau across the bounding box $[r_1 \dots r_2] \times [c_1 \dots c_2]$.

$$D[r_1][c_1] \mathrel{+}= V, \quad D[r_1][c_2+1] \mathrel{-}= V, \quad D[r_2+1][c_1] \mathrel{-}= V, \quad D[r_2+1][c_2+1] \mathrel{+}= V$$

Let's implement the `DifferenceMatrix2D` class.

```cpp
// 2D Difference Matrix: O(1) Region Update, O(R * C) Reconstruction
class DifferenceMatrix2D {
    int R, C;
    vector<vector<long long>> diff;
public:
    DifferenceMatrix2D(int rows, int cols) : R(rows), C(cols) {
        diff.assign(R + 2, vector<long long>(C + 2, 0));
    }

    void update_region(int r1, int c1, int r2, int c2, long long val) {
        diff[r1 + 1][c1 + 1] += val;
        diff[r1 + 1][c2 + 2] -= val;
        diff[r2 + 2][c1 + 1] -= val;
        diff[r2 + 2][c2 + 2] += val;
    }

    vector<vector<long long>> reconstruct() {
        vector<vector<long long>> grid(R, vector<long long>(C, 0));
        for (int r = 1; r <= R; ++r) {
            for (int c = 1; c <= C; ++c) {
                diff[r][c] += diff[r - 1][c] + diff[r][c - 1] - diff[r - 1][c - 1];
                grid[r - 1][c - 1] = diff[r][c];
            }
        }
        return grid;
    }
};
```

| Operation | Top-Left $(r_1, c_1)$ | Top-Right $(r_1, c_2+1)$ | Bottom-Left $(r_2+1, c_1)$ | Bottom-Right $(r_2+1, c_2+1)$ |
| :--- | :--- | :--- | :--- | :--- |
| Add $+3$ on $[0,0] \to [1,1]$ | $+3$ at $(0,0)$ | $-3$ at $(0,2)$ | $-3$ at $(2,0)$ | $+3$ at $(2,2)$ |
| Add $+2$ on $[1,1] \to [2,2]$ | $+2$ at $(1,1)$ | $-2$ at $(1,3)$ | $-2$ at $(3,1)$ | $+2$ at $(3,3)$ |

```text
Sweeping 2D Prefix over Delta Matrix restores exact values:
Row by row, column by column integration spreads +V across rectangle
Negative boundary markers cancel the wave at column c2+1 and row r2+1
```

> [!TIP]
> Size the difference array buffer to $(R+2) \times (C+2)$ to safely handle 1-based offset writes at $r_2+2$ and $c_2+2$ without conditional bounds checks.

This completes the Subarrays and Prefix Sums chapter, mastering contiguous slice math, Kadane's algorithm, 1D/2D range sum lookups, modular prefix remainder pairing, and 1D/2D difference updates.


#### Complexity Analysis
- **Time Complexity:** $O(1)$ per rectangular subgrid update; $O(R \cdot C)$ for single-pass matrix reconstruction.
- **Auxiliary Space:** $O(R \cdot C)$ auxiliary buffer for the 2D difference matrix.

---


## Cheat Sheet & Quick Reference

| Technique | Primary Purpose | Core Formula / Invariant | Complexity (Query / Update) |
| :--- | :--- | :--- | :--- |
| **Kadane's Algorithm** | Maximum Contiguous Sum | `current_max = max(A[i], current_max + A[i])` | $\Theta(N)$ / $O(1)$ |
| **1D Prefix Sums** | Static Range Sum Queries | `Sum(L, R) = Pref[R+1] - Pref[L]` | $O(1)$ / $O(N)$ Build |
| **Modular Prefix Sums** | Subarrays Divisible by $K$ | `(Pref[j] % K == Pref[i] % K) => Divisible` | $\Theta(N)$ / $O(K)$ Space |
| **2D Prefix Sums** | Static Matrix Region Sums | `P[r2][c2] - P[r1-1][c2] - P[r2][c1-1] + P[r1-1][c1-1]` | $O(1)$ / $O(R \cdot C)$ Build |
| **1D Difference Array** | Batch Static Range Updates | `D[L] += V; D[R+1] -= V; PrefixSum(D)` | $O(1)$ Update / $O(N)$ Reconstruct |
| **2D Difference Array** | Batch Grid Region Updates | 4-Corner: `+V, -V, -V, +V; 2D-Prefix(D)` | $O(1)$ Update / $O(R \cdot C)$ Reconstruct |
