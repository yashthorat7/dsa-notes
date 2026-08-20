# Chapter 2: Algorithmic Paradigms

---


## Brute Force & Complete Search


### Exhaustive State Space Search

Picture standing in front of a four-digit bicycle combination lock whose code you forgot. Without clues, the only foolproof approach is methodically dialing every combination from 0000 to 9999.

Exhaustive search systematically visits every single state in the problem configuration space. It serves as our ultimate baseline oracle against which all future algorithmic optimizations are verified.

```text
Subsets (Power Set):      2^n states       (Include/Exclude choice)
Permutations:             n! states        (Order-dependent choices)
Combinations (n choose k): n! / (k!(n-k)!) (Unordered selections)
```

The mathematical cardinality of your search space dictates whether brute force is computationally feasible within competitive programming time limits.

$$|S_{\text{subsets}}| = 2^n, \quad |S_{\text{permutations}}| = n!, \quad |S_{\text{combinations}}| = \binom{n}{k}$$

Modern commodity CPUs execute roughly $10^8$ operations per second. If the total state cardinality exceeds this threshold, brute force will trigger a Time Limit Exceeded error.

```cpp
// Recursive Power Set Generator: Generates 2^n subsets
void generate_subsets(const vector<int>& arr, int index, vector<int>& current) {
    if (index == arr.size()) {
        // Base case: Leaf node reached in decision tree
        // Process or print current subset state
        return;
    }
    // Branch 1: Exclude element arr[index]
    generate_subsets(arr, index + 1, current);

    // Branch 2: Include element arr[index]
    current.push_back(arr[index]);
    generate_subsets(arr, index + 1, current);
    current.pop_back(); // Backtrack state
}
```

We can also generate subsets iteratively using bitmask manipulation. Each integer from $0$ to $2^n - 1$ acts as a binary flag array, avoiding all recursive call stack overhead.

```cpp
// Iterative Bitmask Subset Generator: Zero recursion overhead
void bitmask_subsets(const vector<int>& arr) {
    int n = arr.size();
    int total_states = 1 << n; // 2^n total configurations
    for (int mask = 0; mask < total_states; ++mask) {
        vector<int> subset;
        for (int i = 0; i < n; ++i) {
            if (mask & (1 << i)) { // Test if bit i is active
                subset.push_back(arr[i]);
            }
        }
        // Process constructed subset
    }
}
```

| Input Size ($n$) | Subset States ($2^n$) | Permutations ($n!$) | Brute Force Feasibility ($10^8 \text{ ops/sec}$) |
| :--- | :--- | :--- | :--- |
| $10$ | $1,024$ | $3,628,800$ | **Instant** ($< 0.05 \text{ seconds}$) |
| $20$ | $1,048,576$ | $2.43 \times 10^{18}$ | **Subsets viable**; Permutations fail |
| $30$ | $1.07 \times 10^9$ | Explosive | **Subsets TLE** ($> 10 \text{ seconds}$) |
| $50$ | $1.12 \times 10^{15}$ | Uncomputable | **Infeasible** without pruning |

```text
             [ Root: {} ]
            /            \
   [ Exclude 1 ]       [ Include 1 ]
     /       \           /       \
  [ {} ]   [ {2} ]    [ {1} ]   [ {1,2} ]
  /    \   /    \     /    \     /     \
{}    {3} {2} {2,3}  {1}  {1,3} {1,2} {1,2,3}
Total Leaves = 2^3 = 8 Exhaustive States
```

> [!WARNING]
> Permutation brute force on $n \ge 13$ generates over $6.2 \times 10^9$ recursive states, causing immediate timeout in online judges.

Brute force gives us an infallible reference oracle for differential stress testing. Let's now explore how to decompose massive problems using divide and conquer.


#### Complexity Analysis
- **Time Complexity:** $O(2^n)$ for subset generation, $O(n \cdot n!)$ for full permutation generation.
- **Auxiliary Space:** $O(n)$ call stack depth for recursive backtracking, $O(1)$ extra space for bitmasks.

---


## Divide and Conquer


### Divide Phase — Problem Decomposition

Divide and Conquer breaks a monolithic problem into smaller, non-overlapping subproblems of identical structure, solves them independently, and reassembles their results into the final solution.

The key requirement is problem symmetry. Each subdivided piece must represent an exact miniature replica of the original computational problem over a smaller contiguous domain.

```text
Original Array Domain: [ low = 0 ........................ high = N ]
                                |
                       Calculated Midpoint
                                v
Left Subproblem: [ low .. mid ]  |  Right Subproblem: [ mid+1 .. high]
```

When partitioning intervals in software systems, division must strictly conserve all elements without omitting or duplicating indices at boundaries.

$$n_1 = \lfloor n/2 \rfloor, \quad n_2 = \lceil n/2 \rceil \implies n_1 + n_2 = n$$

Calculating the midpoint index safely requires guarding against arithmetic integer overflow on large index values.

```cpp
// Midpoint Index Calculation: Safe vs Unsafe
int mid_unsafe = (low + high) / 2; // BUG: Overflows if low + high > INT_MAX

// Safe formula preserving bounds within 32-bit limits
int mid_safe = low + (high - low) / 2;
```

Binary bisection into two equal halves almost always provides optimal asymptotic performance. Splitting into 3 or 4 subproblems increases overhead without improving asymptotic depth.

