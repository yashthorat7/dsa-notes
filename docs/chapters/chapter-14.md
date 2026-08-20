# Chapter 14: Strings & Parsing

---



## String Basics & Representations



### String Memory Architecture — SSO & Null Termination

Let's begin at the whiteboard by examining how modern C++ represents strings in physical memory, contrasting raw C-style pointers with `string` and `string_view`.

To avoid expensive dynamic heap allocations for everyday short text, modern C++ implementations use Small String Optimization (SSO) to store short strings directly within the object's stack frame.

```text
SSO Mode (<= 15 chars):
Stack Frame Object [ Cap | Size | 'h','e','l','l','o','\0' ... ]

Heap Mode (> 15 chars):
Stack Object [ Ptr: 0x7fff... | Size: 32 | Cap: 64 ]
                     |
                     v
Heap Buffer: [ "This is a very long string that requires heap...", \0]
```

A `string` instance typically occupies 24 or 32 bytes on the stack, consisting of a pointer, a size integer, and an internal capacity or SSO character buffer.

$$\text{sizeof}(\text{string}) = 24 \text{ bytes (GCC/Clang)} \quad \text{or } 32 \text{ bytes (MSVC)}$$

Let's inspect how `string_view` provides zero-copy substring views without memory allocation.

```cpp
// String View vs Deep Copy Substring Slicing
void inspect_string_views(const string& full_text) {
    // string_view: O(1) Time, 0 Heap Allocations
    // Holds only: 1 pointer + 1 size_t length (16 bytes total)
    string_view view = full_text;
    string_view prefix = view.substr(0, 5); // Zero copy!

    // Standard string substr: O(K) Time, Allocates fresh Heap Buffer
    string copy = full_text.substr(0, 5);
}
```

| Type | Memory Ownership | Heap Allocation? | Mutability | Substring Complexity |
| :--- | :--- | :--- | :--- | :--- |
| `const char*` | Unowned pointer | No (Points to literal/buffer) | Read-only | $O(1)$ pointer shift (Unsafe length) |
| `string` | Full ownership | Only if length > SSO limit | Read/Write | $O(K)$ deep copy |
| `string_view` | Non-owning window | Zero heap allocations | Read-only | $O(1)$ constant time |

```text
Underlying Buffer : [ 'H', 'e', 'l', 'l', 'o', ' ', 'W', 'o', 'r', 'l', 'd' ]
Full string_view  : [-------------------------------------------------------]
Substring slice   :        [------------] (Ptr to 'e', Length = 4)
Zero dynamic allocation and zero memory copying!
```

> [!WARNING]
> A `string_view` does not own its underlying memory. Creating a `string_view` over a temporary `string` that gets destroyed leaves a dangling pointer, causing undefined behavior.

Let's now study character frequency tables and alphabet histograms.



#### Complexity Analysis
- **Time Complexity:** $O(1)$ construction and substring operations for `string_view`; $O(K)$ copy for `string`.
- **Auxiliary Space:** $O(1)$ auxiliary stack space for SSO strings; $O(N)$ heap for large strings.

---

### string Quick Syntax Reference

The C++ `string` class provides an extensive suite of member functions and numeric conversions for string manipulation.

```text
Mutators:    s.push_back('a'), s.pop_back(), s += "txt", s.clear()
Search:      s.find("pattern")  ---> Returns index or string::npos
Extraction:  s.substr(start, length)
Conversion:  to_string(42) <---> stoi("42"), stoll("10000000000")
```

#### Core String Operations Reference

