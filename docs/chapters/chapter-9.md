# Chapter 9: Two Pointers

---


## Pointer Navigation


### Converging Opposite-Direction Pointers

Imagine two people starting at opposite ends of a narrow bridge and walking inward toward each other. Every step reduces the distance between them until they meet at the center.

The converging two-pointer technique places `left = 0` and `right = N - 1` on a sorted array, using data monotonicity to eliminate candidate pairs in $O(1)$ time per step.

```text
Sorted Array: [ 2,  4,  7,  11,  15 ],  Target = 15
Left -> [ 2 ]                             [ 15 ] <- Right
Step 1: 2 + 15 = 17 > 15 -> (15 is too large for ANY left) -> R--
Step 2: Left=[2], Right=[11] -> 2 + 11 = 13 < 15 -> L++
Step 3: Left=[4], Right=[11] -> 4 + 11 = 15 ===> Target Found!
```

In a sorted array, if `arr[L] + arr[R] > target`, then `arr[i] + arr[R] > target` for all $i \ge L$. We can safely eliminate index $R$ entirely in a single decrement.

$$\text{Span}(k) = R - L + 1 \implies \text{Strictly terminates when } L \ge R \text{ in at most } N \text{ steps}$$

Let's implement converging two-pointer target pair search on a sorted sequence in $O(N)$ time and $O(1)$ space.

```cpp
// Converging Two-Pointer Target Pair Search: O(N) Time, O(1) Space
pair<int, int> two_sum_sorted(const vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left < right) {
        int current_sum = arr[left] + arr[right];
        if (current_sum == target) {
            return {left, right}; // Match found
        } else if (current_sum < target) {
            left++; // Need a larger sum -> Advance left pointer
        } else {
            right--; // Need a smaller sum -> Retreat right pointer
        }
    }
    return {-1, -1}; // Target not present
}
```

| Step | Pointer `left` | Pointer `right` | Values (`arr[L]`, `arr[R]`) | Current Sum | Decision | Search Space Eliminated |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Step 1 | $0$ | $4$ | $2, 15$ | $17 > 15$ | Decrement `right` | Entire column $R=4$ discarded |
| Step 2 | $0$ | $3$ | $2, 11$ | $13 < 15$ | Increment `left` | Entire row $L=0$ discarded |
| Step 3 | $1$ | $3$ | $4, 11$ | $15 == 15$ | **Target Found!** | Search completes |

```text
Pair Matrix (Sorted rows and cols):
  [ (2,2)   (2,4)   (2,7)   (2,11)  (2,15) ] <--- Check (2,15) > 15
  [ (4,2)   (4,4)   (4,7)   (4,11)  (4,15) ]      Eliminates col 4!
  Each pointer step discards a full row or column in O(1) time!
```

> [!IMPORTANT]
> Opposite-direction pointer convergence requires the array to be monotonically sorted. Running this technique on unsorted data produces incorrect results.

#### Decision Guide: Two Pointers vs Hash Map

| Criteria | Two Pointers Approach | Hash Map Approach |
| :--- | :--- | :--- |
| **Input Requirement** | Requires sorted input ($O(N \log N)$ or pre-sorted) | Works on completely unsorted data |
| **Time Complexity** | $O(N)$ when pre-sorted / $O(N \log N)$ with sort | $O(N)$ expected average time |
| **Auxiliary Space** | $O(1)$ strictly constant memory | $O(N)$ dynamic memory allocations |
| **Index Stability** | Sorting reorders original index positions | Preserves original element indices |
| **Best Used When** | Array is already sorted or memory is tightly bounded | Input is unsorted and original indices are required |

Let's now examine same-direction fast and slow pointers.


#### Complexity Analysis
- **Time Complexity:** $O(N)$ linear time; at each step either `left` increments or `right` decrements.
- **Auxiliary Space:** $O(1)$ scalar index workspace.

---


