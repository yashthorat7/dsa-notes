# Chapter 12: Sorting Algorithms

---

## Theoretical Sorting Concepts

### Theoretical Sorting Taxonomies & Strict Weak Ordering

Let's start at the whiteboard by establishing the foundational classification axes that govern every sorting algorithm in computer science.

We categorize sorting routines along two critical dimensions: Stability, which preserves the original relative order of equal keys, and Adaptivity, which accelerates when inputs are already partially sorted.

```text
Input Records:   [ ("Alice", 2), ("Bob", 1), ("Charlie", 2) ]
Stable Sort:     [ ("Bob", 1), ("Alice", 2), ("Charlie", 2) ]
                 (Alice appeared before Charlie -> order preserved!)
Unstable Sort:   [ ("Bob", 1), ("Charlie", 2), ("Alice", 2) ]
                 (Charlie jumped ahead of Alice -> order destroyed!)
```

Every comparison-based comparator in C++ must strictly satisfy the three mathematical axioms of Strict Weak Ordering.

$$\text{Irreflexivity: } \neg(a < a), \quad \text{Asymmetry: } a < b \implies \neg(b < a), \quad \text{Transitivity: } a < b \land b < c \implies a < c$$

Let's look at how a subtle comparator mistake leads to memory corruption in C++.

```cpp
// Correct vs Faulty Comparator Structs in C++
struct Student {
    string name;
    int score;
};

// CORRECT: Satisfies strict weak ordering (irreflexive: cmp(a, a) == false)
bool valid_compare(const Student& a, const Student& b) {
    return a.score > b.score; 
}

// BUG TRAP: Violates irreflexivity (cmp(a, a) == true), crashing sort
bool buggy_compare(const Student& a, const Student& b) {
    return a.score >= b.score; // DANGEROUS! Never use >= or <=
}
```

Two items are considered equivalent under strict weak ordering whenever neither is strictly less than the other.

$$a \equiv b \iff \neg(a < b) \land \neg(b < a)$$

Let's implement a clean multi-field comparator using tuple tie-breaking.

```cpp
// Multi-field comparator with secondary tie-breaking
struct Employee {
    int department_id;
    int salary;
    string name;
};

bool compare_employees(const Employee& a, const Employee& b) {
    if (a.department_id != b.department_id) {
        return a.department_id < b.department_id;
    }
    if (a.salary != b.salary) {
        return a.salary > b.salary; // Higher salary first
    }
    return a.name < b.name;         // Lexicographical fallback
}
```

| Algorithm | Best Time | Average Time | Worst Time | Auxiliary Space | Stable? | Adaptive? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Bubble Sort** | $O(N)$ | $O(N^2)$ | $O(N^2)$ | $O(1)$ | Yes | Yes |
| **Selection Sort** | $O(N^2)$ | $O(N^2)$ | $O(N^2)$ | $O(1)$ | No | No |
| **Insertion Sort** | $O(N)$ | $O(N^2)$ | $O(N^2)$ | $O(1)$ | Yes | Yes |
| **Merge Sort** | $O(N \log N)$ | $O(N \log N)$ | $O(N \log N)$ | $O(N)$ | Yes | No |
| **QuickSort** | $O(N \log N)$ | $O(N \log N)$ | $O(N^2)$ | $O(\log N)$ | No | No |
| **Heap Sort** | $O(N \log N)$ | $O(N \log N)$ | $O(N \log N)$ | $O(1)$ | No | No |

```text
Sorting N elements requires identifying 1 permutation out of N!
Binary decision tree of height h has at most 2^h leaf nodes:
                2^h >= N!  ===>  h >= log2(N!)
By Stirling's Approximation: log2(N!) = Theta(N log N)
CONCLUSION: Comparison-based sorting cannot beat Omega(N log N)
```

> [!WARNING]
> Using `<=` or `>=` inside custom comparators violates irreflexivity because `cmp(x, x)` evaluates to `true`. This causes undefined behavior and infinite loops in standard library sorting routines.

Let's now examine the elementary quadratic sorting algorithms.

#### Complexity Analysis
- **Time Complexity:** Comparison-based lower bound is $\Omega(N \log N)$; linear $O(N + K)$ only via non-comparison indexing.
- **Auxiliary Space:** $O(1)$ for in-place sorters; $O(N)$ for out-of-place stable merges.

---

## Comparison-Based Sorting

### Quadratic Sorters — Bubble, Selection, and Insertion Sort

Let's walk through the three foundational $O(N^2)$ sorting routines: Bubble Sort, Selection Sort, and Insertion Sort.

Bubble Sort ripples large items rightward via adjacent swaps, Selection Sort hunts the minimum unsorted element, and Insertion Sort slides incoming items into an expanding sorted prefix.

```text
Bubble Sort:    [ 5, 2, 8, 1 ] -> Compare adjacent (5,2) -> Swap
Selection Sort: [ 5, 2, 8, 1 ] -> Find min (1) in rest -> Swap with 5
Insertion Sort: [ 2, 5 | 1 ]   -> Slide 1 left into sorted prefix
```

All three algorithms perform nested iterations whose worst-case comparison counts sum to a triangular quadratic series.

$$\sum_{i=1}^{N-1} i = \frac{N(N-1)}{2} = \Theta(N^2)$$

