# Chapter 13: Binary Search

---




## Core Binary Search Mechanics




### Binary Search Loop Invariants & Midpoint Arithmetic Safety

As established in Chapter 1's logarithmic complexity patterns, binary search bisects a monotonically ordered domain at every comparison step.

The fundamental loop invariant states that if the target element exists in the sorted array, it must reside within the closed search interval $[\text{low}, \text{high}]$.

```text
Initial Search Space: [ 0 ...................................... N-1 ]
Step 1 (Size N/2)   : [ 0 ................. Mid-1 ]
Step 2 (Size N/4)   : [ Mid+1 ......... Mid-1 ]
Step k (Size 1)     : [ Target Found or Exhausted ]
Total Halving Steps : ceil(log2(N)) + 1
```

$$\text{Safe Midpoint: } \text{mid} = \text{low} + \frac{\text{high} - \text{low}}{2} \quad \text{or} \quad \text{mid} = (\text{unsigned}(\text{low}) + \text{unsigned}(\text{high})) \gg 1$$

#### Search Interval Boundary Contracts

| Interval Model | Loop Condition | Left Update | Right Update | Midpoint Formula | Termination State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Closed** `[low, high]` | `while (low <= high)` | `low = mid + 1` | `high = mid - 1` | `low + (high - low) / 2` | `low == high + 1` |
| **Half-Open** `[low, high)` | `while (low < high)` | `low = mid + 1` | `high = mid` | `low + (high - low) / 2` | `low == high` |

Let's write the iterative binary search implementation with overflow protection.

```cpp
// Iterative Binary Search: O(log N) Time, O(1) Aux Space
int binary_search_iterative(const vector<int>& arr, int target) {
    int low = 0;
    int high = arr.size() - 1;

    while (low <= high) {
        // Safe midpoint calculation avoiding integer overflow
        int mid = low + (high - low) / 2;

        if (arr[mid] == target) {
            return mid; // Target found at index mid
        } else if (arr[mid] < target) {
            low = mid + 1; // Discard left half
        } else {
            high = mid - 1; // Discard right half
        }
    }
    return -1; // Target not found
}
```

We can also implement binary search recursively, which consumes $O(\log N)$ stack frames.

```cpp
// Recursive Binary Search: O(log N) Time, O(log N) Stack Space
int binary_search_recursive(const vector<int>& arr, int low, int high, int target) {
    if (low > high) return -1; // Base case: search interval exhausted

    int mid = low + (high - low) / 2;
    if (arr[mid] == target) return mid;
    if (arr[mid] < target) return binary_search_recursive(arr, mid + 1, high, target);
    return binary_search_recursive(arr, low, mid - 1, target);
}
```

| Step | `low` | `high` | `mid` | `arr[mid]` | Target vs `arr[mid]` | Next Search Space |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| $1$ | $0$ | $9$ | $4$ | $23$ | $38 > 23$ | `[5, 9]` |
| $2$ | $5$ | $9$ | $7$ | $45$ | $38 < 45$ | `[5, 6]` |
| $3$ | $5$ | $6$ | $5$ | $31$ | $38 > 31$ | `[6, 6]` |
| $4$ | $6$ | $6$ | $6$ | $38$ | $38 == 38$ | **Found at index 6** |

```text
                             [ arr[4] ]
                           /            \
                 [ arr[1] ]              [ arr[7] ]
                /          \            /          \
           [ arr[0] ]  [ arr[2] ]  [ arr[5] ]  [ arr[8] ]
Max Tree Depth = ceil(log2(10)) + 1 = 4 levels
```

> [!WARNING]
> The formula `(low + high) / 2` overflows when $\text{low} + \text{high} > 2^{31} - 1$, producing a negative index. This caused a famous 9-year bug in Java's standard library.

Let's now investigate boundary index queries for handling duplicate keys.




#### Complexity Analysis
- **Time Complexity:** $\Theta(\log N)$ logarithmic comparisons.
- **Auxiliary Space:** $O(1)$ for iterative; $O(\log N)$ stack space for recursion.

---




### Lower Bound, Upper Bound, and Occurrence Ranges

When arrays contain duplicate elements, finding an exact match is insufficient; we frequently need the first or last occurrence of a target key.

