# Chapter 15: String Matching Algorithms

---

## Basic String Search

### Naive String Matching & Distinct-Character Skip Optimization

Let's stand at the whiteboard and slide a pattern $P$ of length $M$ across text $T$ of length $N$ to introduce exact substring matching.

The brute-force naive approach aligns $P$ at every text position $i$, comparing characters until finding a match or a mismatch.

```text
Text T:    [ A, A, A, A, A, A, A, A, A, B ]    (Length N = 10)
Shift 0:   [ A, A, A, A, B ]  -> Mismatch at index 4 (4 comparisons)
Shift 1:      [ A, A, A, A, B ]  -> Mismatch at index 5 (4 comps)
Total Comparisons in Worst-Case = (N - M + 1) * M = 6 * 5 = 30 ops!
```

When text and pattern contain repetitive prefixes, the naive scan degrades to quadratic time.

$$\text{Worst-Case Complexity} = (N - M + 1) \cdot M = \Theta(N \cdot M)$$

Let's inspect the naive search implementation alongside the distinct-character skip optimization.

```cpp
// Naive String Matching: O(N * M) Worst Case
vector<int> search_naive(const string& text, const string& pattern) {
    int n = text.size(), m = pattern.size();
    vector<int> matches;

    for (int i = 0; i <= n - m; ++i) {
        int j = 0;
        while (j < m && text[i + j] == pattern[j]) {
            j++;
        }
        if (j == m) matches.push_back(i); // Full pattern matched
    }
    return matches;
}

// Distinct-Character Fast Skip Search: O(N) Time, O(1) Space
vector<int> search_distinct_pattern(const string& text, const string& pattern) {
    int n = text.size(), m = pattern.size();
    vector<int> matches;
    int i = 0;

    while (i <= n - m) {
        int j = 0;
        while (j < m && text[i + j] == pattern[j]) j++;
        if (j == m) {
            matches.push_back(i);
            i += m; // Jump forward by full pattern length
        } else if (j == 0) {
            i += 1;
        } else {
            i += j; // Skip all j matched characters (all distinct!)
        }
    }
    return matches;
}
```

| Shift Step | Text Window Examined | Pattern Alignment | Shift Distance (Naive vs Distinct) |
| :--- | :--- | :--- | :--- |
| Step 1 | `"ABCDEF"` | `"ABCDX"` | Mismatch at 4 $\to$ Naive: $+1$, Distinct: $+4$ |
| Step 2 | `"EFGHIJ"` | `"ABCDX"` | Mismatch at 0 $\to$ Naive: $+1$, Distinct: $+1$ |

```text
Text:    [ A,  B,  C,  D,  E,  F,  G ]
Pattern: [ A,  B,  C,  D,  X ]
Match fails at 'E' vs 'X' (j = 4 characters matched).
Because all chars in P are distinct, no earlier slice of P can match!
We safely leap i forward by j = 4 positions in a single jump!
```

> [!WARNING]
> The distinct-character skip trick is ONLY valid when all characters in $P$ are unique. Applying it to patterns with duplicate characters like `"AABA"` will skip valid matches.

Let's now study algebraic fingerprints with Polynomial Rolling Hash and Rabin-Karp.

#### Complexity Analysis
- **Time Complexity:** $O(N \cdot M)$ worst-case naive; $O(N)$ for patterns with distinct characters.
- **Auxiliary Space:** $O(1)$ scalar pointers.

---

### Polynomial Rolling Hash & Rabin-Karp Search

The Rabin-Karp algorithm converts substring matching into numerical equality checks by computing a polynomial hash fingerprint for pattern $P$ and comparing it against sliding text windows.

By using a rolling hash function, we remove the outgoing left character and add the incoming right character in deterministic $O(1)$ time.

```text
Window 0: H("abc") = ('a'*B^2 + 'b'*B^1 + 'c'*B^0) mod Q
Slide ->: 1. Subtract outgoing 'a'*B^2
          2. Multiply remainder by base B
          3. Add incoming 'd'*B^0 mod Q
Window 1: H("bcd") computed in O(1) arithmetic operations!
```

The mathematical recurrence relation updates the rolling hash in constant time per character shift.

$$H(i+1) = \left( (H(i) - T[i] \cdot B^{M-1}) \cdot B + T[i+M] \right) \bmod Q$$