Let's implement optimized Bubble Sort with early termination alongside Selection Sort.

```cpp
// Optimized Bubble Sort & Selection Sort: O(N^2) Time, O(1) Space
void bubble_sort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; ++i) {
        bool swapped = false;
        for (int j = 0; j < n - i - 1; ++j) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
                swapped = true;
            }
        }
        if (!swapped) break; // Array is already fully sorted
    }
}

void selection_sort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; ++i) {
        int min_idx = i;
        for (int j = i + 1; j < n; ++j) {
            if (arr[j] < arr[min_idx]) min_idx = j;
        }
        swap(arr[i], arr[min_idx]);
    }
}
```

Now let's examine Insertion Sort, which runs in linear time on nearly-sorted data.

```cpp
// Insertion Sort with Inversion Shifts: O(N + I) Time, O(1) Space
void insertion_sort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 1; i < n; ++i) {
        int key = arr[i];
        int j = i - 1;
        // Shift larger sorted elements to the right to make room
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}
```

| Iteration $i$ | Unsorted Array State | Element Shifted / Key | Comparisons Made | Inversions Cleared |
| :--- | :--- | :--- | :--- | :--- |
| Init | `[ 5, 2, 4, 6, 1 ]` | - | - | - |
| $i=1$ | `[ 2, 5, 4, 6, 1 ]` | Key = $2$, shifts $5$ | $1$ | $1$ |
| $i=2$ | `[ 2, 4, 5, 6, 1 ]` | Key = $4$, shifts $5$ | $2$ | $1$ |
| $i=3$ | `[ 2, 4, 5, 6, 1 ]` | Key = $6$, no shifts | $1$ | $0$ |
| $i=4$ | `[ 1, 2, 4, 5, 6 ]` | Key = $1$, shifts all | $4$ | $4$ |

```text
Pass 1: [ 2, 5 ] | 4, 6, 1        (Sorted prefix size = 2)
Pass 2: [ 2, 4, 5 ] | 6, 1        (Sorted prefix size = 3)
Pass 3: [ 2, 4, 5, 6 ] | 1        (Sorted prefix size = 4)
Pass 4: [ 1, 2, 4, 5, 6 ]         (Fully sorted array)
```

> [!TIP]
> Insertion Sort executes in exactly $\Theta(N + I)$ time, where $I$ is the number of inversions. For small arrays ($N \le 16$), its tiny constant factors beat QuickSort and Merge Sort.

Next, let's step up to divide-and-conquer log-linear sorting with Merge Sort.

#### Complexity Analysis
- **Time Complexity:** $O(N)$ best case for Bubble and Insertion; $O(N^2)$ worst case for all three.
- **Auxiliary Space:** $O(1)$ in-place memory.

---

### Merge Sort — Divide-and-Conquer & Out-of-Place Stability

Merge Sort splits the input array into two equal halves, recursively sorts each half, and merges the sorted halves back together in linear time.

Because equal items are selected from the left subarray first during the merge pass, Merge Sort guarantees absolute stability.

```text
Split:                [ 8, 3, 2, 9, 7, 1, 5, 4 ]
                 [ 8, 3, 2, 9 ]        [ 7, 1, 5, 4 ]
              [ 8, 3 ]    [ 2, 9 ]   [ 7, 1 ]    [ 5, 4 ]
Reconstruct:  [ 3, 8 ]    [ 2, 9 ]   [ 1, 7 ]    [ 4, 5 ]
                 [ 2, 3, 8, 9 ]        [ 1, 4, 5, 7 ]
Final Merge:          [ 1, 2, 3, 4, 5, 7, 8, 9 ]
```

The Master Theorem recurrence confirms that halving the problem size with linear merge work results in tight $\Theta(N \log N)$ time.

$$T(N) = 2T(N/2) + \Theta(N) \implies T(N) = \Theta(N \log N)$$

Let's implement Merge Sort using a single pre-allocated auxiliary scratch buffer.

```cpp
// Stable Merge Sort with Shared Buffer: O(N log N) Time, O(N) Space
void merge(vector<int>& arr, vector<int>& temp, int left, int mid, int right) {
    int i = left, j = mid + 1, k = left;

    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) { // <= preserves stability
            temp[k++] = arr[i++];
        } else {
            temp[k++] = arr[j++];
        }
    }
    while (i <= mid) temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];
    for (int p = left; p <= right; ++p) arr[p] = temp[p];
}

void merge_sort_rec(vector<int>& arr, vector<int>& temp, int left, int right) {
    if (left >= right) return;
    int mid = left + (right - left) / 2;
    merge_sort_rec(arr, temp, left, mid);
    merge_sort_rec(arr, temp, mid + 1, right);
    merge(arr, temp, left, mid, right);
}
```

We can also adapt the merge subroutine to count array inversions in $O(N \log N)$ time.

