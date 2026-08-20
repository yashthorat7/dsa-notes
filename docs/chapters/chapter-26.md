# Chapter 26: Tries & Prefix Trees

---

## Standard Trie Architecture & Operations

### Trie Architecture — Node Alphabets & Prefix Branch Invariants

Let's stand at the whiteboard and construct a Trie (Prefix Tree): an ordered tree structure that shares common character prefixes across an entire dictionary of words.

Each trie node contains a fixed array of 26 child pointers `TrieNode* children[26]` paired with a boolean terminal flag `bool isEndOfWord` indicating a completed word.

```text
Words inserted: "cat", "car", "cart", "dog"

(Root)
  |-- 'c' --> (c) -- 'a' --> (a) -- 't' --> (t)* ("cat")
                              |
                              \-- 'r' --> (r)* ("car")
                                            \-- 't' --> (t)* ("cart")
  |-- 'd' --> (d) -- 'o' --> (o) -- 'g' --> (g)* ("dog")
Prefix "ca" is stored ONCE and shared across "cat", "car", and "cart"!
```

Inserting, searching, or prefix-matching a string of length $L$ takes strictly $O(L)$ time, independent of total words in the dictionary.

$$\text{Insert}(W) = O(|W|), \quad \text{Search}(W) = O(|W|), \quad \text{StartsWith}(P) = O(|P|)$$

Let's implement the `Trie` class in C++.

```cpp
// Standard Trie Implementation: O(L) Search & Insert
struct TrieNode {
    TrieNode* children[26];
    bool is_end_of_word;
    TrieNode() : is_end_of_word(false) {
        for (int i = 0; i < 26; ++i) children[i] = nullptr;
    }
    ~TrieNode() {
        for (int i = 0; i < 26; ++i) delete children[i]; // Recursive memory cleanup
    }
};

class Trie {
    TrieNode* root;
public:
    Trie() : root(new TrieNode()) {}
    ~Trie() { delete root; }

    void insert(const string& word) {
        TrieNode* curr = root;
        for (char c : word) {
            int idx = c - 'a';
            if (!curr->children[idx]) {
                curr->children[idx] = new TrieNode();
            }
            curr = curr->children[idx];
        }
        curr->is_end_of_word = true;
    }

    bool search(const string& word) const {
        TrieNode* curr = root;
        for (char c : word) {
            int idx = c - 'a';
            if (!curr->children[idx]) return false;
            curr = curr->children[idx];
        }
        return curr && curr->is_end_of_word;
    }

    bool starts_with(const string& prefix) const {
        TrieNode* curr = root;
        for (char c : prefix) {
            int idx = c - 'a';
            if (!curr->children[idx]) return false;
            curr = curr->children[idx];
        }
        return curr != nullptr;
    }
};
```

| Word Inserted | Characters Processed | Nodes Reused | New Nodes Allocated | Terminal Set |
| :--- | :--- | :--- | :--- | :--- |
| `"cat"` | `'c', 'a', 't'` | None | $3$ nodes (`c, a, t`) | `t->is_end = true` |
| `"car"` | `'c', 'a', 'r'` | `c, a` (Reused!) | $1$ node (`r`) | `r->is_end = true` |
| `"cart"` | `'c', 'a', 'r', 't'` | `c, a, r` (Reused!) | $1$ node (`t`) | `t->is_end = true` |

```text
Query starts_with("car"):
1. Root -> Follow 'c' edge (Valid)
2. 'c'  -> Follow 'a' edge (Valid)
3. 'a'  -> Follow 'r' edge (Valid) ===> Returns true!
```

> [!WARNING]
> Tries allocate deeply nested heap node objects. Always implement a recursive destructor or use memory pool arenas to deallocate nodes and prevent memory leaks.

Let's now examine wildcard pattern matching and multi-branch backtracking.

#### Complexity Analysis
- **Time Complexity:** $O(L)$ for insert, search, and prefix matching on word length $L$.
- **Auxiliary Space:** $O(N \cdot L \cdot 26)$ memory storing node pointer tables.

---

## Search Applications & Autocomplete

### Wildcard Pattern Matching & Multi-Branch Backtracking

The Word Dictionary problem requires searching for strings containing exact characters as well as wildcard dot `'.'` symbols that match any character from `'a'` to `'z'`.

When encountering a `'.'`, the search branches recursively into all 26 non-null child nodes, returning `true` if any sub-branch finds a valid terminal word.