```cpp
// Divide Phase Skeleton: Recursive Interval Bisection
void divide_interval(int low, int high) {
    if (low >= high) return; // Irreducible base case
    int mid = low + (high - low) / 2;
    divide_interval(low, mid);      // Left Half:  size ~ n/2
    divide_interval(mid + 1, high); // Right Half: size ~ n/2
}
```

| Partition Strategy | Subproblem Size | Subproblems ($a$) | Recursion Depth | Divide Overhead |
| :--- | :--- | :--- | :--- | :--- |
| Binary Split | $n/2$ | $2$ | $\log_2 n$ | $O(1)$ index math |
| Ternary Split | $n/3$ | $3$ | $\log_3 n$ | $O(1)$ index math |
| Linear Split | $n-1$ | $1$ | $n$ | $O(1)$ index math |
| Pivot Partition | Variable ($k, n-1-k$) | $2$ | $O(\log n)$ to $O(n)$ | $O(n)$ element scan |

```text
    [ 0 ...................... 7 ]  (n = 8)
           /                \
  [ 0 .... 3 ]            [ 4 .... 7 ]
   /        \              /        \
[0..1]    [2..3]        [4..5]    [6..7]
 /  \      /  \          /  \      /  \
[0] [1]   [2] [3]       [4] [5]   [6] [7] (Leaves)
```

> [!CAUTION]
> Always use `low + (high - low) / 2` when computing midpoints to prevent integer overflow when indices exceed $2 \times 10^9$.

With the decomposition strategy locked in, let's look at defining and solving the irreducible base cases.


#### Complexity Analysis
- **Time Complexity:** $O(1)$ work expended during the divide step to calculate boundary indices.
- **Auxiliary Space:** $O(\log n)$ call stack frames allocated across the recursive tree depth.

---


### Conquer Phase — Base Case Solving

The conquer phase resolves subproblems recursively until they reach atomic base cases small enough to be solved trivially in $O(1)$ time.

A missing or incorrect base case triggers infinite recursive descent, terminating in catastrophic stack overflow crashes.

```text
[ Problem: n = 4 ] ---> [ n = 2 ] ---> [ Base: n = 1 ] ---> (Returns
                                              |
                                     (Halts; No further branching!)
```

The base case serves as the foundational termination invariant of the recursion, guaranteeing that execution halts at irreducible units.

$$T(0) = O(1), \quad T(1) = O(1)$$

Atomic base cases can involve a single element or a small fixed cluster of elements, depending on algorithm requirements.

```cpp
// Conquer Phase: Atomic Base Case Identification
struct MinMax { int min_val; int max_val; };

MinMax find_min_max(const vector<int>& arr, int low, int high) {
    // Base Case 1: Exactly 1 element
    if (low == high) {
        return {arr[low], arr[low]};
    }
    // Base Case 2: Exactly 2 elements (Solves in 1 comparison)
    if (high == low + 1) {
        if (arr[low] < arr[high]) return {arr[low], arr[high]};
        else return {arr[high], arr[low]};
    }
    // Recursive conquer step
    int mid = low + (high - low) / 2;
    MinMax left_res = find_min_max(arr, low, mid);
    MinMax right_res = find_min_max(arr, mid + 1, high);
    return {min(left_res.min_val, right_res.min_val),
            max(left_res.max_val, right_res.max_val)};
}
```

| Problem Type | Atomic Base Case Size | Base Condition Test | Direct Answer Returned |
| :--- | :--- | :--- | :--- |
| Merge Sort | $n \le 1$ | `low >= high` | Subarray already sorted |
| Binary Search | $n = 0$ | `low > high` | Element not found ($-1$) |
| Tournament MinMax | $n = 1 \text{ or } 2$ | `low == high \|\| high == low + 1` | Direct 1-comparison struct |
| Fast Exponentiation | $exp = 0$ | `exp == 0` | Identity value $1$ |

```text
find_min_max(arr, 0, 1) ---> Base Case hit! Returns {2, 9}
find_min_max(arr, 2, 3) ---> Base Case hit! Returns {1, 7}
Unwinding to parent: Combine {min(2,1)=1, max(9,7)=9} -> Returns
```

Always test your base case logic against boundary inputs such as empty vectors and single-element containers before writing recursive branches.

> [!IMPORTANT]
> Verify that base conditions trigger correctly for all boundary inputs, including empty collections and identical index bounds `low == high`.

Now let's examine the final phase: combining sub-solutions into the overarching answer.


#### Complexity Analysis
- **Time Complexity:** $O(1)$ constant time evaluation per leaf node base case.
- **Auxiliary Space:** $O(1)$ scalar return storage per base invocation.

---


### Combine Phase — Sub-solution Merging

The combine phase merges solutions to independent subproblems into a unified global solution.

In many divide-and-conquer algorithms, the combine phase performs the dominant share of total computational work.

```text
Left Sorted Span:   [ 2 ][ 5 ][ 8 ]   (Pointer i -> arr[0])
Right Sorted Span:  [ 1 ][ 6 ][ 9 ]   (Pointer j -> arr[3])
Output Buffer:      [ 1 ][ 2 ][ 5 ][ 6 ][ 8 ][ 9 ]
Work: Exactly (n_left + n_right) comparisons = O(n) linear work
```

In Merge Sort, dividing takes $O(1)$ and conquer base cases take $O(1)$, but merging two sorted spans of total size $n$ requires $O(n)$ work.

$$T(n) = 2T(n/2) + O(n)$$

Let's trace the two-pointer merge subroutine that executes during this combine phase.