```cpp
// Inversion Count via Merge Sort Subroutine
long long count_inversions(vector<int>& arr, vector<int>& temp, int l, int r) {
    if (l >= r) return 0;
    int m = l + (r - l) / 2;
    long long inv = count_inversions(arr, temp, l, m) 
                  + count_inversions(arr, temp, m + 1, r);

    int i = l, j = m + 1, k = l;
    while (i <= m && j <= r) {
        if (arr[i] <= arr[j]) {
            temp[k++] = arr[i++];
        } else {
            temp[k++] = arr[j++];
            inv += (m - i + 1); // All remaining left elements form inversions
        }
    }
    while (i <= m) temp[k++] = arr[i++];
    while (j <= r) temp[k++] = arr[j++];
    for (int p = l; p <= r; ++p) arr[p] = temp[p];
    return inv;
}
```

| Recursion Depth | Subarray $[L, R]$ | Subarrays Merged | Inversions Added | Resulting Segment |
| :--- | :--- | :--- | :--- | :--- |
| Level 2 | $[0, 1]$ | `[8]` and `[3]` | $+1$ ($8 > 3$) | `[3, 8]` |
| Level 2 | $[2, 3]$ | `[2]` and `[9]` | $0$ | `[2, 9]` |
| Level 1 | $[0, 3]$ | `[3, 8]` and `[2, 9]` | $+2$ ($3>2, 8>2$) | `[2, 3, 8, 9]` |
| Level 0 | $[0, 7]$ | `[2, 3, 8, 9]` and `[1, 4, 5, 7]` | $+7$ | `[1, 2, 3, 4, 5, 7, 8, 9]` |

```text
Left Half:  [ 3,  8 ]     (Pointer i -> 8)
Right Half: [ 2,  9 ]     (Pointer j -> 2)
Action: arr[i] > arr[j] -> Copy arr[j]=2 to temp, jump inversions:
Inversions added = (mid - i + 1) = 1 - 0 + 1 = 2 (items: 3>2 and 8>2)
```

> [!WARNING]
> Allocating a new `vector<int>` inside every recursive merge call creates $O(N)$ dynamic allocations, destroying CPU cache locality. Always allocate a single scratch buffer upfront.

Let's now investigate QuickSort and its partitioning strategies.

#### Complexity Analysis
- **Time Complexity:** $\Theta(N \log N)$ across all input cases (best, average, and worst).
- **Auxiliary Space:** $O(N)$ for the merge scratch buffer plus $O(\log N)$ recursion stack space.

---

### QuickSort — Partitioning Mechanics (Lomuto vs Hoare) & Pivot Selection

QuickSort operates by picking a pivot element, partitioning the array so smaller elements sit on the left and larger on the right, and recurring on both sides.

Unlike Merge Sort, QuickSort sorts completely in place without requiring external buffer memory.

```text
Pivot = P
Array:  [  Elements < P  |  P  |  Elements >= P  ]
               |                   |
        Recur Left Part     Recur Right Part
```

Pivot quality determines the recursion tree shape: balanced partitions run in $O(N \log N)$, while unbalanced partitions degrade to $O(N^2)$.

$$\text{Best: } T(N) = 2T(N/2) + \Theta(N) = \Theta(N \log N), \quad \text{Worst: } T(N) = T(N-1) + \Theta(N) = \Theta(N^2)$$

Let's implement Lomuto partitioning and the standard QuickSort driver.

```cpp
// Lomuto Partitioning QuickSort: O(N log N) Avg, In-Place
int lomuto_partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;

    for (int j = low; j < high; ++j) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return i + 1; // Pivot final index
}

void quicksort_lomuto(vector<int>& arr, int low, int high) {
    if (low < high) {
        int p = lomuto_partition(arr, low, high);
        quicksort_lomuto(arr, low, p - 1);
        quicksort_lomuto(arr, p + 1, high);
    }
}
```

Now let's examine Hoare's bidirectional partitioning with Median-of-3 pivot selection, which performs roughly three times fewer swaps.

```cpp
// Hoare Partitioning with Median-of-3 Pivot Selection
int median_of_three(vector<int>& arr, int low, int high) {
    int mid = low + (high - low) / 2;
    if (arr[low] > arr[mid]) swap(arr[low], arr[mid]);
    if (arr[low] > arr[high]) swap(arr[low], arr[high]);
    if (arr[mid] > arr[high]) swap(arr[mid], arr[high]);
    return arr[mid];
}

int hoare_partition(vector<int>& arr, int low, int high) {
    int pivot = median_of_three(arr, low, high);
    int i = low - 1, j = high + 1;

    while (true) {
        do { i++; } while (arr[i] < pivot);
        do { j--; } while (arr[j] > pivot);
        if (i >= j) return j;
        swap(arr[i], arr[j]);
    }
}
```

| Partition Scheme | Scan Direction | Average Swap Count | Equal Element Handling | In-Place? |
| :--- | :--- | :--- | :--- | :--- |
| **Lomuto** | 1-Directional ($L \to R$) | $\approx N$ swaps | Pushes equals to right | Yes |
| **Hoare** | 2-Directional (Converging) | $\approx N/3$ swaps | Stops on equals, splits evenly | Yes |
| **Dutch Flag** | 3-Way Partition | $\approx N$ swaps | Isolates duplicates in middle | Yes |

```text
Array:   [  5,  2,  9,  3,  8,  4  ]  Pivot = 4
Pointers:   i ->                 <- j
i stops on 5 (>= 4), j stops on 4 (<= 4) -> Swap 5 and 4
Array:   [  4,  2,  9,  3,  8,  5  ]
Pointers advance and repeat until i and j cross
```

