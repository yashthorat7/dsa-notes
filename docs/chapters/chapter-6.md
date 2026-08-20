# Chapter 6: Arrays & Vectors

---



## Array Structure & Representation



### Static Arrays & Contiguous Memory Addressing

Imagine a row of identical postal mailboxes numbered consecutively on a wall. Finding mailbox number 5 does not require inspecting boxes 0 through 4; you simply take 5 steps from the start.

A static array is a contiguous block of homogeneous memory slots allocated in physical RAM, offering $O(1)$ random access through direct base address arithmetic.

```text
Slot Index:      [ 0 ]       [ 1 ]       [ 2 ]       [ 3 ]
RAM Address:    0x1000      0x1004      0x1008      0x100C
Byte Offset:   Base + 0    Base + 4    Base + 8    Base + 12
Formula:       Address(i) = Base_Address + i * sizeof(int)
```

Because every element has identical byte width $w$, the hardware calculates the physical memory address in a single CPU instruction.

$$\text{Loc}(A[i]) = \alpha + i \cdot w \quad \text{where } \alpha = \text{Base Address}, \; w = \text{Element Width in Bytes}$$

Let's inspect how subscript notation `arr[i]` maps directly to pointer arithmetic `*(arr + i)`.

```cpp
// Pointer Arithmetic Equivalents in C++
void array_addressing() {
    int arr[4] = {10, 20, 30, 40};
    int val0 = arr[0];       // Reads from *(arr + 0) -> 10
    int val2 = *(arr + 2);   // Pointer offset arithmetic -> 30
    int val3 = arr[3];       // Reads from *(arr + 3) -> 40
}
```

In standard C++, array bracket notation `arr[i]` performs unchecked access. Modern C++ standard containers also provide `.at(i)`, which throws `out_of_range` on invalid indices.

```cpp
// Unchecked Subscript vs Bounds-Checked Access
int safe_read(const vector<int>& arr, int index) {
    if (index < 0 || index >= arr.size()) {
        return -1; // Defensive bounds check
    }
    return arr[index]; // O(1) single-cycle direct read
}
```

| Operation | Best-Case Time | Worst-Case Time | Space Complexity | Description |
| :--- | :--- | :--- | :--- | :--- |
| Random Access (`A[i]`) | $O(1)$ | $O(1)$ | $O(1)$ | Direct pointer arithmetic |
| Search (Unsorted) | $O(1)$ | $O(N)$ | $O(1)$ | Linear scan |
| Insertion (End) | $O(1)$ | $O(1)$ | $O(1)$ | If capacity available |
| Insertion (Middle) | $O(1)$ | $O(N)$ | $O(1)$ | Requires shifting elements right |
| Deletion (Middle) | $O(1)$ | $O(N)$ | $O(1)$ | Requires shifting elements left |

```text
CPU Register [ Base: 0x1000 ] + [ Offset: 2 * 4 = 8 ]
      |
      ===> Memory Bus reads 4 bytes from 0x1008 in 1 cycle!
```

> [!WARNING]
> Unchecked out-of-bounds array access in C++ does not halt automatically; it causes Undefined Behavior and silent memory corruption. Always validate indices.

Let's now examine dynamic arrays (`vector`) that expand automatically when full.



#### Complexity Analysis
- **Time Complexity:** $\Theta(1)$ constant time for direct element lookup by index.
- **Auxiliary Space:** $O(1)$ scalar calculation workspace.

---



### Dynamic Arrays (Vectors) & Capacity Resizing Mechanics

A dynamic array (such as `vector`) solves the fixed-capacity limit of static arrays by wrapping a heap-allocated buffer with a triplet of `(pointer, size, capacity)`.

When adding an element causes `size == capacity`, the vector automatically allocates a new buffer with double the capacity, copies elements over, and deallocates the old buffer.

```text
Old Buffer (Capacity 4):  [ 1 ][ 2 ][ 3 ][ 4 ] (Full!)
                               |
New Buffer (Capacity 8):  [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ . ][ . ][ . ]
Old buffer freed; Vector pointer updated to new heap address.
```

Geometric capacity doubling ensures that the total number of reallocations remains logarithmic $\Theta(\log N)$ as elements are inserted.

$$C_k = \gamma \cdot C_{k-1} \implies C_k = C_0 \cdot \gamma^k \quad (\text{Growth factor } \gamma = 2.0 \text{ in GCC, } 1.5 \text{ in MSVC})$$