### Fast & Slow Pointers (Floyd's Tortoise and Hare)

Floyd's Cycle-Finding Algorithm uses two pointers advancing at different speeds (slow moves 1 step, fast moves 2 steps) to find midpoints and detect cycles.

When navigating a cyclic track, the fast pointer closes the distance gap by 1 step in each iteration, guaranteeing a collision within $C$ loop steps.

```text
Sequence: 1 -> 2 -> 3 -> 4 -> 5
                    ^         |
                    +---------+ (Cycle of length 3)
Step 1: Slow at 2, Fast at 3
Step 2: Slow at 3, Fast at 5
Step 3: Slow at 4, Fast at 4 ===> COLLISION DETECTED!
```

The mathematical collision proof confirms that the distance gap decreases by 1 modulo $C$ in every iteration.

$$\Delta d = (2t - t) \bmod C = t \bmod C = 0 \implies \text{Collision within } C \text{ steps}$$

Let's inspect single-pass midpoint detection and cycle entry location in linked lists.

```cpp
// Linked List Node Definition
struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(nullptr) {}
};

// Find Midpoint of Linked List in a Single Pass
ListNode* find_middle_node(ListNode* head) {
    ListNode* slow = head;
    ListNode* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;       // Advance 1 step
        fast = fast->next->next; // Advance 2 steps
    }
    return slow; // Points to exact middle node
}
```

To locate the start of the cycle, reset `slow` to `head` and advance both pointers 1 step at a time until they meet.

```cpp
// Floyd's Cycle Entry Detection
ListNode* detect_cycle_entry(ListNode* head) {
    ListNode* slow = head;
    ListNode* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {
            // Collision detected! Find cycle start
            ListNode* ptr1 = head;
            ListNode* ptr2 = slow;
            while (ptr1 != ptr2) {
                ptr1 = ptr1->next;
                ptr2 = ptr2->next;
            }
            return ptr1; // Cycle entry node
        }
    }
    return nullptr; // No cycle
}
```

| Iteration | Slow Pointer Node | Fast Pointer Node | Relative Distance Gap | Status |
| :--- | :--- | :--- | :--- | :--- |
| Start | Node 1 | Node 1 | $0$ | Initial state |
| Step 1 | Node 2 | Node 3 | $1$ | Traversal |
| Step 2 | Node 3 | Node 5 | $2$ | Traversal |
| Step 3 | Node 4 | Node 4 | $0$ | **Collision!** |

```text
Distance Head to Entry = L, Entry to Collision = d, Cycle Length = C
Fast distance = 2 * Slow distance ===> 2(L + d) = L + nC + d
Simplifying: L = nC - d ===> Distance(Head, Entry) == Distance(Col, Entry)
```

> [!CAUTION]
> Always check `fast != nullptr && fast->next != nullptr` before advancing the fast pointer to prevent null-pointer dereference crashes.

Let's now study multi-value sum reductions.


#### Complexity Analysis
- **Time Complexity:** $O(N)$ linear time to detect cycles and locate midpoints.
- **Auxiliary Space:** $O(1)$ pointer workspace.

---


## Algorithmic Applications


### Multi-Value Sums — Multi-Variable Reduction & Converging Pointers

The multi-variable balance problem finds all unique combinations of calibration variables that sum to a target equilibrium value $T$.

We reduce multi-variable sum problems to converging two-pointer subproblems by sorting the array, fixing outer loop variables, and scanning the remaining elements from both ends inward.

```text
Sorted Offsets: [ -4,  -1,  -1,  0,  1,  2 ]
Fix Pivot i:  nums[i] = -4 -> Target for Two-Pointer = 0 - (-4) = 4
Converging Pointers on [ -1, -1, 0, 1, 2 ] search for sum = 4
```

Sorting enables deterministic duplicate skipping across both fixed pivots and converging inner pointers:

$$\text{if } (i > 0 \land \text{nums}[i] == \text{nums}[i-1]) \implies \text{continue}$$