> [!CAUTION]
> Always picking `arr[low]` or `arr[high]` as the pivot triggers $O(N^2)$ worst-case time on sorted or reverse-sorted data. Always use Median-of-3 or randomized pivot selection.

Let's now study Heap Sort for guaranteed $O(N \log N)$ sorting in $O(1)$ auxiliary space.

#### Complexity Analysis
- **Time Complexity:** $O(N \log N)$ expected average; $O(N^2)$ worst-case under adversarial pivot choices.
- **Auxiliary Space:** $O(\log N)$ average call stack memory for recursion.

---

### Heap Sort & In-Place Binary Heap Construction

Heap Sort organizes an array into a Max-Heap in $O(N)$ time, then repeatedly extracts the maximum element to the back of the array.

Unlike QuickSort, Heap Sort guarantees $O(N \log N)$ worst-case time while requiring zero additional auxiliary memory.

```text
Tree:            [0]                   Array Indices:
               /     \                 Left Child  = 2*i + 1
            [1]       [2]              Right Child = 2*i + 2
           /   \     /   \             Parent      = (i - 1) / 2
         [3]   [4] [5]   [6]
```

Bottom-up heap construction runs in linear $O(N)$ time because the vast majority of nodes reside near the bottom with minimal sift-down heights.

$$\sum_{h=0}^{\lfloor\log_2 N\rfloor} \frac{N}{2^{h+1}} O(h) = O\left(N \sum_{h=0}^\infty \frac{h}{2^h}\right) = O(2N) = \Theta(N)$$

Let's implement the core `heapify` downward sifting routine.

```cpp
// Max-Heap Sift-Down: O(log N) Time, O(1) Space
void heapify(vector<int>& arr, int n, int i) {
    int largest = i;
    int left = 2 * i + 1;
    int right = 2 * i + 2;

    if (left < n && arr[left] > arr[largest]) largest = left;
    if (right < n && arr[right] > arr[largest]) largest = right;

    if (largest != i) {
        swap(arr[i], arr[largest]);
        heapify(arr, n, largest); // Sift down recursively
    }
}
```

Now let's assemble complete in-place Heap Sort.

```cpp
// In-Place Heap Sort: O(N log N) Time, O(1) Space
void heap_sort(vector<int>& arr) {
    int n = arr.size();

    // Step 1: Build Max-Heap from last non-leaf parent down to root
    for (int i = n / 2 - 1; i >= 0; --i) {
        heapify(arr, n, i);
    }

    // Step 2: Extract maximum elements one by one
    for (int i = n - 1; i > 0; --i) {
        swap(arr[0], arr[i]);   // Move current max to sorted suffix
        heapify(arr, i, 0);     // Restore heap property on reduced heap
    }
}
```

| Step | Heap Size | Root Element (Max) | Extracted Swap Target | Sift-Down Path |
| :--- | :--- | :--- | :--- | :--- |
| Build | $6$ | Max element placed at root | - | Subtrees normalized |
| $i=5$ | $6 \to 5$ | Root `arr[0]` | Swap with `arr[5]` | Sift down root into size 5 |
| $i=4$ | $5 \to 4$ | Root `arr[0]` | Swap with `arr[4]` | Sift down root into size 4 |
| $i=3$ | $4 \to 3$ | Root `arr[0]` | Swap with `arr[3]` | Sift down root into size 3 |
| $i=2$ | $3 \to 2$ | Root `arr[0]` | Swap with `arr[2]` | Sift down root into size 2 |
| $i=1$ | $2 \to 1$ | Root `arr[0]` | Swap with `arr[1]` | Array fully sorted |

```text
Active Max Heap: [ 9, 7, 8, 3, 2 ] | Sorted Suffix: [ 10, 15 ]
1. Swap root (9) with end of heap (2):
   [ 2, 7, 8, 3, 9 ] | [ 10, 15 ]
2. Sift down 2 to restore heap:
   [ 8, 7, 2, 3 ] | [ 9, 10, 15 ]
```

> [!IMPORTANT]
> Heap Sort is NOT stable and exhibits poorer CPU cache locality than QuickSort due to non-contiguous array jumps across tree child nodes.

Let's now examine Shell Sort, which uses diminishing gap sequences.

#### Complexity Analysis
- **Time Complexity:** $O(N)$ for heap construction, $\Theta(N \log N)$ total sorting time across all cases.
- **Auxiliary Space:** $O(1)$ strictly in-place memory.

---

### Shell Sort & Diminishing Increment Sequences

Shell Sort improves on Insertion Sort by comparing and exchanging elements separated by a diminishing gap sequence.

Sorting with wide gaps breaks long-distance inversions rapidly, ensuring the final gap-1 insertion pass completes in near-linear time.

```text
Array Indices:   0   1   2   3   4   5   6   7   8
Sub-Array 0:    [A0]        [A3]        [A6]
Sub-Array 1:        [A1]        [A4]        [A7]
Sub-Array 2:            [A2]        [A5]        [A8]
```

The time complexity of Shell Sort depends directly on the chosen gap reduction formula.