Lower Bound finds the first index where $\text{arr}[\text{idx}] \ge \text{target}$, while Upper Bound finds the first index where $\text{arr}[\text{idx}] > \text{target}$.

```text
Array:   [ 2,  4,  5,  5,  5,  5,  7,  9 ]   Target = 5
                     ^               ^
                     |               |
       lower_bound(5) = idx 2    upper_bound(5) = idx 6
Duplicate Span Range = [ 2, 6 ) -> Total Count = 6 - 2 = 4 elements
```

Subtracting the lower bound index from the upper bound index directly computes the frequency of any element in $O(\log N)$ time.

$$\text{Count}(\text{target}) = \text{upper\_bound}(\text{target}) - \text{lower\_bound}(\text{target})$$

Let's implement our own custom `lower_bound` function.

```cpp
// Custom Lower Bound: Returns first index where arr[i] >= target
int custom_lower_bound(const vector<int>& arr, int target) {
    int low = 0, high = arr.size() - 1;
    int ans = arr.size(); // Default if all elements are < target

    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] >= target) {
            ans = mid;      // Valid candidate found, search left for earlier
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }
    return ans;
}
```

Now let's implement `upper_bound` and the full first-and-last position finder.

```cpp
// Custom Upper Bound and First/Last Position Range Finder
int custom_upper_bound(const vector<int>& arr, int target) {
    int low = 0, high = arr.size() - 1;
    int ans = arr.size(); // Default if all elements are <= target

    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] > target) {
            ans = mid;      // Candidate found, search left
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }
    return ans;
}

pair<int, int> find_first_last_position(const vector<int>& arr, int target) {
    int lb = custom_lower_bound(arr, target);
    if (lb == arr.size() || arr[lb] != target) return {-1, -1};
    int ub = custom_upper_bound(arr, target);
    return {lb, ub - 1};
}
```

| Search Query on `[2, 4, 5, 5, 5, 7, 9]` | `lower_bound` Index | `upper_bound` Index | Total Range Count |
| :--- | :--- | :--- | :--- |
| $\text{Target} = 5$ (Present key) | $2$ (Points to first $5$) | $5$ (Points to $7$) | $5 - 2 = 3$ |
| $\text{Target} = 6$ (Missing key) | $5$ (Points to $7$) | $5$ (Points to $7$) | $5 - 5 = 0$ |
| $\text{Target} = 1$ (Below min) | $0$ (Points to $2$) | $0$ (Points to $2$) | $0 - 0 = 0$ |
| $\text{Target} = 10$ (Above max) | $7$ (End sentinel) | $7$ (End sentinel) | $7 - 7 = 0$ |

```text
When arr[mid] >= target:
1. Record mid in ans variable: ans = mid
2. Narrow search window to the left: high = mid - 1
3. Loop guarantees ans holds the leftmost valid index on termination
```

> [!TIP]
> In C++, standard library functions `lower_bound` and `upper_bound` return iterators. Always subtract `arr.begin()` to obtain the 0-based integer index.

Let's now study binary search in structurally modified and rotated arrays.




#### Complexity Analysis
- **Time Complexity:** $\Theta(\log N)$ logarithmic time.
- **Auxiliary Space:** $O(1)$ scalar variable tracking.

---




## Binary Search in Modified Arrays




### Rotated Sorted Arrays — Pivot Hunting & Branch Selection

When a sorted array is rotated around an unknown pivot point, it splits into two independently ascending segments.

The crucial invariant is that whenever you split a rotated sorted array at midpoint `mid`, at least one of the two halves is guaranteed to be strictly sorted.

```text
Values
  8 |             * (Pivot Peak = 8)
  7 |         *
  6 |     *
  4 | *                                       * (Ascending Ramp 2)
  2 |                                     *
  1 |                                 * (Pivot Valley = 1)
    +---------------------------------------------------> Indices
      0   1   2   3                   4   5   6
      [ Ramp 1: Strictly Sorted ]     [ Ramp 2: Strictly Sorted ]
```

By comparing `arr[low]` with `arr[mid]`, we deduce which half is sorted and test if the target falls within that sorted boundary:

$$\text{arr}[\text{low}] \le \text{arr}[\text{mid}] \implies \text{Left half is sorted; check if } \text{target} \in [\text{arr}[\text{low}], \text{arr}[\text{mid}]]$$

Let's implement the cyclic buffer search algorithm in $O(\log N)$ time.

```cpp
// Cyclic Timestamp Buffer Search: O(log N) Time, O(1) Space
int search_cyclic_timestamp_buffer(const vector<int>& timestamps, int target_ts) {
    int low = 0, high = timestamps.size() - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (timestamps[mid] == target_ts) return mid;

        // Case 1: Left half is strictly sorted
        if (timestamps[low] <= timestamps[mid]) {
            if (timestamps[low] <= target_ts && target_ts < timestamps[mid]) {
                high = mid - 1; // Target lies within left sorted ramp
            } else {
                low = mid + 1;  // Target lies in right half
            }
        }
        // Case 2: Right half is strictly sorted
        else {
            if (timestamps[mid] < target_ts && target_ts <= timestamps[high]) {
                low = mid + 1;  // Target lies within right sorted ramp
            } else {
                high = mid - 1; // Target lies in left half
            }
        }
    }
    return -1; // Target timestamp not found
}
```



#### Complexity Analysis
- **Time Complexity:** $O(\log N)$ for unique keys; $O(N)$ worst-case with massive duplicates.
- **Auxiliary Space:** $O(1)$ strictly in-place memory.

---




## Binary Search on State Spaces




### Binary Search on Answer & Monotonic Feasibility Predicates

Binary Search on Answer applies when searching over a contiguous domain of candidate solutions $[X_{\min}, X_{\max}]$ rather than physical array indices.

If a feasibility predicate $P(X)$ is monotonic—transitioning from False to True at some threshold—we can find the optimal value in $O(\log(\text{Range}))$ checks.

```text
Candidate Answer X:  1    2    3    4    5    6    7    8
Predicate P(X):    False False False True True True True True
                                      ^
                              First True Boundary (Optimal Threshold)
```

The number of binary search iterations is bounded by the logarithm of the search domain width.

$$\text{Total Iterations} = \lceil \log_2(X_{\max} - X_{\min} + 1) \rceil \approx 30 \text{ iterations for } 10^9 \text{ domain}$$

Let's implement the generic First True template.

```cpp
// Generic Binary Search on Answer (First True Template)
int binary_search_first_true(int low, int high, const function<bool(int)>& feasible) {
    int ans = high;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (feasible(mid)) {
            ans = mid;      // Valid solution found; try finding a smaller one
            high = mid - 1;
        } else {
            low = mid + 1;  // Not feasible; must increase answer
        }
    }
    return ans;
}
```

Now let's apply this pattern to compute integer square roots safely.

```cpp
// Integer Square Root using Binary Search on Answer
int my_sqrt(int x) {
    if (x <= 1) return x;
    long long low = 1, high = x / 2;
    int ans = 1;

    while (low <= high) {
        long long mid = low + (high - low) / 2;
        if (mid * mid <= x) {
            ans = mid;     // mid^2 <= x is valid; try larger candidate
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return ans;
}
```

| Candidate $X$ | Predicate Condition ($X^2 \le 18$) | Result | Search Window Shift |
| :--- | :--- | :--- | :--- |
| $4$ | $4^2 = 16 \le 18$ | **True** (Feasible) | `low = mid + 1` $\to [5, 9]$ |
| $7$ | $7^2 = 49 > 18$ | **False** (Too large) | `high = mid - 1` $\to [5, 6]$ |
| $5$ | $5^2 = 25 > 18$ | **False** (Too large) | `high = mid - 1` $\to [5, 4]$ (Terminates) |

```text
Domain [ 1 ... 9 ]:
X^2 <= 18:  [ T,  T,  T,  T,  F,  F,  F,  F,  F ]
Values   :    1   2   3   4   5   6   7   8   9
Last True occurs at X = 4 ===> sqrt(18) = 4
```

> [!IMPORTANT]
> Always verify that your helper predicate function $P(X)$ is strictly monotonic. If $P(X)$ fluctuates non-monotonically between True and False, binary search will return an incorrect answer.

Let's now apply answer-space search to workload optimization problems.