```text
Pattern Query: "b.d"
Root -> Follow 'b'
         |
         +-- '.' matches 'a' -> 'a' -> 'd'* ("bad" -> MATCH!)
         +-- '.' matches 'e' -> 'e' -> 'd'* ("bed" -> MATCH!)
         +-- '.' matches 'i' -> 'i' -> 'r'  ("bird" -> Fail)
```

While regular search runs in $O(L)$ time, a query consisting entirely of wildcard dots branches exponentially in the worst case.

$$\text{Exact Search} = O(L), \quad \text{Worst-Case Dot Wildcard } T(L) = 26 \cdot T(L-1) = O(26^L)$$

Let's implement the `WordDictionary` class in C++.

```cpp
// Wildcard Word Dictionary: Supports '.' matching any character
class WordDictionary {
    TrieNode* root;

    bool dfs_search(const string& word, int idx, TrieNode* curr) {
        if (!curr) return false;
        if (idx == word.size()) return curr->is_end_of_word;

        char c = word[idx];
        if (c != '.') {
            int ch_idx = c - 'a';
            return dfs_search(word, idx + 1, curr->children[ch_idx]);
        }

        // Wildcard '.': Branch into all existing non-null children
        for (int i = 0; i < 26; ++i) {
            if (curr->children[i] && dfs_search(word, idx + 1, curr->children[i])) {
                return true;
            }
        }
        return false;
    }
public:
    WordDictionary() : root(new TrieNode()) {}
    void add_word(const string& word) {
        TrieNode* curr = root;
        for (char c : word) {
            int idx = c - 'a';
            if (!curr->children[idx]) curr->children[idx] = new TrieNode();
            curr = curr->children[idx];
        }
        curr->is_end_of_word = true;
    }
    bool search(const string& word) {
        return dfs_search(word, 0, root);
    }
};
```

| Query Token | Character Evaluated | Action Taken | Result |
| :--- | :--- | :--- | :--- |
| `"bad"` | `'b', 'a', 'd'` | Direct path traversal | `true` |
| `".ad"` | `'.'` | Branch into 26 children | `true` (via `'b'`) |
| `"b.."` | `'b'`, `'.'`, `'.'` | Double multi-branch | `true` (matches `"bad"`, `"bed"`) |

```text
Searching on a Boggle Board:
If current grid letter path hits nullptr in Trie:
Prune the 2D DFS search immediately! Avoids millions of dead paths.
```

> [!TIP]
> In 2D grid Word Search II, pruning the DFS search the moment `curr->children[grid[r][c] - 'a'] == nullptr` accelerates execution by over $100\times$.

Let's now examine autocomplete engines and top-K suggestion caching.

#### Complexity Analysis
- **Time Complexity:** $O(L)$ for exact search; $O(26^L)$ worst-case for strings of all dots.
- **Auxiliary Space:** $O(L)$ recursion call stack memory.

---

### Autocomplete Systems & Subtree Prefix Aggregations

An Autocomplete Engine provides search suggestions in real time as a user types characters one by one.

To answer autocomplete queries with low latency, each node in the Trie can cache its Top-$K$ most popular completed words directly on the node.

```text
Prefix Node "app":
Cached Top 3: [ ("apple", 100), ("app", 85), ("application", 40) ]

When user types "app", return cached vector directly in O(|P|) time
without executing expensive subtree DFS scans!
```

Node caching reduces live query latency to $O(|P|)$ time, where $|P|$ is the length of the typed prefix.

$$\text{Query Time with Top-K Caching} = O(|P|) \ll O(|P| + |\text{Subtree}|)$$

Let's implement a prefix autocomplete collector that gathers matching words from descendant subtrees.

```cpp
// Autocomplete Subtree Collector: O(|P| + Subtree Size)
void collect_words(TrieNode* curr, string current_word, vector<string>& results) {
    if (!curr) return;
    if (curr->is_end_of_word) {
        results.push_back(current_word);
    }

    for (int i = 0; i < 26; ++i) {
        if (curr->children[i]) {
            collect_words(curr->children[i], current_word + char('a' + i), results);
        }
    }
}

vector<string> get_autocomplete_suggestions(TrieNode* root, const string& prefix) {
    TrieNode* curr = root;
    for (char c : prefix) {
        int idx = c - 'a';
        if (!curr->children[idx]) return {}; // Prefix not in trie
        curr = curr->children[idx];
    }

    vector<string> suggestions;
    collect_words(curr, prefix, suggestions);
    return suggestions;
}
```

