# Chapter 31: Greedy Algorithms

---


## Greedy Foundations & Proof Techniques


### Greedy Axioms & Exchange Argument Proof Techniques

Let's stand at the whiteboard and contrast Greedy Algorithms with Dynamic Programming: a greedy algorithm makes an irrevocable, locally optimal choice at each step without looking back.

A greedy algorithm is correct if and only if the problem exhibits two core properties: the Greedy Choice Property (locally optimal choices lead to a global optimum) and Optimal Substructure.

```text
Assume hypothetical optimal solution O differs from greedy solution G.
Identify first point of divergence: choice o_k vs greedy choice g_k.
Exchange o_k with g_k: prove Cost(O') <= Cost(O) without breaking rules
Repeat exchange until O is transformed into G without degrading value!
```

The exchange argument mathematically proves that swapping an optimal component with the greedy component preserves optimality.

$$\text{Cost}(G) \le \text{Cost}(O) \implies \text{Greedy choice is globally optimal}$$

Contrasting the change-making problem on a standard currency system against a non-canonical system demonstrates where greedy heuristics succeed and where they fail.

```cpp
// Canonical Denomination Dispensation with Greedy Choice
vector<int> greedy_coin_change(int amount, const vector<int>& canonical_coins) {
    // Coins sorted descendingly: e.g. {100, 50, 20, 10, 5, 2, 1}
    vector<int> change;
    for (int coin : canonical_coins) {
        while (amount >= coin) {
            change.push_back(coin);
            amount -= coin;
        }
    }
    return change;
}
```

| Strategy | Decision Irrevocability | State Space Explored | Time Complexity | Optimality Guarantee |
| :--- | :--- | :--- | :--- | :--- |
| **Greedy** | **Irrevocable** (Zero backtracking) | Single linear path | $O(N)$ or $O(N \log N)$ | Only if greedy choice holds |
| **Dynamic Prog** | Explores overlapping subproblems | Memoized DAG states | $O(N^2)$ or $O(N \cdot W)$ | **Guaranteed** |
| **Backtracking** | Explores with undo step | Exhaustive search tree | $O(2^N)$ or $O(N!)$ | **Guaranteed** |

```text
Target = 6, Denominations = { 4, 3, 1 }
Greedy Choice: Takes 4 -> Remaining 2 -> Takes 1, 1 ===> 3 coins
Optimal Choice: Takes 3, 3 ===> 2 coins! (Greedy fails here!)
```

> [!WARNING]
> Always prove that making a local greedy choice cannot block superior future outcomes. When the greedy choice property fails, use Dynamic Programming.

Let's now examine interval scheduling and boundary consolidation.


#### Complexity Analysis
- **Time Complexity:** $O(N)$ for linear change making; $O(N \log N)$ if input requires sorting.
- **Auxiliary Space:** $O(1)$ auxiliary space beyond output buffers.

---


## Interval & Job Scheduling


### Interval Selection & Boundary Consolidation

Interval scheduling problems evaluate sets of time intervals $[s_i, f_i]$: Activity Selection maximizes non-overlapping tasks, while Interval Merging consolidates overlapping time spans.

Sorting by Earliest Finish Time is optimal for Activity Selection because finishing earliest leaves the maximum remaining time resource for subsequent tasks.

```text
Tasks: [ 1..3 ], [ 2..5 ], [ 4..6 ], [ 6..8 ]
1. Select [ 1..3 ] -> Finishes at 3 (Leaves maximum room!)
2. Skip [ 2..5 ]   -> Starts at 2 < 3 (Overlaps!)
3. Select [ 4..6 ] -> Finishes at 6
4. Select [ 6..8 ] -> Finishes at 8 ===> 3 tasks scheduled!
```

The greedy selection recurrence chooses the next compatible activity with the minimum finish time.

$$A_{k} = \text{argmin}_{i \in S, \; s_i \ge f_{\text{last}}} f_i$$

Let's implement Non-Overlapping Interval Selection and Interval Merging in C++.