$$\text{Shell Sequence } (N/2^k): O(N^2), \quad \text{Knuth } ((3^k-1)/2): O(N^{3/2}), \quad \text{Sedgewick}: O(N^{4/3})$$

Let's implement Shell Sort using Knuth's gap sequence.

```cpp
// Shell Sort with Knuth's Sequence: O(N^(3/2)) Time, O(1) Space
void shell_sort_knuth(vector<int>& arr) {
    int n = arr.size();

    // Generate maximum Knuth gap: 1, 4, 13, 40, 121...
    int h = 1;
    while (h < n / 3) h = 3 * h + 1;

    // Diminish gap down to 1
    while (h >= 1) {
        for (int i = h; i < n; ++i) {
            int key = arr[i];
            int j = i;
            // Shift elements separated by gap h
            while (j >= h && arr[j - h] > key) {
                arr[j] = arr[j - h];
                j -= h;
            }
            arr[j] = key;
        }
        h /= 3; // Reduce gap
    }
}
```

| Gap Formula | Gap Sequence Example | Worst-Case Complexity | Memory Overhead |
| :--- | :--- | :--- | :--- |
| **Shell** ($N/2^k$) | $16, 8, 4, 2, 1$ | $\Theta(N^2)$ | $O(1)$ |
| **Hibbard** ($2^k - 1$) | $1, 3, 7, 15, 31$ | $\Theta(N^{3/2})$ | $O(1)$ |
| **Knuth** ($(3^k - 1)/2$) | $1, 4, 13, 40, 121$ | $\Theta(N^{3/2})$ | $O(1)$ |
| **Sedgewick** | $1, 5, 19, 41, 109$ | $\Theta(N^{4/3})$ | $O(1)$ |

```text
Pass 1 (Gap = 4): [ 9, 8, 3, 7, 5, 6, 4, 1 ] -> 24 Inversions
                  Sort items at stride 4
Pass 2 (Gap = 1): [ 5, 6, 3, 1, 9, 8, 4, 7 ] -> 4 Inversions!
Final Pass:       Fast near-linear Insertion Sort pass finishes array
```

> [!TIP]
> Shell Sort requires zero recursion stack memory and runs entirely in-place, making it a popular choice for memory-constrained embedded systems and microcontrollers.

Let's now move from comparison sorting to non-comparison linear sorters.

#### Complexity Analysis
- **Time Complexity:** $O(N^{3/2})$ with Knuth's sequence; $O(N \log N)$ best-case on sorted inputs.
- **Auxiliary Space:** $O(1)$ in-place memory.

---

## Non-Comparison Sorters

### Non-Comparison Sorters — Counting Sort & Radix Sort

Counting Sort and Radix Sort break the comparison $\Omega(N \log N)$ lower bound by treating keys as discrete numbers and indexing directly into frequency buckets.

Counting Sort tallies frequencies and builds prefix index maps, while Radix Sort sorts multi-digit numbers pass-by-pass from Least Significant Digit to Most Significant Digit.

```text
Input Array:     [ 4, 2, 2, 8, 3, 3, 1 ]
Count Tally:     Key 1:1, Key 2:2, Key 3:2, Key 4:1, Key 8:1
Prefix Sums:     Offset positions for each key in output array
Stable Output:   [ 1, 2, 2, 3, 3, 4, 8 ]
```

The time complexity of Counting Sort scales with key range $K$, while LSD Radix Sort scales with digit count $d$.

$$\text{Counting Sort} = \Theta(N + K), \quad \text{LSD Radix Sort} = \Theta(d \cdot (N + b))$$

Let's implement a stable Counting Sort subroutine.

```cpp
// Stable Counting Sort: O(N + K) Time, O(N + K) Space
void counting_sort(vector<int>& arr) {
    if (arr.empty()) return;
    int max_val = *max_element(arr.begin(), arr.end());
    int min_val = *min_element(arr.begin(), arr.end());
    int range = max_val - min_val + 1;

    vector<int> count(range, 0), output(arr.size());
    for (int num : arr) count[num - min_val]++;
    for (int i = 1; i < range; ++i) count[i] += count[i - 1];

    // Iterate backward to guarantee stability
    for (int i = arr.size() - 1; i >= 0; --i) {
        output[count[arr[i] - min_val] - 1] = arr[i];
        count[arr[i] - min_val]--;
    }
    arr = output;
}
```

Now let's build Least Significant Digit (LSD) Radix Sort for integers.

```cpp
// LSD Radix Sort: O(d * (N + 10)) Time, O(N) Space
void count_sort_for_radix(vector<int>& arr, int exp) {
    int n = arr.size();
    vector<int> output(n), count(10, 0);

    for (int i = 0; i < n; ++i) count[(arr[i] / exp) % 10]++;
    for (int i = 1; i < 10; ++i) count[i] += count[i - 1];

    for (int i = n - 1; i >= 0; --i) {
        int digit = (arr[i] / exp) % 10;
        output[count[digit] - 1] = arr[i];
        count[digit]--;
    }
    arr = output;
}

void radix_sort(vector<int>& arr) {
    if (arr.empty()) return;
    int max_val = *max_element(arr.begin(), arr.end());
    for (int exp = 1; max_val / exp > 0; exp *= 10) {
        count_sort_for_radix(arr, exp);
    }
}
```

