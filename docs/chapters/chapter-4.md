# Chapter 4: Bit Manipulation

---


## Basic Bitwise Operations


### Bitwise Fundamental Operators (AND, OR, XOR, NOT)

Every high-level data structure ultimately boils down to physical transistors switching high and low voltages inside the CPU ALU.

Bitwise operators manipulate these individual binary bits in parallel within single-cycle processor registers, offering maximum computational speed and minimal memory footprint.

```text
Inputs (A, B) | AND (A & B) | OR (A | B) | XOR (A ^ B) | NOT (~A)
    (0, 0)    |      0      |     0      |      0      |    1
    (0, 1)    |      0      |     1      |      1      |    1
    (1, 0)    |      0      |     1      |      1      |    0
    (1, 1)    |      1      |     1      |      0      |    0
```

In two's complement arithmetic, applying the bitwise NOT operator `~` inverts every bit, creating the standard signed algebraic identity.

$$\sim x = -x - 1 \iff -x = \sim x + 1$$

Let's inspect how the four primary bitwise operators behave on 8-bit unsigned integer values.

```cpp
// Fundamental Bitwise Operations Demonstration
void demonstrate_bitwise_operators() {
    unsigned char a = 0b01101100; // Decimal 108
    unsigned char b = 0b00110101; // Decimal 53

    unsigned char op_and = a & b; // 0b00100100 (Decimal 36)
    unsigned char op_or  = a | b; // 0b01111101 (Decimal 125)
    unsigned char op_xor = a ^ b; // 0b01011001 (Decimal 89)
    unsigned char op_not = ~a;    // 0b10010011 (Decimal 147)
}
```

Bitwise XOR ($\oplus$) has special properties: any number XORed with 0 remains unchanged, and any number XORed with itself cancels to 0.

```cpp
// Algebraic Properties of Bitwise XOR
void xor_identities(int x, int y) {
    int id1 = x ^ 0;         // Identity: x ^ 0 = x
    int id2 = x ^ x;         // Self-Inverse: x ^ x = 0
    int id3 = x ^ y ^ x;     // Commutative cancellation: evaluates to y
}
```

| Operator | Syntax | Boolean Logic Meaning | Hardware Logic Role | Practical Programming Use |
| :--- | :--- | :--- | :--- | :--- |
| Bitwise AND | `a & b` | Both bits must be 1 | Parallel Masking / Filter | Test active bit flags |
| Bitwise OR | `a \| b` | At least one bit is 1 | Union / Accumulation | Set flags / Combine masks |
| Bitwise XOR | `a ^ b` | Exactly one bit is 1 | Parity / Difference | Toggle bits / Cancellation |
| Bitwise NOT | `~a` | Inverts all bits | One's Complement | Invert masks / Clear bits |

```text
Operand A:  0  1  1  0  1  1  0  0  (Decimal 108)
Operand B:  0  0  1  1  0  1  0  1  (Decimal  53)
----------------------------------
A & B:      0  0  1  0  0  1  0  0  (AND:  Both 1)  -> 36
A | B:      0  1  1  1  1  1  0  1  (OR:   Any 1)   -> 125
A ^ B:      0  1  0  1  1  0  0  1  (XOR:  Differ)  -> 89
```

> [!WARNING]
> Bitwise operators (`&`, `|`, `^`) have lower operator precedence than comparison operators (`==`, `<`). Always wrap bitwise operations in explicit parentheses: `(x & 1) == 0`.

Let's now examine bit shifts and their underlying machine mechanics.


#### Complexity Analysis
- **Time Complexity:** $O(1)$ single-cycle machine instruction per bitwise operation.
- **Auxiliary Space:** $O(1)$ CPU register workspace.

---


### Bit Shift Mechanics — Logical vs Arithmetic Shifts

Bit shifting moves all bits of an integer register left or right by a specified number of positions $k$.

Shifting left by $k$ positions multiplies the integer by $2^k$, while shifting right by $k$ positions performs integer floor division by $2^k$.