Let's implement Rabin-Karp using Double Hashing with two distinct prime moduli to eliminate collisions.

```cpp
// Rabin-Karp with Double Hashing: Expected O(N + M) Time
vector<int> rabin_karp_double_hash(const string& text, const string& pattern) {
    int n = text.size(), m = pattern.size();
    if (m > n) return {};

    const long long B = 257;
    const long long Q1 = 1e9 + 7, Q2 = 1e9 + 9;
    long long p_h1 = 0, p_h2 = 0, t_h1 = 0, t_h2 = 0;
    long long pow1 = 1, pow2 = 1;

    for (int i = 0; i < m - 1; ++i) {
        pow1 = (pow1 * B) % Q1;
        pow2 = (pow2 * B) % Q2;
    }

    for (int i = 0; i < m; ++i) {
        p_h1 = (p_h1 * B + pattern[i]) % Q1;
        p_h2 = (p_h2 * B + pattern[i]) % Q2;
        t_h1 = (t_h1 * B + text[i]) % Q1;
        t_h2 = (t_h2 * B + text[i]) % Q2;
    }

    vector<int> matches;
    for (int i = 0; i <= n - m; ++i) {
        if (t_h1 == p_h1 && t_h2 == p_h2) {
            matches.push_back(i); // Fingerprints match with probability > 1 - 10^-18
        }
        if (i < n - m) {
            t_h1 = ((t_h1 - text[i] * pow1) % Q1 + Q1) % Q1;
            t_h1 = (t_h1 * B + text[i + m]) % Q1;

            t_h2 = ((t_h2 - text[i] * pow2) % Q2 + Q2) % Q2;
            t_h2 = (t_h2 * B + text[i + m]) % Q2;
        }
    }
    return matches;
}
```

| Window Index $i$ | Text Substring | Double Hash $(H_1, H_2)$ | Pattern Match? | Action |
| :--- | :--- | :--- | :--- | :--- |
| $0$ | `"cba"` | $(104239, 874112)$ | No | Slide window |
| $3$ | `"aeb"` | $(553912, 102944)$ | No | Slide window |
| $6$ | `"abc"` | $(774910, 339102)$ | **Yes (Both match!)** | Record match at 6 |

```text
Single Modulo (10^9): Collision Probability ~ 1 / 10^9
Double Modulo (10^9 * 10^9): Collision Probability ~ 1 / 10^18
Eliminates spurious hash collisions completely on competitive tests!
```

> [!IMPORTANT]
> When subtracting `text[i] * pow` in modular arithmetic, the result can become negative. Always write `((val % Q) + Q) % Q` to prevent negative remainder values in C++.

Let's now examine deterministic linear-time matching with the Knuth-Morris-Pratt (KMP) algorithm.

#### Complexity Analysis
- **Time Complexity:** $O(N + M)$ average expected time; $O(N \cdot M)$ worst case if hash collisions occur without double hashing.
- **Auxiliary Space:** $O(1)$ scalar hash accumulators.

---

## Linear Time Matching

### Knuth-Morris-Pratt (KMP) & The LPS Array Pipeline

The Knuth-Morris-Pratt (KMP) algorithm guarantees deterministic $O(N + M)$ matching by ensuring the text pointer $i$ never steps backward.

KMP uses a precomputed Longest Prefix Suffix (LPS) array: $\text{LPS}[i]$ stores the length of the longest proper prefix of $P[0 \dots i]$ that is also a suffix of $P[0 \dots i]$.

```text
Pattern: [ A,  B,  A,  B,  C,  A,  B,  A,  B ]
LPS:     [ 0,  0,  1,  2,  0,  1,  2,  3,  4 ]
Notice: At index 8 ('B'), suffix "ABAB" matches prefix "ABAB" (len=4)
On mismatch after "ABAB", fall back to LPS[3] = 2 without rescanning!
```

When a mismatch occurs at pattern index $j$, we fall back to $j = \text{LPS}[j-1]$ while keeping text index $i$ fixed.

$$\text{Mismatch at } P[j] \implies j \leftarrow \text{LPS}[j-1] \quad (\text{if } j > 0)$$

$$\text{Invariant: } \text{LPS}[i] \le \text{LPS}[i-1] + 1$$