#### Core Operations & Member Function Reference

| Category | Method / Idiom | Time Complexity | Purpose |
| :--- | :--- | :--- | :--- |
| **Growth & Insertion** | `v.push_back(val)` | $O(1)$ amortized | Appends a copy/move of `val` to the end |
| | `v.emplace_back(args...)` | $O(1)$ amortized | Constructs element in-place at the end |
| | `v.insert(pos, val)` | $O(N)$ | Inserts `val` before iterator `pos`, shifting right |
| **Element Access** | `v[i]` | $O(1)$ | Unchecked direct index lookup (fastest) |
| | `v.at(i)` | $O(1)$ | Bounds-checked index lookup (throws `out_of_range`) |
| | `v.front()`, `v.back()` | $O(1)$ | Returns reference to first / last element |
| **Capacity & Memory** | `v.size()`, `v.capacity()`| $O(1)$ | Returns current element count vs allocated slots |
| | `v.reserve(n)` | $O(N)$ once | Preallocates heap capacity for $\ge n$ elements |
| | `v.shrink_to_fit()` | $O(N)$ | Requests deallocation of unused capacity |
| **Iteration & Ranges** | `for (int x : v)` | $O(N)$ | Range-based for loop (read/copy) |
| | `for (const auto& x : v)` | $O(N)$ | Range-based for loop by `const` reference (zero copy)|

Let's build a custom dynamic vector structure to understand its internal memory lifecycle.

```cpp
// Custom Dynamic Vector Implementation
struct MyVector {
    int* data;
    int size_count;
    int cap;

    MyVector() : size_count(0), cap(1) { data = new int[1]; }
    ~MyVector() { delete[] data; }

    void push_back(int val) {
        if (size_count == cap) {
            // Reallocation: Double capacity
            cap *= 2;
            int* new_data = new int[cap];
            for (int i = 0; i < size_count; ++i) new_data[i] = data[i];
            delete[] data;
            data = new_data;
        }
        data[size_count++] = val;
    }
};
```

When the final number of elements is known in advance, using `.reserve(N)` preallocates the entire buffer upfront, eliminating all reallocation and copying overhead.

```cpp
// Eliminating Reallocation Churn with reserve()
void populate_vector(int n) {
    vector<int> v;
    v.reserve(n); // Preallocates n slots in a single heap allocation
    for (int i = 0; i < n; ++i) {
        v.push_back(i); // Exactly n assignments, 0 reallocations!
    }
}
```

| Insertion # | Current `size` | Current `capacity` | Reallocation Triggered? | Elements Copied |
| :--- | :--- | :--- | :--- | :--- |
| Insertion 1 | $1$ | $1$ | Initial allocation | $0$ |
| Insertion 2 | $2$ | $2$ | **Yes** (Doubled to 2) | $1$ |
| Insertion 3 | $3$ | $4$ | **Yes** (Doubled to 4) | $2$ |
| Insertion 4 | $4$ | $4$ | **No** (Fits in capacity) | $0$ |
| Insertion 5 | $5$ | $8$ | **Yes** (Doubled to 8) | $4$ |
| Insertion 8 | $8$ | $8$ | **No** (Fits in capacity) | $0$ |
| Insertion 9 | $9$ | $16$ | **Yes** (Doubled to 16) | $8$ |

```text
Step 1: Allocate new heap buffer [ 0x5000 ... 0x5020 ] (8 slots)
Step 2: Copy elements 1..4 from 0x2000 to 0x5000
Step 3: Free old heap chunk 0x2000 (delete[] old_data)
Step 4: Update internal data pointer to 0x5000
```

> [!TIP]
> Always call `vector.reserve(N)` before populating a vector if you know the approximate element count to avoid memory reallocation churn.

Let's now mathematically prove that dynamic array insertions run in $O(1)$ amortized time.



#### Complexity Analysis
- **Time Complexity:** $O(1)$ amortized time per `push_back`, $O(N)$ worst-case during a reallocation step.
- **Auxiliary Space:** $O(N)$ heap capacity storage.

---



### Amortized Analysis of Dynamic Array Growth (Aggregate & Banker's Methods)

Amortized analysis proves that even though an individual array reallocation takes $O(N)$ time, the average cost per insertion over a long sequence remains strictly $O(1)$.