```text
Left Shift (x << 2):   [ 0 0 0 0 1 1 0 1 ] ===> [ 0 0 1 1 0 1 0 0 ]
(Multiplies by 2^2=4)   Discard MSBs <---       <--- Zero-fill LSBs

Right Shift (x >> 2):  [ 0 0 0 0 1 1 0 1 ] ===> [ 0 0 0 0 0 0 1 1 ]
(Divides by 2^2=4)      Zero-fill MSBs --->      ---> Discard LSBs
```

The mathematical relationship directly maps binary shifts to powers of two.

$$x \ll k = x \cdot 2^k, \quad x \gg k = \left\lfloor \frac{x}{2^k} \right\rfloor$$

We must distinguish between Logical Right Shift (zero-filling on unsigned types) and Arithmetic Right Shift (sign-bit preservation on signed types).

```cpp
// Logical vs Arithmetic Right Shift
void shift_mechanics() {
    unsigned int u = 0b11000000; // Unsigned: Logical Shift
    unsigned int u_shifted = u >> 2; // 0b00110000 (MSBs filled with 0s)

    int s = -16; // Signed: Arithmetic Shift (Two's complement)
    int s_shifted = s >> 2; // -4 (MSBs filled with 1s to preserve sign)
}
```

| Type & Expression | Value Before Shift | Binary Before | Binary After (`>> 2`) | Value After |
| :--- | :--- | :--- | :--- | :--- |
| `unsigned int (16 >> 2)` | $16$ | `00010000` | `00000100` | $4$ |
| `unsigned int (255 >> 2)` | $255$ | `11111111` | `00111111` | $63$ |
| `signed int (16 >> 2)` | $16$ | `00010000` | `00000100` | $4$ |
| `signed int (-16 >> 2)` | $-16$ | `11110000` | `11111100` | $-4$ (**Sign Preserved**) |

```text
Unsigned Shift: [0] [0] ---> [ b7 ][ b6 ][ b5 ][ b4 ][ b3 ][ b2 ]
                             \_________________________________/
                                   Zero-fill MSB Positions

Signed Shift:   [1] [1] ---> [ b7 ][ b6 ][ b5 ][ b4 ][ b3 ][ b2 ]
                             \_________________________________/
                                   Sign-fill MSB with 1s
```

> [!CAUTION]
> In C++, shifting by $\ge 32$ bits on a 32-bit integer triggers Undefined Behavior. Always use `1ULL << k` when shifting 64-bit masks.

Let's now study how bitmasks act as compact boolean arrays.


#### Complexity Analysis
- **Time Complexity:** $O(1)$ single-cycle machine shift instruction.
- **Auxiliary Space:** $O(1)$ scalar variable workspace.

---


## Common Bit Masking Techniques


### Bit Masking — Setting, Clearing, Toggling, and Testing Bits

A bitmask is an integer whose individual bits serve as a compact array of boolean flags.

We use four core bitmask operations: testing a bit, setting a bit to 1, clearing a bit to 0, and toggling a bit.

```text
1. Test Bit k:    (x & (1 << k)) != 0    (Evaluates to true if 1)
2. Set Bit k:     x = x | (1 << k)       (Forces bit k to 1)
3. Clear Bit k:   x = x & ~(1 << k)      (Forces bit k to 0)
4. Toggle Bit k:  x = x ^ (1 << k)       (Flips bit k: 0<->1)
```

These masking idioms form the standard Boolean equations for bitwise state manipulation.

$$\text{set}(x, k) = x \lor 2^k, \quad \text{clear}(x, k) = x \land \neg(2^k), \quad \text{toggle}(x, k) = x \oplus 2^k$$

Let's build helper functions for these atomic bit operations.

```cpp
// Atomic Bitmask Operations Helper Suite
bool test_bit(int mask, int k) {
    return (mask & (1 << k)) != 0;
}

int set_bit(int mask, int k) {
    return mask | (1 << k);
}

int clear_bit(int mask, int k) {
    return mask & ~(1 << k);
}

int toggle_bit(int mask, int k) {
    return mask ^ (1 << k);
}
```