| Typed Prefix $P$ | Prefix Node Located | Subtree Words Gathered | Output Suggestions |
| :--- | :--- | :--- | :--- |
| `"ca"` | Node `(a)` below `(c)` | `"cat"`, `"car"`, `"cart"` | `["car", "cart", "cat"]` |
| `"do"` | Node `(o)` below `(d)` | `"dog"`, `"door"` | `["dog", "door"]` |
| `"z"` | `nullptr` | None | `[]` |

```text
User types 'c'   -> Suggestions: ["cat", "car", "code", "cow"]
User types 'a'   -> Suggestions: ["cat", "car", "cart"]
User types 'r'   -> Suggestions: ["car", "cart"]
Traversal follows 1 edge per keystroke in O(1) interactive response!
```

> [!IMPORTANT]
> In large-scale production autocomplete engines, cache top-$K$ recommendations directly on each node during offline updates to eliminate live subtree traversal overhead.

Let's now shift from text alphabets to bitwise binary tries.

#### Complexity Analysis
- **Time Complexity:** $O(|P| + \text{Subtree})$ for un-cached DFS; $O(|P|)$ with top-K node caching.
- **Auxiliary Space:** $O(\text{Subtree Height})$ recursion stack memory.

---

## Bitwise Tries & XOR Optimization

### Binary (Bitwise) Tries & Fixed-Width Bit Splitting

A Bitwise (Binary) Trie is a specialized trie of fixed depth 32 (or 64) where each node has at most two children representing bit `0` and bit `1`.

Integers are inserted bit by bit starting from the Most Significant Bit (MSB, bit 31) down to the Least Significant Bit (LSB, bit 0).

```text
Number 5 in binary (32-bit): ...00000101
Bit 31 down to 3: Branch Left (Bit 0)
Bit 2 (Val 1)   : Branch Right (Bit 1)
Bit 1 (Val 0)   : Branch Left (Bit 0)
Bit 0 (Val 1)   : Branch Right (Bit 1)
Every number is encoded as a fixed-length root-to-leaf path!
```

Because depth is fixed at 32, insertion and query operations run in deterministic $O(32) = O(1)$ constant time.

$$|\Sigma| = 2, \quad \text{Depth} = 32 \implies \text{Insert and Query take exactly 32 steps } = O(1)$$

Let's write the `BitwiseTrie` class in C++.

```cpp
// Bitwise Binary Trie: Fixed 32-Bit Integer Traversal
struct BitNode {
    BitNode* children[2];
    BitNode() { children[0] = children[1] = nullptr; }
};

class BitwiseTrie {
    BitNode* root;
public:
    BitwiseTrie() : root(new BitNode()) {}

    void insert(int num) {
        BitNode* curr = root;
        for (int i = 31; i >= 0; --i) {
            int bit = (num >> i) & 1;
            if (!curr->children[bit]) {
                curr->children[bit] = new BitNode();
            }
            curr = curr->children[bit];
        }
    }

    bool contains(int num) const {
        BitNode* curr = root;
        for (int i = 31; i >= 0; --i) {
            int bit = (num >> i) & 1;
            if (!curr->children[bit]) return false;
            curr = curr->children[bit];
        }
        return true;
    }
};
```

| Integer | 3-Bit Expansion | Bit 2 (MSB) | Bit 1 | Bit 0 (LSB) | Traversed Path |
| :--- | :--- | :--- | :--- | :--- | :--- |
| $3$ | `0b011` | `0` (Left) | `1` (Right) | `1` (Right) | `0 -> 1 -> 1` |
| $5$ | `0b101` | `1` (Right) | `0` (Left) | `1` (Right) | `1 -> 0 -> 1` |
| $6$ | `0b110` | `1` (Right) | `1` (Right) | `0` (Left) | `1 -> 1 -> 0` |

```text
     (Root)
    /      \
  0          1
 / \        / \
0   1      0   1
```

> [!CAUTION]
> Always extract the $i$-th bit using `(num >> i) & 1`. Multiplying powers of two can trigger integer overflow on signed 32-bit integers.

Let's now study maximum XOR queries using greedy opposite-bit matching.

#### Complexity Analysis
- **Time Complexity:** $\Theta(32) = O(1)$ per integer insertion and query.
- **Auxiliary Space:** $O(32 \cdot N)$ memory storing bit nodes.

---

### Maximum XOR Queries & Greedy Opposite-Bit Path Traversal