#### Complexity Analysis
- **Time Complexity:** $O(\text{Cost}(P) \cdot \log(\text{Range}))$, where $\text{Cost}(P)$ is the predicate verification time.
- **Auxiliary Space:** $O(1)$ scalar tracking memory.

---




### Workload & Rate Optimization Problems (Minimax Allocation)

Two classic scenarios showcase answer-space optimization: signal repeater distance maximization and distributed server log parsing workload minimization.

In distributed workload partitioning, we binary search over the maximum allowed workload capacity $C$, greedily verifying whether $K$ worker threads can parse all contiguous data blocks without any single worker exceeding capacity $C$.

```text
Block Sizes: [ 10, 20, 30, 40, 50 ]          Target Workers K = 2
Test Capacity C = 60:
Worker 1: [ 10 + 20 + 30 ] = 60 <= 60 (Pass!)
Worker 2: [ 40 ] = 40; +50 = 90 > 60 -> Needs 3rd Worker! (Fail!)
Conclusion: Capacity C = 60 is too small -> Search range [61 .. 150]
```

The feasibility predicate runs in linear $O(N)$ time:

$$P(C) = \text{true} \iff \text{count\_workers}(C) \le K$$

Let's implement the minimax workload optimizer in C++.

```cpp
// Distributed Log Parsing Workload Minimization: O(N log(Sum)) Time
bool can_parse_within_workload(const vector<int>& block_sizes, int k_workers, long long max_cap) {
    int workers_used = 1;
    long long current_load = 0;

    for (int size : block_sizes) {
        if (size > max_cap) return false; // Single block exceeds capacity
        if (current_load + size > max_cap) {
            workers_used++;
            current_load = size;
        } else {
            current_load += size;
        }
    }
    return workers_used <= k_workers;
}

long long minimize_max_worker_workload(const vector<int>& block_sizes, int k_workers) {
    long long low = 0, high = 0;
    for (int size : block_sizes) {
        low = max(low, (long long)size);
        high += size;
    }

    long long optimal_workload = high;
    while (low <= high) {
        long long mid = low + (high - low) / 2;
        if (can_parse_within_workload(block_sizes, k_workers, mid)) {
            optimal_workload = mid;
            high = mid - 1; // Try finding smaller viable maximum workload
        } else {
            low = mid + 1;  // Capacity too tight; increase workload limit
        }
    }
    return optimal_workload;
}
```


#### Complexity Analysis
- **Time Complexity:** $O(N \log(\sum \text{arr}))$ for Painter's Partition; $O(N \log N + N \log(\max - \min))$ for Aggressive Cows.
- **Auxiliary Space:** $O(1)$ auxiliary scalar tracking.

---




## Advanced Searching Paradigms




### Floating-Point Binary Search & Precision Convergence

Floating-point binary search solves continuous numerical equations $f(x) = 0$ and finds roots across real numbers.

Unlike integer binary search, we never add or subtract $1$ from `mid`; we update $\text{low} = \text{mid}$ or $\text{high} = \text{mid}$ continuously.

```text
Interval:   [ low ---------------- mid ---------------- high ]
If f(mid) < Target: low = mid  (Shrink without +1)
If f(mid) > Target: high = mid (Shrink without -1)
Width drops by 2^(-k) at step k -> Achieves extreme precision!
```

Running a fixed loop of 100 iterations achieves double-precision accuracy ($2^{-100} \approx 10^{-30}$) and avoids infinite loops caused by floating-point rounding.

$$\text{Precision after } 100 \text{ steps: } \frac{\text{high} - \text{low}}{2^{100}} < 10^{-30}$$

Let's write the fixed-iteration floating-point square root routine.

```cpp
// Floating-Point Binary Search with Fixed Iterations: O(100) Steps
double float_sqrt(double x) {
    if (x < 0) return -1.0;
    double low = 0.0, high = max(1.0, x);

    // Fixed 100 iterations eliminates IEEE 754 precision stalls
    for (int iter = 0; iter < 100; ++iter) {
        double mid = low + (high - low) / 2.0;
        if (mid * mid >= x) {
            high = mid;
        } else {
            low = mid;
        }
    }
    return low;
}
```