```cpp
// Combine Phase: Two-Pointer Sorted Range Merging
void merge_spans(vector<int>& arr, int low, int mid, int high) {
    vector<int> temp;
    int i = low, j = mid + 1;
    while (i <= mid && j <= high) {
        if (arr[i] <= arr[j]) temp.push_back(arr[i++]);
        else temp.push_back(arr[j++]);
    }
    while (i <= mid) temp.push_back(arr[i++]);
    while (j <= high) temp.push_back(arr[j++]);
    for (int k = 0; k < temp.size(); ++k) {
        arr[low + k] = temp[k]; // Copy back merged span
    }
}
```

Notice the contrast between Merge Sort and QuickSort. Merge Sort performs light division and heavy combination, whereas QuickSort performs heavy partitioning and zero combination.

```cpp
// QuickSort Partition: Heavy divide O(n), Zero combine O(1)
int partition_pivot(vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; ++j) {
        if (arr[j] <= pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return i + 1; // Pivot at final position; no merging needed later!
}
```

| Algorithm | Divide Cost | Conquer Base Cost | Combine Cost | Dominant Bottleneck |
| :--- | :--- | :--- | :--- | :--- |
| Merge Sort | $O(1)$ | $O(1)$ | $O(n)$ linear merge | **Combine Phase** |
| QuickSort | $O(n)$ partition | $O(1)$ | $O(1)$ zero work | **Divide Phase** |
| Binary Search | $O(1)$ | $O(1)$ | $O(1)$ direct return | **Divide Phase** |
| Closest Pair of Points | $O(1)$ | $O(1)$ | $O(n)$ strip scan | **Combine Phase** |

```text
  [ 1, 2, 5, 6, 8, 9 ] (Root Solution)
         /          \
  [ 2, 5, 8 ]    [ 1, 6, 9 ] (Combine: Interleave)
   /       \      /       \
[ 5, 8 ]  [ 2 ] [ 6, 9 ]  [ 1 ]
```

> [!TIP]
> Optimizing the combine subroutine directly reduces the non-recursive overhead $f(n)$, shrinking total runtime across all recursion levels.

Let's now analyze recurrence relations to derive closed-form mathematical runtimes.


#### Complexity Analysis
- **Time Complexity:** $O(n)$ linear time spent during each combine merge phase.
- **Auxiliary Space:** $O(n)$ temporary auxiliary buffer memory during span merging.

---


### Solving Recurrences — Substitution, Recursion Tree, and Master Theorem

Solving divide-and-conquer recurrences unlocks exact asymptotic runtimes from mathematical relations of the form $T(n) = a T(n/b) + f(n)$.

We deploy three standard analytical techniques: mathematical induction substitution, visual recursion trees, and the Master Theorem shortcut.

```text
Level 0:                      f(n)                      Work = f(n)
                           /        \
Level 1:              f(n/b)          f(n/b)            Work = a*f
                    /      \        /      \
Level 2:          f(n/b^2) ...    ...    f(n/b^2)       Work = a^2*f
Total Levels: log_b(n) | Leaf Nodes: a^(log_b n) = n^(log_b a)
```

The Master Theorem compares the growth rate of the non-recursive work $f(n)$ against the leaf-node capacity $n^{\log_b a}$.

$$T(n) = a T(n/b) + f(n)$$

Case 1 applies when leaf work dominates ($f(n) = O(n^{\log_b a - \epsilon}) \implies \Theta(n^{\log_b a})$). Case 2 applies when work is evenly balanced ($f(n) = \Theta(n^{\log_b a}) \implies \Theta(n^{\log_b a} \log n)$).

Case 3 applies when root divide/combine work dominates ($f(n) = \Omega(n^{\log_b a + \epsilon}) \implies \Theta(f(n))$).

```cpp
// Recurrence Verification: Merge Sort matches Master Theorem Case 2
// T(n) = 2T(n/2) + O(n) ==> a=2, b=2, n^(log_2 2) = n^1 ==> Theta(n log n)
void merge_sort_timed(vector<int>& arr, int low, int high) {
    if (low >= high) return;
    int mid = low + (high - low) / 2;
    merge_sort_timed(arr, low, mid);
    merge_sort_timed(arr, mid + 1, high);
    merge_spans(arr, low, mid, high); // Theta(n) combine work
}
```

| Recurrence Equation | Parameters $(a, b, f(n))$ | $n^{\log_b a}$ | Master Theorem Case | Asymptotic Bound |
| :--- | :--- | :--- | :--- | :--- |
| $T(n) = 2T(n/2) + O(1)$ | $a=2, b=2, f(n)=1$ | $n^1 = n$ | Case 1 (Leaves dominate) | $\Theta(n)$ |
| $T(n) = 2T(n/2) + O(n)$ | $a=2, b=2, f(n)=n$ | $n^1 = n$ | Case 2 (Evenly balanced) | $\Theta(n \log n)$ |
| $T(n) = T(n/2) + O(1)$ | $a=1, b=2, f(n)=1$ | $n^0 = 1$ | Case 2 (Evenly balanced) | $\Theta(\log n)$ |
| $T(n) = 3T(n/2) + O(n)$ | $a=3, b=2, f(n)=n$ | $n^{\log_2 3} \approx n^{1.58}$ | Case 1 (Karatsuba mul) | $\Theta(n^{1.58})$ |
| $T(n) = 2T(n/2) + O(n^2)$ | $a=2, b=2, f(n)=n^2$ | $n^1 = n$ | Case 3 (Root dominates) | $\Theta(n^2)$ |