Let's implement the triplet equilibrium finder with duplicate skipping logic in $O(N^2)$ time and $O(1)$ extra space.

```cpp
// Tri-Sensor Equilibrium Search: Find all unique triplets summing to zero in O(N^2)
vector<vector<int>> find_equilibrium_triplets(vector<int>& sensor_offsets) {
    sort(sensor_offsets.begin(), sensor_offsets.end());
    vector<vector<int>> result;
    int n = sensor_offsets.size();

    for (int i = 0; i < n - 2; ++i) {
        // Skip duplicate outer pivot values
        if (i > 0 && sensor_offsets[i] == sensor_offsets[i - 1]) continue;

        int left = i + 1, right = n - 1;
        int target = -sensor_offsets[i];

        while (left < right) {
            int current_sum = sensor_offsets[left] + sensor_offsets[right];
            if (current_sum == target) {
                result.push_back({sensor_offsets[i], sensor_offsets[left], sensor_offsets[right]});

                // Skip identical inner duplicates
                while (left < right && sensor_offsets[left] == sensor_offsets[left + 1]) left++;
                while (left < right && sensor_offsets[right] == sensor_offsets[right - 1]) right--;

                left++;
                right--;
            } else if (current_sum < target) {
                left++; // Increase sum by shifting left pointer rightward
            } else {
                right--; // Decrease sum by shifting right pointer leftward
            }
        }
    }
    return result;
}
```

#### Complexity Analysis
- **Time Complexity:** $O(N^2)$ for 3-Variable Sum; $O(N^{K-1})$ for general $K$-Variable Sum.
- **Auxiliary Space:** $O(1)$ extra space (excluding the output container).

---


### Dual-Sequence Pointer Traversal — Sorted Merging & Intersections

Dual-sequence traversal maintains pointer $i$ on sorted array $A$ and pointer $j$ on sorted array $B$, comparing elements to merge or intersect data in $O(N + M)$ time.

This technique powers the merge step of Merge Sort, database merge joins, and search engine posting list intersections.

```text
Array A: [ 1,  3,  5 ]  (Pointer i)
Array B: [ 2,  4,  6 ]  (Pointer j)
Output:  [ 1,  2,  3,  4,  5,  6 ]
Step 1: 1 < 2 -> Take 1 from A (i++)
Step 2: 3 > 2 -> Take 2 from B (j++)
```

The total number of comparisons is bounded by the combined length of both sequences.

$$\text{Total Operations} \le |A| + |B| = \Theta(N + M)$$

Let's implement sorted array intersection in C++.

```cpp
// Intersect Two Sorted Arrays: O(N + M) Time, O(1) Extra Space
vector<int> intersect_sorted_arrays(const vector<int>& a, const vector<int>& b) {
    vector<int> intersection;
    int i = 0, j = 0;
    while (i < a.size() && j < b.size()) {
        if (a[i] == b[j]) {
            // Avoid duplicate additions
            if (intersection.empty() || intersection.back() != a[i]) {
                intersection.push_back(a[i]);
            }
            i++; j++;
        } else if (a[i] < b[j]) {
            i++; // a[i] cannot match any future element in b
        } else {
            j++; // b[j] cannot match any future element in a
        }
    }
    return intersection;
}
```

| Step | Pointer $i$ | Pointer $j$ | Compared Values | Comparison | Action Taken |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Step 1 | $0$ (`1`) | $0$ (`2`) | $1 \text{ vs } 2$ | $1 < 2$ | Advance $i$ |
| Step 2 | $1$ (`2`) | $0$ (`2`) | $2 \text{ vs } 2$ | Equal | **Add 2 to output**; Advance $i, j$ |
| Step 3 | $2$ (`4`) | $1$ (`3`) | $4 \text{ vs } 3$ | $4 > 3$ | Advance $j$ |
| Step 4 | $2$ (`4`) | $2$ (`5`) | $4 \text{ vs } 5$ | $4 < 5$ | Advance $i$ |
| Step 5 | $3$ (`5`) | $2$ (`5`) | $5 \text{ vs } 5$ | Equal | **Add 5 to output**; Advance $i, j$ |