| Radix Pass | Digit Examined | Array State After Stable Sort Pass |
| :--- | :--- | :--- |
| Initial | - | `[ 170, 045, 075, 090, 802, 024, 002, 066 ]` |
| Pass 1 ($1\text{s}$) | $1\text{s}$ digit | `[ 170, 090, 802, 002, 024, 045, 075, 066 ]` |
| Pass 2 ($10\text{s}$) | $10\text{s}$ digit | `[ 802, 002, 024, 045, 066, 170, 075, 090 ]` |
| Pass 3 ($100\text{s}$) | $100\text{s}$ digit | `[ 002, 024, 045, 066, 075, 090, 170, 802 ]` |

```text
Digit Pass (1s):
Bucket 0: [ 170, 90 ]     Bucket 2: [ 802, 2 ]    Bucket 4: [ 24 ]
Bucket 5: [ 45, 75 ]      Bucket 6: [ 66 ]
Flattening buckets in order yields stable input for next digit pass
```

> [!WARNING]
> Counting Sort requires memory proportional to key range $K = \max(A) - \min(A)$. If $K = 10^9$ while $N = 100$, allocating the count array will trigger an out-of-memory crash.

Let's now study Bucket Sort for uniformly distributed floating-point numbers.

#### Complexity Analysis
- **Time Complexity:** $\Theta(N + K)$ for Counting Sort; $\Theta(d(N + b))$ for Radix Sort with $d$ digits and base $b$.
- **Auxiliary Space:** $O(N + K)$ for Counting Sort output and frequency buffers.

---

### Bucket Sort & Uniform Distribution Sorting

Bucket Sort partitions continuous numeric values into uniformly spaced interval buckets, sorts each bucket individually, and concatenates the results.

When input values are uniformly distributed, each bucket contains $O(1)$ elements on average, resulting in linear $O(N)$ sorting time.

```text
Values: [ 0.78, 0.17, 0.39, 0.26, 0.72, 0.94, 0.21, 0.12, 0.23 ]
Bucket 1 [0.1-0.2): [ 0.17, 0.12 ] -> Sort -> [ 0.12, 0.17 ]
Bucket 2 [0.2-0.3): [ 0.26, 0.21, 0.23 ] -> Sort -> [ 0.21, 0.23, 0.26]
Bucket 3 [0.3-0.4): [ 0.39 ]
Bucket 7 [0.7-0.8): [ 0.78, 0.72 ] -> Sort -> [ 0.72, 0.78 ]
Bucket 9 [0.9-1.0): [ 0.94 ]
```

The mathematical expectation proves that quadratic sorting on small individual buckets sums to linear total time.

$$E[T(N)] = \Theta(N) + \sum_{i=0}^{K-1} O(E[n_i^2]) = \Theta(N) + K \cdot O\left(1 + \frac{N}{K}\right) = O(N)$$

Let's implement Bucket Sort for floating-point values in $[0, 1)$.

```cpp
// Bucket Sort for Uniform Floats: O(N) Avg Time, O(N) Space
void bucket_sort(vector<float>& arr) {
    int n = arr.size();
    if (n <= 1) return;

    vector<vector<float>> buckets(n);

    // 1. Distribute elements into buckets
    for (int i = 0; i < n; ++i) {
        int bucket_idx = n * arr[i];
        if (bucket_idx >= n) bucket_idx = n - 1;
        buckets[bucket_idx].push_back(arr[i]);
    }

    // 2. Sort individual buckets and concatenate
    int index = 0;
    for (int i = 0; i < n; ++i) {
        sort(buckets[i].begin(), buckets[i].end());
        for (float val : buckets[i]) {
            arr[index++] = val;
        }
    }
}
```

| Bucket Index | Range | Elements Assigned | Sorted Sub-Array |
| :--- | :--- | :--- | :--- |
| $B_1$ | $[0.1, 0.2)$ | $0.17, 0.12$ | `[ 0.12, 0.17 ]` |
| $B_2$ | $[0.2, 0.3)$ | $0.26, 0.21, 0.23$ | `[ 0.21, 0.23, 0.26 ]` |
| $B_3$ | $[0.3, 0.4)$ | $0.39$ | `[ 0.39 ]` |
| $B_7$ | $[0.7, 0.8)$ | $0.78, 0.72$ | `[ 0.72, 0.78 ]` |
| $B_9$ | $[0.9, 1.0)$ | $0.94$ | `[ 0.94 ]` |

```text
[0.12, 0.17] + [0.21, 0.23, 0.26] + [0.39] + [0.72, 0.78] + [0.94]
===> Final Sorted Output:
[ 0.12, 0.17, 0.21, 0.23, 0.26, 0.39, 0.72, 0.78, 0.94 ]
```

> [!CAUTION]
> If the input data is heavily skewed rather than uniformly distributed, all $N$ elements land in a single bucket, causing the runtime to degrade to $O(N^2)$.

Let's now study Cycle Sort, which minimizes physical memory writes.

#### Complexity Analysis
- **Time Complexity:** $O(N)$ average time under uniform distribution; $O(N^2)$ worst-case under severe clustering.
- **Auxiliary Space:** $O(N)$ space to store bucket sub-arrays.

---