| Operation Category | Method / Function | Complexity | Purpose |
| :--- | :--- | :--- | :--- |
| **Size & Capacity** | `s.size()`, `s.length()` | $O(1)$ | Returns number of characters |
| | `s.empty()` | $O(1)$ | Returns `true` if string length is 0 |
| | `s.reserve(n)` | $O(N)$ once | Preallocates capacity for $\ge n$ characters |
| **Element Access** | `s[i]` | $O(1)$ | Unchecked character read/write |
| | `s.front()`, `s.back()` | $O(1)$ | References to first / last character |
| | `s.c_str()`, `s.data()` | $O(1)$ | Returns null-terminated `const char*` pointer |
| **Search & Slice** | `s.substr(pos, len)` | $O(\text{len})$ | Extracts substring of length `len` starting at `pos` |
| | `s.find(target, pos)` | $O(N \cdot M)$ | Returns start index of `target`, or `string::npos` |
| | `s.rfind(target)` | $O(N \cdot M)$ | Reverse find: locates last occurrence |
| **Mutation** | `s.push_back(c)` | $O(1)$ amortized | Appends character `c` to end |
| | `s.pop_back()` | $O(1)$ | Removes trailing character |
| | `s.insert(pos, str)` | $O(N)$ | Inserts `str` starting at index `pos` |
| | `s.erase(pos, len)` | $O(N)$ | Erases `len` characters starting at `pos` |
| **Numeric Conversion** | `to_string(val)` | $O(D)$ digits | Converts integer or float to `string` |
| | `stoi(str)`, `stoll(str)`| $O(D)$ digits | Parses `string` into `int` or `long long` |

> [!TIP]
> When searching for substrings with `s.find()`, always compare the result against `string::npos` to check if the target was absent.

#### Complexity Analysis
- **Time Complexity:** $O(1)$ for size and back mutations; $O(K)$ for substrings of length $K$; $O(D)$ for string-to-number parsing.
- **Auxiliary Space:** $O(1)$ for in-place methods; $O(K)$ for substring extractions.

---



### ASCII Frequency Tables & Alphabet Histograms

When counting character frequencies or verifying character sets, allocating a general hash map incurs heavy hashing overhead and pointer chasing.

Because standard ASCII contains only 128 characters (or 256 for extended ASCII), a fixed-size integer array provides deterministic $O(1)$ lookups with maximum CPU cache locality.

```text
Character 'a' (ASCII 97)  ---> freq['a' - 'a'] = freq[0]
Character 'b' (ASCII 98)  ---> freq['b' - 'a'] = freq[1]
Character 'z' (ASCII 122) ---> freq['z' - 'a'] = freq[25]
Direct 0-indexed integer lookup with zero hashing overhead!
```

A fixed 256-slot histogram requires strictly constant auxiliary memory regardless of input string length.

$$\text{Memory Overhead} = O(|\Sigma|) = 256 \times 4 \text{ bytes} = 1024 \text{ bytes} = \Theta(1)$$

Let's write a character frequency counter and alphabetical string reconstructor.

```cpp
// Fixed ASCII Frequency Counter & Alphabetical Sorter: O(N) Time
string sort_string_via_frequency(const string& s) {
    // 256-element array covers all extended ASCII bytes
    vector<int> freq(256, 0);

    for (unsigned char c : s) {
        freq[c]++;
    }

    string sorted_result = "";
    sorted_result.reserve(s.size());

    for (int i = 0; i < 256; ++i) {
        while (freq[i] > 0) {
            sorted_result.push_back((char)i);
            freq[i]--;
        }
    }
    return sorted_result;
}
```

| ASCII Code Range | Character Category | Typical Offset Formula |
| :--- | :--- | :--- |
| `48` to `57` | Numeric Digits (`'0'` - `'9'`) | `c - '0'` (Range $0 \dots 9$) |
| `65` to `90` | Uppercase Alphabet (`'A'` - `'Z'`) | `c - 'A'` (Range $0 \dots 25$) |
| `97` to `122` | Lowercase Alphabet (`'a'` - `'z'`) | `c - 'a'` (Range $0 \dots 25$) |
| `0` to `255` | Full Extended ASCII Table | `(unsigned char)c` (Range $0 \dots 255$) |