```text
Lane A: [ 1 ] -> [ 2 ] ---------> [ 4 ] -> [ 5 ]
                  |                         |
Lane B: --------> [ 2 ] -> [ 3 ] ---------> [ 5 ]
Matches found simultaneously in a single coordinated sweep!
```

> [!TIP]
> Dual-pointer sorted merging processes streaming data with $O(1)$ memory, making it ideal for external sorting on large disk datasets.

Let's now study in-place compaction using read and write pointers.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N + M)$ linear time across both input collections.
- **Auxiliary Space:** $O(1)$ extra space excluding the output container.

---


## Compaction & String Operations


### Sequence Partitioning & In-Place Pointer Compaction

In-place compaction filters or deduplicates an array using a write pointer $w$ and a read pointer $r$ without allocating extra memory.

The read pointer scans the full array, while the write pointer writes valid elements to the prefix of the array.

```text
Array: [ 1,  1,  2,  2,  3 ]
w=0, r=0: Keep 1 -> arr[0]=1, w=1
w=1, r=1: 1 == arr[w-1] -> Skip
w=1, r=2: 2 != arr[w-1] -> Keep 2 -> arr[1]=2, w=2
w=2, r=3: 2 == arr[w-1] -> Skip
w=2, r=4: 3 != arr[w-1] -> Keep 3 -> arr[2]=3, w=3
Deduplicated Prefix: [ 1, 2, 3 ], Length = 3
```

The compaction invariant guarantees that the prefix $[0 \dots w-1]$ holds the final deduplicated result.

$$\text{arr}[0 \dots w-1] = \text{Deduplicated Prefix}, \quad \text{New Length} = w \le N$$

Let's implement in-place deduplication of a sorted array.

```cpp
// In-Place Sorted Array Deduplication: O(N) Time, O(1) Space
int remove_duplicates(vector<int>& nums) {
    if (nums.empty()) return 0;
    int write_ptr = 1;
    for (int read_ptr = 1; read_ptr < nums.size(); ++read_ptr) {
        if (nums[read_ptr] != nums[write_ptr - 1]) {
            nums[write_ptr++] = nums[read_ptr]; // Write unique element
        }
    }
    return write_ptr; // New valid array length
}
```

| Step (`read_ptr`) | Value Read (`nums[r]`) | Compared With (`nums[w-1]`) | Action Taken | Write Pointer (`w`) | Array Prefix State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Init | $-$ | $-$ | $-$ | $w = 1$ | `[1]` |
| $r = 1$ | $1$ | $1$ | Duplicate $\to$ Skip | $w = 1$ | `[1]` |
| $r = 2$ | $2$ | $1$ | Unique $\to$ Write | $w = 2$ | `[1, 2]` |
| $r = 3$ | $2$ | $2$ | Duplicate $\to$ Skip | $w = 2$ | `[1, 2]` |
| $r = 4$ | $3$ | $2$ | Unique $\to$ Write | $w = 3$ | **[1, 2, 3]** |

```text
[ Valid Deduplicated Region ] | [ Trailing Discarded Space ]
[ nums[0] .. nums[w-1] ]      | [ nums[w] .. nums[N-1] ]
```

> [!IMPORTANT]
> In read/write pointer compaction, always return the write pointer index $w$ as the new logical size of the array.

Let's now examine two-pointer string validation and word reversal.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ single-pass linear scan.
- **Auxiliary Space:** $O(1)$ in-place index workspace.

---


### String Operations & Palindromic Validation Scans

Two-pointer string techniques include palindromic validation, word boundary parsing, and in-place reversal.