### Cycle Sort & Memory-Write Minimization

Cycle Sort is an in-place sorting algorithm designed to minimize the absolute number of memory write operations.

Every element is written to its final destination at most once or twice by decomposing the permutation into disjoint cyclic orbits.

```text
Element 4 belongs at index 3 -> Swap with item at index 3 (1)
Element 1 belongs at index 0 -> Write 1 into index 0
Cycle (4 -> 1 -> 4) closes with minimal writes!
```

Cycle Sort achieves the theoretical minimum number of writes required to sort an array.

$$\text{Best Writes: } 0, \quad \text{Worst Writes: } N - 1 + \text{cycles} \le 2N - 1 = \Theta(N)$$

Let's implement Cycle Sort with exact rank calculation.

```cpp
// Cycle Sort: O(N^2) Time, O(1) Space, Minimum Memory Writes
int cycle_sort(vector<int>& arr) {
    int n = arr.size(), writes = 0;

    for (int cycle_start = 0; cycle_start < n - 1; ++cycle_start) {
        int item = arr[cycle_start];
        int pos = cycle_start;

        for (int i = cycle_start + 1; i < n; ++i) {
            if (arr[i] < item) pos++;
        }
        if (pos == cycle_start) continue;

        while (item == arr[pos]) pos++;
        swap(item, arr[pos]);
        writes++;

        while (pos != cycle_start) {
            pos = cycle_start;
            for (int i = cycle_start + 1; i < n; ++i) {
                if (arr[i] < item) pos++;
            }
            while (item == arr[pos]) pos++;
            swap(item, arr[pos]);
            writes++;
        }
    }
    return writes;
}
```

We can also apply the cyclic index-as-value concept to find missing positive numbers in $O(N)$ time.

```cpp
// First Missing Positive via Cyclic Placement: O(N) Time, O(1) Space
int first_missing_positive(vector<int>& nums) {
    int n = nums.size();
    for (int i = 0; i < n; ++i) {
        // Place nums[i] at index (nums[i] - 1) if within range [1, n]
        while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] != nums[i]) {
            swap(nums[i], nums[nums[i] - 1]);
        }
    }
    for (int i = 0; i < n; ++i) {
        if (nums[i] != i + 1) return i + 1;
    }
    return n + 1;
}
```

| Cycle Root Index | Item Examined | Calculated Target Position | Write Action | Total Writes |
| :--- | :--- | :--- | :--- | :--- |
| `0` | $4$ | $3$ | Swap with `arr[3]` | $1$ |
| `0` (revolving) | $1$ | $0$ | Put into `arr[0]` | $2$ |
| `1` | $3$ | $2$ | Swap with `arr[2]` | $3$ |
| `1` (revolving) | $2$ | $1$ | Put into `arr[1]` | $4$ |

```text
          [ 4 ] --------> Pos 3
            ^                |
            |                v
          Pos 0 <------- [ 1 ]
Cycle completes in place with zero redundant writes
```

> [!TIP]
> Cycle Sort is optimal for writing to Flash Memory and EEPROMs, where physical write cycles cause hardware wear and are orders of magnitude slower than reads.

Let's now conclude with selection algorithms and interval scheduling applications.

#### Complexity Analysis
- **Time Complexity:** $\Theta(N^2)$ comparisons; $O(N)$ writes in the worst case.
- **Auxiliary Space:** $O(1)$ in-place memory.

---

## Sorting Applications

### QuickSelect & Interval Applications (Merge & Scheduling)

Sorting forms the engine for two of the most common interview problem patterns: order statistics selection and interval scheduling.

QuickSelect finds the $K$-th smallest element in expected linear $O(N)$ time by discarding half the array at each partition step without sorting the whole array.

```text
Full Array: [ 8, 3, 2, 9, 7, 1, 5, 4 ]  Looking for K = 3rd smallest
Partition:  [ 3, 2, 1 ] | [ 4 ] | [ 8, 9, 7, 5 ]
Pivot index = 3 == K -> Found 4!
Only recurse into the partition containing index K!
```

The geometric summation proves that halving work at each partition step converges to expected $O(N)$ time.

$$T(N) = T(N/2) + \Theta(N) \implies N + \frac{N}{2} + \frac{N}{4} + \dots = 2N = O(N)$$

Let's implement QuickSelect for finding the $K$-th smallest element.

```cpp
// QuickSelect Algorithm: Expected O(N) Time, O(1) Aux Space
int quick_select(vector<int>& arr, int low, int high, int k) {
    if (low == high) return arr[low];

    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; ++j) {
        if (arr[j] <= pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    int p = i + 1;

    if (p == k) return arr[p];
    if (p > k) return quick_select(arr, low, p - 1, k);
    return quick_select(arr, p + 1, high, k);
}
```

#### Complexity Analysis
- **Time Complexity:** Expected $O(N)$ average time; $O(N^2)$ worst-case if poorly partitioned.
- **Auxiliary Space:** $O(\log N)$ average recursive call stack depth.

---

### Interval Merging

Interval merging combines overlapping or contiguous time windows into mutually exclusive, consolidated spans.

By sorting intervals by their start timestamp, all potentially overlapping intervals cluster together adjacently, allowing a single linear sweep to merge collisions.