Notice that $\text{LPS}[i]$ can increase by at most $1$ per character step (when $P[i] == P[\text{len}]$), while mismatches fall back recursively through $\text{len} = \text{LPS}[\text{len}-1]$ until finding a match or reaching 0.

Let's implement the LPS precomputation and KMP search functions.

```cpp
// KMP String Matching: O(N + M) Guaranteed Deterministic Time
vector<int> compute_lps(const string& pattern) {
    int m = pattern.size();
    vector<int> lps(m, 0);
    int len = 0, i = 1;

    while (i < m) {
        if (pattern[i] == pattern[len]) {
            len++;
            lps[i++] = len;
        } else {
            if (len != 0) {
                len = lps[len - 1]; // Fallback to previous longest prefix
            } else {
                lps[i++] = 0;
            }
        }
    }
    return lps;
}

vector<int> kmp_search(const string& text, const string& pattern) {
    int n = text.size(), m = pattern.size();
    vector<int> lps = compute_lps(pattern);
    vector<int> matches;
    int i = 0, j = 0;

    while (i < n) {
        if (text[i] == pattern[j]) {
            i++; j++;
        }
        if (j == m) {
            matches.push_back(i - j); // Found match at index i - j
            j = lps[j - 1];           // Fallback for overlapping matches
        } else if (i < n && text[i] != pattern[j]) {
            if (j != 0) {
                j = lps[j - 1];       // Do NOT advance i!
            } else {
                i++;
            }
        }
    }
    return matches;
}
```

| Index $i$ | Pattern Char $P[i]$ | `len` (Previous LPS) | LPS Value Assigned $\text{LPS}[i]$ |
| :--- | :--- | :--- | :--- |
| $0$ | `'A'` | $0$ | $0$ |
| $1$ | `'B'` | $0$ | $0$ |
| $2$ | `'A'` | $0 \to 1$ ($P[2] == P[0]$) | $1$ |
| $3$ | `'B'` | $1 \to 2$ ($P[3] == P[1]$) | $2$ |
| $4$ | `'A'` | $2 \to 3$ ($P[4] == P[2]$) | $3$ |

```text
Text:    [ A, B, A, B, A, B, C ]
Pointer:   ------------------> (Index i advances strictly forward)
Pattern: [ A, B, A, B, C ]
Match fails at 'A' vs 'C' -> Pattern pointer j drops from 4 to 2
Text pointer i never rewinds!
```

> [!CAUTION]
> In KMP, never increment `i` on a mismatch when `j > 0`. Incrementing `i` during a pattern fallback will skip valid matching prefixes in the text stream.

Let's now study the Z-Algorithm as an intuitive prefix-matching alternative.

#### Complexity Analysis
- **Time Complexity:** $O(M)$ for LPS precomputation; $O(N)$ for text scanning $\implies \Theta(N + M)$ total.
- **Auxiliary Space:** $O(M)$ memory to store the LPS array.

---

### Z-Algorithm & Linear Prefix Match Boxes

The Z-Algorithm computes array $Z$, where $Z[i]$ represents the length of the longest substring starting at $S[i]$ that matches the prefix $S[0 \dots]$.

By maintaining a rightmost matched bounding box $[L, R]$, the algorithm copies previous $Z$-values in $O(1)$ time, achieving linear runtime.

```text
String S:  [ a,  b,  a,  c,  a,  b,  a,  e ]
Active Z-Box:                [ L = 4 ... R = 6 ] ("aba")
Current Index:                      i = 5
Symmetrical Prefix Index:    k = i - L = 5 - 4 = 1
Reuse Z[1] = 0 -> Avoid redundant character comparisons!
```

If current index $i$ lies within the active Z-box $[L, R]$, we initialize $Z[i]$ using its prefix mirror index $k = i - L$.

$$Z[i] = \min(R - i + 1, Z[i - L]) \quad (\text{for } i \le R)$$

Let's implement the Z-array builder and the delimiter concatenation pattern matcher.