| Iteration | `low` | `high` | `mid` | `mid * mid` | Error Width |
| :--- | :--- | :--- | :--- | :--- | :--- |
| $1$ | $0.0000$ | $2.0000$ | $1.0000$ | $1.0000$ | $1.0000$ |
| $2$ | $1.0000$ | $2.0000$ | $1.5000$ | $2.2500$ | $0.5000$ |
| $3$ | $1.0000$ | $1.5000$ | $1.2500$ | $1.5625$ | $0.2500$ |
| $4$ | $1.2500$ | $1.5000$ | $1.3750$ | $1.8906$ | $0.1250$ |
| $5$ | $1.3750$ | $1.5000$ | $1.4375$ | $2.0664$ | $0.0625$ |

```text
Step 0:  [ 0.0 ============================================== 2.0 ]
Step 1:  [ 1.0 ====================== 2.0 ]
Step 2:  [ 1.0 ========== 1.5 ]
Step 3:        [ 1.25 ==== 1.5 ]
Step 100: Absolute mathematical convergence to sqrt(2) = 1.41421356...
```

> [!TIP]
> Prefer `for (int iter = 0; iter < 100; ++iter)` over `while (high - low > 1e-7)` to prevent infinite loops caused by IEEE 754 precision limits on large numbers.

Let's now examine multi-array partitioning to find the combined median across two sorted streams.




#### Complexity Analysis
- **Time Complexity:** $O(1)$ fixed loop of 60 to 100 iterations.
- **Auxiliary Space:** $O(1)$ memory.

---




### Multi-Array Partitioning & Dual-Stream Median Identification

Finding the combined median across two independently sorted telemetry streams $A$ and $B$ in optimal $O(\log(\min(N, M)))$ time is one of the most celebrated binary search algorithms.

We partition both arrays such that the combined left half contains exactly half of all elements and every element on the left is $\le$ every element on the right.

```text
Log A:    [ A0, A1, ... A[i-1] | A[i], ... A[N-1] ]
Log B:    [ B0, B1, ... B[j-1] | B[j], ... B[M-1] ]
Left Half: (i + j) elements    | Right Half: (N + M - i - j) elements
Partition Valid when: A[i-1] <= B[j] AND B[j-1] <= A[i]
```

The invariant equation determines the partition balance in $O(1)$ time:

$$i + j = \lfloor (N + M + 1) / 2 \rfloor \implies j = \lfloor (N + M + 1) / 2 \rfloor - i$$

Let's implement the logarithmic dual-stream median algorithm in C++.

```cpp
// Dual-Datacenter Telemetry Median: O(log(min(N, M))) Time, O(1) Space
double find_dual_stream_median(const vector<int>& log1, const vector<int>& log2) {
    if (log1.size() > log2.size()) {
        return find_dual_stream_median(log2, log1); // Ensure log1 is the shorter array
    }

    int n = log1.size(), m = log2.size();
    int low = 0, high = n;

    while (low <= high) {
        int i = low + (high - low) / 2;
        int j = (n + m + 1) / 2 - i;

        int max_left_a = (i == 0) ? -1e9 : log1[i - 1];
        int min_right_a = (i == n) ? 1e9 : log1[i];

        int max_left_b = (j == 0) ? -1e9 : log2[j - 1];
        int min_right_b = (j == m) ? 1e9 : log2[j];

        // Valid partition condition
        if (max_left_a <= min_right_b && max_left_b <= min_right_a) {
            if ((n + m) % 2 == 1) {
                return max(max_left_a, max_left_b); // Odd total length
            } else {
                return (max(max_left_a, max_left_b) + min(min_right_a, min_right_b)) / 2.0;
            }
        } else if (max_left_a > min_right_b) {
            high = i - 1; // Partition in log1 is too far right; move left
        } else {
            low = i + 1;  // Partition in log1 is too far left; move right
        }
    }
    return 0.0;
}
```

#### Complexity Analysis
- **Time Complexity:** $O(\log(\min(N, M)))$ logarithmic in the size of the smaller array.
- **Auxiliary Space:** $O(1)$ space using scalar pointers.

---




### Exponential Search & Unbounded Search Spaces

Exponential Search (also known as Galloping Search) finds elements in unbounded sorted arrays or data streams where the length $N$ is unknown.