```text
Sorted Intervals:  [ 1, 3 ],  [ 2, 6 ],  [ 8, 10 ],  [ 15, 18 ]
Merge [1,3] & [2,6] (2 <= 3):  ===>  [ 1, max(3,6) = 6 ]
Compare with [8,10] (8 > 6):   ===>  New disjoint interval [8, 10]
Output:            [ 1, 6 ],  [ 8, 10 ],  [ 15, 18 ]
```

The mathematical overlap condition between adjacent intervals $A$ and $B$ (where $A.\text{start} \le B.\text{start}$) is:

$$B.\text{start} \le A.\text{end} \implies \text{Merged} = [A.\text{start}, \; \max(A.\text{end}, B.\text{end})]$$

Let's implement interval merging and greedy activity selection.

```cpp
// Merge Overlapping Intervals & Max Non-Overlapping Meetings
struct Interval {
    int start, end;
};

vector<Interval> merge_intervals(vector<Interval>& intervals) {
    if (intervals.empty()) return {};
    sort(intervals.begin(), intervals.end(), [](const Interval& a, const Interval& b) {
        return a.start < b.start;
    });

    vector<Interval> merged = {intervals[0]};
    for (size_t i = 1; i < intervals.size(); ++i) {
        if (intervals[i].start <= merged.back().end) {
            merged.back().end = max(merged.back().end, intervals[i].end);
        } else {
            merged.push_back(intervals[i]);
        }
    }
    return merged;
}

int max_non_overlapping_meetings(vector<Interval>& intervals) {
    // Greedy heuristic: Sort by EARLIEST END TIME
    sort(intervals.begin(), intervals.end(), [](const Interval& a, const Interval& b) {
        return a.end < b.end;
    });
    int count = 0, last_end = -1e9;
    for (const auto& iv : intervals) {
        if (iv.start >= last_end) {
            count++;
            last_end = iv.end;
        }
    }
    return count;
}
```

| Interval Processed | Current Interval $[S, E]$ | Comparison with Active Range | Action Taken | Active Merged Interval |
| :--- | :--- | :--- | :--- | :--- |
| Init | $[1, 3]$ | Base interval | Push to output | `[1, 3]` |
| Interval 2 | $[2, 6]$ | $2 \le 3$ (Overlaps!) | Merge: $\max(3, 6) = 6$ | `[1, 6]` |
| Interval 3 | $[8, 10]$ | $8 > 6$ (Disjoint!) | Start new interval | `[8, 10]` |
| Interval 4 | $[9, 12]$ | $9 \le 10$ (Overlaps!) | Merge: $\max(10, 12) = 12$ | `[8, 12]` |

```text
[1 ======= 3]
     [2 ================= 6]
Consolidated: [1 ================= 6]
                                      [8 ====== 10]
                                            [9 ====== 12]
Consolidated:                         [8 ============ 12]
```

> [!IMPORTANT]
> To merge overlapping intervals, sort by **START TIME**. To maximize non-overlapping scheduled meetings, sort greedily by **EARLIEST END TIME**.

This completes the Sorting Algorithms chapter, covering theoretical lower bounds, comparison-based sorters, linear non-comparison routines, and interval applications.

#### Complexity Analysis
- **Time Complexity:** Expected $O(N)$ for QuickSelect; $O(N \log N)$ for Interval Merging and Scheduling.
- **Auxiliary Space:** $O(1)$ scalar tracking for intervals and selection.

---

## Cheat Sheet & Quick Reference

| Sorting Technique | Average Time | Worst Time | Space | Stable? | Key Invariant / Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Insertion Sort** | $O(N^2)$ | $O(N^2)$ | $O(1)$ | Yes | $O(N + I)$ for nearly-sorted data / small arrays |
| **Merge Sort** | $O(N \log N)$ | $O(N \log N)$ | $O(N)$ | Yes | Guaranteed $\Theta(N \log N)$ stable divide-and-conquer |
| **QuickSort** | $O(N \log N)$ | $O(N^2)$ | $O(\log N)$ | No | Cache-optimal in-place partitioning with median pivot |
| **Heap Sort** | $O(N \log N)$ | $O(N \log N)$ | $O(1)$ | No | In-place tree-backed guaranteed $O(N \log N)$ |
| **Shell Sort** | $O(N^{4/3})$ | $O(N^{3/2})$ | $O(1)$ | No | Diminishing gap sequence for embedded systems |
| **Counting Sort** | $\Theta(N + K)$ | $\Theta(N + K)$ | $O(N + K)$ | Yes | Direct frequency indexing over small integer range $K$ |
| **Radix Sort (LSD)** | $\Theta(d(N + b))$ | $\Theta(d(N + b))$ | $O(N + b)$ | Yes | Multi-pass stable digit sorting on large integers |
| **Bucket Sort** | $O(N)$ | $O(N^2)$ | $O(N)$ | Yes | Partition uniform floats into interval buckets |
| **Cycle Sort** | $\Theta(N^2)$ | $\Theta(N^2)$ | $O(1)$ | No | Minimizes physical memory write cycles on Flash |
| **QuickSelect** | $O(N)$ avg | $O(N^2)$ | $O(\log N)$ | No | Discard unused partition to find $K$-th smallest element |