```cpp
// Non-Overlapping Interval Selection & Interval Merging
struct Interval {
    int start, end;
};

int max_non_overlapping_intervals(vector<Interval>& intervals) {
    if (intervals.empty()) return 0;
    // Sort by END time ascendingly
    sort(intervals.begin(), intervals.end(), [](const Interval& a, const Interval& b) {
        return a.end < b.end;
    });

    int count = 1;
    int last_end = intervals[0].end;

    for (size_t i = 1; i < intervals.size(); ++i) {
        if (intervals[i].start >= last_end) {
            count++;
            last_end = intervals[i].end;
        }
    }
    return count;
}

vector<Interval> merge_overlapping_intervals(vector<Interval>& intervals) {
    if (intervals.empty()) return {};
    // Sort by START time ascendingly
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
```

| Interval | Start $s_i$ | End $f_i$ | Overlaps `last_end`? | Selection Decision | Active `last_end` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Task 1 | $1$ | $3$ | No ($1 \ge 0$) | **Selected** | $3$ |
| Task 2 | $2$ | $5$ | **Yes ($2 < 3$)** | Discarded | $3$ |
| Task 3 | $4$ | $6$ | No ($4 \ge 3$) | **Selected** | $6$ |
| Task 4 | $6$ | $8$ | No ($6 \ge 6$) | **Selected** | $8$ |

```text
- Maximize Non-Overlapping Tasks : Sort by END time ascendingly!
- Merge Overlapping Intervals    : Sort by START time ascendingly!
```

> [!IMPORTANT]
> Sort by **START** time when consolidating overlapping intervals; sort by **END** time when maximizing non-overlapping selections.

Let's now examine deadline-constrained task scheduling and CPU cooldowns.


#### Complexity Analysis
- **Time Complexity:** $O(N \log N)$ dominated by initial sorting.
- **Auxiliary Space:** $O(1)$ extra space beyond output vector.

---


### Deadlines, Profits & Task Scheduling with Cooldowns

Job Sequencing with Deadlines schedules unit-time jobs with assigned profits and deadlines to maximize total revenue, while Task Scheduler arranges tasks with cooldown constraint $n$.

For Job Sequencing, we sort jobs by profit descendingly and greedily place each job in the latest available free time slot before its deadline using DSU.

```text
Job 1: Profit 100, Deadline 2 -> Placed in Slot 2 (Latest possible!)
Job 2: Profit 50,  Deadline 2 -> Slot 2 taken -> Placed in Slot 1
Job 3: Profit 40,  Deadline 1 -> Slot 1 taken -> Slot 0 (DISCARDED)
DSU parent[slot] tracks the next available free time slot in O(alpha)!
```

For Task Scheduler, the highest frequency task count $M$ defines the minimum idle slot framework.

$$\text{Total CPU Cycles} = \max\left( \text{tasks.size()}, \; (M - 1) \times (n + 1) + \text{count}(\text{tasks with frequency } M) \right)$$

Let's implement Job Sequencing with DSU and the CPU Task Scheduler in C++.

```cpp
// Job Sequencing with DSU & CPU Task Scheduler
struct Job {
    int id, deadline, profit;
};

int job_sequencing_dsu(vector<Job>& jobs, int max_deadline) {
    sort(jobs.begin(), jobs.end(), [](const Job& a, const Job& b) {
        return a.profit > b.profit; // Highest profit first
    });

    vector<int> parent(max_deadline + 1);
    for (int i = 0; i <= max_deadline; ++i) parent[i] = i;

    auto find_slot = [&](auto& self, int i) -> int {
        if (parent[i] == i) return i;
        return parent[i] = self(self, parent[i]);
    };

    int total_profit = 0;
    for (const auto& job : jobs) {
        int available_slot = find_slot(find_slot, min(max_deadline, job.deadline));
        if (available_slot > 0) {
            total_profit += job.profit;
            parent[available_slot] = find_slot(find_slot, available_slot - 1);
        }
    }
    return total_profit;
}

int least_interval(const vector<char>& tasks, int n) {
    vector<int> freq(26, 0);
    int max_f = 0, count_max_f = 0;

    for (char c : tasks) {
        freq[c - 'A']++;
        max_f = max(max_f, freq[c - 'A']);
    }

    for (int f : freq) {
        if (f == max_f) count_max_f++;
    }

    int frame_size = (max_f - 1) * (n + 1) + count_max_f;
    return max((int)tasks.size(), frame_size);
}
```

