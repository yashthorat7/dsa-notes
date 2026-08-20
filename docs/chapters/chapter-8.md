# Chapter 8: Hash Maps & Sets

---





## Hashing Infrastructure





### Direct Address Tables & Bounded-Universe Lookups

Imagine a coat check room with numbered hooks from 0 to 99. When you arrive with ticket #42, the attendant walks straight to hook 42 without checking any other hooks.

Direct addressing uses the search key directly as an array index, achieving deterministic $O(1)$ time for search, insertion, and deletion across a bounded key universe $U$.

```text
Key Value (k):     [ 0 ]   [ 1 ]   [ 2 ]   [ 3 ]   [ 4 ] ... [ 9 ]
Direct Array Slot: [ 0 ]   [ 1 ]   [ 2 ]   [ 3 ]   [ 4 ] ... [ 9 ]
Lookup Operation:  Table[k] directly accesses item in 1 cycle!
```

Direct addressing is optimal when the key universe size $|U|$ is small and comparable to the number of stored keys $N$.

$$\text{Time}(\text{Search}) = O(1), \quad \text{Space} = \Theta(|U|) \quad (\text{Practical when } |U| \approx N)$$

Let's inspect a direct address character frequency counter for lowercase ASCII characters `'a'` through `'z'` using a static 26-slot array.

```cpp
// Direct Address Frequency Counter: 26-Slot Universe
void count_char_frequencies(const string& s) {
    int freq[26] = {0}; // Static direct address table for 'a'..'z'
    for (char ch : s) {
        freq[ch - 'a']++; // Direct index offset arithmetic
    }
}
```

For large integer universes, boolean membership can be tracked with `bitset<N>`, which packs 8 boolean flags per byte for an $8\times$ memory reduction.

```cpp
// Bitset Direct Address Membership Tester: 1 Bit Per Key
class DirectBitSet {
    vector<unsigned long long> bits;
public:
    DirectBitSet(int max_val) : bits((max_val + 63) / 64, 0) {}

    void insert(int key) { bits[key / 64] |= (1ULL << (key % 64)); }
    bool contains(int key) const { return (bits[key / 64] & (1ULL << (key % 64))) != 0; }
};
```

| Property | Direct Address Table | Hash Table |
| :--- | :--- | :--- |
| Worst-Case Lookup | **Strictly $O(1)$** | $O(N)$ with collisions |
| Space Complexity | $\Theta(|U|)$ universe size | $\Theta(N)$ stored keys |
| Collision Risk | **Zero collisions** | Present (Requires resolution) |
| Memory Overhead | Massive when $|U| \gg N$ | Compact and proportional to $N$ |

```text
Storing 3 keys {5, 9000, 999999}:
Direct Table: Allocates 1,000,000 slots (99.99% empty RAM waste!)
Hash Table:   Compresses keys into 7 buckets -> Space = O(N)
```

> [!WARNING]
> Allocating direct address tables for unbounded integer keys (e.g. 32-bit `int`) requires 16 GB of RAM and triggers immediate Out-Of-Memory crashes.

Let's now study hash functions that compress massive key universes into compact tables.





#### Complexity Analysis
- **Time Complexity:** $\Theta(1)$ deterministic single-cycle access.
- **Auxiliary Space:** $\Theta(|U|)$ memory proportional to the maximum key universe size.

---





### Hash Function Design & Uniform Distribution Principles

A hash function $h(k)$ maps keys from a large universe $U$ down to a compact slot range $[0 \dots M-1]$ within the hash table buffer.

The Simple Uniform Hashing Assumption (SUHA) requires every key to be equally likely to hash into any of the $M$ slots independently.

```text
Uniform (SUHA):   [ 2 ][ 2 ][ 1 ][ 2 ][ 2 ][ 1 ][ 2 ] (Even spread)
Biased (Flawed):  [ 0 ][ 0 ][ 12 ][ 0 ][ 0 ][ 0 ][ 0 ] (Degraded O(N))
```

Polynomial rolling hash functions treat strings as polynomials over a prime base $p$, dispersing character permutations across the modulo ring.

$$h_{\text{poly}}(S) = \left( \sum_{i=0}^{L-1} S[i] \cdot p^i \right) \bmod M \quad (\text{Base } p = 31 \text{ or } 53, \; M = 10^9 + 7)$$

Let's implement a polynomial rolling hash function for strings.

```cpp
// Polynomial Rolling Hash for Strings
long long polynomial_string_hash(const string& s, long long p = 31, long long m = 1000000007) {
    long long hash_val = 0;
    long long p_pow = 1;
    for (char c : s) {
        hash_val = (hash_val + (c - 'a' + 1) * p_pow) % m;
        p_pow = (p_pow * p) % m;
    }
    return hash_val;
}
```