```text
Recurrence: T(n) = 2T(n/2) + n log n
Level k work: 2^k * (n/2^k) * log(n/2^k) = n * (log n - k)
Summing over all k from 0 to log2(n):
Total Work = n * sum(log n - k) = n * Theta(log^2 n) = Theta(n log^2 n)
```

> [!CAUTION]
> The Master Theorem cannot solve recurrences with unequal partition sizes (e.g. $T(n) = T(n/3) + T(2n/3) + n$), which require recursion tree analysis.

Now let's examine decrease-and-conquer paradigms where problems reduce to a single smaller instance.


#### Complexity Analysis
- **Time Complexity:** $\Theta(n \log n)$ closed-form runtime derived via Master Theorem Case 2 for Merge Sort.
- **Auxiliary Space:** $O(\log n)$ recursion frame depth.

---


## Decrease and Conquer


### Reduction to Smaller Instances — Linear vs Exponential Decrease

Decrease and Conquer solves a computational problem by reducing it to a single smaller subproblem rather than branching into multiple subproblems.

We classify reductions into Decrease by a Constant (linear decrease, $n \to n-1$) and Decrease by a Constant Factor (exponential decrease, $n \to n/2$).

```text
Linear Decrease (n -> n - 1):
[ n ] ---> [ n - 1 ] ---> [ n - 2 ] ---> ... ---> [ 1 ]  (n steps)

Factor Decrease (n -> n / 2):
[ n ] ---> [ n / 2 ] ---> [ n / 4 ] ---> ... ---> [ 1 ]  (log2 n)
```

The difference in execution speed between linear reduction and factor reduction is massive. Linear reduction executes in $\Theta(n)$ time, while factor reduction executes in $\Theta(\log n)$ time.

$$T_{\text{linear}}(n) = T(n-1) + O(1) \implies \Theta(n), \quad T_{\text{factor}}(n) = T(n/2) + O(1) \implies \Theta(\log n)$$

Let's contrast naive linear power computation against fast binary exponentiation.

```cpp
// Naive Linear Decrease: O(n) time
long long power_linear(long long base, int exp) {
    if (exp == 0) return 1;
    return base * power_linear(base, exp - 1); // Reduces exp by 1
}

// Decrease by Factor (Binary Exponentiation): O(log n) time
long long power_log(long long base, int exp) {
    if (exp == 0) return 1;
    long long half = power_log(base, exp / 2); // Halves exponent
    if (exp % 2 == 0) return half * half;
    else return base * half * half;
}
```

| Paradigm | Reduction Step | Recurrence | Asymptotic Time | Representative Algorithm |
| :--- | :--- | :--- | :--- | :--- |
| Divide & Conquer | Split into $2$ halves | $T(n) = 2T(n/2) + O(n)$ | $\Theta(n \log n)$ | Merge Sort |
| Decrease by $1$ | Reduce by $1$ unit | $T(n) = T(n-1) + O(1)$ | $\Theta(n)$ | Linear Insertion Scan |
| Decrease by Factor | Halve input space | $T(n) = T(n/2) + O(1)$ | $\Theta(\log n)$ | Binary Search / Fast Pow |
| Variable Decrease | Modulo reduction | $T(n) = T(n \bmod m) + O(1)$ | $O(\log n)$ | Euclidean GCD |

```text
[ exp = 27 ] (odd: 27 - 1 = 26)
     |
[ exp = 13 ] (odd: 13 - 1 = 12)
     |
[ exp = 6  ] (even: 6 / 2 = 3)
     |
[ exp = 3  ] ---> [ exp = 1 ] ---> [ exp = 0 ] (Terminates in 5 ops)
```

> [!TIP]
> Converting recursive decrease-by-one patterns into iterative loops eliminates $O(n)$ auxiliary call stack frames.

Let's now explore fundamental design heuristics, starting with greedy decision making.


#### Complexity Analysis
- **Time Complexity:** $\Theta(\log n)$ time for fast binary exponentiation versus $\Theta(n)$ for linear iteration.
- **Auxiliary Space:** $O(\log n)$ recursive frame depth for logarithmic decrease.

---


## Core Paradigm Mindsets


### Greedy Thinking — Local Optimality to Global Optimum

The greedy mindset makes the locally optimal, myopic choice at each step without ever reconsidering or undoing past decisions.

Greedy algorithms are blazingly fast and easy to implement, but they fail completely if the problem does not exhibit the Greedy Choice Property and Optimal Substructure.

```text
Starting Node (Root)
   /                    \
 [ Choice A: Gain +10 ] [ Choice B: Gain +2 ]  <-- Greedy picks A!
   |                      |
 [ Dead End: Gain +0 ]  [ Jack Pot: Gain +100 ]
 Total Path A = 10      Total Path B = 102 (Global Optimum Missed!)
```

Proving greedy correctness requires mathematical exchange arguments, demonstrating that swapping an optimal solution's choice with the greedy choice never degrades solution quality.

$$S_{\text{opt}} = \{o_1, o_2, \dots, o_k\}, \quad S_{\text{greedy}} = \{g_1, g_2, \dots, g_k\} \implies \text{Cost}(S_{\text{greedy}}) \le \text{Cost}(S_{\text{opt}})$$

Fractional Knapsack succeeds with a greedy strategy by sorting items by their value-to-weight density ratio.

> [!NOTE]
> **C++ Syntax — Lambda Comparators:**
> An inline lambda `[](const Item& a, const Item& b) { return ...; }` defines an anonymous comparator function on the fly. `[]` is the capture list, `(...)` specifies the parameter types, and the body returns `true` if `a` should strictly precede `b` in sorted order.