| Task | Frequency $f$ | Frame Base $(M-1)(n+1)$ | Extra Max Tasks | Resulting CPU Slots |
| :--- | :--- | :--- | :--- | :--- |
| `A: 3`, `B: 3`, $n=2$ | $M=3$ | $(3-1)(2+1) = 6$ | $2$ (`A` and `B`) | $\max(6, 6 + 2) = 8$ (`AB_AB_AB`) |
| `A: 3`, `B: 1`, $n=2$ | $M=3$ | $(3-1)(2+1) = 6$ | $1$ (`A`) | $\max(4, 6 + 1) = 7$ (`A__A__A`) |

```text
Schedule for A:3, B:3, n=2:
Frame 1: [ A | B | Idle ]
Frame 2: [ A | B | Idle ]
Final  : [ A | B ]         ===> Total = 8 CPU Cycles
```

> [!TIP]
> Using DSU to track available time slots reduces Job Sequencing runtime from naive $O(N \cdot D)$ to optimal $O(N \log N + N \cdot \alpha(D))$.

Let's now examine the Fractional Knapsack problem and density sorting.


#### Complexity Analysis
- **Time Complexity:** $O(N \log N)$ for Job Sequencing; $O(N)$ for Task Scheduler.
- **Auxiliary Space:** $O(D)$ for DSU time slots; $O(1)$ for Task Scheduler frequency table.

---


## Optimization Paradigms & Prefix Codings


### Fractional Knapsack & Density Sorting

In the Fractional Knapsack Problem, items can be sliced into fractional pieces, unlike the 0/1 Knapsack problem where items must be taken whole or left behind.

The greedy strategy repeatedly takes items with the highest value-to-weight density ratio $\rho_i = v_i / w_i$ until the knapsack capacity $W$ is filled.

```text
Item A: Val 60, Wt 10 -> Density = 6.0 (Take 100%!)
Item B: Val 100, Wt 20 -> Density = 5.0 (Take 100%!)
Item C: Val 120, Wt 30 -> Density = 4.0 (Capacity remaining = 20)
Slicing Item C: Take 20/30 = 2/3 fraction -> Value +80!
Total Value = 60 + 100 + 80 = 240!
```

The mathematical formula computes the maximum achievable value.

$$\text{Max Value} = \sum_{i=1}^{k-1} v_i + \left( \frac{W - \sum_{j=1}^{k-1} w_j}{w_k} \right) v_k$$

Let's implement the Fractional Knapsack solver in C++.

```cpp
// Fractional Knapsack: O(N log N) Time, O(1) Auxiliary Space
struct KnapsackItem {
    int value, weight;
};

double fractional_knapsack(int W, vector<KnapsackItem>& items) {
    // Sort items descendingly by value density ratio
    sort(items.begin(), items.end(), [](const KnapsackItem& a, const KnapsackItem& b) {
        double r1 = (double)a.value / a.weight;
        double r2 = (double)b.value / b.weight;
        return r1 > r2;
    });

    double total_value = 0.0;
    int remaining_capacity = W;

    for (const auto& item : items) {
        if (remaining_capacity >= item.weight) {
            // Take complete item
            total_value += item.value;
            remaining_capacity -= item.weight;
        } else {
            // Take fractional piece
            total_value += item.value * ((double)remaining_capacity / item.weight);
            break; // Knapsack is full
        }
    }
    return total_value;
}
```