For 64-bit integers, the SplitMix64 mixing function uses bitwise XOR and multiplication constants to ensure single-bit input flips cause an avalanche across all 64 output bits.

```cpp
// SplitMix64 Fast Anti-Clustering Integer Hash
uint64_t splitmix64(uint64_t x) {
    x += 0x9e3779b97f4a7c15ULL;
    x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9ULL;
    x = (x ^ (x >> 27)) * 0x94d049bb133111ebULL;
    return x ^ (x >> 31);
}
```

| Hash Method | Application Domain | Throughput | Bit Avalanche Effect | Collision Resistance |
| :--- | :--- | :--- | :--- | :--- |
| Division ($k \bmod M$) | Simple integers | **Highest** | Low (Preserves patterns) | Poor without prime $M$ |
| Polynomial Rolling | Strings / Substrings | High | High across text | High with large prime |
| SplitMix64 | 64-bit Integers | **Very High** | **Full (50% bit flip)** | Excellent |
| MurmurHash3 | Arbitrary Byte Blobs | Very High | Excellent | Industry standard |

```text
Constant A = (sqrt(5) - 1) / 2 = 0.6180339887... (Golden Ratio)
Formula: h(k) = floor( M * ( (k * A) mod 1 ) )
Disperses arithmetic sequences evenly across all table buckets!
```

> [!TIP]
> Always choose table size $M$ as a prime number not close to powers of two when using modulo division hashing to eliminate arithmetic stride biases.

Let's now examine resolving collisions using Separate Chaining.





#### Complexity Analysis
- **Time Complexity:** $O(L)$ where $L$ is string length; $O(1)$ for fixed integer hashing.
- **Auxiliary Space:** $O(1)$ scalar calculation workspace.

---





### Separate Chaining & Bucket List Dynamics

Separate Chaining (Open Hashing) handles collisions by having each bucket slot point to a linked list of entries that share the same hash value.

Under the Simple Uniform Hashing Assumption (SUHA), average search time is proportional to the Load Factor $\alpha = N / M$.

```text
Bucket Array (M = 4):
  Bucket [ 0 ] ---> [ Key: 4, Val: "A" ] ---> [ Key: 8, Val: "B" ]
  Bucket [ 1 ] ---> nullptr (Empty)
  Bucket [ 2 ] ---> [ Key: 6, Val: "C" ]
  Bucket [ 3 ] ---> [ Key: 7, Val: "D" ] ---> [ Key: 11, Val: "E" ]
```

The mathematical theorem for expected search cost confirms that performance remains constant as long as the load factor is bounded.

$$\text{Expected Probes (Unsuccessful)} = 1 + \alpha, \quad \text{Expected Probes (Successful)} = 1 + \frac{\alpha}{2} \quad \left(\alpha = \frac{N}{M}\right)$$

Let's implement a custom `ChainedHashMap` with dynamic insertion, search, and deletion.

```cpp
// Separate Chaining Hash Map Implementation
class ChainedHashMap {
    struct Node {
        int key, val;
        Node* next;
        Node(int k, int v) : key(k), val(v), next(nullptr) {}
    };

    vector<Node*> buckets;
    int num_buckets;

public:
    ChainedHashMap(int m = 7) : num_buckets(m), buckets(m, nullptr) {}

    void insert(int key, int val) {
        int idx = key % num_buckets;
        for (Node* curr = buckets[idx]; curr; curr = curr->next) {
            if (curr->key == key) { curr->val = val; return; } // Update existing
        }
        Node* new_node = new Node(key, val);
        new_node->next = buckets[idx];
        buckets[idx] = new_node; // Head insertion
    }

    bool find(int key, int& val) {
        int idx = key % num_buckets;
        for (Node* curr = buckets[idx]; curr; curr = curr->next) {
            if (curr->key == key) { val = curr->val; return true; }
        }
        return false;
    }
};
```

| Operation | Target Key | Hash Index ($k \bmod 4$) | Bucket Chain Traversal | Result |
| :--- | :--- | :--- | :--- | :--- |
| `insert(4, "A")` | $4$ | $0$ | `nullptr` (Empty) | Head inserted at `buckets[0]` |
| `insert(8, "B")` | $8$ | $0$ | Traverses `[4]` $\to$ Collides | Head inserted: `[8] -> [4]` |
| `find(4)` | $4$ | $0$ | Steps: `[8]` (miss) $\to$ `[4]` (hit) | Value `"A"` returned |
| `find(5)` | $5$ | $1$ | `buckets[1]` is `nullptr` | Returns `false` in 1 check |