In palindromic validation, `left` and `right` pointers start at opposite ends and step inward, skipping non-alphanumeric characters and comparing characters.

```text
String: "A man, a plan, a canal: Panama"
L -> 'A' (lower 'a')                     'a' <- R
Pointers step inward, skipping punctuation:
  'm' == 'm',  'a' == 'a',  'n' == 'n' ... ===> Symmetric Token Match!
```

The mathematical palindrome invariant requires character parity across symmetric index pairs.

$$S \text{ is palindromic} \iff \forall i \in [0, \lfloor|S|/2\rfloor], \quad S[i] == S[|S| - 1 - i]$$

Let's implement in-place word-by-word sentence reversal using a two-phase reversal strategy: reverse individual words first, then reverse the entire string.

```cpp
// Reverse Words in a Sentence In-Place: O(N) Time, O(1) Space
void reverse_words_in_string(string& s) {
    int n = s.size();
    int start = 0;
    // Phase 1: Reverse each individual word
    for (int end = 0; end <= n; ++end) {
        if (end == n || s[end] == ' ') {
            int l = start, r = end - 1;
            while (l < r) swap(s[l++], s[r--]);
            start = end + 1;
        }
    }
    // Phase 2: Reverse entire string
    int l = 0, r = n - 1;
    while (l < r) swap(s[l++], s[r--]);
}
```

| Phase | Operation | String State |
| :--- | :--- | :--- |
| Start | Raw Input | `"the sky is blue"` |
| Phase 1 (Word 1) | Reverse `"the"` | `"eht sky is blue"` |
| Phase 1 (Word 2) | Reverse `"sky"` | `"eht yks is blue"` |
| Phase 1 (Word 3) | Reverse `"is"` | `"eht yks si blue"` |
| Phase 1 (Word 4) | Reverse `"blue"` | `"eht yks si eulb"` |
| Phase 2 (Global) | Reverse entire string | **"blue is sky the"** |

```text
[ Word 1 ][ Word 2 ][ Word 3 ] ===> [ 1_rev ][ 2_rev ][ 3_rev ]
                                                 |
                                      (Global String Reverse)
                                                 v
[ Word 3 ][ Word 2 ][ Word 1 ] <=================+
```

> [!TIP]
> Two-phase reversal (reversing each word in-place, then reversing the entire string) inverts sentence word order with zero heap allocations.

This completes the Two Pointers chapter, establishing mastery over converging opposite-direction pointers, fast/slow Floyd cycles, multi-value sum reductions, dual-array merges, in-place compactions, and string scans.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear time across two passes.
- **Auxiliary Space:** $O(1)$ in-place character swapping workspace.

---


## Cheat Sheet & Quick Reference

| Two-Pointer Pattern | Setup / Pointer Movement | Primary Use Case | Time / Space |
| :--- | :--- | :--- | :--- |
| Converging Pointers | `L = 0`, `R = N-1`; move inward | Target value pairing, boundary optimization | $O(N)$ / $O(1)$ |
| Fast & Slow Pointers | `slow += 1`, `fast += 2` | Cycle Detection, Midpoint, Happy Number | $O(N)$ / $O(1)$ |
| Triplet Sum Reduction | Sort + Fixed Loop + Two Pointers | Unique 3-element target sums | $O(N^2)$ / $O(1)$ |
| Dual-Array Merge | Pointer $i$ on $A$, pointer $j$ on $B$ | Sorted Merge, Intersections | $O(N+M)$ / $O(1)$ |
| In-Place Compaction | Write pointer $w$, Read pointer $r$ | Tombstone compaction, duplicate filtering | $O(N)$ / $O(1)$ |
| Palindrome Validation | `L` and `R` inward character comparison | String symmetry verification | $O(N)$ / $O(1)$ |
| Two-Phase Reversal | Reverse words, then reverse all | Invert word order in-place | $O(N)$ / $O(1)$ |
