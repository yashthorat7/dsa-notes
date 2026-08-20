# Chapter 10: Sliding Window

---






## Fixed Window Mechanics






### Fixed-Size Sliding Windows & Boundary Shift Mechanics

Imagine looking through a rigid rectangular magnifying glass of width $K$ moving from left to right across a printed strip of numbers.

Instead of recalculating the entire window metric from scratch in $O(K)$ time at each step, we update the state in $O(1)$ time by adding the incoming element on the right and subtracting the outgoing element on the left.

```text
Array: [ 2,  1,  5,  1,  3,  2 ]
Window 0: [ 2 + 1 + 5 ] = 8
Shift ->: -2 (Outgoing Left)  +1 (Incoming Right)
Window 1: [ 1 + 5 + 1 ] = 8 - 2 + 1 = 7  (O(1) update!)
Shift ->: -1 (Outgoing Left)  +3 (Incoming Right)
Window 2: [ 5 + 1 + 3 ] = 7 - 1 + 3 = 9  (Maximum found!)
```

The mathematical recurrence relation updates the rolling sum in constant time per shift.

$$W_i = W_{i-1} + A[i] - A[i - K] \quad \text{for all } i \ge K$$

Let's implement the optimal $O(N)$ Maximum Sum Subarray of size $K$.

```cpp
// Maximum Sum Subarray of Fixed Size K: O(N) Time, O(1) Space
int max_sum_fixed_window(const vector<int>& arr, int k) {
    int n = arr.size();
    if (n < k) return -1;

    // Step 1: Compute initial K-element prefix sum
    int current_sum = 0;
    for (int i = 0; i < k; ++i) current_sum += arr[i];

    int max_sum = current_sum;

    // Step 2: Slide window across remaining array in O(1) per step
    for (int i = k; i < n; ++i) {
        current_sum += arr[i] - arr[i - k]; // Add incoming, subtract outgoing
        max_sum = max(max_sum, current_sum);
    }
    return max_sum;
}
```

| Window Index Range $[L, R]$ | Outgoing Element ($A[i-K]$) | Incoming Element ($A[i]$) | Window Rolling Sum | Max Sum Recorded |
| :--- | :--- | :--- | :--- | :--- |
| $[0, 2]$ | Initial prefix | Initial prefix | $2 + 1 + 5 = 8$ | $8$ |
| $[1, 3]$ | $2$ | $1$ | $8 - 2 + 1 = 7$ | $8$ |
| $[2, 4]$ | $1$ | $3$ | $7 - 1 + 3 = 9$ | **9 (Peak)** |
| $[3, 5]$ | $5$ | $2$ | $9 - 5 + 2 = 6$ | $9$ |

```text
[ A0, A1, A2 ] -> [ A1, A2, A3 ] -> [ A2, A3, A4 ] -> [ A3, A4, A5 ]
  Sum: 8             Sum: 7            Sum: 9            Sum: 6
```

> [!WARNING]
> Always compute the initial $K$-element window sum before entering the sliding loop. Forgetting initialization causes index out-of-bounds errors on `i - k`.

Let's now study matching character frequency signatures with fixed windows.






#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear time; exactly 1 addition and 1 subtraction per shift.
- **Auxiliary Space:** $O(1)$ scalar variable workspace.

---






### Fixed-Window Frequency Signatures & Pattern Matching

Fixed-size windows solve pattern matching problems such as finding all occurrences where a substring matches an exact character distribution.

We maintain a fixed-width window of length $|P|$ and compare its 26-element character frequency signature against pattern $P$'s signature in $O(1)$ time per shift using a match counter.

```text
Pattern P = "abc" (Counts: a:1, b:1, c:1, others:0)
Text S:   "c  b  a  e  b  a  b  c  a  c  d"
Window 0: [c  b  a] -> Matches: 26/26 ===> SIGNATURE HIT AT INDEX 0!
Shift ->: -c, +e    -> Matches: 24/26 -> No hit
```

The sliding window frequency update maintains the total number of matched character counts in $O(1)$ time:

$$\Delta \text{matches} = \text{update}(\text{outgoing}) + \text{update}(\text{incoming})$$

Let's implement the rolling frequency scanner in C++.

```cpp
// Genomic Enzyme Probe Scanner: O(|S|) Time, O(1) Space
vector<int> find_probe_matches(const string& genome, const string& probe) {
    if (genome.size() < probe.size()) return {};

    vector<int> p_count(26, 0), s_count(26, 0);
    for (char c : probe) p_count[c - 'a']++;

    int k = probe.size();
    for (int i = 0; i < k; ++i) s_count[genome[i] - 'a']++;

    int matches = 0;
    for (int i = 0; i < 26; ++i) {
        if (p_count[i] == s_count[i]) matches++;
    }

    vector<int> result;
    if (matches == 26) result.push_back(0);

    for (int i = k; i < (int)genome.size(); ++i) {
        int r = genome[i] - 'a';
        int l = genome[i - k] - 'a';

        // Add incoming character
        s_count[r]++;
        if (s_count[r] == p_count[r]) matches++;
        else if (s_count[r] == p_count[r] + 1) matches--;

        // Remove outgoing character
        s_count[l]--;
        if (s_count[l] == p_count[l]) matches++;
        else if (s_count[l] == p_count[l] - 1) matches--;

        if (matches == 26) result.push_back(i - k + 1);
    }
    return result;
}
```