The algorithm doubles its step index geometrically ($1, 2, 4, 8, 16 \dots$) until bracketing the target, then binary searches within $[i/2, i]$.

```text
Target = 55
Probe idx 1  (Val: 4)  < 55 -> Jump to 2
Probe idx 2  (Val: 9)  < 55 -> Jump to 4
Probe idx 4  (Val: 18) < 55 -> Jump to 8
Probe idx 8  (Val: 35) < 55 -> Jump to 16
Probe idx 16 (Val: 62) >= 55 -> Target bracketed in [ 8 ... 16 ]!
```

The time complexity is bounded by $O(\log K)$, where $K$ is the actual index of the target element.

$$\text{Range Bounding: } O(\log K), \quad \text{Subarray Binary Search: } O(\log K) \implies \text{Total: } O(\log K)$$

Let's write the Exponential Search implementation.

```cpp
// Exponential Search on Unbounded Array / Stream Interface
int exponential_search(const vector<int>& arr, int target) {
    int n = arr.size();
    if (n == 0) return -1;
    if (arr[0] == target) return 0;

    // Stage 1: Find range by exponential jumping
    int i = 1;
    while (i < n && arr[i] <= target) {
        i *= 2;
    }

    // Stage 2: Binary search on bracketed interval
    int low = i / 2;
    int high = min(i, n - 1);

    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}
```

| Galloping Step | Index Probed | Value Probed | Target Comparison | Action |
| :--- | :--- | :--- | :--- | :--- |
| Step 0 | $1$ | $4$ | $4 < 42$ | Double index $\to 2$ |
| Step 1 | $2$ | $10$ | $10 < 42$ | Double index $\to 4$ |
| Step 2 | $4$ | $25$ | $25 < 42$ | Double index $\to 8$ |
| Step 3 | $8$ | $50$ | $50 \ge 42$ | **Bracket range $[4, 8]$** |

```text
Array Size N = 1,000,000, Target at Index K = 12
Standard Binary Search : log2(1,000,000) ~ 20 probes
Exponential Search     : log2(12) * 2    ~ 8 probes  (2.5x faster!)
```

> [!TIP]
> Exponential Search is heavily used inside Timsort to merge adjacent sorted runs efficiently when one run contains a long sequence of winning elements.

This completes the Binary Search chapter, covering midpoint overflow safety, boundary bounds, rotated configurations, answer-space feasibility, workload optimizations, float bisections, dual-array medians, and exponential galloping searches.




#### Complexity Analysis
- **Time Complexity:** $O(\log K)$ where $K$ is the target's index position ($K \ll N$).
- **Auxiliary Space:** $O(1)$ memory.

---




## Cheat Sheet & Quick Reference

| Binary Search Variant | Search Domain | Invariant / Predicate | Complexity |
| :--- | :--- | :--- | :--- |
| **Standard Binary Search** | Exact match in $[0, N-1]$ | Safe `mid = low + (high - low) / 2` | $\Theta(\log N)$ / $O(1)$ |
| **Lower Bound** | First index $\ge \text{target}$ | If `arr[mid] >= target`: `ans=mid, high=mid-1` | $\Theta(\log N)$ / $O(1)$ |
| **Upper Bound** | First index $> \text{target}$ | If `arr[mid] > target`: `ans=mid, high=mid-1` | $\Theta(\log N)$ / $O(1)$ |
| **Rotated Sorted Search** | Circularly shifted array | Identify sorted half: `arr[low] <= arr[mid]` | $O(\log N)$ / $O(1)$ |
| **Binary Search on Answer** | Continuous domain $[X_{\min}, X_{\max}]$ | Monotonic feasibility predicate $P(X)$ | $O(\text{Cost}(P) \log R)$ |
| **Floating-Point Search** | Continuous real values | Fixed `for (int i=0; i<100; ++i)` loop | $O(100)$ / $O(1)$ |
| **Median of Two Arrays** | Dual partitions $i, j$ | Cross balance: $A[i-1] \le B[j] \land B[j-1] \le A[i]$ | $O(\log(\min(N, M)))$ |
| **Exponential Search** | Unbounded stream / $K \ll N$ | Gallop $1, 2, 4, 8 \dots$ then binary search | $O(\log K)$ / $O(1)$ |