```cpp
// Fractional Knapsack: Greedy choice by value density
struct Item { int value; int weight; };

double fractional_knapsack(int capacity, vector<Item>& items) {
    // Sort items by descending value-to-weight density
    sort(items.begin(), items.end(), [](const Item& a, const Item& b) {
        return (double)a.value / a.weight > (double)b.value / b.weight;
    });
    double total_value = 0.0;
    for (const auto& item : items) {
        if (capacity >= item.weight) {
            capacity -= item.weight;
            total_value += item.value;
        } else {
            total_value += item.value * ((double)capacity / item.weight);
            break; // Knapsack full
        }
    }
    return total_value;
}
```

However, the 0/1 Knapsack problem (where items cannot be sliced fractionally) causes greedy density selection to fail.

```cpp
// 0/1 Knapsack Greedy Failure Counterexample
// Capacity = 50. Items: A(w=10, v=60), B(w=20, v=100), C(w=30, v=120)
// Densities: A=6.0, B=5.0, C=4.0
// Greedy picks A + B (w=30, v=160). Unused capacity = 20.
// Optimal picks B + C (w=50, v=220) ===> Greedy fails!
```

| Item | Weight | Value | Density | Greedy Action | Remaining Capacity | Accumulated Value |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Item A | $10$ | $60$ | $6.0$ | Take fully | $40$ | $60$ |
| Item B | $20$ | $100$ | $5.0$ | Take fully | $20$ | $160$ |
| Item C | $30$ | $120$ | $4.0$ | Take $20/30$ frac | $0$ | $240$ (Fractional) |

```text
Timeline:  0----1----2----3----4----5----6----7----8
Job 1:     [=====] (Finish: 2) -> PICKED!
Job 2:        [========] (Finish: 4) -> Clashes (Rejected)
Job 3:              [====] (Finish: 5) -> PICKED!
```

> [!CAUTION]
> Greedy selection fails on 0/1 Knapsack because unused capacity cannot be filled fractionally, requiring Dynamic Programming instead.

Let's now study handling overlapping subproblems through dynamic programming.


#### Complexity Analysis
- **Time Complexity:** $O(n \log n)$ time dominated by sorting items by density ratio.
- **Auxiliary Space:** $O(1)$ workspace memory during greedy iteration.

---


### Dynamic Programming Thinking — Overlapping Subproblems & Memoization

Dynamic Programming solves problems by breaking them into overlapping subproblems, solving each subproblem once, and storing its answer in a table to avoid redundant computation.

The two fundamental prerequisites for DP are Optimal Substructure and Overlapping Subproblems.

```text
                   [ Fib(5) ]
                  /          \
          [ Fib(4) ]        [ Fib(3) ]
         /          \        /       \
    [ Fib(3) ]   [ Fib(2) ] [ Fib(2) ] [ Fib(1) ]
     /      \
[ Fib(2) ] [ Fib(1) ]  <--- Fib(2) & Fib(3) computed repeatedly!
```

The mathematical recurrence relation formalizes the transition from subproblem states to the target answer.

$$DP(i) = \min_{j < i} \{ DP(j) + \text{cost}(j, i) \}, \quad DP(0) = 0$$

Memoization caches recursive results in a lookup table, transforming exponential recursion into linear execution.

```cpp
// Top-Down Dynamic Programming with Memoization: O(n)
long long fib_memo(int n, vector<long long>& memo) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n]; // Cache hit!
    memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo);
    return memo[n];
}
```

We can eliminate recursion overhead completely by tabulating solutions iteratively bottom-up.

```cpp
// Bottom-Up DP with Space Optimization: O(n) Time, O(1) Space
long long fib_optimized(int n) {
    if (n <= 1) return n;
    long long prev2 = 0, prev1 = 1;
    for (int i = 2; i <= n; ++i) {
        long long current = prev1 + prev2; // State transition
        prev2 = prev1;
        prev1 = current;
    }
    return prev1; // O(1) space!
}
```

| Dimension | Top-Down (Memoization) | Bottom-Up (Tabulation) |
| :--- | :--- | :--- |
| Approach | Recursive (Root down to leaves) | Iterative (Base cases up to target) |
| Memory Overhead | $O(n)$ recursion stack + $O(n)$ memo table | $O(n)$ table (can reduce to $O(1)$) |
| Subproblem Coverage | Solves only reachable subproblems | Evaluates all table entries |
| Implementation Ease | Natural recursive translation | Requires ordering topological states |

```text
Full 1D Table: [ DP[0] ][ DP[1] ][ DP[2] ] ... [ DP[N] ]  ---> O(N)
Rolling State:  prev2      prev1   current                ---> O(1)
Memory reduced from O(N) heap to 2 scalar registers!
```

> [!IMPORTANT]
> Always define the exact semantic meaning of your DP state table before writing state transition code.

Let's now examine backtracking when choices must be explored and undone dynamically.


#### Complexity Analysis
- **Time Complexity:** $\Theta(n)$ linear time visiting each subproblem state exactly once.
- **Auxiliary Space:** $O(1)$ space using two rotating variables in bottom-up tabulation.

---


### Backtracking Thinking — State-Space Tree Exploration & Pruning

Backtracking is a refined depth-first search strategy that builds candidate solutions incrementally and abandons (prunes) a candidate branch the instant it violates problem constraints.

Pruning cuts off massive subtrees of the state-space tree, turning computationally impossible problems into fast traversals.