| Item | Value $v_i$ | Weight $w_i$ | Density $\rho_i = v_i / w_i$ | Fraction Taken | Value Added |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Item $1$ | $60$ | $10$ | $6.0$ | $1.0$ (Full) | $+60.0$ |
| Item $2$ | $100$ | $20$ | $5.0$ | $1.0$ (Full) | $+100.0$ |
| Item $3$ | $120$ | $30$ | $4.0$ | $20 / 30 = 0.67$ | $+80.0$ |
| Total | - | Capacity $50$ | - | - | **$240.0$** |

```text
Fractional Knapsack: Greedy density sorting gives EXACT optimal answer!
0/1 Knapsack       : Greedy FAILS (Requires Dynamic Programming!)
```

> [!IMPORTANT]
> Greedy density sorting produces the exact global optimum for Fractional Knapsack, but fails on 0/1 Knapsack where fractional slicing is forbidden.

Let's now examine greedy reachability and range hop optimizations.


#### Complexity Analysis
- **Time Complexity:** $O(N \log N)$ dominated by sorting items by density.
- **Auxiliary Space:** $O(1)$ auxiliary space beyond input data.

---


### Greedy Reachability & Minimum Hop Optimization

Greedy reachability problems determine whether a moving entity (such as an autonomous delivery rover) can traverse a sequence of recharging stations where each station $i$ provides range $R[i]$.

We track the farthest reachable index `max_reach`. If at any point the current index $i$ exceeds `max_reach`, the rover is stranded and cannot proceed further.

```text
Station Ranges: [ 2,  3,  1,  1,  4 ]
Index 0 (R=2): max_reach = max(0, 0 + 2) = 2
Index 1 (R=3): max_reach = max(2, 1 + 3) = 4
max_reach >= 4 (Final destination reached in O(N) single pass!)
```

The minimum hops variant expands layers like a greedy breadth-first search:

$$\text{if } (i == \text{current\_hop\_end}) \implies (\text{hops}++, \; \text{current\_hop\_end} = \text{farthest})$$

Let's implement reachability verification and minimum hop calculation in C++.

```cpp
// Range Reachability Verification: O(N) Time, O(1) Space
bool can_traverse_recharge_route(const vector<int>& pad_ranges) {
    int max_reach = 0;
    int n = pad_ranges.size();

    for (int i = 0; i < n; ++i) {
        if (i > max_reach) return false; // Stranded before reaching station i
        max_reach = max(max_reach, i + pad_ranges[i]);
        if (max_reach >= n - 1) return true; // Destination within reach
    }
    return true;
}

// Minimum Recharging Hops to Destination: O(N) Time, O(1) Space
int min_recharge_hops_to_destination(const vector<int>& pad_ranges) {
    int n = pad_ranges.size();
    if (n <= 1) return 0;

    int hops = 0, current_hop_end = 0, farthest = 0;

    for (int i = 0; i < n - 1; ++i) {
        farthest = max(farthest, i + pad_ranges[i]);

        if (i == current_hop_end) {
            hops++;
            current_hop_end = farthest;
            if (current_hop_end >= n - 1) break;
        }
    }
    return hops;
}
```

#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ single pass across array elements.
- **Auxiliary Space:** $O(1)$ auxiliary memory.

---


### Huffman Coding & Optimal Prefix Trees

Huffman Coding is a lossless compression algorithm that assigns variable-length binary codes to characters based on their frequencies: frequent characters receive short codes, while rare characters receive longer codes.

It satisfies the Prefix Property: no character's assigned code is a prefix of any other code, allowing unambiguous decompression without delimiters.

```text
Min-Heap of Character Frequencies: { 'a': 45, 'b': 13, 'c': 12 }
1. Extract 2 smallest: 'c' (12) and 'b' (13)
2. Merge into parent node with frequency = 25
3. Re-insert parent into Min-Heap
4. Repeat until single root tree remains!
```

The algorithm minimizes the expected total code length across the character alphabet.

$$L(C) = \sum_{c \in \Sigma} f(c) \cdot \text{length}(\text{code}(c))$$

Let's implement the Huffman Tree builder and prefix code generator in C++.