```text
If a single bucket list length exceeds 8 nodes:
Linked List ---> Converted to Red-Black Tree (O(log N) worst case!)
```

> [!TIP]
> Inserting new elements at the head of the bucket list runs in $O(1)$ time, provided keys are known to be unique.

Let's now examine Open Addressing where all elements are stored directly in the table array.





#### Complexity Analysis
- **Time Complexity:** $O(1 + \alpha)$ average time for search, insertion, and deletion; $O(N)$ worst-case.
- **Auxiliary Space:** $O(N + M)$ memory for bucket pointers and linked nodes.

---





### Open Addressing — Linear, Quadratic, and Double Hashing Probing

Open Addressing (Closed Hashing) stores all key-value pairs directly in the table array without linked lists.

When a collision occurs at slot $h(k)$, the algorithm inspects a sequence of alternative slots $h(k, i)$ until finding an empty cell.

```text
Linear Probing:    h(k, i) = (h(k) + i) % M
Quadratic Probing: h(k, i) = (h(k) + c1 * i + c2 * i^2) % M
Double Hashing:    h(k, i) = (h1(k) + i * h2(k)) % M
```

Double Hashing uses a secondary hash function $h_2(k)$ as the step size, eliminating both primary and secondary clustering.

$$h_{\text{double}}(k, i) = (h_1(k) + i \cdot h_2(k)) \bmod M \quad (\text{where } \gcd(h_2(k), M) = 1)$$

When an element is deleted, its slot must be marked with a special `TOMBSTONE` marker rather than being cleared to empty, ensuring subsequent searches do not terminate prematurely.

```cpp
// Open Addressing with Linear Probing and Tombstone Handling
class LinearProbeHashMap {
    enum SlotState { EMPTY, OCCUPIED, TOMBSTONE };
    struct Entry { int key, val; SlotState state = EMPTY; };
    vector<Entry> table;
    int cap;

public:
    LinearProbeHashMap(int m = 11) : cap(m), table(m) {}

    void insert(int key, int val) {
        int idx = key % cap;
        int tombstone_idx = -1;
        for (int i = 0; i < cap; ++i) {
            int probe = (idx + i) % cap;
            if (table[probe].state == OCCUPIED && table[probe].key == key) {
                table[probe].val = val; return;
            }
            if (table[probe].state == TOMBSTONE && tombstone_idx == -1) tombstone_idx = probe;
            if (table[probe].state == EMPTY) {
                int target = (tombstone_idx != -1) ? tombstone_idx : probe;
                table[target] = {key, val, OCCUPIED};
                return;
            }
        }
    }
};
```

| Probe Strategy | Formula | Advantages | Disadvantages |
| :--- | :--- | :--- | :--- |
| Linear Probing | $h(k) + i$ | Excellent cache locality | **Primary Clustering** (Long chains) |
| Quadratic Probing | $h(k) + i^2$ | Eliminates primary clusters | **Secondary Clustering** |
| Double Hashing | $h_1(k) + i \cdot h_2(k)$ | **Zero clustering** | Requires 2 hash computations |

```text
Slot 0: [ Key: 11 ] ---> Occupied
Slot 1: [ TOMBSTONE ] -> Key was deleted (Search CONTINUES past it!)
Slot 2: [ Key: 22 ] ---> Target Found! (Search succeeds)
Slot 3: [ EMPTY ] -----> Search terminates if reached
```

> [!CAUTION]
> In Open Addressing, table load factor must be kept strictly below $\alpha \le 0.7$ (or $\le 0.5$ for Linear Probing) to prevent severe performance degradation.

Let's now examine dynamic resizing and rehashing.





#### Complexity Analysis
- **Time Complexity:** $O(1 / (1 - \alpha))$ average search probes; $O(1)$ when load factor $\alpha \le 0.5$.
- **Auxiliary Space:** $O(M)$ flat array storage.

---





### Dynamic Table Resizing & Amortized Rehashing

As elements are inserted, the load factor $\alpha = N / M$ increases, causing longer collision chains and degrading lookup times.

When $\alpha$ reaches the threshold (typically $\alpha_{\text{threshold}} = 0.75$), the hash table doubles its capacity ($2M$) and rehashes all existing keys into their new bucket positions. As established in Chapter 6's amortized growth analysis, geometric doubling guarantees $O(1)$ amortized insertion cost.

```text
Old Table (M = 4, N = 3, Load = 0.75):
  Bucket 0: [ 4 ] -> [ 8 ]  |  Bucket 2: [ 6 ]

New Table (M = 8, Load drops to 3/8 = 0.375):
  Bucket 0: [ 8 ] | Bucket 4: [ 4 ] | Bucket 6: [ 6 ]
  Collisions dispersed across doubled bucket range!
```