```text
             [ Root: Empty ]
             /             \
     [ Pick A ]           [ Pick B ]
     /        \               |
[ A -> C ]   [ A -> D ]    [ B -> X (Invalid!) ]
  (Valid)      (Valid)        \
                           [ PRUNED! ] -> Backtrack!
```

The pruning condition acts as an early bounding guard that terminates dead ends before expanding deeper.

$$\text{is_valid}(\text{state}) = \text{false} \implies \text{prune branch and backtrack}$$

```text
1. CHOOSE   ---> Mark state (cols[c] = d1[diag1] = true)
2. EXPLORE  ---> Recurse to next row: place_defense_beacons(row+1)
3. UNCHOOSE ---> Rollback state (cols[c] = d1[diag1] = false)
4. PRUNE    ---> Skip invalid branch before recursing
```

Consider an autonomous beacon deployment solver across an $N \times N$ sensor grid where non-colliding relay beacons are placed row-by-row while avoiding conflict lines.

```cpp
// Guarded Grid Beacon Placement: Explicit State Rollback
void place_defense_beacons(int row, int n, vector<int>& col_placements,
                           vector<bool>& cols, vector<bool>& d1, vector<bool>& d2) {
    if (row == n) {
        // Solution found! Record complete beacon layout
        return;
    }
    for (int col = 0; col < n; ++col) {
        if (!cols[col] && !d1[row - col + n] && !d2[row + col]) {
            // Apply choice (Place beacon)
            cols[col] = d1[row - col + n] = d2[row + col] = true;
            col_placements.push_back(col);

            place_defense_beacons(row + 1, n, col_placements, cols, d1, d2);

            // Rollback choice (Backtrack)
            col_placements.pop_back();
            cols[col] = d1[row - col + n] = d2[row + col] = false;
        }
    }
}
```

Bitmask operations allow us to check column and diagonal interference zones simultaneously in $O(1)$ time.

```cpp
// Fast Bitmask Beacon Placement Solver
int total_valid_layouts = 0;
void count_beacon_layouts_bitmask(int row, int n, int cols, int d1, int d2) {
    if (row == n) {
        total_valid_layouts++;
        return;
    }
    // Available unblocked coordinate positions on current row
    int available = ((1 << n) - 1) & ~(cols | d1 | d2);
    while (available) {
        int bit = available & (-available); // Extract lowest available position
        available &= (available - 1);       // Clear extracted position
        count_beacon_layouts_bitmask(row + 1, n, cols | bit, (d1 | bit) << 1, (d2 | bit) >> 1);
    }
}
```

#### Complexity Analysis
- **Time Complexity:** $O(N!)$ worst-case upper bound, heavily reduced by pruning in practice.
- **Auxiliary Space:** $O(N)$ recursive stack depth for an $N \times N$ chessboard.

---


## Randomized Algorithms


### Deterministic vs Expected Time and Space Complexity

Randomized algorithms use random bits during execution to guarantee fast average performance regardless of adversarial input arrangements.

In deterministic algorithms, worst-case inputs always trigger worst-case execution times. In randomized algorithms, worst-case runtime depends on random choices, not input ordering.

```text
Deterministic QuickSort (First element pivot):
Adversary passes already sorted array: [ 1, 2, 3, 4, 5 ]
Partitioning degrades to (n-1, 0) splits ===> O(n^2) worst case!

Randomized QuickSort:
Pivot chosen uniformly at random: mt19937 RNG
Adversary cannot craft bad inputs ===> Expected Theta(n log n) time!
```

The expected runtime of Randomized QuickSort is derived by summing pair comparison probabilities over all random permutations.

$$E[T(n)] = \sum_{i=1}^{n-1} \sum_{j=i+1}^n \frac{2}{j - i + 1} = 2n \ln n + O(n) = \Theta(n \log n)$$

Let's examine how random pivot selection protects QuickSort from worst-case inputs.

```cpp
// Randomized QuickSort Partitioning: Eliminates Adversarial Inputs
int randomized_partition(vector<int>& arr, int low, int high, mt19937& rng) {
    int random_idx = low + (rng() % (high - low + 1));
    swap(arr[random_idx], arr[high]); // Place random pivot at end
    return partition_pivot(arr, low, high);
}
```

| Property | Deterministic QuickSort | Randomized QuickSort |
| :--- | :--- | :--- |
| Worst-Case Time | $O(n^2)$ (sorted/reverse inputs) | $O(n^2)$ (astronomically rare) |
| Expected Time | $\Theta(n \log n)$ | $\Theta(n \log n)$ |
| Space Complexity | $O(n)$ stack on sorted data | $O(\log n)$ expected stack depth |
| Vulnerable to Adversary? | **Yes** (exploitable by bad inputs) | **No** (input independent) |

```text
Deterministic on Sorted Input:   |-------------------> [ O(n^2) ]
Randomized Expected Runtime:     [ O(n log n) Narrow Bell Curve ]
```

> [!TIP]
> Use `mt19937` with `random_device` seeding instead of outdated `rand()` to prevent modulo bias on large number ranges.

Let's now categorize randomized algorithms into Las Vegas and Monte Carlo paradigms.


#### Complexity Analysis
- **Time Complexity:** $\Theta(n \log n)$ expected runtime over all random seeds.
- **Auxiliary Space:** $O(\log n)$ expected call stack depth.

---


### Las Vegas Paradigms — Exact Correctness with Variable Runtime