```text
Input String: "banana"
Tally Pass  : freq['a'-'a'] = 3, freq['b'-'a'] = 1, freq['n'-'a'] = 2
Reconstruction: "a" * 3 + "b" * 1 + "n" * 2 ===> "aaabnn"
Achieves stable non-comparison sorting in O(N + 26) = O(N) time!
```

> [!CAUTION]
> In many C++ compilers, `char` is a signed 8-bit integer ($-128$ to $127$). Directly indexing `freq[c]` with extended ASCII characters causes negative array index crashes. Always cast to `(unsigned char)c`.

Let's now examine palindrome validation and center-expansion search algorithms.



#### Complexity Analysis
- **Time Complexity:** $\Theta(N + |\Sigma|)$ linear time to count and reconstruct.
- **Auxiliary Space:** $\Theta(|\Sigma|) = O(1)$ fixed 256-element buffer.

---



## String Operations



### Palindrome Verification & Center-Expansion Search

A string is a palindrome if it reads identically forward and backward, exhibiting reflectional symmetry around its central axis.

To find the longest symmetric radar reflection pattern, we expand outward from all $2N - 1$ potential centers: $N$ single-character centers (odd lengths) and $N-1$ character-pair centers (even lengths).

```text
Odd-Length Center (Single Char):     [ a,  b,  c, (d), c,  b,  a ]
                                           <--  |  -->
Even-Length Center (Char Pair):      [ a,  b, (c,  c), b,  a ]
                                           <--  |  -->
```

Outward expansion verifies character equality step-by-step:

$$S[\text{left} - k] == S[\text{right} + k] \implies \text{expand radius } k \to k+1$$

Let's implement the center-expansion palindrome finder in $O(N^2)$ time and $O(1)$ space.

```cpp
// Longest Symmetric Radar Signature: O(N^2) Time, O(1) Space
int expand_around_center(const string& s, int left, int right) {
    while (left >= 0 && right < (int)s.size() && s[left] == s[right]) {
        left--;
        right++;
    }
    return right - left - 1; // Length of palindrome span
}

string find_longest_symmetric_radar_pattern(const string& signal) {
    if (signal.empty()) return "";
    int start = 0, max_len = 0;

    for (int i = 0; i < (int)signal.size(); ++i) {
        int len_odd = expand_around_center(signal, i, i);       // Single-character center
        int len_even = expand_around_center(signal, i, i + 1);   // Character-pair center
        int len = max(len_odd, len_even);

        if (len > max_len) {
            max_len = len;
            start = i - (len - 1) / 2;
        }
    }
    return signal.substr(start, max_len);
}
```


#### Complexity Analysis
- **Time Complexity:** $O(N)$ for two-pointer verification; $O(N^2)$ for Longest Symmetric Pattern Search.
- **Auxiliary Space:** $O(1)$ strictly in-place memory.

---



### Frequency Signature Verification & Sliding Permutation Search

Two strings are frequency-equivalent if they contain the exact same character counts, differing only in relative character order.

We can verify frequency equivalence in $O(N)$ time by tallying character counts in string $A$, decrementing with string $B$, and verifying that all count buckets return to zero.

```text
String A: "listen" -> Increment: l:+1, i:+1, s:+1, t:+1, e:+1, n:+1
String B: "silent" -> Decrement: s:-1, i:-1, l:-1, e:-1, n:-1, t:-1
Final Array State  -> All 26 slots equal ZERO ===> Frequency Match!
```

The count balance invariant proves equality across all character frequencies:

$$\forall c \in [\text{'a'} \dots \text{'z'}], \; \text{count}_A(c) - \text{count}_B(c) = 0 \iff A \sim B$$

Let's implement frequency parity verification in C++.

```cpp
// Transcript Frequency Parity Verification: O(|S|) Time, O(1) Space
bool verify_transcript_character_parity(const string& s, const string& t) {
    if (s.size() != t.size()) return false;

    vector<int> count(26, 0);
    for (int i = 0; i < (int)s.size(); ++i) {
        count[s[i] - 'a']++;
        count[t[i] - 'a']--;
    }

    for (int c : count) {
        if (c != 0) return false;
    }
    return true;
}
```