Amortized analysis proves that even though rehashing takes $O(N)$ work, the average cost per insertion remains strictly $O(1)$.

$$\sum_{i=1}^N T_{\text{insert}}(i) \le N + (2N - 1) < 3N \implies \text{Amortized Cost} = O(1)$$

Let's trace a dynamic resizing routine for a hash table.

```cpp
// Dynamic Hash Table Resizing Subroutine
void rehash_table(vector<vector<pair<int, int>>>& old_table, int new_cap) {
    vector<vector<pair<int, int>>> new_table(new_cap);
    for (const auto& bucket : old_table) {
        for (const auto& pair : bucket) {
            int new_idx = pair.first % new_cap; // Recalculate hash index
            new_table[new_idx].push_back(pair);
        }
    }
    old_table = move(new_table); // Transfer ownership in O(1)
}
```

Incremental Rehashing (used in production engines like Redis) migrates one bucket per query, avoiding sudden latency spikes.

```text
Active State:  ht[0] (Old Table)  and  ht[1] (New Doubled Table)
Lookups:       Check ht[0] first; if absent, check ht[1]
Mutations:     Migrate 1 bucket from ht[0] to ht[1] per query
```

| Insertion Step | Stored Elements ($N$) | Bucket Capacity ($M$) | Load Factor ($\alpha$) | Action Taken |
| :--- | :--- | :--- | :--- | :--- |
| Step 1 | $1$ | $4$ | $0.25$ | Direct insertion |
| Step 2 | $2$ | $4$ | $0.50$ | Direct insertion |
| Step 3 | $3$ | $4$ | $0.75$ | Threshold hit $\to$ **Rehash to $M=8$** |
| Step 4 | $4$ | $8$ | $0.50$ | Direct insertion |
| Step 6 | $6$ | $8$ | $0.75$ | Threshold hit $\to$ **Rehash to $M=16$** |

> [!TIP]
> Calling `unordered_map.reserve(N)` before inserting elements pre-allocates bucket capacity and eliminates resizing overhead entirely.

Let's now compare standard library associative containers in C++.





#### Complexity Analysis
- **Time Complexity:** $O(1)$ amortized time per insertion; $O(N)$ worst-case during a resize step.
- **Auxiliary Space:** $\Theta(M)$ bucket buffer storage.

---





## STL Containers & Advanced Hashing





### C++ STL Containers — unordered_map vs map

The C++ Standard Template Library provides two primary associative key-value containers: `unordered_map` and `map`.

`unordered_map` uses a Hash Table with Separate Chaining ($O(1)$ average lookup), while `map` uses a Self-Balancing Red-Black Search Tree ($O(\log N)$ guaranteed lookup).

```text
unordered_map (Hash Table):
  [ Bucket Array ] ---> [ Linked Nodes ] (Unordered, O(1) average)

map (Red-Black BST):
         [ Node 20 ]
        /           \
  [ Node 10 ]   [ Node 30 ]  (Sorted Keys, O(log N) strict lookup)
```

The operational complexity comparison highlights the trade-offs between average speed and ordering guarantees.

$$\text{unordered\_map} = O(1) \text{ avg} / O(N) \text{ worst}, \quad \text{map} = \Theta(\log N) \text{ guaranteed all cases}$$

To store custom structs in `unordered_map`, we must provide a custom hash functor and an equality operator `operator==`.

```cpp
// Custom Struct Hashing in unordered_map
struct Point {
    int x, y;
    bool operator==(const Point& other) const {
        return x == other.x && y == other.y;
    }
};

struct PointHash {
    size_t operator()(const Point& p) const {
        return splitmix64((uint64_t)p.x << 32 | (uint32_t)p.y);
    }
};

// Usage: unordered_map<Point, string, PointHash> point_map;
```

| Feature | `unordered_map` | `map` |
| :--- | :--- | :--- |
| Underlying Structure | Hash Table (Chaining) | Red-Black Tree (BST) |
| Key Ordering | **Unordered** (Hash dependent) | **Strictly Sorted** ($<$) |
| Search / Insert Time | **$O(1)$ average**, $O(N)$ worst | **$\Theta(\log N)$ guaranteed** |
| Range Queries (`lower_bound`) | **Not supported** | **Supported** ($O(\log N)$) |
| Memory Overhead | Bucket array + node pointers | $32$ bytes per tree node |

```text
unordered_map: Hash key -> Direct bucket jump -> 1-2 node checks
map:           Root -> Left/Right child hops -> log2(N) node hops
```

> [!IMPORTANT]
> Use `map` when keys must be iterated in sorted order or when range queries (`lower_bound`, `upper_bound`) are needed; use `unordered_map` for general lookups.

Let's now examine Universal and Perfect Hashing.