Bitmasks also allow us to test or update multiple flags simultaneously in a single operation.

```cpp
// Batch Permission Checking via Bitmasks
const int READ_PERM  = 1 << 0; // 0001
const int WRITE_PERM = 1 << 1; // 0010
const int EXEC_PERM  = 1 << 2; // 0100

bool has_read_and_write(int user_perms) {
    int required = READ_PERM | WRITE_PERM;
    return (user_perms & required) == required; // Checks both flags at once!
}
```

| Operation | Target Bit ($k=3$) | Mask Used (`1 << 3`) | Before Binary | After Binary |
| :--- | :--- | :--- | :--- | :--- |
| `test_bit(x, 3)` | Inspect Bit 3 | `00001000` | `00101100` | Returns `true` |
| `set_bit(x, 3)` | Turn ON Bit 3 | `00001000` | `00100100` | `00101100` |
| `clear_bit(x, 3)` | Turn OFF Bit 3 | `11110111` (`~mask`) | `00101100` | `00100100` |
| `toggle_bit(x, 3)` | Flip Bit 3 | `00001000` | `00101100` | `00100100` |

```text
Original bits:   b7   b6   b5   b4   b3   b2   b1   b0
Mask ~(1 << 3):   1    1    1    1    0    1    1    1
-------------------------------------------------------------------
Result (&):      b7   b6   b5   b4    0   b2   b1   b0  (Cleared!)
```

> [!TIP]
> Bitmask flags use up to 8x less memory than `bool[]` arrays while enabling batch tests in a single CPU instruction.

Let's now study counting set bits (1s) in an integer.


#### Complexity Analysis
- **Time Complexity:** $O(1)$ single-cycle execution for all masking operations.
- **Auxiliary Space:** $O(1)$ workspace memory.

---


### Population Count & Brian Kernighan's Algorithm

Counting the number of set bits (1s) in an integer is known as population count or Hamming weight.

While a naive loop tests all 32 bits one by one, Brian Kernighan's algorithm runs in $O(\text{set bits})$ by clearing the lowest set bit in each iteration.

```text
Value n:        0 0 1 0 1 1 0 0   (Decimal 44)
Value n - 1:    0 0 1 0 1 0 1 1   (Lowest 1 flipped, lower bits set)
Bitwise AND:    0 0 1 0 1 0 0 0   (Lowest 1-bit cleared to 0!)
```

The transformation $n \ \& \ (n - 1)$ strips away the lowest set 1-bit in a single step.

$$n = \dots 1000_2 \implies n - 1 = \dots 0111_2 \implies n \land (n - 1) = \dots 0000_2$$

Let's contrast the naive loop against Brian Kernighan's algorithm and compiler intrinsics.

```cpp
// Brian Kernighan's Population Count: Theta(number of set bits)
int count_set_bits_kernighan(int n) {
    int count = 0;
    while (n > 0) {
        n = n & (n - 1); // Clears the lowest set 1-bit
        count++;
    }
    return count;
}

// Hardware-Accelerated Compiler Builtin: 1 CPU cycle
int count_set_bits_hardware(unsigned int n) {
    return __builtin_popcount(n); // Maps directly to CPU POPCNT instruction
}
```

| Approach | Operations for $n = 44$ (`101100_2`) | Time Complexity | Portability |
| :--- | :--- | :--- | :--- |
| Naive Loop | $32$ iterations | $\Theta(\text{total bits}) = 32$ | Fully portable |
| Kernighan's Algorithm | Exactly $3$ iterations | $\Theta(\text{set bits})$ | Fully portable |
| Compiler Builtin | $1$ CPU instruction | $\Theta(1)$ single cycle | GCC / Clang intrinsic |
| 8-Bit Lookup Table | $4$ table lookups | $\Theta(1)$ cached array | Portable & fast |