#### Complexity Analysis
- **Time Complexity:** $\Theta(|S|)$ linear time across the text string.
- **Auxiliary Space:** $O(1)$ fixed 26-slot frequency arrays.

---






## Variable Window Mechanics






### Dynamic Variable-Size Windows & Shrink Invariants

In a variable sliding window, two pointers `left` and `right` expand and contract dynamically based on a constraint predicate $P(W)$.

The standard algorithm follows a two-phase loop: expand `right` to include elements until the constraint is met or violated, then adjust `left` accordingly.

```text
1. Expand Phase: Right pointer advances -> [ L ............ R -> ]
2. Constraint Check: If threshold condition satisfied:
3. Shrink Phase: Left pointer contracts -> [ -> L ......... R ]
Window stretches rightward and snaps leftward like an accordion.
```

#### Variable Window Design: Longest vs Shortest Contract

| Goal | Invariant Contract | Shrink Condition (`while`) | Answer Update Point |
| :--- | :--- | :--- | :--- |
| **Longest Subarray** | Window must remain **Valid** | `while (window_is_invalid)` | After shrink loop: `max_len = max(...)` |
| **Shortest Subarray**| Window has achieved **Goal** | `while (window_meets_goal)` | Inside shrink loop: `min_len = min(...)` |

Each element enters the window via `right` once and exits via `left` at most once, guaranteeing strictly linear $O(N)$ amortized time.

$$T(N) = N \text{ expansions} + N \text{ contractions} = O(N)$$

Let's implement the shortest batch span meeting or exceeding a target capacity in $O(N)$ time.

```cpp
// Shortest High-Capacity Batch Span (Sum >= Target): O(N) Time, O(1) Space
int min_capacity_batch_span(int quota, const vector<int>& batch_sizes) {
    int left = 0, current_sum = 0;
    int min_len = 1e9;
    int n = batch_sizes.size();

    for (int right = 0; right < n; ++right) {
        current_sum += batch_sizes[right]; // Expand window rightward

        // Shrink window from left as long as quota condition is satisfied
        while (current_sum >= quota) {
            min_len = min(min_len, right - left + 1);
            current_sum -= batch_sizes[left];
            left++;
        }
    }
    return (min_len == 1e9) ? 0 : min_len;
}
```




#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ amortized linear time across all pointer steps.
- **Auxiliary Space:** $O(1)$ scalar variable workspace.

---






### Variable-Window Element Cardinality & Sum Bounds

Variable windows can find the longest contiguous substring containing distinct elements or bounded character frequencies.

We maintain a character frequency tracking structure and shrink `left` whenever cardinality constraints are exceeded.

```text
Signal: "e  c  e  b  a",  K = 2 distinct channel codes
R=0 ('e'): Map: {e:1} -> Size 1 <= 2 -> MaxLen = 1
R=1 ('c'): Map: {e:1, c:1} -> Size 2 <= 2 -> MaxLen = 2
R=2 ('e'): Map: {e:2, c:1} -> Size 2 <= 2 -> MaxLen = 3 ("ece")
R=3 ('b'): Map: {e:2, c:1, b:1} -> Size 3 > 2 -> Shrink L until <= 2
```

A direct 128-element array stores each character's last seen index, allowing the left pointer to jump directly forward in $O(1)$ time:

$$\text{left} = \max(\text{left}, \text{last\_seen}[S[\text{right}]] + 1)$$

Let's implement the longest unique signal burst tracker in C++.

```cpp
// Longest Distinct Signal Burst: O(N) Time, O(1) Space
int longest_distinct_channel_burst(const string& signal_stream) {
    vector<int> last_seen(128, -1);
    int max_len = 0, left = 0;

    for (int right = 0; right < (int)signal_stream.size(); ++right) {
        char c = signal_stream[right];
        if (last_seen[c] >= left) {
            left = last_seen[c] + 1; // Jump left pointer past duplicate
        }
        last_seen[c] = right;
        max_len = max(max_len, right - left + 1);
    }
    return max_len;
}
```



#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear time across all character insertions and jumps.
- **Auxiliary Space:** $O(K)$ hash map storage or $O(1)$ fixed 128-element array.

---






## Window State Tracking & Parsing






### Monotonic Deque Sliding Window Extremum Tracking

The sliding window extremum problem finds the peak maximum value in every sliding window of size $K$ in $O(N)$ total time.

We maintain a Monotonic Decreasing Deque storing element indices whose values are strictly decreasing ($A[d_1] > A[d_2] > \dots$).

```text
Incoming Element: x = 5
Deque state before: [ 7 (index 0) ][ 3 (index 1) ][ 2 (index 2) ]
5 is larger than 2 and 3 -> Pop 2 and 3 from back!
Deque state after:  [ 7 (index 0) ][ 5 (index 3) ]
Front element is ALWAYS the maximum of the current window!
```