```cpp
// Z-Algorithm for Pattern Matching: O(N + M) Time, O(N + M) Space
vector<int> compute_z_array(const string& s) {
    int n = s.size();
    vector<int> z(n, 0);
    int l = 0, r = 0;

    for (int i = 1; i < n; ++i) {
        if (i <= r) {
            z[i] = min(r - i + 1, z[i - l]);
        }
        while (i + z[i] < n && s[z[i]] == s[i + z[i]]) {
            z[i]++;
        }
        if (i + z[i] - 1 > r) {
            l = i;
            r = i + z[i] - 1;
        }
    }
    return z;
}

vector<int> search_z_algorithm(const string& text, const string& pattern) {
    string combined = pattern + "$" + text;
    vector<int> z = compute_z_array(combined);
    vector<int> matches;
    int m = pattern.size();

    for (size_t i = m + 1; i < z.size(); ++i) {
        if (z[i] == m) {
            matches.push_back(i - m - 1); // Exact pattern match found!
        }
    }
    return matches;
}
```

| Index $i$ | Character $S[i]$ in `"aab$aabaab"` | Active Z-Box $[L, R]$ | Mirror $k = i - L$ | Calculated $Z[i]$ |
| :--- | :--- | :--- | :--- | :--- |
| $0$ | `'a'` | - | - | $0$ (Base) |
| $1$ | `'a'` | $[1, 1]$ | - | $1$ |
| $2$ | `'b'` | $[1, 1]$ | - | $0$ |
| $4$ | `'a'` | $[4, 6]$ | - | $3$ (Matches `"aab"`) |
| $7$ | `'a'` | $[7, 9]$ | - | $3$ (Matches `"aab"`) |

```text
Combined String:  [ P a t t e r n ] $ [ T  e  x  t  . . . ]
Indices        :    0 ... M-1       M   M+1 ... M+N
Every index i > M where Z[i] == M marks a full occurrence of P!
```

> [!TIP]
> Always use a unique delimiter like `'$'` or `'#'` that does not appear in $P$ or $T$. This prevents $Z$-values from expanding beyond the boundary of the pattern.

Let's now examine linear-time palindrome search with Manacher's Algorithm.

#### Complexity Analysis
- **Time Complexity:** $\Theta(N + M)$ linear time.
- **Auxiliary Space:** $\Theta(N + M)$ auxiliary space for the combined string and Z-array.

---

## Advanced Palindromic & Automata Structures

### Manacher's Algorithm & Linear Palindromic Symmetry

Manacher's Algorithm finds the longest symmetric palindromic substring in strictly linear $O(N)$ time by exploiting reflection symmetry.

By inserting delimiter `#` characters between letters and sentinels at ends (`"^#a#b#a#$"`), Manacher handles both odd and even palindromes uniformly.

```text
Center C = 5, Right Boundary R = 9
Current Index:               i = 7
Mirror Index:                i' = 2*C - i = 10 - 7 = 3
Palindrome Radius at i' is mirrored into P[i] = min(R - i, P[i'])
```

If current index $i < R$, the palindrome radius $P[i]$ is initialized directly from its mirror index $i' = 2C - i$.

$$P[i] = \min(R - i, P[2C - i]) \quad (\text{for } i < R)$$

Let's implement Manacher's Algorithm.

```cpp
// Manacher's Algorithm: O(N) Time, O(N) Space
string longest_palindrome_manacher(const string& s) {
    if (s.empty()) return "";

    // Step 1: Transform string with delimiters and sentinels
    string t = "^";
    for (char c : s) {
        t += "#";
        t += c;
    }
    t += "#$";

    int n = t.size();
    vector<int> p(n, 0);
    int c = 0, r = 0;

    // Step 2: Linear palindrome radius expansion
    for (int i = 1; i < n - 1; ++i) {
        int i_mirror = 2 * c - i;
        if (r > i) {
            p[i] = min(r - i, p[i_mirror]);
        }

        // Expand outward around center i
        while (t[i + 1 + p[i]] == t[i - 1 - p[i]]) {
            p[i]++;
        }

        // Update center and right boundary
        if (i + p[i] > r) {
            c = i;
            r = i + p[i];
        }
    }

    // Step 3: Extract maximum palindrome span
    int max_len = 0, center_idx = 0;
    for (int i = 1; i < n - 1; ++i) {
        if (p[i] > max_len) {
            max_len = p[i];
            center_idx = i;
        }
    }
    int start = (center_idx - 1 - max_len) / 2;
    return s.substr(start, max_len);
}
```

| Index $i$ in `^#a#b#a#$` | Character $T[i]$ | Active Center $C$ | Right Boundary $R$ | Radius $P[i]$ |
| :--- | :--- | :--- | :--- | :--- |
| $2$ | `'a'` | $2$ | $3$ | $1$ |
| $4$ | `'b'` | $4$ | $7$ | $3$ (Span `"aba"`) |
| $6$ | `'a'` (Mirror of 2) | $4$ | $7$ | $1$ (Mirrored from 2) |