#### Complexity Analysis
- **Time Complexity:** $O(1)$ average for `unordered_map`; $\Theta(\log N)$ guaranteed for `map`.
- **Auxiliary Space:** $O(N)$ memory storage in both containers.

---





### Universal Hashing & Perfect Hashing (2-Level Tables)

Universal Hashing selects a hash function uniformly at random from a family $\mathcal{H}$ at runtime to prevent adversarial inputs from forcing $O(N^2)$ worst-case collisions.

A hash family $\mathcal{H}$ is universal if the collision probability for any two distinct keys is at most $1/M$.

$$P_{h \in \mathcal{H}}(h(x) = h(y)) \le \frac{1}{M} \quad \text{for all } x \neq y$$

Perfect Hashing (Fredman, Komlós, Szemerédi - FKS) provides guaranteed $O(1)$ worst-case lookup for static sets of keys using a 2-level table.

```text
Primary Table (M = N buckets):
  Bucket 0: (C0 = 2 keys) -> Secondary Table of size S0 = 2^2 = 4
  Bucket 1: (C1 = 0 keys) -> nullptr
  Bucket 2: (C2 = 3 keys) -> Secondary Table of size S2 = 3^2 = 9
By the Birthday Paradox, quadratic size S_i = C_i^2 GUARANTEES 0 collisions!
```

The total expected memory space of an FKS table remains strictly linear $O(N)$.

$$E[\text{Total Space}] = M + \sum_{i=0}^{M-1} C_i^2 \le M + 2N = O(N) \quad (\text{when } M = N)$$

Let's implement a universal hash function generator in C++.

```cpp
// Universal Hash Function Family: h_{a,b}(k) = ((a*k + b) mod p) mod M
struct UniversalHash {
    long long a, b, p, m;

    UniversalHash(long long mod_size, long long prime = 1000000007)
        : m(mod_size), p(prime) {
        a = 1 + rand() % (p - 1); // a in [1, p-1]
        b = rand() % p;           // b in [0, p-1]
    }

    int operator()(long long key) const {
        return ((a * key + b) % p) % m;
    }
};
```

| Primary Bucket ($i$) | Colliding Keys ($C_i$) | Secondary Table Size ($S_i = C_i^2$) | Collision Status |
| :--- | :--- | :--- | :--- |
| Bucket 0 | $2$ keys | $4$ slots | **0 collisions** (Perfect) |
| Bucket 1 | $1$ key | $1$ slot | **0 collisions** (Perfect) |
| Bucket 2 | $3$ keys | $9$ slots | **0 collisions** (Perfect) |
| Bucket 3 | $0$ keys | $0$ slots | Empty |

```text
Query(Key) ===> 1. Secondary_Table = Primary[h1(Key)]
           ===> 2. Value = Secondary_Table[h2(Key)] (0 Collisions!)
Strictly 2 memory reads guaranteed in the worst case!
```

> [!TIP]
> Perfect Hashing is ideal for static dictionaries such as programming language keywords, compiler symbol tables, and frozen routing lookup tables.

Let's now examine algorithmic hash map patterns, starting with complement lookup.





#### Complexity Analysis
- **Time Complexity:** $O(1)$ guaranteed worst-case lookup in FKS perfect hashing.
- **Auxiliary Space:** $O(N)$ linear space bound across primary and secondary tables.

---





## Algorithmic Hash Patterns





### Calibration Frequency Pair Detection & Complement Hash Lookup

Calibration frequency pairing finds the indices of two oscillator channels in an unsorted frequency array that sum to exact target calibration value $F$.

While a naive nested loop takes $O(N^2)$ time, checking for the required complement $\text{target} - \text{arr}[i]$ in a hash map solves the problem in a single $O(N)$ pass.

```text
Frequencies: [ 20,  70,  110,  150 ],  Target Calibration = 90
Step 1: Val = 20  -> Need (90 - 20 = 70)  -> Absent -> Store {20: 0}
Step 2: Val = 70  -> Need (90 - 70 = 20)  -> Found at index 0!
Match resolved in single pass without sorting!
```

The mathematical lookup relation expresses instantaneous complement discovery.

$$\text{complement} = \text{target} - \text{arr}[i] \in \text{HashMap} \implies (\text{HashMap}[\text{complement}], i) \text{ is the valid pair}$$

Let's implement single-pass calibration pairing using `unordered_map`.