```text
Step 1: n = 44 (101100) & 43 (101011) ===> n = 40 (101000), count = 1
Step 2: n = 40 (101000) & 39 (100111) ===> n = 32 (100000), count = 2
Step 3: n = 32 (100000) & 31 (011111) ===> n =  0 (000000), count = 3
Process terminates in exactly 3 steps!
```

> [!IMPORTANT]
> Use `__builtin_popcountll(n)` for 64-bit `unsigned long long` integers to avoid 32-bit truncation errors.

Let's now examine power-of-two tests and isolating the lowest set bit.


#### Complexity Analysis
- **Time Complexity:** $O(\text{set bits})$ for Brian Kernighan's algorithm, $O(1)$ for hardware `__builtin_popcount`.
- **Auxiliary Space:** $O(1)$ workspace memory.

---


## Bit Tricks & Real-World Patterns


### Power of Two & Least Significant Bit (LSB) Isolation

In binary, powers of two ($1, 2, 4, 8, 16, \dots$) contain exactly one set bit (`1`, `10`, `100`, `1000`, $\dots$).

Using Brian Kernighan's bit-clearing trick, clearing that single set bit must reduce the value to zero.

```text
Value n:        0 0 1 0 1 1 0 0   (Decimal 44)
Invert (~n):    1 1 0 1 0 0 1 1
Add 1 (-n):     1 1 0 1 0 1 0 0   (Two's complement -n)
AND (n & -n):   0 0 0 0 0 1 0 0   (Isolated LSB = 4!)
```

In two's complement, $-n = \sim n + 1$. Bitwise ANDing $n$ with its negative $-n$ clears all bits except the lowest set bit.

$$n \land (-n) = \text{isolated least significant set 1-bit}$$

This LSB extraction pattern is the core indexing mechanism in Fenwick Trees (Binary Indexed Trees).

```cpp
// Power of Two & LSB Helpers
bool is_power_of_two(int n) {
    return n > 0 && (n & (n - 1)) == 0; // Exactly one bit set
}

int get_lsb(int n) {
    return n & (-n); // Extracts isolated lowest set bit
}

int clear_lsb(int n) {
    return n & (n - 1); // Strips lowest set bit
}
```

| Value ($n$) | Binary Representation | Two's Complement ($-n$) | Extracted LSB (`n & -n`) | Is Power of 2? |
| :--- | :--- | :--- | :--- | :--- |
| $6$ | `00000110` | `11111010` | `00000010` ($2$) | **No** |
| $8$ | `00001000` | `11111000` | `00001000` ($8$) | **Yes** |
| $12$ | `00001100` | `11110100` | `00000100` ($4$) | **No** |
| $16$ | `00010000` | `11110000` | `00010000` ($16$) | **Yes** |

```text
 n:   0  0  0  0  1  1  0  0
-n:   1  1  1  1  0  1  0  0
----------------------------
 &:   0  0  0  0  0  1  0  0  ===> Output: 4 (LSB Isolated)
```

> [!WARNING]
> Always include the `n > 0` check when testing for powers of two; otherwise $n = 0$ incorrectly evaluates `0 & -1 == 0` as true.

Let's now examine XOR parity invariants for finding unique array elements.


#### Complexity Analysis
- **Time Complexity:** $O(1)$ single-cycle machine instruction per trick.
- **Auxiliary Space:** $O(1)$ workspace memory.

---


### Unpaired Sensor Beacon Isolation & XOR Parity Invariants

In duplex telemetry transmission streams, sensor packets are broadcast in duplicate confirmation pairs $(id, id)$, except for one faulty sensor node that transmitted an unpaired solitary beacon $u$.

Because XOR is commutative, associative, and self-canceling ($A \oplus A = 0$ and $A \oplus 0 = A$), XORing all received packet IDs together cancels every matched transmission pair.