Las Vegas algorithms are randomized algorithms that are guaranteed to always produce the strictly correct answer.

The only variable in a Las Vegas algorithm is its execution runtime, never the correctness of its output.

```text
Guaranteed Output: Strictly 100% correct answer
Runtime: Random variable clustered tightly around Expected Mean
Tail Probability (Markov's Inequality): P(T >= k * E[T]) <= 1 / k
```

Markov's Inequality bounds the probability that a Las Vegas algorithm takes significantly longer than its expected runtime.

$$P(T \ge k \cdot E[T]) \le \frac{1}{k}$$

Randomized QuickSelect is a classic Las Vegas algorithm that finds the $k$-th smallest element in expected $O(n)$ time.

```cpp
// Las Vegas QuickSelect: Expected O(n) Time, Guaranteed Correctness
int quick_select(vector<int>& arr, int low, int high, int k, mt19937& rng) {
    if (low == high) return arr[low];
    int p_idx = randomized_partition(arr, low, high, rng);
    if (p_idx == k) return arr[p_idx]; // Exact target element found!
    else if (p_idx > k) return quick_select(arr, low, p_idx - 1, k, rng);
    else return quick_select(arr, p_idx + 1, high, k, rng);
}
```

We can eliminate recursion frames by updating search boundaries iteratively.

```cpp
// Iterative QuickSelect: Zero call stack frames
int quick_select_iterative(vector<int>& arr, int k, mt19937& rng) {
    int low = 0, high = arr.size() - 1;
    while (low <= high) {
        if (low == high) return arr[low];
        int p_idx = randomized_partition(arr, low, high, rng);
        if (p_idx == k) return arr[p_idx];
        else if (p_idx > k) high = p_idx - 1;
        else low = p_idx + 1;
    }
    return -1;
}
```

| Trial # | Random Seed | Partition Efficiency | Steps Executed | Correctness |
| :--- | :--- | :--- | :--- | :--- |
| Trial 1 | `Seed: 42` | Balanced ($50/50$) | $180$ steps | **100% Correct** |
| Trial 2 | `Seed: 1337` | Skewed ($70/30$) | $240$ steps | **100% Correct** |
| Trial 3 | `Seed: 9999` | Optimal ($48/52$) | $165$ steps | **100% Correct** |

```text
[ Size: n = 1000 ] ===> [ Size: 480 ] ===> [ Size: 220 ] ===> Done!
Total Expected Work = n + n/2 + n/4 + ... = 2n = Theta(n)
```

> [!IMPORTANT]
> Las Vegas algorithms never compromise on correctness; they only introduce variance in execution duration.

Now let's examine Monte Carlo algorithms, which trade absolute certainty for fixed runtime bounds.


#### Complexity Analysis
- **Time Complexity:** $\Theta(n)$ expected runtime to find the $k$-th smallest element.
- **Auxiliary Space:** $O(1)$ space for the iterative in-place selection loop.

---


### Monte Carlo Paradigms — Fixed Runtime with Bounded Error

Monte Carlo algorithms are randomized algorithms with fixed, deterministic runtimes that may produce an error with a small, mathematically bounded probability.

By repeating independent Monte Carlo trials, we exponentially amplify success probability, driving error rates to near-zero.

```text
1 Trial:   [ Error Rate: 50% ]
2 Trials:  [ Error Rate: 25% ]
10 Trials: [ Error Rate: 0.097% ]
30 Trials: [ Error Rate: 0.00000009% (< 1 in a billion!) ]
```

The error probability amplification formula proves how quickly independent trials eliminate uncertainty.

$$P(\text{failure after } k \text{ trials}) \le \left(\frac{1}{2}\right)^k \implies P(\text{error}) < 10^{-9} \quad \text{for } k = 30$$

Fermat's Primality Test is a classic Monte Carlo algorithm that tests whether a number $n$ is prime using modular exponentiation.

```cpp
// Modular Exponentiation Helper: (base^exp) % mod
long long mod_pow(long long base, long long exp, long long mod) {
    long long res = 1;
    base %= mod;
    while (exp > 0) {
        if (exp % 2 == 1) res = (__int128)res * base % mod;
        base = (__int128)base * base % mod;
        exp /= 2;
    }
    return res;
}

// Monte Carlo Fermat Primality Test (k trials)
bool fermat_is_prime(long long n, int k, mt19937_64& rng) {
    if (n <= 1 || n == 4) return false;
    if (n <= 3) return true;
    for (int i = 0; i < k; ++i) {
        long long a = 2 + (rng() % (n - 3)); // Random base in [2, n-2]
        if (mod_pow(a, n - 1, n) != 1) return false; // Composite witness!
    }
    return true; // Probably prime (bounded error)
}
```

| Dimension | Las Vegas | Monte Carlo |
| :--- | :--- | :--- |
| Output Correctness | Guaranteed $100\%$ correct | Probabilistic (error bounded by $\epsilon$) |
| Runtime Bound | Random variable (Expected bound) | Deterministic fixed bound ($O(k \cdot f(n))$) |
| Failure Mode | Excessive execution time | Incorrect answer returned |
| Representative Example | Randomized QuickSelect | Miller-Rabin Primality Test |

```text
If a single base 'a' fails: mod_pow(a, n-1, n) != 1
Number is GUARANTEED to be composite (100% certain witness!)
If all 'k' bases pass: Number is prime with confidence > 1 - 2^(-k)
```

> [!CAUTION]
> A single failing witness test proves composite status with 100% certainty, whereas passing all trials guarantees primality only probabilistically.