```text
Because R only advances forward and never rewinds, the total number
of character comparisons across the entire algorithm is bounded by 2N
Result: Strictly linear O(N) execution time!
```

> [!TIP]
> The sentinels `'^'` at the start and `'$'` at the end eliminate boundary checks in the while loop because `'^'` never equals `'$'`.

Let's now examine multi-pattern dictionary matching with the Aho-Corasick Automaton.

#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ strictly linear time.
- **Auxiliary Space:** $\Theta(N)$ memory for the transformed string and radius array.

---

### Aho-Corasick Automaton & Multi-Pattern Dictionary Matching

When searching for hundreds of keywords simultaneously in a text stream (such as in antivirus signatures or content moderation), running KMP for each keyword takes $O(K \cdot N)$ time.

The Aho-Corasick Automaton combines a Trie with KMP-style failure links, locating all occurrences of all dictionary keywords simultaneously in $O(N + \sum |P_i| + \text{matches})$ time.

```text
Patterns: { "he", "she", "his", "hers" }
Trie Edges (Solid):    (root) --s--> (s) --h--> (sh) --e--> (she)*
                               |
Failure Link (Dashed): (sh) ------------------------> (h)
When matching text "ush...", failing at 's' jumps directly to 'h'!
```

Failure links are constructed breadth-first using a queue: node $u$'s failure link points to the longest proper suffix of the string ending at $u$.

$$\text{Build Time} = O\left(\sum |P_i| \cdot |\Sigma|\right), \quad \text{Search Time} = O(|T| + \text{Total Matches})$$

Let's implement the Aho-Corasick Automaton.

```cpp
// Aho-Corasick Multi-Pattern Matcher
struct ACNode {
    vector<int> next;
    int fail = 0;
    vector<int> pattern_indices;
    ACNode() : next(26, 0) {}
};

class AhoCorasick {
    vector<ACNode> trie;
public:
    AhoCorasick() { trie.emplace_back(); }

    void insert(const string& word, int id) {
        int u = 0;
        for (char c : word) {
            int ch = c - 'a';
            if (!trie[u].next[ch]) {
                trie[u].next[ch] = trie.size();
                trie.emplace_back();
            }
            u = trie[u].next[ch];
        }
        trie[u].pattern_indices.push_back(id);
    }

    void build_failure_links() {
        queue<int> q;
        for (int ch = 0; ch < 26; ++ch) {
            if (trie[0].next[ch]) q.push(trie[0].next[ch]);
        }

        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int ch = 0; ch < 26; ++ch) {
                int v = trie[u].next[ch];
                if (v) {
                    int f = trie[u].fail;
                    while (f && !trie[f].next[ch]) f = trie[f].fail;
                    trie[v].fail = trie[f].next[ch];
                    // Propagate output matches
                    for (int id : trie[trie[v].fail].pattern_indices) {
                        trie[v].pattern_indices.push_back(id);
                    }
                    q.push(v);
                }
            }
        }
    }
};
```

| Queue Step | Node $v$ (Word Path) | Parent $u$ | Resolved Failure Target | Output Matches Inherited |
| :--- | :--- | :--- | :--- | :--- |
| Level 1 | `"s"`, `"h"` | Root $0$ | Root $0$ | None |
| Level 2 | `"sh"` | `"s"` | `"h"` | None |
| Level 3 | `"she"` | `"sh"` | `"he"` | Inherits match `"he"` |

```text
Processing Text Stream: "a h e r s"
Text Character 'e' arrives -> State "he" reached -> MATCH "he"!
Text Character 'r' arrives -> State "her" reached
Text Character 's' arrives -> State "hers" reached -> MATCH "hers"!
```

> [!IMPORTANT]
> Always propagate dictionary match lists across failure links during BFS setup. This ensures that reaching a state like `"she"` simultaneously reports substrings like `"he"`.

Let's now examine Suffix Trees and Ukkonen's linear-time construction foundations.

#### Complexity Analysis
- **Time Complexity:** $O(\sum |P_i| \cdot |\Sigma|)$ build time; $O(|T| + \text{matches})$ streaming search time.
- **Auxiliary Space:** $O(\sum |P_i| \cdot |\Sigma|)$ trie node state table.