#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear time to scan string and pattern.
- **Auxiliary Space:** $O(1)$ fixed 26-element integer buffers.

---



### Parsing, Delimiter Splitting, and Word-Level Reversals

Parsing formatted strings into tokens and manipulating word boundaries is fundamental to compiler design, query processing, and data serialization.

A classic interview algorithm reverses the words in a sentence in $O(1)$ auxiliary space: first reverse the entire string, then reverse each individual word.

```text
Input String        : "the sky is blue"
1. Reverse Entire   : "eulb si yks eht"
2. Reverse Each Word: "blue is sky the"
Pure in-place word order reversal with zero string reallocations!
```

The mathematical identity confirms that applying two reversals preserves word characters while reversing token sequence order.

$$\text{ReverseWords}(S) = \text{ReverseEachWord}(\text{ReverseEntireString}(S))$$

Let's write a zero-copy delimiter tokenizer alongside the in-place word reverser.

```cpp
// Zero-Copy Delimiter Splitter and In-Place Sentence Reverser
vector<string_view> split_string_view(string_view s, char delim) {
    vector<string_view> tokens;
    size_t start = 0, end = 0;

    while ((end = s.find(delim, start)) != string_view::npos) {
        if (end > start) {
            tokens.push_back(s.substr(start, end - start));
        }
        start = end + 1;
    }
    if (start < s.size()) {
        tokens.push_back(s.substr(start));
    }
    return tokens;
}

string reverse_words_in_place(string s) {
    // Step 1: Clean up redundant whitespace in-place
    int i = 0, n = s.size(), write_idx = 0;
    while (i < n) {
        while (i < n && s[i] == ' ') i++;
        if (i < n && write_idx > 0) s[write_idx++] = ' ';
        int start = write_idx;
        while (i < n && s[i] != ' ') s[write_idx++] = s[i++];
        reverse(s.begin() + start, s.begin() + write_idx); // Reverse word
    }
    s.resize(write_idx);

    // Step 2: Reverse whole string to fix sentence order
    reverse(s.begin(), s.end());
    return s;
}
```

| Pipeline Step | Intermediate String State | Operation Applied |
| :--- | :--- | :--- |
| Input | `"  hello   world  "` | Raw input with irregular spaces |
| Compact & Word Reverse | `"olleh dlrow"` | Spaces collapsed, words individually reversed |
| Whole Sentence Reverse | `"world hello"` | Entire string flipped to restore proper word order |

```text
Raw:     [   b l u e       s k y   ]
Step 1:  [ e u l b   y k s ] (Words reversed individually)
Step 2:  [ s k y   b l u e ] (Entire string reversed)
```

> [!TIP]
> Use `string_view` when tokenizing large log files or JSON payloads to avoid millions of tiny heap allocations created by standard `stringstream`.

Let's now study lexicographical permutation ranking and rotational symmetries.



#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear time to scan, split, and reverse.
- **Auxiliary Space:** $O(1)$ auxiliary space for in-place sentence manipulation.

---



## String Hashing & Permutations



### Lexicographical Permutation Rank & Rotational Equivalence

Suppose you need to calculate the 1-based lexicographical rank of a string among all its possible alphabetical permutations without generating them all.

At each position $i$, we count how many unused characters are strictly smaller than $S[i]$, and multiply that count by the factorial $(N - 1 - i)!$.

```text
String = "CAB" (Sorted alphabet: A, B, C)
Index 0 ('C'): Characters smaller than 'C' are 'A', 'B' (Count = 2)
               Skip all words starting with A or B: 2 * (3-1)! = 4
Index 1 ('A'): Characters smaller than 'A' among unused = 0
Index 2 ('B'): Characters smaller than 'B' among unused = 0
Total Rank = 1 (base) + 4 = 5
```