Let's conclude this chapter with Meet in the Middle, an effective search space reduction technique.


#### Complexity Analysis
- **Time Complexity:** $O(k \log n)$ time for $k$ randomized modular exponentiation trials.
- **Auxiliary Space:** $O(1)$ scalar calculation storage.

---


## Search Space Reduction


### Meet in the Middle — Divide-and-Map Technique

Consider a subset sum problem where $n = 40$. A standard brute force search across $2^{40} \approx 1.1 \times 10^{12}$ states is far too slow to run within time limits.

Meet in the Middle splits the search space into two equal halves of size $n/2$, generates all $2^{n/2}$ subsets for each half, and combines them using binary search or hash maps.

```text
Full Brute Force Tree:   2^40 = 1,099,511,627,776 states (TLE!)
Left Half Tree (n = 20): 2^20 = 1,048,576 states
Right Half Tree (n = 20):2^20 = 1,048,576 states
Total Work: 2^20 + 2^20 * log(2^20) = ~2.2 x 10^7 operations (Pass!)
```

Splitting the exponent in half transforms an intractable exponential problem into an efficient computation.

$$O(2^n) \longrightarrow O\left(2^{n/2} \cdot \frac{n}{2} + 2^{n/2} \log\left(2^{n/2}\right)\right) = O\left(n \cdot 2^{n/2}\right)$$

Let's implement Meet in the Middle for the 40-element Subset Sum problem.

```cpp
// Meet in the Middle Subset Sum Solver: n <= 40
void get_subset_sums(const vector<long long>& arr, int start, int len, vector<long long>& sums) {
    int total = 1 << len;
    for (int mask = 0; mask < total; ++mask) {
        long long current_sum = 0;
        for (int i = 0; i < len; ++i) {
            if (mask & (1 << i)) current_sum += arr[start + i];
        }
        sums.push_back(current_sum);
    }
}

bool meet_in_the_middle(const vector<long long>& arr, long long target) {
    int n = arr.size();
    int mid = n / 2;
    vector<long long> left_sums, right_sums;
    get_subset_sums(arr, 0, mid, left_sums);
    get_subset_sums(arr, mid, n - mid, right_sums);

    sort(right_sums.begin(), right_sums.end()); // Enable binary search

    for (long long s : left_sums) {
        long long needed = target - s;
        if (binary_search(right_sums.begin(), right_sums.end(), needed)) {
            return true; // Match found!
        }
    }
    return false;
}
```

| Input Size ($n$) | Brute Force States ($2^n$) | Meet in Middle States ($2^{n/2}$) | Speedup Factor |
| :--- | :--- | :--- | :--- |
| $20$ | $1,048,576$ | $1,024$ | **1,000x** |
| $30$ | $1.07 \times 10^9$ | $32,768$ | **32,000x** |
| $40$ | $1.1 \times 10^{12}$ | $1,048,576$ | **1,000,000x** |

```text
[ Left Half (n/2) ]               [ Right Half (n/2) ]
        |                                  |
(Generate 2^(n/2) sums)          (Generate 2^(n/2) sums)
        |                                  |
[ Left Sums List ]               [ Sort Right Sums ]
        \                                  /
         \                                /
          ===> Binary Search Lookup <====
```

```text
Time reduction from 2^40 to 2^20 comes at the cost of storing
2^20 integers (1,048,576 elements * 8 bytes = ~8.4 MB RAM).
Memory easily fits standard 256 MB competitive limits!
```

> [!WARNING]
> Storing generated subsets in memory requires careful space budgeting. If $n/2 > 24$, storing $2^{24}$ integers consumes over 64 MB of RAM.

Meet in the Middle completes our survey of fundamental algorithmic paradigms, providing design strategies for the data structures and algorithms in upcoming chapters.


#### Complexity Analysis
- **Time Complexity:** $O(n \cdot 2^{n/2})$ total time to generate and binary search subproblem sums.
- **Auxiliary Space:** $O(2^{n/2})$ auxiliary vector storage holding generated subset sums.

---


## Cheat Sheet & Quick Reference

| Paradigm | Core Philosophy | Time Complexity Pattern | Optimal Use Case |
| :--- | :--- | :--- | :--- |
| Brute Force | Systematic exhaustive state search | $O(2^n)$ or $O(n!)$ | Small $n \le 20$, Stress test oracle |
| Divide & Conquer | Split disjoint subproblems & combine | $T(n) = aT(n/b) + O(n)$ | Sorting, geometric algorithms |
| Decrease & Conquer | Reduce to 1 smaller subproblem | $T(n) = T(n/2) + O(1)$ | Binary Search, Fast Exponentiation |
| Greedy Algorithm | Myopic locally optimal choices | $O(n \log n)$ (sorting) | Activity Selection, Huffman, Kruskal |
| Dynamic Programming | Memoize overlapping subproblems | $O(N \cdot K)$ state table | Knapsack, Shortest Paths, Edit Dist |
| Backtracking | State tree DFS with early pruning | $O(B^D)$ pruned | Combinatorial search, constraint puzzles, power set generation |
| Las Vegas | Exact correctness, variable runtime | Expected $\Theta(n)$ | Randomized QuickSelect / QuickSort |
| Monte Carlo | Fixed runtime, bounded error | $O(k \log n)$ | Miller-Rabin Primality Testing |
| Meet in the Middle | Halve search space & binary search | $O(n \cdot 2^{n/2})$ | Subset Sum, Knapsack with $n \le 40$ |