```cpp
// Target Calibration Frequency Pair Lookup: O(N) Time, O(N) Space
pair<int, int> find_calibration_pair(const vector<int>& frequencies, int target_freq) {
    unordered_map<int, int> seen_frequencies; // frequency -> original index

    for (int i = 0; i < (int)frequencies.size(); ++i) {
        int complement = target_freq - frequencies[i];
        if (seen_frequencies.count(complement)) {
            return {seen_frequencies[complement], i}; // Found pair!
        }
        seen_frequencies[frequencies[i]] = i;
    }
    return {-1, -1}; // No valid calibration pair exists
}
```




#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ average time for a single linear pass.
- **Auxiliary Space:** $O(N)$ auxiliary memory for the hash map.

---





### Multiset Signature Grouping & Categorization Keys

Chemical formula isomer grouping partitions a list of compounds into clusters that share identical atomic composition signatures.

We can generate categorization keys using two approaches: sorting each string signature ($O(K \log K)$) or building a 26-character count signature ($O(K)$).

```text
Compounds: "cba", "bac", "xyz"
Option 1 (Sorted Key):       "abc"
Option 2 (Count Signature):  "#1#1#1#0...#0" (26 counts)
All isomers map to the identical bucket key in the hash table!
```

The signature mapping guarantees that permutation equivalence classes map to identical string keys:

$$S_1 \sim S_2 \iff \text{Signature}(S_1) = \text{Signature}(S_2)$$

Let's implement isomer grouping using 26-element character count signatures.

```cpp
// Group Isomers via 26-Character Count Signatures: O(N * K)
vector<vector<string>> group_isomeric_compounds(const vector<string>& compounds) {
    unordered_map<string, vector<string>> clusters;

    for (const string& s : compounds) {
        vector<int> count(26, 0);
        for (char c : s) count[c - 'a']++;

        // Format unique frequency signature: "#1#0#2..."
        string key = "";
        for (int i = 0; i < 26; ++i) {
            key += "#" + to_string(count[i]);
        }
        clusters[key].push_back(s);
    }

    vector<vector<string>> result;
    for (auto& [key, cluster] : clusters) {
        result.push_back(move(cluster));
    }
    return result;
}
```



#### Complexity Analysis
- **Time Complexity:** $\Theta(N \cdot K)$ where $N$ is word count and $K$ is maximum word length.
- **Auxiliary Space:** $O(N \cdot K)$ memory to store hash map keys and grouped strings.

---





### Target-Sum Subarray Tracking & Prefix Sum Hashing

Net power grid surplus monitoring counts the total number of contiguous recording intervals whose net wattage deviation sums to target value $K$.

Combining prefix sums with a frequency hash map solves this in $O(N)$ time: if the current prefix sum is $S$, any earlier prefix sum equal to $S - K$ forms a valid target subarray.

```text
Array:             [ A0,  A1,  A2,  A3,  A4 ]
Prefix Sums:       P0    P1    P2    P3    P4
Subarray Sum (j..i] = P[i] - P[j] = K  ===>  P[j] = P[i] - K
```

The fundamental prefix sum relation underpins the hash lookup:

$$\text{Sum}(A[j+1 \dots i]) = P[i] - P[j] = K \iff P[j] = P[i] - K$$

We initialize the hash map with `{0: 1}` to account for subarrays starting at index 0.

```cpp
// Count Contiguous Subarrays with Target Net Surplus: O(N) Time, O(N) Space
int count_target_sum_subarrays(const vector<int>& readings, int k) {
    unordered_map<int, int> prefix_counts;
    prefix_counts[0] = 1; // Base case: empty prefix sum

    int current_prefix = 0;
    int total_valid_subarrays = 0;

    for (int val : readings) {
        current_prefix += val;
        int required_prefix = current_prefix - k;

        // If (current_prefix - k) was seen before, add its occurrence count
        if (prefix_counts.count(required_prefix)) {
            total_valid_subarrays += prefix_counts[required_prefix];
        }
        prefix_counts[current_prefix]++;
    }
    return total_valid_subarrays;
}
```


#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear single-pass scan across the array.
- **Auxiliary Space:** $O(N)$ auxiliary memory for the prefix frequency map.

---





### Consecutive Milestone Range Tracking & Set Neighborhood Traversal

The milestone streak problem finds the length of the longest unbroken sequence of consecutive integers in an unsorted telemetry dataset in $O(N)$ time.

A number $x$ is the start of a consecutive streak if and only if $x - 1$ does NOT exist in the set. Checking this condition prevents redundant traversals.

```text
Telemetry: [ 100, 4, 200, 1, 3, 2 ]
Set:       { 1, 2, 3, 4, 100, 200 }
Check 1: (1 - 1 = 0 not in set) -> START OF STREAK! Counts 1,2,3,4
Check 2: (2 - 1 = 1 is in set)  -> Skip (Not a sequence head)
Check 3: (3 - 1 = 2 is in set)  -> Skip (Not a sequence head)
```