```text
Packet Stream: [ 104, 101, 102, 101, 102 ]
XOR Accumulator: (104) ^ (101 ^ 101) ^ (102 ^ 102)
Evaluation:      104 ^ 0 ^ 0 = 104
Result: Paired transmissions vanish; only the faulty ID remains!
```

The mathematical identity formalizes the cancellation of all paired terms.

$$\bigoplus_{i=1}^{2k+1} A_i = (x_1 \oplus x_1) \oplus \dots \oplus (x_k \oplus x_k) \oplus u = 0 \oplus \dots \oplus 0 \oplus u = u$$

This isolates the unpaired faulty sensor ID in $O(n)$ time and $O(1)$ auxiliary memory without using hash tables.

```cpp
// Unpaired Telemetry Beacon: Isolate 1 solitary ID among paired streams
int isolate_unpaired_sensor_beacon(const vector<int>& packet_stream) {
    int unpaired_id = 0;
    for (int packet_id : packet_stream) {
        unpaired_id ^= packet_id; // Matched transmission pairs cancel out to 0
    }
    return unpaired_id;
}
```

When a network stream contains TWO faulty sensors $(u_1, u_2)$ emitting unpaired packets among matched pairs, the total XOR sum equals $u_1 \oplus u_2$.

We extract the lowest set bit of this XOR sum to partition the stream into two disjoint frequency buckets, isolating each faulty sensor ID independently.

```text
xor_sum = u1 ^ u2 (Since u1 != u2, at least one bit is set: lsb)

Stream Elements Partitioned by (packet_id & lsb):
Bucket 1 (Bit is 1): [ Paired IDs... ] + { u1 } ===> XOR = u1
Bucket 2 (Bit is 0): [ Paired IDs... ] + { u2 } ===> XOR = u2
Both anomalous sensor IDs isolated in a single pass!
```

> [!NOTE]
> **C++ Syntax — Pair Containers:** `pair<T1, T2>` bundles heterogeneous objects:
> `pair<int, int>` bundles two heterogeneous objects into a single unit, accessible via `.first` and `.second` (or via structured bindings `auto [a, b] = p`).

```cpp
// Dual Unpaired Beacon Isolation: Partition 2 anomalous IDs via LSB differentiator
pair<int, int> isolate_dual_unpaired_beacons(const vector<int>& packet_stream) {
    long long xor_sum = 0;
    for (int packet_id : packet_stream) xor_sum ^= packet_id;

    long long lsb = xor_sum & (-xor_sum); // Differentiating bit between u1 and u2
    int u1 = 0, u2 = 0;
    for (int packet_id : packet_stream) {
        if (packet_id & lsb) u1 ^= packet_id; // Bucket 1: differentiating bit set
        else u2 ^= packet_id;                 // Bucket 2: differentiating bit clear
    }
    return {u1, u2};
}
```

#### Complexity Analysis
- **Time Complexity:** $\Theta(n)$ single-pass linear scan across the array.
- **Auxiliary Space:** $O(1)$ scalar tracking workspace.

---


### Bitmask Combinatorics & Submask Enumeration

Bitmask combinatorics maps each integer $mask \in [0, 2^N - 1]$ to a unique subset of an $N$-element collection.

Iterating through all submasks of all masks using naive nested loops takes $O(4^N)$ time, but the submask decrement trick runs in optimal $\Theta(3^N)$ total operations.

```text
Target Mask:     1 1 0 1   (Decimal 13)
Decrement Trick: sub = (sub - 1) & mask
Step 1: (13 - 1) & 13 = 12 & 13 = 12 (1100)
Step 2: (12 - 1) & 13 = 11 & 13 = 9  (1001)
Step 3: (9 - 1)  & 13 = 8  & 13 = 8  (1000)
Step 4: (8 - 1)  & 13 = 7  & 13 = 5  (0101) ...
Visits ONLY valid submasks in descending order!
```

The Binomial Theorem proves that iterating over all submasks across all masks takes $3^N$ operations.

$$\sum_{k=0}^N \binom{N}{k} 2^k = (1 + 2)^N = 3^N \ll 4^N$$