The double-ended queue maintains the monotonicity invariant at each step:

$$\text{dq.back}() < \text{incoming} \implies \text{pop\_back}()$$

Let's implement the optimal $O(N)$ sliding latency peak monitor using `deque`.

```cpp
// Rolling Latency Peak Monitor: O(N) Time, O(K) Auxiliary Space
vector<int> monitor_sliding_peak_latency(const vector<int>& latencies, int k) {
    deque<int> dq; // Stores indices of candidate maximums
    vector<int> peaks;
    int n = latencies.size();

    for (int i = 0; i < n; ++i) {
        // 1. Evict expired indices outside current window [i - k + 1, i]
        if (!dq.empty() && dq.front() <= i - k) {
            dq.pop_front();
        }

        // 2. Maintain monotonic decreasing invariant: evict smaller elements
        while (!dq.empty() && latencies[dq.back()] <= latencies[i]) {
            dq.pop_back();
        }

        dq.push_back(i);

        // 3. Record maximum once the initial window of size k is formed
        if (i >= k - 1) {
            peaks.push_back(latencies[dq.front()]);
        }
    }
    return peaks;
}
```


#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear time; each index is pushed and popped at most once.
- **Auxiliary Space:** $O(K)$ space to store at most $K$ indices in the deque.

---






### Constrained Substring Windowing & Target Character Set Parsing

The constrained substring windowing problem finds the shortest contiguous slice in text $S$ that contains every required character of target template $T$ (including duplicate counts).

We maintain target character counts and a `formed` match counter, expanding `right` until all requirements are met, then shrinking `left` to find the minimal valid window.

```text
Text: "A D O B E C O D E B A N C",  Target: "A B C"
Expand Right: [ A D O B E C ] -> Contains A, B, C! (Length = 6)
Shrink Left:  Trim redundant characters from left
Best Window:  [ B A N C ] (Length = 4 -> Minimal Solution!)
```

The optimization balances window validity against minimal span length:

$$\min_{W \subseteq S} |W| \quad \text{subject to } \forall c \in T, \; \text{count}_W(c) \ge \text{count}_T(c)$$

Let's implement the constrained substring parser in C++.

```cpp
// Shortest Diagnostic Log Span: O(|S| + |T|) Time, O(1) Auxiliary Space
string shortest_diagnostic_log_span(const string& log_stream, const string& required_tags) {
    if (log_stream.empty() || required_tags.empty()) return "";

    vector<int> target_freq(128, 0), window_freq(128, 0);
    for (char c : required_tags) target_freq[c]++;

    int required_unique = 0;
    for (int i = 0; i < 128; ++i) {
        if (target_freq[i] > 0) required_unique++;
    }

    int left = 0, formed_unique = 0;
    int min_len = 1e9, start_idx = 0;

    for (int right = 0; right < (int)log_stream.size(); ++right) {
        char c = log_stream[right];
        window_freq[c]++;

        if (target_freq[c] > 0 && window_freq[c] == target_freq[c]) {
            formed_unique++;
        }

        // Shrink window from left as long as all required tags are present
        while (left <= right && formed_unique == required_unique) {
            if (right - left + 1 < min_len) {
                min_len = right - left + 1;
                start_idx = left;
            }

            char left_char = log_stream[left];
            window_freq[left_char]--;
            if (target_freq[left_char] > 0 && window_freq[left_char] < target_freq[left_char]) {
                formed_unique--;
            }
            left++;
        }
    }
    return (min_len == 1e9) ? "" : log_stream.substr(start_idx, min_len);
}
```

#### Complexity Analysis
- **Time Complexity:** $\Theta(|S| + |T|)$ linear time across both input strings.
- **Auxiliary Space:** $O(1)$ fixed 128-element frequency arrays.

---






## Cheat Sheet & Quick Reference

| Sliding Window Technique | Window Sizing | Condition / Predicate | Complexity |
| :--- | :--- | :--- | :--- |
| Fixed Window Max Sum | Fixed width $K$ | Add incoming, subtract outgoing | $\Theta(N)$ / $O(1)$ |
| Rolling Anagram Matching | Fixed width $\|P\|$ | 26-slot match counter | $\Theta(N)$ / $O(1)$ |
| Variable Minimum Subarray | Variable $[L, R]$ | Shrink while $\text{sum} \ge \text{target}$ | $\Theta(N)$ / $O(1)$ |
| At Most $K$ Distinct Chars | Variable $[L, R]$ | Shrink while $\text{distinct} > K$ | $\Theta(N)$ / $O(K)$ |
| Longest Unique Substring | Variable $[L, R]$ | Direct jump $L = \text{last}[c] + 1$ | $\Theta(N)$ / $O(1)$ |
| Monotonic Deque Extremum | Fixed width $K$ | Pop smaller contenders from back | $\Theta(N)$ / $O(K)$ |
| Constrained Substring Coverage | Variable $[L, R]$ | Shrink while $\text{formed} == \text{required}$ | $\Theta(N)$ / $O(1)$ |