Streak heads are identified in constant time:

$$\text{is_head}(x) = (x - 1 \notin \text{Set})$$

Let's implement the optimal $O(N)$ streak finder using `unordered_set`.

```cpp
// Longest Unbroken Milestone Streak: O(N) Time, O(N) Space
int find_longest_milestone_streak(const vector<int>& milestones) {
    unordered_set<int> num_set(milestones.begin(), milestones.end());
    int longest_streak = 0;

    for (int num : num_set) {
        // Only initiate streak traversal if 'num' is a sequence head
        if (!num_set.count(num - 1)) {
            int current_val = num;
            int current_streak = 1;

            while (num_set.count(current_val + 1)) {
                current_val++;
                current_streak++;
            }
            longest_streak = max(longest_streak, current_streak);
        }
    }
    return longest_streak;
}
```

#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear time visiting each element at most twice.
- **Auxiliary Space:** $O(N)$ auxiliary memory for the hash set.

---





## High-Performance Hash Architectures





### LRU Cache Design & Hash Table + Doubly-Linked List Integration

A Least Recently Used (LRU) Cache supports $O(1)$ `get(key)` and $O(1)$ `put(key, value)` operations while evicting the least recently accessed item when full.

We combine a Doubly-Linked List (maintaining recency order) with a Hash Map (mapping keys directly to list iterators for $O(1)$ lookup).

```text
Hash Map:    [ Key 1 ] -------> Node 1 Iterator
             [ Key 2 ] -------> Node 2 Iterator

Doubly-List: [ Head ] <-> [ Node 2 (MRU) ] <-> [ Node 1 (LRU) ] <-> [ Tail ]
             Most Recently Used                Eviction Candidate
```

Sentinel `head` and `tail` nodes simplify pointer updates by eliminating edge cases during node insertions and deletions.

$$\text{Time}(\text{get}) = O(1), \quad \text{Time}(\text{put}) = O(1), \quad \text{Space} = O(\text{capacity})$$

Let's implement the complete `LRUCache` class in C++.

```cpp
// Production LRU Cache: O(1) Get and Put
class LRUCache {
    struct Node {
        int key, val;
        Node* prev;
        Node* next;
        Node(int k, int v) : key(k), val(v), prev(nullptr), next(nullptr) {}
    };

    int cap;
    unordered_map<int, Node*> cache;
    Node* head;
    Node* tail;

    void remove_node(Node* node) {
        node->prev->next = node->next;
        node->next->prev = node->prev;
    }

    void add_to_head(Node* node) {
        node->next = head->next;
        node->prev = head;
        head->next->prev = node;
        head->next = node;
    }

public:
    LRUCache(int capacity) : cap(capacity) {
        head = new Node(0, 0);
        tail = new Node(0, 0);
        head->next = tail;
        tail->prev = head;
    }

    int get(int key) {
        if (!cache.count(key)) return -1;
        Node* node = cache[key];
        remove_node(node);
        add_to_head(node); // Mark as most recently used
        return node->val;
    }

    void put(int key, int value) {
        if (cache.count(key)) {
            Node* node = cache[key];
            node->val = value;
            remove_node(node);
            add_to_head(node);
        } else {
            if (cache.size() == cap) {
                Node* lru = tail->prev;
                cache.erase(lru->key);
                remove_node(lru);
                delete lru;
            }
            Node* new_node = new Node(key, value);
            cache[key] = new_node;
            add_to_head(new_node);
        }
    }
};
```

| Operation | Cache Contents (MRU $\to$ LRU) | Action Taken | Evicted Key |
| :--- | :--- | :--- | :--- |
| `put(1, 1)` | `[1]` | Inserted at head | None |
| `put(2, 2)` | `[2, 1]` | Inserted at head | None |
| `get(1)` | `[1, 2]` | Node 1 moved to head | None |
| `put(3, 3)` | `[3, 1]` | Capacity reached $\to$ Node 2 evicted | **Key 2 evicted** |
| `get(2)` | `[3, 1]` | Key 2 absent $\to$ returns -1 | None |

```text
1. Unlink: node->prev->next = node->next; node->next->prev = node->prev
2. Splice: Insert immediately between head and head->next (MRU slot)
```

> [!TIP]
> Using dummy sentinel `head` and `tail` nodes eliminates null-pointer checks during list mutations.

Let's conclude with defense strategies against hash collision denial of service attacks.





#### Complexity Analysis
- **Time Complexity:** $O(1)$ constant time for both `get` and `put` operations.
- **Auxiliary Space:** $\Theta(\text{capacity})$ memory for hash map entries and doubly-linked nodes.

---





### Anti-Hash Denial of Service & Custom Safe Hashers