Let's implement power set generation and the submask enumeration loop.

```cpp
// Power Set Generation: 2^N Subsets
void generate_power_set(const vector<int>& arr) {
    int n = arr.size();
    for (int mask = 0; mask < (1 << n); ++mask) {
        // mask represents a unique subset
    }
}

// Optimal Submask Enumeration for a given mask: O(2^k)
void enumerate_submasks(int mask) {
    for (int sub = mask; sub > 0; sub = (sub - 1) & mask) {
        // 'sub' is a valid non-empty submask of 'mask'
    }
    // Handle empty submask (sub = 0) separately if needed
}
```

| Iteration Step | Formula `(sub - 1) & 13` | Binary Submask | Decimal Value | Elements Selected from `{A, B, C, D}` |
| :--- | :--- | :--- | :--- | :--- |
| Start | `mask` | `1101` | $13$ | $\{A, C, D\}$ |
| Step 1 | `(13 - 1) & 13` | `1100` | $12$ | $\{C, D\}$ |
| Step 2 | `(12 - 1) & 13` | `1001` | $9$ | $\{A, D\}$ |
| Step 3 | `(9 - 1) & 13` | `1000` | $8$ | $\{D\}$ |
| Step 4 | `(8 - 1) & 13` | `0101` | $5$ | $\{A, C\}$ |
| Step 5 | `(5 - 1) & 13` | `0100` | $4$ | $\{C\}$ |
| Step 6 | `(4 - 1) & 13` | `0001` | $1$ | $\{A\}$ |
| Step 7 | `(1 - 1) & 13` | `0000` | $0$ (Done) | $\emptyset$ (Empty Set) |

```text
         [ 1101 ] ({A,C,D})
        /    |   \
[ 1100 ]  [ 1001 ]  [ 0101 ]
   \        /          /
[ 1000 ]  [ 0100 ]  [ 0001 ]
       \     |     /
         [ 0000 ] ({})
```

> [!WARNING]
> `1 << N` overflows a 32-bit signed integer when $N \ge 31$. Always write `1ULL << N` when handling up to 64 elements.

This concludes our Bit Manipulation chapter, providing techniques for bitwise math, masking, popcounts, parity invariants, and combinatorial traversals.


#### Complexity Analysis
- **Time Complexity:** $O(2^k)$ to iterate all submasks of a mask with $k$ set bits; $\Theta(3^N)$ across all subsets of size $N$.
- **Auxiliary Space:** $O(1)$ scalar variable workspace.

---


## Cheat Sheet & Quick Reference

| Bit Trick / Idiom | C++ Syntax | Result / Purpose |
| :--- | :--- | :--- |
| Test Bit $k$ | `(x & (1 << k)) != 0` | Returns true if $k$-th bit is 1 |
| Set Bit $k$ | `x \| (1 << k)` | Turns $k$-th bit ON |
| Clear Bit $k$ | `x & ~(1 << k)` | Turns $k$-th bit OFF |
| Toggle Bit $k$ | `x ^ (1 << k)` | Flips $k$-th bit ($0 \leftrightarrow 1$) |
| Clear Lowest Set Bit | `n & (n - 1)` | Strips the least significant 1-bit |
| Extract Lowest Set Bit (LSB) | `n & (-n)` | Isolates the least significant 1-bit |
| Power of Two Test | `n > 0 && (n & (n - 1)) == 0` | Checks if $n$ is a power of 2 |
| Fast Multiplication by $2^k$ | `x << k` | Computes $x \cdot 2^k$ |
| Fast Division by $2^k$ | `x >> k` | Computes $\lfloor x / 2^k \rfloor$ |
| Population Count | `__builtin_popcount(n)` | Counts total set 1-bits |
| Parity Isolation (Pairs) | `xor_all ^= num` | Cancels duplicate pairs to find unique ID |
| Submask Enumeration Loop | `for(int s=m; s>0; s=(s-1)&m)` | Iterates submasks in $O(2^k)$ |