---

### Suffix Trees & Ukkonen's Algorithm Foundations

A Suffix Tree is a compressed trie containing all $N$ suffixes of string $S$, enabling substring search in $O(M)$ time independent of text length $N$.

Ukkonen's Algorithm constructs the suffix tree online in linear $O(N)$ time using suffix links, active point navigation, and edge label compression $[L, R]$.

```text
(Root)
  |-- [0, 6] ("BANANA$") -------------------------> Leaf 0
  |-- [1, 1] ("A")
  |     |-- [6, 6] ("$") -------------------------> Leaf 5
  |     |-- [2, 3] ("NA")
  |           |-- [6, 6] ("$") -------------------> Leaf 3
  |           |-- [4, 6] ("NA$") -----------------> Leaf 1
```

By storing edge labels as index pairs $[L, R]$ referencing the original string, the tree uses linear memory.

$$\text{Nodes} \le 2N, \quad \text{Leaves} = N, \quad \text{Memory} = O(N)$$

Let's write a `SuffixTreeNode` struct and substring query helper.

```cpp
// Suffix Tree Node Representation with Compressed Edges
struct SuffixTreeNode {
    int start;
    int* end;
    int suffix_link;
    unordered_map<char, SuffixTreeNode*> children;

    SuffixTreeNode(int s, int* e) : start(s), end(e), suffix_link(0) {}
};

bool search_suffix_tree(SuffixTreeNode* root, const string& text, const string& pattern) {
    SuffixTreeNode* curr = root;
    int i = 0, m = pattern.size();

    while (i < m) {
        char c = pattern[i];
        if (curr->children.find(c) == curr->children.end()) return false;

        SuffixTreeNode* child = curr->children[c];
        int edge_len = *(child->end) - child->start + 1;

        for (int j = 0; j < edge_len && i < m; ++j, ++i) {
            if (text[child->start + j] != pattern[i]) return false;
        }
        curr = child;
    }
    return true; // Pattern completely traversed on suffix tree path
}
```

| Query Pattern | Edge Path Followed | Characters Matched | Search Result |
| :--- | :--- | :--- | :--- |
| `"ANA"` | Root $\to$ `[1, 1]` (`"A"`) $\to$ `[2, 3]` (`"NA"`) | $3 / 3$ matched | **Found (Substring)** |
| `"NAN"` | Root $\to$ `[2, 3]` (`"NA"`) $\to$ `[4, 4]` (`"N"`) | $3 / 3$ matched | **Found (Substring)** |
| `"BAN"` | Root $\to$ `[0, 6]` (`"BANANA$"`) | $3 / 3$ matched | **Found (Substring)** |

```text
Before: (Parent) -------- [0, 5] ("ABCDEF") --------> (OldLeaf)
Insert "ABCXYZ":
Split : (Parent) --- [0, 2] ("ABC") ---> (InternalNode)
                                           |-- [3, 5] ("DEF") -> (Old)
                                           |-- [3, 5] ("XYZ") -> (New)
```

> [!CAUTION]
> Always append a unique terminal character like `'$'` to the input string. This ensures that no suffix is a prefix of another, guaranteeing that every suffix terminates at a unique leaf.

Let's now examine Suffix Automata (SAM) for minimal-state suffix processing.

#### Complexity Analysis
- **Time Complexity:** $O(N)$ Ukkonen construction; $O(M)$ substring pattern search.
- **Auxiliary Space:** $O(N)$ auxiliary tree nodes and edge records.

---

### Suffix Automata (SAM) & Directed Acyclic Word Graphs

The Suffix Automaton (SAM) is the minimal Deterministic Finite Automaton (DFA) that recognizes all suffixes of a string $S$.

For a string of length $N$, the SAM contains at most $2N - 1$ states and $3N - 4$ transitions, providing an efficient alternative to suffix trees.

```text
String = "aab"
State 0 (Root, Len 0) --a--> State 1 (Len 1, "a")
State 1 --a--> State 2 (Len 2, "aa") --b--> State 3 (Len 3, "aab")
State 0 --b--> State 3 (Direct transition for suffix "b"!)
Suffix Link from State 2 -> State 1 (Longest shared suffix)
```