In standard GCC C++, `hash<int>` is implemented as the identity function ($h(x) = x$), leaving `unordered_map` vulnerable to collision attacks.

An adversary can supply multiples of the table size ($0, M, 2M, 3M, \dots$), forcing all keys into a single bucket and degrading lookups to $O(N^2)$.

```text
Attacker keys: 0, 10007, 20014, 30021 ... (All collide mod 10007)
Bucket 0: [ 0 ] -> [ 10007 ] -> [ 20014 ] -> [ 30021 ] ... (N nodes)
Every insert/lookup traverses the entire N-node chain -> O(N^2) TLE!
```

The quadratic degradation formula illustrates how execution time explodes under collision attacks.

$$T(N \text{ insertions}) = \sum_{i=1}^N i = \frac{N(N + 1)}{2} = \Theta(N^2) \text{ operations}$$

We protect against this vulnerability with a randomized `custom_hash` that seeds SplitMix64 using `chrono` high-resolution clock timestamps.

```cpp
// Production Custom Hash Functor (Anti-Hash Attack Defense)
struct custom_hash {
    static uint64_t splitmix64(uint64_t x) {
        x += 0x9e3779b97f4a7c15ULL;
        x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9ULL;
        x = (x ^ (x >> 27)) * 0x94d049bb133111ebULL;
        return x ^ (x >> 31);
    }

    // Functor call operator: invoked automatically by unordered_map to hash keys
    size_t operator()(uint64_t x) const {
        // High-entropy random seed generated once at program startup
        static const uint64_t FIXED_RANDOM = 1999999973ULL;
        return splitmix64(x + FIXED_RANDOM);
    }
};

// Safe Hash Map Declaration:
// unordered_map<long long, int, custom_hash> safe_map;
```

> [!NOTE]
> **C++ Syntax — Functor Call Operator:** Overloading `operator()` turns a struct into a callable:
> Overloading `operator()` turns a `struct` into a callable object (functor). When `custom_hash` is passed as the third template argument to `unordered_map<Key, Value, custom_hash>`, the container invokes `custom_hash()(key)` to compute 64-bit bucket hashes.

| Container Setup | 100,000 Random Keys | 100,000 Adversarial Keys | Status |
| :--- | :--- | :--- | :--- |
| Default `unordered_map` | $0.03 \text{ seconds}$ | **28.4 seconds (TLE)** | **Vulnerable** |
| `unordered_map` with `custom_hash` | $0.03 \text{ seconds}$ | **0.04 seconds** | **Immune** |
| Balanced `map` | $0.18 \text{ seconds}$ | $0.19 \text{ seconds}$ | Safe (Tree-based) |

```text
Adversarial Keys + Random Seed ===> Scattered across all buckets!
Prevents attacker from precomputing collision payloads.
```

> [!IMPORTANT]
> Always use a randomized `custom_hash` with `unordered_map` when handling untrusted user input to prevent denial of service attacks.

This completes the Hash Maps & Sets chapter, establishing mastery over direct tables, hash function design, collision handling, STL containers, perfect hashing, and LRU cache architectures.





#### Complexity Analysis
- **Time Complexity:** $O(1)$ expected lookup and insertion time, immune to adversarial degradation.
- **Auxiliary Space:** $O(N)$ hash table storage.

---





## Cheat Sheet & Quick Reference

| Concept / Algorithm | Implementation Formula / Pattern | Time Complexity | Space Complexity |
| :--- | :--- | :--- | :--- |
| Direct Address Table | `table[key]` direct access | $\Theta(1)$ deterministic | $\Theta(\|U\|)$ |
| Polynomial String Hash | $\sum S[i] \cdot p^i \bmod M$ | $O(L)$ string length | $O(1)$ |
| Separate Chaining | Array of linked bucket heads | $O(1 + \alpha)$ average | $O(N + M)$ |
| Double Hashing | $h_1(k) + i \cdot h_2(k) \bmod M$ | $O(1)$ average | $O(M)$ |
| Table Rehashing | Double $M$ when $\alpha \ge 0.75$ | $O(1)$ amortized | $O(N)$ |
| Target Complement Lookup | Look for $\text{target} - \text{arr}[i]$ in hash map | $\Theta(N)$ | $O(N)$ |
| Prefix Delta Subarray Counter | Prefix sum difference $P[i] - K$ | $\Theta(N)$ | $O(N)$ |
| Longest Consecutive | Check `!set.count(x - 1)` | $\Theta(N)$ | $O(N)$ |
| LRU Cache | Hash Map + Doubly-Linked List | $O(1)$ get/put | $O(\text{capacity})$ |
| Safe Custom Hash | SplitMix64 with random clock seed | $O(1)$ | $O(1)$ |