The factorial summation formula directly computes the exact lexicographical rank.

$$\text{Rank}(S) = 1 + \sum_{i=0}^{N-1} \text{countSmallerUnused}(S[i]) \times (N - 1 - i)!$$

Let's implement the permutation rank calculator and the rotational shift verifier.

```cpp
// Lexicographical Rank & Rotational Equivalence Verifier
long long factorial(int n) {
    long long f = 1;
    for (int i = 2; i <= n; ++i) f *= i;
    return f;
}

long long get_permutation_rank(const string& s) {
    int n = s.size();
    long long rank = 1;

    for (int i = 0; i < n; ++i) {
        int smaller = 0;
        for (int j = i + 1; j < n; ++j) {
            if (s[j] < s[i]) smaller++;
        }
        rank += smaller * factorial(n - 1 - i);
    }
    return rank;
}

bool is_cyclic_rotation(const string& s1, const string& s2) {
    if (s1.size() != s2.size()) return false;
    string doubled = s1 + s1;
    return doubled.find(s2) != string::npos;
}
```

| Index $i$ | Character $S[i]$ | Smaller Remaining Chars | Factorial Weight $(N-1-i)!$ | Rank Contribution |
| :--- | :--- | :--- | :--- | :--- |
| $0$ | `'S'` | $2$ (`'T'`, `'R'`, `'I'`, `'N'`, `'G'`) | $5! = 120$ | $2 \times 120 = 240$ |
| $1$ | `'T'` | $4$ | $4! = 24$ | $4 \times 24 = 96$ |
| $2$ | `'R'` | $3$ | $3! = 6$ | $3 \times 6 = 18$ |

```text
Original String A = "waterbottle" (Length = 11)
Doubled String (A+A): "waterbottlewaterbottle"
Target B = "erbottlewat" is clearly visible as a contiguous substring!
Concatenating A+A contains all possible cyclic rotations of A.
```

> [!IMPORTANT]
> When testing rotational equivalence via `(s1 + s1).find(s2)`, always verify `s1.size() == s2.size()` first. Without this check, a shorter string like `"water"` would incorrectly match as a rotation of `"waterbottle"`.

This completes the Strings and Parsing chapter, covering SSO memory structures, ASCII tables, palindromes, sliding anagrams, tokenizers, permutation ranking, and rotational symmetries.



#### Complexity Analysis
- **Time Complexity:** $O(N^2)$ for Lexicographical Rank; $O(N)$ for string rotation check.
- **Auxiliary Space:** $O(N)$ memory for doubled rotation string buffer.

---



## Cheat Sheet & Quick Reference

| String Technique | Core Mechanism | Key Invariant / Formula | Complexity |
| :--- | :--- | :--- | :--- |
| **Small String Optimization** | In-situ stack buffer | Strings $\le 15$ chars avoid heap allocations | $O(1)$ / $O(1)$ Space |
| **string_view** | Non-owning pointer + size | Zero-copy substring views | $O(1)$ / $0$ Allocations |
| **ASCII Frequency Array** | Direct index mapping | `int freq[256]` with `(unsigned char)c` | $\Theta(N)$ / $O(1)$ Space |
| **Center Expansion** | Expand odd/even rays | $2N - 1$ possible palindrome centers | $O(N^2)$ / $O(1)$ Space |
| **Sliding Window Anagram** | Fixed-size $|P|$ window | Balance 26-slot frequency map | $\Theta(|S|)$ / $O(1)$ Space |
| **Sentence Word Reversal** | In-place double reversal | Flip entire string, then flip each word | $\Theta(N)$ / $O(1)$ Space |
| **Permutation Rank** | Combinatorial factorials | `Rank = 1 + sum(smaller * (n - 1 - i)!)` | $O(N^2)$ / $O(1)$ Space |
| **Rotational Equivalence** | String doubling | `(s1 + s1).find(s2) != npos` | $O(N)$ / $O(N)$ Space |