```cpp
// Huffman Coding: Optimal Variable-Length Prefix Compression
struct HuffmanNode {
    char ch;
    int freq;
    HuffmanNode *left, *right;
    HuffmanNode(char c, int f) : ch(c), freq(f), left(nullptr), right(nullptr) {}
};

struct CompareHuffman {
    bool operator()(HuffmanNode* a, HuffmanNode* b) const {
        return a->freq > b->freq; // Min-Heap
    }
};

void generate_codes(HuffmanNode* root, string code, unordered_map<char, string>& huffman_codes) {
    if (!root) return;
    if (!root->left && !root->right) {
        huffman_codes[root->ch] = code;
    }
    generate_codes(root->left, code + "0", huffman_codes);
    generate_codes(root->right, code + "1", huffman_codes);
}

unordered_map<char, string> build_huffman_tree(const unordered_map<char, int>& freq_map) {
    priority_queue<HuffmanNode*, vector<HuffmanNode*>, CompareHuffman> min_heap;

    for (auto const& [ch, freq] : freq_map) {
        min_heap.push(new HuffmanNode(ch, freq));
    }

    while (min_heap.size() > 1) {
        HuffmanNode* left = min_heap.top(); min_heap.pop();
        HuffmanNode* right = min_heap.top(); min_heap.pop();

        HuffmanNode* parent = new HuffmanNode('$', left->freq + right->freq);
        parent->left = left;
        parent->right = right;
        min_heap.push(parent);
    }

    unordered_map<char, string> huffman_codes;
    generate_codes(min_heap.top(), "", huffman_codes);
    return huffman_codes;
}
```

| Character | Frequency | Generated Bitstring | Code Length | Total Bits (Freq $\times$ Len) |
| :--- | :--- | :--- | :--- | :--- |
| `'a'` | $45$ | `"0"` | $1$ | $45$ bits |
| `'b'` | $13$ | `"101"` | $3$ | $39$ bits |
| `'c'` | $12$ | `"100"` | $3$ | $36$ bits |

```text
Encoded Stream: "0101100"
"0" matches 'a' -> "101" matches 'b' -> "100" matches 'c'
Decodes uniquely to "abc" with zero ambiguous delimiter tokens!
```

> [!TIP]
> The Prefix Property eliminates ambiguity during decompression: encoded streams can be decoded deterministically in a single pass by traversing the prefix tree.

This completes the Greedy Algorithms chapter, mastering exchange arguments, interval selections, deadline schedules, fractional knapsacks, jump frontiers, and Huffman prefix trees.


#### Complexity Analysis
- **Time Complexity:** $O(N \log N)$ to build tree using Min-Heap over $N$ unique alphabet characters.
- **Auxiliary Space:** $O(N)$ memory storing tree nodes and binary prefix strings.

---


## Cheat Sheet & Quick Reference

| Greedy Problem | Decision Policy | Sorting / Struct Strategy | Complexity |
| :--- | :--- | :--- | :--- |
| **Activity Selection** | Max non-overlapping | Sort by **END** time ascendingly | $O(N \log N)$ / $O(1)$ Space |
| **Interval Merging** | Consolidate overlaps | Sort by **START** time ascendingly | $O(N \log N)$ / $O(1)$ Space |
| **Job Sequencing** | Max profit by deadline | Sort profit descending + DSU slot tracker | $O(N \log N)$ / $O(D)$ Space |
| **Task Scheduler** | Minimum CPU cycles | Frame by max frequency $M$: $(M-1)(n+1) + k$ | $O(N)$ / $O(1)$ Space |
| **Fractional Knapsack**| Max value filling | Sort by density ratio $\rho = v_i / w_i$ | $O(N \log N)$ / $O(1)$ Space |
| **Range Reachability** | Minimum hop reach | Expand farthest horizon $[L, R]$ layer-by-layer| $\Theta(N)$ / $O(1)$ Space |
| **Huffman Coding** | Lossless compression | Repeatedly merge 2 lowest freqs in Min-Heap | $O(N \log N)$ / $O(N)$ Space |