The SAM bounds prove linear memory allocation and state transitions.

$$|\text{States}| \le 2N - 1, \quad |\text{Transitions}| \le 3N - 4 \implies \text{Linear Memory } O(N)$$

Let's implement the incremental online SAM extension algorithm.

```cpp
// Suffix Automaton (SAM): O(N) Construction Time and Linear Space
struct SAMState {
    int len = 0, link = -1;
    vector<int> next;
    SAMState() : next(26, 0) {}
};

class SuffixAutomaton {
    vector<SAMState> st;
    int last = 0;
public:
    SuffixAutomaton(int maxlen) {
        st.reserve(2 * maxlen);
        st.emplace_back(); // Root state 0
        last = 0;
    }

    void extend(char c) {
        int cur = st.size();
        st.emplace_back();
        st[cur].len = st[last].len + 1;
        int ch = c - 'a';

        int p = last;
        while (p != -1 && !st[p].next[ch]) {
            st[p].next[ch] = cur;
            p = st[p].link;
        }

        if (p == -1) {
            st[cur].link = 0;
        } else {
            int q = st[p].next[ch];
            if (st[p].len + 1 == st[q].len) {
                st[cur].link = q;
            } else {
                int clone = st.size();
                st.push_back(st[q]); // Clone state q
                st[clone].len = st[p].len + 1;
                while (p != -1 && st[p].next[ch] == q) {
                    st[p].next[ch] = clone;
                    p = st[p].link;
                }
                st[q].link = st[cur].link = clone;
            }
        }
        last = cur;
    }

    long long count_distinct_substrings() const {
        long long total = 0;
        for (size_t i = 1; i < st.size(); ++i) {
            total += st[i].len - st[st[i].link].len;
        }
        return total;
    }
};
```

| Step | Char Appended | New State `cur` | Cloned State? | Suffix Link Target |
| :--- | :--- | :--- | :--- | :--- |
| Init | - | State $0$ (Root) | - | $-1$ |
| $1$ | `'a'` | State $1$ ($\text{len}=1$) | No | $0$ |
| $2$ | `'a'` | State $2$ ($\text{len}=2$) | No | $1$ |
| $3$ | `'b'` | State $3$ ($\text{len}=3$) | No | $0$ |

```text
Each state u in SAM represents substrings of lengths:
           ( st[link[u]].len, st[u].len ]
Total Distinct Substrings = Sum( st[u].len - st[link[u]].len )
Computes distinct substring count in a single O(N) pass!
```

> [!TIP]
> Suffix Automata can count distinct substrings, calculate substring frequencies, and locate the lexicographical $K$-th substring in $O(N)$ time with fewer pointer operations than Suffix Trees.

This completes the String Matching Algorithms chapter, covering naive skips, rolling hashes, KMP, Z-algorithm, Manacher, Aho-Corasick, Suffix Trees, and Suffix Automata.

#### Complexity Analysis
- **Time Complexity:** $O(N)$ amortized linear construction time.
- **Auxiliary Space:** $O(N \cdot |\Sigma|)$ state transition graph.

---

## Cheat Sheet & Quick Reference

| Matching Technique | Problem Scope | Core Data Structure | Time (Build / Search) |
| :--- | :--- | :--- | :--- |
| **Naive / Distinct Skip** | Single pattern | Sliding pointer comparison | $O(N \cdot M)$ worst / $O(N)$ distinct |
| **Rabin-Karp** | Single pattern | Double polynomial rolling hash | $O(M)$ / Expected $O(N)$ |
| **KMP** | Single pattern | Longest Prefix Suffix (LPS) array | $O(M)$ / Guaranteed $O(N)$ |
| **Z-Algorithm** | Single pattern | Z-box boundary interval array | $O(N + M)$ total |
| **Manacher's Algorithm**| All palindromes | Delimiter `#` string & radius array | $\Theta(N)$ linear time |
| **Aho-Corasick** | Dictionary ($K$ patterns) | Trie + BFS Failure Links | $O(\sum |P_i|) \ / \ O(N + \text{matches})$ |
| **Suffix Tree** | All suffixes of text | Compressed edge-index suffix trie | $O(N)$ Ukkonen / $O(M)$ query |
| **Suffix Automaton (SAM)**| All substrings of text | Minimal DFA DAG + Suffix links | $O(N)$ online / $O(M)$ query |