Finding two numbers $a, b \in \text{nums}$ that maximize $a \oplus b$ in $O(N)$ time uses a Bitwise Trie with greedy opposite-bit matching.

At each bit position $i$ (from 31 down to 0), if current bit is $b$, we greedily branch toward opposite bit $1 - b$ to set the $i$-th bit of the XOR result to $1$.

```text
Query number has bit = 0:
- If child[1] exists -> Branch right! XOR gets bit 1 (Optimal!)
- If child[1] is null -> Must branch left to child[0] -> XOR gets 0
Setting high-order bits to 1 strictly dominates all lower-order bits!
```

The greedy invariant holds because a single high-order bit $2^k$ is strictly greater than the sum of all lower bits.

$$2^k > \sum_{i=0}^{k-1} 2^i = 2^k - 1 \implies \text{Greedy choice at bit } k \text{ is strictly optimal}$$

Let's implement the complete Maximum XOR solver in C++.

```cpp
// Maximum XOR of Two Numbers in Array: O(32 * N) = O(N) Time
class MaxXORFinder {
    BitNode* root;
public:
    MaxXORFinder() : root(new BitNode()) {}

    void insert(int num) {
        BitNode* curr = root;
        for (int i = 31; i >= 0; --i) {
            int bit = (num >> i) & 1;
            if (!curr->children[bit]) curr->children[bit] = new BitNode();
            curr = curr->children[bit];
        }
    }

    int get_max_xor(int num) {
        BitNode* curr = root;
        int max_xor = 0;

        for (int i = 31; i >= 0; --i) {
            int bit = (num >> i) & 1;
            int opposite_bit = 1 - bit;

            // Greedily choose opposite bit if available
            if (curr->children[opposite_bit]) {
                max_xor |= (1 << i);
                curr = curr->children[opposite_bit];
            } else {
                curr = curr->children[bit];
            }
        }
        return max_xor;
    }
};

int find_maximum_xor(vector<int>& nums) {
    MaxXORFinder trie;
    for (int n : nums) trie.insert(n);

    int max_result = 0;
    for (int n : nums) {
        max_result = max(max_result, trie.get_max_xor(n));
    }
    return max_result;
}
```

| Query Number $X$ | Bit $i$ of $X$ | Preferred Opposite Bit | Branch Taken | Bit Added to Result |
| :--- | :--- | :--- | :--- | :--- |
| `3` (`0b011`) | Bit 2 (`0`) | `1` | `1` (Available!) | $+2^2 = +4$ |
| `3` (`0b011`) | Bit 1 (`1`) | `0` | `0` (Available!) | $+2^1 = +2$ |
| `3` (`0b011`) | Bit 0 (`1`) | `0` | `1` (Forced) | $+0$ |
| Result | - | - | - | **Max XOR = 6** (`0b110`) |

```text
Number 3 (011) paired with Number 5 (101):
011 XOR 101 = 110 (Value 6)
Computed in 32 pointer steps without checking all N^2 pairs!
```

> [!TIP]
> For Maximum XOR with an upper bound constraint $M$, sort queries by $M_i$ and insert elements monotonically into the Bitwise Trie in a single $O((N + Q) \log N)$ sweep.

This completes the Tries and Prefix Trees chapter, covering standard trie layouts, wildcard backtracking, autocomplete engines, bitwise tries, and greedy XOR optimizations.

#### Complexity Analysis
- **Time Complexity:** $\Theta(32 \cdot N) = O(N)$ linear time.
- **Auxiliary Space:** $O(32 \cdot N)$ memory storing bitwise trie nodes.

---

## Cheat Sheet & Quick Reference

| Trie Technique | Alphabet | Core Operation / Mechanism | Complexity |
| :--- | :--- | :--- | :--- |
| **Standard Text Trie** | 26 lowercase | `children[26]` + `isEndOfWord` | $O(L)$ search/insert |
| **Wildcard Matching** | 26 + `'.'` | Branch into all 26 children on `'.'` | $O(L)$ avg / $O(26^L)$ worst |
| **Autocomplete Engine** | 26 lowercase | Node caching top-K suggestions | $O(|P|)$ query time |
| **Bitwise Binary Trie** | 2 bits (`0, 1`) | Fixed-depth 32 MSB $\to$ LSB tree | $O(32) = O(1)$ per op |
| **Maximum XOR Query** | 2 bits (`0, 1`) | Greedily branch to opposite bit $1-b$ | $\Theta(32 \cdot N) = O(N)$ |