We formalize this using two classic analytical techniques: the Aggregate Method and the Accounting (Banker's) Method.

```text
Charge $3 per insertion:
  $1 pays for current element write
  $1 stored as credit on current element
  $1 stored as credit on older element
When doubling occurs, stored credit tokens pay for all copies!
```

The Aggregate Method sums the total cost of all copies across $N$ insertions and divides by $N$.

$$\text{Total Work} = N + \sum_{j=0}^{\lfloor\log_2 N\rfloor} 2^j = N + (2N - 1) < 3N \implies \frac{\text{Total Work}}{N} < \frac{3N}{N} = O(1)$$

Let's trace a simulation verifying that total copying steps remain bounded by $3N$.

```cpp
// Amortized Cost Step Counter Simulation
void simulate_amortized_growth(int n) {
    int total_copies = 0;
    int capacity = 1;
    for (int size = 1; size <= n; ++size) {
        if (size > capacity) {
            total_copies += (size - 1); // Cost of copying old elements
            capacity *= 2;
        }
        total_copies += 1; // Cost of inserting the new element
    }
    // Verifies: total_copies < 3 * n
}
```

| Element Inserted | Capacity Before | Capacity After | Write Work | Copy Work | Total Step Cost | Cumulative Cost |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Element 1 | $1$ | $1$ | $1$ | $0$ | $1$ | $1$ |
| Element 2 | $1$ | $2$ | $1$ | $1$ | $2$ | $3$ |
| Element 3 | $2$ | $4$ | $1$ | $2$ | $3$ | $6$ |
| Element 4 | $4$ | $4$ | $1$ | $0$ | $1$ | $7$ |
| Element 5 | $4$ | $8$ | $1$ | $4$ | $5$ | $12$ |
| Element 8 | $8$ | $8$ | $1$ | $0$ | $1$ | $15$ |

```text
Array: [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ]
Tokens: [$0][$0][$0][$0][$2][$2][$2][$2]
Elements 5 through 8 hold 4 x $2 = $8 in tokens.
Next jump to capacity 16 costs exactly $8 to copy! (Self-funded)
```

The Potential Method uses the potential function $\Phi = 2 \cdot \text{size} - \text{capacity}$ to prove that the potential is always non-negative and pays for doubling costs.

> [!CAUTION]
> Shrinking a dynamic array when it is 50% full creates costly thrashing if insertions and deletions alternate. Shrink only when capacity drops to 25% full.

Let's now expand memory mapping principles to multidimensional arrays.



#### Complexity Analysis
- **Time Complexity:** $O(1)$ amortized time per insertion.
- **Auxiliary Space:** $O(N)$ heap capacity storage.

---



### Multi-Dimensional Arrays & Row/Column-Major Memory Layouts

Computer memory is a physical 1D sequence of byte addresses. Multidimensional arrays flatten 2D or 3D coordinate grids into this 1D address space.

Row-Major Order (standard in C and C++) stores elements row by row, while Column-Major Order (used in Fortran and MATLAB) stores elements column by column.

```text
2D Grid (3 Rows x 4 Cols):
Row 0: [ A00 ][ A01 ][ A02 ][ A03 ]
Row 1: [ A10 ][ A11 ][ A12 ][ A13 ]
Row 2: [ A20 ][ A21 ][ A22 ][ A23 ]
Linear RAM: [ Row 0 ][ Row 1 ][ Row 2 ]
Formula:    1D Index = r * NUM_COLS + c
```

The mathematical formula maps 2D and 3D coordinates to a single 1D memory offset.

$$\text{Index}_{\text{2D}}(r, c) = r \cdot C + c, \quad \text{Index}_{\text{3D}}(i, j, k) = i \cdot (R \cdot C) + j \cdot C + k$$

Iterating through a matrix row by row accesses memory sequentially, maximizing CPU cache hits. Column-by-column iteration jumps across rows, causing frequent cache misses.

```cpp
// Cache-Friendly (Row-Major) vs Cache-Thrashing Traversal
const int R = 1000, C = 1000;
int matrix[R][C];

// Fast: Unit stride traversal (Sequential cache line loads)
long long sum_row_major() {
    long long total = 0;
    for (int r = 0; r < R; ++r) {
        for (int c = 0; c < C; ++c) total += matrix[r][c];
    }
    return total;
}

// Slow: Strided traversal (Jumps by 1000 ints on every step)
long long sum_col_major() {
    long long total = 0;
    for (int c = 0; c < C; ++c) {
        for (int r = 0; r < R; ++r) total += matrix[r][c];
    }
    return total;
}
```

| Traversal Pattern | Memory Access Stride | Cache Miss Rate | Approximate Runtime ($1000 \times 1000$) |
| :--- | :--- | :--- | :--- |
| Row-Major (`r` outer, `c` inner) | $1$ integer ($4$ bytes) | **Near 0%** (Sequential) | $\approx 1.2 \text{ ms}$ (**10x faster**) |
| Col-Major (`c` outer, `r` inner) | $1000$ integers ($4 \text{ KB}$) | **High** (Cache thrashing) | $\approx 12.8 \text{ ms}$ |

```text
Accessing A[0][0] loads 64 bytes (16 integers: A[0][0]..A[0][15])
Row-Major:   Next 15 reads hit L1 cache instantly! (0 ns delay)
Col-Major:   Next read accesses A[1][0] -> Cache Miss! (100 ns wait)
```

> [!TIP]
> Storing 2D grids in a single flattened 1D `vector<int> arr(R * C)` eliminates pointer indirection and provides optimal CPU cache performance.

Let's now examine multi-directional array scanning patterns.



#### Complexity Analysis
- **Time Complexity:** $\Theta(R \cdot C)$ operations to visit every cell in an $R \times C$ matrix.
- **Auxiliary Space:** $O(1)$ auxiliary scalar state during traversal.

---



## Array Iteration & Indexing



### Array Traversals & Multi-Directional Scans

Array traversal techniques include forward sweeps, reverse scans, and two-pass prefix/suffix accumulations.

In the boundary capacity scoring problem, we compute for each sensor station $\text{ans}[i]$ the combined ambient intensity metric equal to the product of all station ratings to its left multiplied by all ratings to its right, without using division.

```text
Station Ratings: [  1  ]   [  2  ]   [  3  ]   [  4  ]
Left Prefix:     [  1  ]   [  1  ]   [  2  ]   [  6  ] (Product left)
Right Suffix:    [ 24  ]   [ 12  ]   [  4  ]   [  1  ] (Product right)
Output Score:    [ 24  ]   [ 12  ]   [  8  ]   [  6  ] (Pref * Suff)
```

The mathematical invariant defines each element as the product of disjoint left and right prefix spans.

$$\text{Ans}[i] = \text{Prefix}[i - 1] \times \text{Suffix}[i + 1] \quad (\text{where } \text{Prefix}[-1] = 1, \; \text{Suffix}[N] = 1)$$

We can optimize auxiliary space to $O(1)$ by accumulating prefix products directly in the output vector and tracking suffix products using a running scalar variable.

```cpp
// Surrounding Intensity Accumulator: O(N) Time, O(1) Extra Space
vector<int> compute_surrounding_intensity_products(const vector<int>& ratings) {
    int n = ratings.size();
    vector<int> ans(n, 1);

    // Pass 1: Forward prefix scan
    int prefix = 1;
    for (int i = 0; i < n; ++i) {
        ans[i] = prefix;
        prefix *= ratings[i];
    }

    // Pass 2: Backward suffix sweep
    int suffix = 1;
    for (int i = n - 1; i >= 0; --i) {
        ans[i] *= suffix; // Multiply accumulated prefix by current suffix
        suffix *= ratings[i];
    }
    return ans;
}
```

| Index ($i$) | Input Rating (`ratings[i]`) | Prefix Product (Pass 1) | Suffix Product (Pass 2) | Final Intensity (`ans[i]`) |
| :--- | :--- | :--- | :--- | :--- |
| $0$ | $1$ | $1$ | $24$ | $24$ |
| $1$ | $2$ | $1$ | $12$ | $12$ |
| $2$ | $3$ | $2$ | $4$ | $8$ |
| $3$ | $4$ | $6$ | $1$ | $6$ |


#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ across two linear sweeps of the array.
- **Auxiliary Space:** $O(1)$ auxiliary workspace (excluding the output array).

---



### Index Arithmetic & Circular Array Modulo Wrap

A circular array treats a linear buffer as a continuous ring where index $N-1$ wraps seamlessly back to index $0$.

We use modulo arithmetic for stepping forward, stepping backward, and computing circular distance between two indices.

```text
                         [ 0 ]
                    /             \
               [ 5 ]               [ 1 ]
                 |                   |
               [ 4 ]               [ 2 ]
                    \             /
                         [ 3 ]
Forward Step: (i + 1) % N  |  Backward Step: (i - 1 + N) % N
```

The mathematical formulas ensure indices remain within valid buffer bounds $[0, N-1]$.

$$\text{Next}(i, k) = (i + k) \bmod N, \quad \text{Prev}(i, k) = (i - k + N) \bmod N$$

Let's implement a fixed-size Circular Queue using these index wrapping formulas.

```cpp
// Circular Queue Implementation using Array
struct CircularQueue {
    vector<int> buffer;
    int head, tail, count, cap;

    CircularQueue(int k) : buffer(k), head(0), tail(0), count(0), cap(k) {}

    bool enqueue(int val) {
        if (count == cap) return false; // Buffer full
        buffer[tail] = val;
        tail = (tail + 1) % cap; // Modulo forward step
        count++;
        return true;
    }

    bool dequeue() {
        if (count == 0) return false; // Buffer empty
        head = (head + 1) % cap; // Modulo forward step
        count--;
        return true;
    }
};
```

| Operation | Value | `head` Index | `tail` Index | `count` | Buffer State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Initial | $-$ | $0$ | $0$ | $0$ | `[., ., ., .]` |
| `enqueue(10)` | $10$ | $0$ | $1$ | $1$ | `[10, ., ., .]` |
| `enqueue(20)` | $20$ | $0$ | $2$ | $2$ | `[10, 20, ., .]` |
| `dequeue()` | $-$ | $1$ | $2$ | $1$ | `[., 20, ., .]` |
| `enqueue(30)` | $30$ | $1$ | $3$ | $2$ | `[., 20, 30, .]` |
| `enqueue(40)` | $40$ | $1$ | $0$ (Wrap!) | $3$ | `[., 20, 30, 40]` |

```text
Step 1: tail wraps past index N-1 to slot 0: tail = (3 + 1) % 4 = 0
Step 2: Unconsumed elements span from head=1 to tail=0 (3 items)
Distance Formula: (tail - head + cap) % cap = (0 - 1 + 4) % 4 = 3
```

> [!IMPORTANT]
> In C++, `(i - 1) % N` produces a negative number when $i = 0$. Always write `(i - 1 + N) % N` to ensure positive wrap-around.

Let's now examine in-place element segregation using the Dutch National Flag algorithm.



#### Complexity Analysis
- **Time Complexity:** $O(1)$ constant time per circular queue push and pop operation.
- **Auxiliary Space:** $O(K)$ fixed buffer capacity.

---



### In-Place Transformations & Element Segregation (Dutch National Flag)

In-place array partitioning segregates elements based on specific values or properties without allocating auxiliary arrays.

The Dutch National Flag algorithm (3-Way Partitioning) classifies elements into three contiguous priority zones (such as Low, Medium, High tiers) in a single pass using three pointers.

```text
[ 0 .. low-1 ] | [ low .. mid-1 ] | [ mid .. high ] | [ high+1 .. N-1 ]
 Tier 0 (Low)  |  Tier 1 (Medium) |  Unclassified   |  Tier 2 (High)
Pointer Action: Expand classified zones; shrink unclassified middle!
```

Loop invariants maintain four disjoint array regions throughout execution:

$$\text{low} \le \text{mid} \le \text{high} + 1$$

Let's implement both two-pointer compaction (filtering inactive tombstone markers `-1` to the end) and 3-way tier segregation in $O(N)$ time and $O(1)$ space.

```cpp
// In-Place Tombstone Compaction: O(N) Time, O(1) Space
void compact_tombstone_records(vector<int>& records) {
    int insert_pos = 0;
    int n = records.size();
    for (int i = 0; i < n; ++i) {
        if (records[i] != -1) { // Non-tombstone record
            swap(records[insert_pos++], records[i]);
        }
    }
}

// 3-Tier Packet Priority Segregation: O(N) Single-Pass Partition
void segregate_packet_priority_tiers(vector<int>& packets) {
    int low = 0, mid = 0, high = packets.size() - 1;

    while (mid <= high) {
        if (packets[mid] == 0) {
            swap(packets[low++], packets[mid++]); // Expand Tier 0
        } else if (packets[mid] == 1) {
            mid++;                               // Expand Tier 1
        } else {
            swap(packets[mid], packets[high--]);  // Expand Tier 2 (Do not advance mid!)
        }
    }
}
```

#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ single-pass linear scan; each element is swapped at most twice.
- **Auxiliary Space:** $O(1)$ in-place pointer workspace.

---



## Algorithmic Applications & Searches



### Cyclic Array Shifts & Reversal Invariants

Rotating an array of $N$ elements right by $K$ positions shifts elements circularly, wrapping trailing elements to the front.

While a naive approach uses an $O(N)$ auxiliary copy buffer, the 3-step in-place reversal algorithm rotates the array in $O(N)$ time and $O(1)$ space.

```text
Initial Array:          [ 1, 2, 3, 4 | 5, 6, 7 ]  (Rotate right by 3)
Step 1 (Reverse All):   [ 7, 6, 5 | 4, 3, 2, 1 ]
Step 2 (Reverse First 3): [ 5, 6, 7 | 4, 3, 2, 1 ]
Step 3 (Reverse Last 4):  [ 5, 6, 7 | 1, 2, 3, 4 ] (Fully Rotated!)
```

The mathematical composition of reversals preserves relative sub-block ordering while swapping their positions.

$$\text{Rotate}(A, k) = \text{rev}(\text{rev}(A[0 \dots k-1]) \circ \text{rev}(A[k \dots N-1]))$$

Let's implement the 3-step reversal algorithm using a two-pointer reverse helper.

```cpp
// In-Place Array Rotation via 3 Reversals: O(N) Time, O(1) Space
void reverse_range(vector<int>& nums, int l, int r) {
    while (l < r) {
        swap(nums[l++], nums[r--]);
    }
}

void rotate_array(vector<int>& nums, int k) {
    int n = nums.size();
    if (n == 0) return;
    k = k % n; // Normalize k to handle rotations where k >= n

    reverse_range(nums, 0, n - 1);     // Step 1: Reverse entire array
    reverse_range(nums, 0, k - 1);     // Step 2: Reverse first k elements
    reverse_range(nums, k, n - 1);     // Step 3: Reverse remaining n-k elements
}
```

| Reversal Phase | Sub-Range Reversed | Array State Before Phase | Array State After Phase |
| :--- | :--- | :--- | :--- |
| Start | None | `[1, 2, 3, 4, 5, 6, 7]` | `[1, 2, 3, 4, 5, 6, 7]` |
| Phase 1 | `[0, 6]` (Entire array) | `[1, 2, 3, 4, 5, 6, 7]` | `[7, 6, 5, 4, 3, 2, 1]` |
| Phase 2 | `[0, 2]` (First $k=3$) | `[7, 6, 5, 4, 3, 2, 1]` | `[5, 6, 7, 4, 3, 2, 1]` |
| Phase 3 | `[3, 6]` (Last $n-k=4$) | `[5, 6, 7, 4, 3, 2, 1]` | **[5, 6, 7, 1, 2, 3, 4]** |

```text
Block A: [ 1, 2, 3, 4 ]    Block B: [ 5, 6, 7 ]
Target: Move Block B in front of Block A -> [ Block B ][ Block A ]
3 reversals seamlessly invert block ordering without extra buffers!
```

> [!TIP]
> Always normalize the rotation count with `k = k % n` at the start of your function to handle inputs where $K \ge N$.

Let's now compare linear search against binary search on arrays.



#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear time to reverse ranges (each element swapped twice).
- **Auxiliary Space:** $O(1)$ in-place swapping workspace.

---



### Value Searches — Unsorted Linear Search vs Sorted Binary Search

Searching for a target value is a foundational array operation. The structure of the data determines whether search takes linear or logarithmic time.

Unsorted arrays require Linear Search ($O(N)$), whereas sorted arrays allow Binary Search ($O(\log N)$) through interval bisection.

```text
Linear Search: Discards 1 candidate element per comparison -> O(N)
Binary Search: Discards 50% of remaining candidates per step -> O(log N)
```

The mathematical complexity comparison highlights the power of sorted search spaces.

$$T_{\text{linear}}(N) = \Theta(N), \quad T_{\text{binary}}(N) = T(N/2) + O(1) = \Theta(\log_2 N)$$

Let's implement both search strategies in C++.

```cpp
// Linear Search on Unsorted Array: O(N)
int linear_search_array(const vector<int>& arr, int target) {
    for (int i = 0; i < arr.size(); ++i) {
        if (arr[i] == target) return i; // Target found
    }
    return -1; // Target absent
}

// Binary Search on Sorted Array: O(log N)
int binary_search_array(const vector<int>& arr, int target) {
    int low = 0, high = arr.size() - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2; // Avoids integer overflow
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) low = mid + 1; // Discard left half
        else high = mid - 1;                       // Discard right half
    }
    return -1;
}
```

| Dataset Size ($N$) | Linear Search Comparisons ($N$) | Binary Search Comparisons ($\log_2 N$) | Speedup Factor |
| :--- | :--- | :--- | :--- |
| $1,000$ ($10^3$) | $1,000$ | $\approx 10$ | **100x** |
| $1,000,000$ ($10^6$) | $1,000,000$ | $\approx 20$ | **50,000x** |
| $1,000,000,000$ ($10^9$) | $1,000,000,000$ | $\approx 30$ | **33,000,000x** |

```text
Predicate P(x): (arr[x] >= Target)
Array Evaluates: [ F,  F,  F,  T,  T,  T,  T ]
                               ^
Binary Search finds the exact first 'T' boundary in O(log N) steps!
```

> [!IMPORTANT]
> Binary Search requires the array to be monotonically sorted. Running Binary Search on an unsorted array returns incorrect results silently.

Let's now examine how hardware CPU caches interact with array memory layouts.



#### Complexity Analysis
- **Time Complexity:** $O(N)$ for Linear Search; $O(\log N)$ for Binary Search.
- **Auxiliary Space:** $O(1)$ scalar index workspace.

---



## Hardware & Memory Analysis



### CPU Cache Locality & Hardware Pre-Fetching

Modern CPUs execute instructions in fractions of a nanosecond, but fetching data from main system RAM takes roughly 50 to 100 nanoseconds.

To bridge this speed gap, the CPU uses hardware cache hierarchies (L1, L2, L3) and pre-fetchers to load contiguous memory lines before they are explicitly requested.

```text
Registers:  < 1 ns   | 64-bit direct processor registers
L1 Cache:     1 ns   | 32 KB per core, 64-byte Cache Lines
L2 Cache:     4 ns   | 512 KB per core
L3 Cache:    10 ns   | 32 MB shared cache
Main RAM:   100 ns   | Gigabytes capacity (100x slower than L1!)
```

Accessing main RAM is roughly 100 times slower than reading from the L1 cache, making cache hit rates the dominant factor in real-world performance.

$$\text{RAM Latency} \approx 100 \times \text{L1 Cache Latency} \implies \text{Cache hit rates dictate practical execution speed}$$

Let's benchmark unit-stride sequential access versus strided access across a large array.

```cpp
// Cache Stride Benchmark Simulation
const int SIZE = 16000000;
int big_arr[SIZE];

// Fast: Sequential Unit-Stride Access (Pre-fetcher streams cache lines)
long long sequential_read() {
    long long total = 0;
    for (int i = 0; i < SIZE; ++i) total += big_arr[i];
    return total;
}

// Slow: Large-Stride Access (Every read triggers a cache miss)
long long strided_read() {
    long long total = 0;
    for (int i = 0; i < SIZE; i += 16) total += big_arr[i]; // Skips 64 bytes
    return total;
}
```

| Memory Tier | Access Latency | Typical Capacity | Cache Miss Penalty |
| :--- | :--- | :--- | :--- |
| L1 Data Cache | $1 \text{ ns}$ ($4$ cycles) | $32 \text{ KB}$ | Hits pipeline instantly |
| L2 Cache | $4 \text{ ns}$ ($14$ cycles) | $512 \text{ KB}$ | Minor delay |
| L3 Shared Cache | $10 \text{ ns}$ ($40$ cycles) | $32 \text{ MB}$ | Moderate delay |
| Main RAM | $80 \text{ ns}$ ($250$ cycles) | $16 \text{ GB}$ | **Severe CPU pipeline stall** |

```text
When CPU reads arr[0], the memory bus loads an entire 64-byte chunk:
[ arr[0] ][ arr[1] ][ arr[2] ] ... [ arr[15] ] (16 integers packed!)
Accesses to arr[1] through arr[15] hit L1 cache with ZERO delay!
```

> [!TIP]
> Structuring data for contiguous sequential memory access often delivers a $5\times$ to $20\times$ real-world speedup without changing theoretical Big O complexity.

Let's now contrast array memory layouts with pointer-linked structures.



#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ unit-stride linear streaming over $N$ elements.
- **Auxiliary Space:** $O(1)$ scalar accumulator storage.

---



### Heap Fragmentation & Indirection (Arrays vs Linked Lists)

Comparing the physical memory footprints of Arrays versus Linked Lists reveals why contiguous arrays dominate high-performance software systems.

In a linked list, every node traversal dereferences a pointer to a separate heap allocation, creating pointer chasing and constant cache misses.

```text
Contiguous Vector:
[ Int 0 ][ Int 1 ][ Int 2 ][ Int 3 ] (Packed, 1 cache line load)

Fragmented Linked List:
[ Node 0 ] ----> [ Node 1 ] ----> [ Node 2 ] (Scattered heap memory)
(0x1040)         (0x8F20)         (0x3B10)
```

On 64-bit systems, a linked list node holding a 4-byte integer requires 28 bytes of memory due to pointer addresses and heap chunk headers, a $7\times$ memory bloat over arrays.

$$\text{Vector Slot} = 4 \text{ bytes}, \quad \text{List Node} = 4 \text{ (int)} + 8 \text{ (ptr)} + 16 \text{ (heap header)} = 28 \text{ bytes} \ (7\times \text{ bloat})$$

Let's compare the performance of contiguous memory buffers against node allocations.

```cpp
// Array Memory Pool Allocator (Restores cache locality to node structures)
struct CompactNode {
    int val;
    int next_idx; // 4-byte index offset instead of 8-byte pointer
};

// Memory Arena Pool: All nodes packed in a contiguous vector
vector<CompactNode> node_pool;
```

| Evaluation Metric | `vector` (Contiguous Array) | `list` (Linked List) |
| :--- | :--- | :--- |
| Memory Overhead per Item | **0 bytes** (Packed buffer) | **24+ bytes** (Pointers + headers) |
| L1 Cache Spatial Locality | **Optimal** (16 ints per line) | **Poor** (Frequent cache misses) |
| Random Access (`A[i]`) | **$O(1)$** instant | **$O(N)$** pointer chasing |
| Insertion at Head | $O(N)$ (Requires shifting) | **$O(1)$** pointer update |
| Mid-Vector Insert/Delete | $O(N)$ memory move | $O(1)$ once pointer is located |

```text
Vector Stream:  [ Read ][ Read ][ Read ][ Read ] (Continuous burst)
List Traversal: [ Read ] -> [ STALL ] -> [ Read ] -> [ STALL ]
Pipeline stalls while CPU waits 100ns for each heap dereference!
```

> [!IMPORTANT]
> Prefer `vector` over `list` in almost all production applications. Contiguous memory access and CPU cache pre-fetching far outweigh node insertion benefits.

This completes the Arrays & Vectors chapter, establishing mastery over contiguous memory layouts, dynamic growth, amortized analysis, in-place rotations, searches, and hardware cache optimizations.



#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear scan across $N$ elements; orders of magnitude faster in vectors due to cache locality.
- **Auxiliary Space:** $O(1)$ auxiliary workspace memory.

---



## Cheat Sheet & Quick Reference

| Operation / Idiom | Mathematical / C++ Syntax | Time Complexity | Cache Locality |
| :--- | :--- | :--- | :--- |
| Random Access | `arr[i]` or `*(arr + i)` | $\Theta(1)$ | Optimal |
| Vector Amortized Push | `v.push_back(x)` | $O(1)$ amortized | Optimal |
| Preallocation | `v.reserve(N)` | $\Theta(N)$ upfront | Eliminates reallocations |
| 2D Index Flattening | `r * NUM_COLS + c` | $\Theta(1)$ | Row-major optimal |
| Circular Next Index | `(i + 1) % N` | $\Theta(1)$ | Optimal ring step |
| Circular Prev Index | `(i - 1 + N) % N` | $\Theta(1)$ | Guards negative wraps |
| Dutch National Flag | 3-pointer partition | $\Theta(N)$ single-pass | In-place ($O(1)$ space) |
| 3-Step Rotation | 3 calls to `reverse()` | $\Theta(N)$ in-place | $O(1)$ auxiliary space |
| Binary Search | Interval bisection | $\Theta(\log N)$ | Monotonic data required |
| Cache Line Packing | 64 bytes loaded per fetch | Hardware L1 | 16 packed integers |
