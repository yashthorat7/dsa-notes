# Chapter 3: Math & Number Theory

---

## Basic Math & Modular Arithmetic

### Modular Arithmetic & Congruence Properties

Imagine looking at a standard 12-hour analog wall clock. If the current time is 9:00 and we wait 5 hours, the clock displays 2:00, not 14:00.

Modular arithmetic operates over cyclic remainder rings where numbers wrap around a fixed modulo boundary $m$. We write $a \equiv b \pmod m$ when $m$ divides $(a - b)$.

```text
                    [ 0 ]
               /             \
          [ 6 ]               [ 1 ]
         /                         \
       [ 5 ]                       [ 2 ]
         \                         /
          [ 4 ]               [ 3 ]
               \             /
                    ---
Equivalence Classes: ... -7, 0, 7, 14 ... belong to [0]
```

Modular arithmetic preserves fundamental algebraic operations across addition, subtraction, and multiplication, allowing us to apply the modulo operator at intermediate calculation steps.

$$(a + b) \bmod m = ((a \bmod m) + (b \bmod m)) \bmod m$$

$$(a \cdot b) \bmod m = ((a \bmod m) \cdot (b \bmod m)) \bmod m$$

A common pitfall in C++ is the `%` operator returning negative remainders for negative operands (for example, `-1 % 7` evaluates to `-1` instead of `6`).

```cpp
// Safe Modular Arithmetic Helpers (Modulo: 10^9 + 7)
const long long MOD = 1000000007;

long long mod_add(long long a, long long b, long long m = MOD) {
    return (a % m + b % m + m) % m; // Adding m prevents negative wraps
}

long long mod_sub(long long a, long long b, long long m = MOD) {
    return (a % m - b % m + m) % m; // Always returns non-negative remainder
}

long long mod_mul(long long a, long long b, long long m = MOD) {
    return ((a % m) * (b % m)) % m;
}
```

| Expression | Direct C++ Evaluation | Safe Modular Wrapper | Correct Ring Value |
| :--- | :--- | :--- | :--- |
| `5 + 9 (mod 7)` | `(5 + 9) % 7 = 0` | `mod_add(5, 9, 7) = 0` | $0$ |
| `2 - 5 (mod 7)` | `(2 - 5) % 7 = -3` (**Bug!**) | `mod_sub(2, 5, 7) = 4` | $4$ |
| `-8 mod 7` | `-8 % 7 = -1` (**Bug!**) | `(-8 % 7 + 7) % 7 = 6` | $6$ |
| `10^9 * 10^9 (mod 10^9+7)` | 64-bit overflow without mod | `mod_mul(10^9, 10^9) = 49` | $49$ |

```text
... -3   -2   -1    0    1    2    3    4    5    6    7    8 ...
     |    |    |    |    |    |    |    |    |    |    |    |
    [4]  [5]  [6]  [0]  [1]  [2]  [3]  [4]  [5]  [6]  [0]  [1]
```

Notice that regular division does not distribute over modulo. Computing $(a / b) \bmod m$ requires multiplying by the modular multiplicative inverse of $b$.

> [!WARNING]
> In C++, the expression `(a - b) % m` can be negative when $a < b$. Always write `(a - b + m) % m` to guarantee a non-negative remainder.

Let's now study how numbers are represented across different positional base systems.

#### Complexity Analysis
- **Time Complexity:** $O(1)$ constant time for basic modular arithmetic operations.
- **Auxiliary Space:** $O(1)$ workspace memory.

---

### Base Expansions & Base Conversions

Positional numeral systems represent any positive integer $N$ in a chosen base $b$ as a polynomial of positional weights.

Common computational bases include Binary (base 2), Octal (base 8), Decimal (base 10), and Hexadecimal (base 16).

```text
Binary String:   1       1       0       1  (Base 2)
Place Weights:  2^3     2^2     2^1     2^0
Evaluation:   1 * 8 + 1 * 4 + 0 * 2 + 1 * 1 = 13 (Decimal)
```

We convert a decimal integer $N$ into an arbitrary target base $b$ using repeated division and remainder extraction.

$$N = \sum_{i=0}^{k-1} d_i \cdot b^i \quad \text{where } 0 \le d_i < b$$

The remainders collected from repeated division form the digits of the converted number in reverse order, from least to most significant.

```cpp
// Arbitrary Base Conversion: Decimal to Base-b String
string to_base(long long n, int base) {
    if (n == 0) return "0";
    string digits = "0123456789ABCDEF";
    string result = "";
    while (n > 0) {
        result += digits[n % base]; // Extract remainder digit
        n /= base;                  // Shift to next positional digit
    }
    reverse(result.begin(), result.end()); // Reverse to get MSB to LSB
    return result;
}
```

| Decimal ($N$) | Binary (Base 2) | Octal (Base 8) | Hexadecimal (Base 16) |
| :--- | :--- | :--- | :--- |
| $0$ | `0` | `0` | `0` |
| $5$ | `101` | `5` | `5` |
| $10$ | `1010` | `12` | `A` |
| $15$ | `1111` | `17` | `F` |
| $255$ | `11111111` | `377` | `FF` |

```text
13 / 2 = 6,  Remainder = 1 (LSB)  ^ Read digits upward:
 6 / 2 = 3,  Remainder = 0        |
 3 / 2 = 1,  Remainder = 1        | "1101"
 1 / 2 = 0,  Remainder = 1 (MSB)  |
```

```text
Binary:   [ 1 1 0 1 ]   [ 1 1 1 1 ]   [ 0 0 1 0 ]
Hex digit:     D             F             2
Direct mapping: 4 binary bits = exactly 1 hexadecimal digit
```

> [!TIP]
> Grouping binary bits into chunks of 3 (octal) or 4 (hex) converts between bases in $O(1)$ per digit without expensive arithmetic division.

Let's now explore manipulating and reversing digits without converting to strings.

#### Complexity Analysis
- **Time Complexity:** $\Theta(\log_b N)$ steps corresponding to the number of digits in base $b$.
- **Auxiliary Space:** $O(\log_b N)$ memory to store the resulting character string.

---

### Positional Notation Arithmetic & Digit Manipulation

Extracting, summing, and reversing digits are common operations in algorithmic coding. We manipulate digits purely with arithmetic operators without string conversions.

The total digit count of a positive integer $N$ in base $b$ is directly proportional to its base-$b$ logarithm.

```text
n % 10 ---> Extracts the least significant digit (Rightmost digit)
n /= 10 ---> Discards the least significant digit (Pops digit)
rev = rev * 10 + pop ---> Reconstructs integer from left to right
```

The mathematical formula for the number of digits in base $b$ accounts for logarithmic magnitude growth.

$$\text{digits}(N, b) = \lfloor \log_b N \rfloor + 1 \quad (N > 0)$$

When reversing integers, we must check for 32-bit signed integer overflow before multiplying by 10.

```cpp
// Safe 32-bit Integer Reversal with Overflow Guards
int reverse_integer(int x) {
    int rev = 0;
    while (x != 0) {
        int pop = x % 10;
        x /= 10;
        // Check upper overflow boundary against INT_MAX (2147483647)
        if (rev > 214748364 || (rev == 214748364 && pop > 7)) return 0;
        // Check lower overflow boundary against INT_MIN (-2147483648)
        if (rev < -214748364 || (rev == -214748364 && pop < -8)) return 0;
        rev = rev * 10 + pop;
    }
    return rev;
}
```

| Iteration Step | Input Variable ($x$) | Extracted Digit (`pop`) | Reconstructed Value (`rev`) |
| :--- | :--- | :--- | :--- |
| Start | $12345$ | $-$ | $0$ |
| Iteration 1 | $1234$ | $5$ | $5$ |
| Iteration 2 | $123$ | $4$ | $54$ |
| Iteration 3 | $12$ | $3$ | $543$ |
| Iteration 4 | $1$ | $2$ | $5432$ |
| Iteration 5 | $0$ | $1$ | **54321** (Done) |

```text
[ 12345 ] ---> pop = 5 ---> rev = 5
[ 1234  ] ---> pop = 4 ---> rev = 54
[ 123   ] ---> pop = 3 ---> rev = 543
[ 12    ] ---> pop = 2 ---> rev = 5432
[ 1     ] ---> pop = 1 ---> rev = 54321
```

```text
Digital root of N is the iterative sum of its digits until 1 digit.
Closed form: dr(N) = 1 + ((N - 1) % 9)  for all N > 0
Example: dr(987) = 1 + (986 % 9) = 1 + 5 = 6. (9+8+7 = 24 -> 2+4=6)
```

> [!WARNING]
> Integer reversal can easily overflow standard 32-bit signed integer boundaries (`INT_MAX = 2147483647`). Always guard `rev * 10 + pop`.

Let's now examine prime numbers and primality testing algorithms.

#### Complexity Analysis
- **Time Complexity:** $\Theta(\log_{10} N)$ time proportional to the number of decimal digits.
- **Auxiliary Space:** $O(1)$ auxiliary memory for scalar accumulator registers.

---

## Primes & Factorization

### Primality Testing via Trial Division

Prime numbers are integers strictly greater than 1 whose only positive divisors are 1 and themselves. They serve as the multiplicative building blocks of all integers.

When testing if $N$ is prime, we only need to test potential divisors up to $\sqrt{N}$ because divisors always occur in complementary pairs $(d, N/d)$.

```text
  1 x 36 = 36
  2 x 18 = 36
  3 x 12 = 36
  4 x 9  = 36
  6 x 6  = 36  <--- sqrt(36) = 6 (Inflection Point)
-------------------------------------------------------------------
  9 x 4  = 36  (Reflected Mirror Pairs below sqrt(N))
 12 x 3  = 36
 18 x 2  = 36
 36 x 1  = 36
```

If $N$ has a non-trivial factor $a \le b$ such that $a \cdot b = N$, then $a$ must satisfy $a \le \sqrt{N}$.

$$N = a \cdot b \quad (1 < a \le b < N) \implies a^2 \le a \cdot b = N \implies a \le \sqrt{N}$$

We can optimize trial division further by testing 2 and 3 first, then stepping through potential prime candidates of the form $6k \pm 1$.

```cpp
// Optimized O(sqrt(N)) Primality Test with 6k +/- 1 Stepping
bool is_prime(long long n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;
    for (long long i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) return false; // Found divisor!
    }
    return true;
}
```

| $N$ | $\lfloor \sqrt{N} \rfloor$ | Candidates Tested ($6k \pm 1$) | Divisors Found | Result |
| :--- | :--- | :--- | :--- | :--- |
| $37$ | $6$ | $2, 3, 5$ | None | **Prime** |
| $49$ | $7$ | $2, 3, 5, 7$ | $7$ ($49 = 7 \times 7$) | **Composite** |
| $101$ | $10$ | $2, 3, 5, 7$ | None | **Prime** |
| $121$ | $11$ | $2, 3, 5, 7, 11$ | $11$ ($121 = 11 \times 11$) | **Composite** |

```text
Naive Trial Division:       Test all integers up to N      -> O(N)
Square Root Optimization:   Test all integers up to sqrt(N)-> O(N^0.5)
6k +/- 1 Optimization:      Skips multiples of 2 and 3    -> O(N^0.5 / 3)
```

> [!TIP]
> Use `i * i <= n` instead of `i <= sqrt(n)` in your loop condition to avoid floating-point precision issues and function call overhead.

Let's now look at probabilistic tests designed for large numbers where $\sqrt{N}$ is too slow.

#### Complexity Analysis
- **Time Complexity:** $O(\sqrt{N} / 3) \approx O(\sqrt{N})$ trial division steps.
- **Auxiliary Space:** $O(1)$ workspace memory.

---

### Fermat Primality Testing & Probabilistic Bounds

When testing numbers with hundreds of digits, even an $O(\sqrt{N})$ trial division loop would run for centuries.

Probabilistic primality testing trades absolute certainty for $O(k \log N)$ execution speed on massive numbers.

```text
Test Condition: a^(n-1) == 1 (mod n)
If a^(n-1) != 1 (mod n)  ===> 'a' is a WITNESS (n is COMPOSITE!)
If a^(n-1) == 1 (mod n)  ===> 'a' is a LIAR (n is PROBABLY PRIME)
```

Fermat's Primality Test is based on Fermat's Little Theorem: if $p$ is prime and $\gcd(a, p) = 1$, then $a^{p-1} \equiv 1 \pmod p$.

$$a^{n-1} \not\equiv 1 \pmod n \implies n \text{ is guaranteed composite}$$

However, Carmichael numbers (such as 561, 1105, 1729) are composite numbers that satisfy $a^{n-1} \equiv 1 \pmod n$ for all coprime bases $a$.

```cpp
// Fermat Probabilistic Primality Tester (k randomized trials)
bool fermat_test(long long n, int k, mt19937_64& rng) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    for (int i = 0; i < k; ++i) {
        long long a = 2 + (rng() % (n - 3));
        if (mod_pow(a, n - 1, n) != 1) return false; // Composite witness!
    }
    return true; // Probably prime
}
```

| Number of Trials ($k$) | Max Error on Non-Carmichael | Confidence |
| :--- | :--- | :--- |
| $1$ | $50.0\%$ | $50.0\%$ |
| $5$ | $3.125\%$ | $96.875\%$ |
| $10$ | $0.097\%$ | $99.903\%$ |
| $30$ | $9.3 \times 10^{-10}$ | **> 99.9999999%** |

```text
All Composite Numbers
  +-----------------------------------------------------------+
  | Caught by Fermat Witnesses (e.g. 9, 15, 21, 35)           |
  +-----------------------------------------------------------+
  | Carmichael Numbers (Fools Fermat: 561, 1105, 1729...)     |
  +-----------------------------------------------------------+
```

Miller-Rabin eliminates Carmichael failure modes by checking for non-trivial square roots of 1 modulo $n$, providing reliable primality verification.

> [!CAUTION]
> Fermat's test fails on Carmichael numbers regardless of how many random bases you test. Use the Miller-Rabin test for reliable primality checking.

Let's now study generating all primes in a range using sieve algorithms.

#### Complexity Analysis
- **Time Complexity:** $O(k \log N)$ using binary modular exponentiation across $k$ base trials.
- **Auxiliary Space:** $O(1)$ scalar variable workspace.

---

### Sieve of Eratosthenes & Segmented Sieve

The Sieve of Eratosthenes finds all prime numbers up to $N$ by iteratively crossing out composite multiples of known primes.

When crossing out multiples of prime $p$, we can start marking at $p^2$ because smaller multiples $k \cdot p$ (with $k < p$) have already been marked by smaller prime factors.

```text
[ 2]   [ 3]   ( 4)   [ 5]   ( 6)   [ 7]   ( 8)   ( 9)   (10)
[11]   (12)   [13]   (14)   (15)   (16)   [17]   (18)   [19]
(20)   (21)   (22)   [23]   (24)   (25)
Legend: [Prime Number]  (Crossed-Out Composite)
```

The time complexity is derived by summing the reciprocals of prime numbers up to $N$, which forms the harmonic prime series.

$$\sum_{p \le N} \frac{N}{p} = N \sum_{p \le N} \frac{1}{p} = \Theta(N \log \log N)$$

Let's implement the standard Sieve of Eratosthenes returning all primes up to $N$.

```cpp
// Sieve of Eratosthenes: O(N log log N) Time
vector<int> sieve_eratosthenes(int n) {
    vector<bool> is_prime_flag(n + 1, true);
    is_prime_flag[0] = is_prime_flag[1] = false;
    for (int p = 2; p * p <= n; ++p) {
        if (is_prime_flag[p]) {
            // Start crossing out at p * p
            for (int i = p * p; i <= n; i += p) {
                is_prime_flag[i] = false;
            }
        }
    }
    vector<int> primes;
    for (int i = 2; i <= n; ++i) {
        if (is_prime_flag[i]) primes.push_back(i);
    }
    return primes;
}
```

When $N$ is up to $10^{12}$ but we only need primes in a range $[L, R]$ where $R - L \le 10^6$, we use the Segmented Sieve.

```text
Target Range: [ L = 100 ................................ R = 110 ]
Local Buffer: [ 0 ][ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ][ 9 ][10]
Mapping: Index 'k' in local buffer represents integer (L + k)
Base Primes: Precompute primes up to sqrt(R) = sqrt(110) ~ 10
```

| Sieve Type | Target Range | Time Complexity | Memory Footprint |
| :--- | :--- | :--- | :--- |
| Standard Sieve | $[1, N]$ ($N \le 10^7$) | $O(N \log \log N)$ | $O(N)$ bits |
| Segmented Sieve | $[L, R]$ ($R \le 10^{12}, R-L \le 10^6$) | $O((R-L) \log \log R + \sqrt{R})$ | $O(R - L + \sqrt{R})$ |
| Linear Sieve (Euler) | $[1, N]$ ($N \le 10^7$) | $\Theta(N)$ strictly linear | $O(N)$ integer array |

```text
[ 1 .. sqrt(R) ] ===> Marks composites in ===> [ L .............. R ]
(Base Primes)                                  (Offset buffer)
```

> [!WARNING]
> Storing boolean arrays for $N > 10^8$ in standard integer containers causes memory limits to be exceeded. Use `vector<bool>` or `bitset` to pack 8 flags per byte.

Let's now examine Euler's Linear Sieve, which achieves strictly $O(N)$ prime generation.

#### Complexity Analysis
- **Time Complexity:** $O(N \log \log N)$ time for the standard sieve up to $N$.
- **Auxiliary Space:** $O(N)$ bits of storage for the boolean prime flag array.

---

### Linear Sieve (Euler's Sieve) & Smallest Prime Factor (SPF)

The standard sieve does redundant work by crossing out composite numbers multiple times (for example, 12 is marked by 2, 3, 4, and 6).

Euler's Linear Sieve guarantees that every composite number is marked exactly once by its Smallest Prime Factor (SPF), achieving strictly $\Theta(N)$ time.

```text
Index i:   [ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ][ 9 ][ 10 ][ 11 ][ 12 ]
SPF[i]:    [ 2 ][ 3 ][ 2 ][ 5 ][ 2 ][ 7 ][ 2 ][ 3 ][  2 ][ 11 ][  2 ]
Query: Factorize 12 -> SPF[12]=2 -> SPF[6]=2 -> SPF[3]=3 -> Done!
```

The loop break condition `if (i % p == 0) break;` enforces the mathematical invariant that $p$ remains the smallest prime factor of the composite $i \cdot p$.

$$x = i \cdot p \implies p = \text{SPF}(x) \quad \text{and} \quad p \le \text{SPF}(i)$$

Let's implement Euler's Linear Sieve and use its SPF array for $O(\log N)$ factorization queries.

```cpp
// Linear Sieve (Euler's Sieve): Theta(N) Time
const int MAXN = 10000000;
int spf[MAXN + 1];
vector<int> primes;

void linear_sieve(int n) {
    for (int i = 2; i <= n; ++i) {
        if (spf[i] == 0) {
            spf[i] = i; // i is prime, SPF is itself
            primes.push_back(i);
        }
        for (int p : primes) {
            if (p > spf[i] || (long long)i * p > n) break;
            spf[i * p] = p; // Mark composite strictly with its SPF
        }
    }
}
```

| Integer $x$ | $\text{SPF}[x]$ | Next Quotient ($x / \text{SPF}[x]$) | Prime Factor Extracted |
| :--- | :--- | :--- | :--- |
| $60$ | $2$ | $30$ | $2$ |
| $30$ | $2$ | $15$ | $2$ |
| $15$ | $3$ | $5$ | $3$ |
| $5$ | $5$ | $1$ (Terminal) | $5$ |

```text
[ 60 ] ---> (SPF: 2) ---> [ 30 ] ---> (SPF: 2)
                                        |
[ 5 ] (Prime!) <--- (SPF: 3) <--- [ 15 ]<
Total Steps = log2(60) = 4 Operations!
```

```text
If p divides i:       phi(i * p) = phi(i) * p
If p does not divide: phi(i * p) = phi(i) * (p - 1)
Totient values computed directly inside linear sieve loop!
```

> [!TIP]
> Storing the SPF array up to $N = 10^7$ consumes 40 MB of RAM, easily fitting within standard competitive programming limits.

Let's now explore the Euclidean algorithm for computing Greatest Common Divisors.

#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ time to generate primes and populate the SPF array, $O(\log N)$ per factorization query.
- **Auxiliary Space:** $\Theta(N)$ space for the SPF lookup array.

---

## GCD, LCM & Exponentiation

### Euclidean Algorithm & GCD/LCM Computation

The Greatest Common Divisor ($\gcd(a, b)$) of two integers is the largest positive integer that divides both $a$ and $b$ without a remainder.

Euclid's algorithm is based on the invariant that any common divisor of $a$ and $b$ also divides their difference and remainder $a \bmod b$.

```text
Rectangle of dimensions (a = 252) by (b = 105):
Step 1: Tile with 105x105 squares -> Remainder rectangle 42 x 105
Step 2: Tile with 42x42 squares   -> Remainder rectangle 21 x 42
Step 3: Tile with 21x21 squares   -> Remainder = 0! GCD = 21
```

Lamé's Theorem proves that the Euclidean algorithm terminates in $O(\log(\min(a, b)))$ steps, with its worst-case occurring on consecutive Fibonacci numbers.

$$\gcd(a, b) = \gcd(b, a \bmod b), \quad \text{lcm}(a, b) = \frac{|a \cdot b|}{\gcd(a, b)} = \left(\frac{a}{\gcd(a, b)}\right) \cdot b$$

When computing the Least Common Multiple ($\text{lcm}$), always divide by the GCD before multiplying to prevent integer overflow.

```cpp
// Euclidean GCD & Safe LCM
long long gcd_euclid(long long a, long long b) {
    while (b != 0) {
        long long rem = a % b;
        a = b;
        b = rem;
    }
    return a;
}

long long lcm_safe(long long a, long long b) {
    if (a == 0 || b == 0) return 0;
    return (a / gcd_euclid(a, b)) * b; // Divide before multiplying!
}
```

| Step ($k$) | Dividend ($a$) | Divisor ($b$) | Quotient ($q = \lfloor a/b \rfloor$) | Remainder ($r = a \bmod b$) |
| :--- | :--- | :--- | :--- | :--- |
| Step 1 | $252$ | $105$ | $2$ | $42$ |
| Step 2 | $105$ | $42$ | $2$ | $21$ |
| Step 3 | $42$ | $21$ | $2$ | $0$ (Done: $\gcd = 21$) |

```text
gcd(252, 105) ===> gcd(105, 42) ===> gcd(42, 21) ===> gcd(21, 0)
Terminal GCD Output: 21
```

```text
Replaces costly modulo arithmetic with bitwise shifts:
Both even:  gcd(2a, 2b) = 2 * gcd(a, b)
One even:   gcd(2a, b)  = gcd(a, b)
Both odd:   gcd(a, b)   = gcd(|a - b| / 2, min(a, b))
```

> [!WARNING]
> Computing `(a * b) / gcd(a, b)` can cause 64-bit integer overflow even when the final answer fits. Always compute `(a / gcd(a, b)) * b`.

Let's now extend Euclid's algorithm to solve linear Diophantine equations.

#### Complexity Analysis
- **Time Complexity:** $O(\log(\min(a, b)))$ logarithmic reduction steps.
- **Auxiliary Space:** $O(1)$ workspace memory for iterative updates.

---

### Extended Euclidean Algorithm & Bézout's Identity

Bézout's Identity states that for any non-zero integers $a$ and $b$, there exist integers $x$ and $y$ such that $a x + b y = \gcd(a, b)$.

The Extended Euclidean algorithm computes the Greatest Common Divisor while also calculating the Bézout coefficients $(x, y)$.

```text
Recursive call returns: b * x1 + (a % b) * y1 = g
Substitute a % b = a - floor(a/b) * b:
b * x1 + (a - floor(a/b) * b) * y1 = g
Regroup terms: a * y1 + b * (x1 - floor(a/b) * y1) = g
Updated coefficients: x = y1,  y = x1 - floor(a/b) * y1
```

This mathematical derivation gives us the recurrence for transforming $(x_1, y_1)$ back into $(x, y)$.

$$a \cdot y_1 + b \cdot \left(x_1 - \left\lfloor \frac{a}{b} \right\rfloor y_1\right) = \gcd(a, b)$$

Let's implement the Extended Euclidean algorithm using pass-by-reference coefficients.

```cpp
// Extended Euclidean Algorithm: Returns gcd(a,b) and computes x, y
long long ext_gcd(long long a, long long b, long long& x, long long& y) {
    if (b == 0) {
        x = 1;
        y = 0;
        return a;
    }
    long long x1, y1;
    long long g = ext_gcd(b, a % b, x1, y1);
    x = y1;
    y = x1 - (a / b) * y1;
    return g;
}
```

| Recursive Depth | Call Arguments $(a, b)$ | Subproblem Returns $(x_1, y_1)$ | Computed $(x, y)$ | Equation Verification |
| :--- | :--- | :--- | :--- | :--- |
| Depth 2 (Base) | $(20, 0)$ | $-$ | $(1, 0)$ | $20(1) + 0(0) = 20$ |
| Depth 1 | $(30, 20)$ | $(1, 0)$ | $(0, 1 - 1(0)) = (0, 1)$ | $30(0) + 20(1) = 20$ |
| Depth 0 (Root) | $(50, 30)$ | $(0, 1)$ | $(1, 0 - 1(1)) = (1, -1)$ | $50(1) + 30(-1) = 20$ |

```text
[ Base: b = 0 ] ---> Returns (x=1, y=0)
       |
[ Step: 30, 20 ] ---> Unwinds to (x=0, y=1)
       |
[ Root: 50, 30 ] ---> Unwinds to (x=1, y=-1) ===> 50*(1)+30*(-1)=20!
```

```text
Equation: a * x + b * y = c
Solvability Check: c must be divisible by gcd(a, b)
General Solution: x = x0 + k * (b/g),   y = y0 - k * (a/g)
```

> [!CAUTION]
> Bézout coefficients $(x, y)$ are not unique; infinite valid integer pairs exist, parameterized by any integer $k$.

Let's now study fast binary exponentiation.

#### Complexity Analysis
- **Time Complexity:** $O(\log(\min(a, b)))$ logarithmic recursive unwinding steps.
- **Auxiliary Space:** $O(\log(\min(a, b)))$ call stack frames.

---

### Binary Exponentiation ($O(\log P)$)

Computing $a^b$ when $b = 10^{18}$ using a linear multiplication loop would require billions of operations.

Binary exponentiation computes $a^b$ in $O(\log b)$ time by repeatedly squaring the base and halving the exponent.

```text
[ a^16 ]
   | (Square)
[ a^8  ]
   | (Square)
[ a^4  ]
   | (Square)
[ a^2  ]
   | (Square)
[ a^1  ] ---> 4 operations vs 16 steps!
```

Binary exponentiation decomposes the exponent $b$ into its binary representation, multiplying the answer by $a^{2^i}$ whenever bit $i$ is set.

$$a^b = a^{\sum_{i=0}^k b_i \cdot 2^i} = \prod_{b_i = 1} a^{2^i}$$

Let's trace the iterative formulation, which shifts the exponent right while squaring the base.

```cpp
// Iterative Binary Exponentiation: O(log exp) Time
long long power_iterative(long long base, long long exp) {
    long long result = 1;
    while (exp > 0) {
        if (exp & 1) { // If lowest bit is 1, multiply into accumulator
            result *= base;
        }
        base *= base;  // Square the base
        exp >>= 1;     // Shift exponent right by 1
    }
    return result;
}
```

| Iteration | Exponent Bit (`exp & 1`) | Base State (`base`) | Accumulator (`result`) | Remaining `exp` |
| :--- | :--- | :--- | :--- | :--- |
| Start | $-$ | $3$ | $1$ | $13$ (`1101_2`) |
| Step 1 | $1$ (Active) | $3^2 = 9$ | $1 \times 3 = 3$ | $6$ (`110_2`) |
| Step 2 | $0$ (Inactive) | $9^2 = 81$ | $3$ | $3$ (`11_2`) |
| Step 3 | $1$ (Active) | $81^2 = 6561$ | $3 \times 81 = 243$ | $1$ (`1_2`) |
| Step 4 | $1$ (Active) | $6561^2$ | $243 \times 6561 = 1594323$ | $0$ (`0_2`) |

```text
[ F(n+1)   F(n)   ] = [ 1  1 ]^n
[ F(n)     F(n-1) ]   [ 1  0 ]
Powering a 2x2 matrix in O(log n) finds Fib(n) in O(log n) time!
```

> [!TIP]
> Use `long long` for base, exponent, and return types to prevent intermediate multiplication overflows before numbers are bounded.

Let's now add modular arithmetic to binary exponentiation.

#### Complexity Analysis
- **Time Complexity:** $\Theta(\log b)$ bit-shift iterations.
- **Auxiliary Space:** $O(1)$ workspace memory.

---

### Modular Exponentiation & Large Number Arithmetic

Modular exponentiation computes $(a^b) \bmod m$ efficiently without ever materializing massive intermediate numbers.

Applying modulo $m$ at every intermediate multiplication step keeps all values constrained within $[0, m-1]$.

```text
Unbounded: 3^100 = 5.15 x 10^47 (Cannot fit in any 64-bit integer!)
Modular:   At each multiplication: res = (res * base) % MOD
           Every intermediate number stays strictly < 10^9 + 7!
```

The mathematical recurrence applies the modulo operator across both even and odd branches.

$$(a^b) \bmod m = \begin{cases} \left((a^2 \bmod m)^{b/2}\right) \bmod m & \text{if } b \text{ is even} \\ \left(a \cdot (a^{b-1} \bmod m)\right) \bmod m & \text{if } b \text{ is odd} \end{cases}$$

Let's implement safe modular exponentiation with 64-bit casting.

```cpp
// Modular Exponentiation: O(log exp) Time, Constrained Space
long long mod_pow_safe(long long base, long long exp, long long mod) {
    long long res = 1;
    base %= mod;
    if (base < 0) base += mod; // Handle negative bases safely
    while (exp > 0) {
        if (exp & 1) res = (long long)((__int128)res * base % mod);
        base = (long long)((__int128)base * base % mod);
        exp >>= 1;
    }
    return res;
}
```

| Iteration | Exponent Bit | Modular Base ($3^{2^k} \bmod 7$) | Accumulator (`res`) |
| :--- | :--- | :--- | :--- |
| Start | $-$ | $3$ | $1$ |
| Step 1 ($exp=13$) | $1$ | $3^2 \bmod 7 = 2$ | $(1 \times 3) \bmod 7 = 3$ |
| Step 2 ($exp=6$) | $0$ | $2^2 \bmod 7 = 4$ | $3$ |
| Step 3 ($exp=3$) | $1$ | $4^2 \bmod 7 = 2$ | $(3 \times 4) \bmod 7 = 5$ |
| Step 4 ($exp=1$) | $1$ | $2^2 \bmod 7 = 4$ | $(5 \times 2) \bmod 7 = 3$ |

```text
[ exp bit = 1 ] ---> res = (res * base) % mod
[ exp bit = 0 ] ---> base = (base * base) % mod
All intermediate registers remain strictly within modulo boundary!
```

```text
If exponent 'b' is given as a massive 10^5 character string:
Theorem: a^b = a^(b mod phi(m) + phi(m)) (mod m)  for b >= phi(m)
First reduce string exponent modulo phi(m), then run mod_pow!
```

> [!WARNING]
> When $m > 2 \times 10^9$, the product `base * base` overflows 64-bit `long long`. Cast through `__int128_t` to avoid overflow bugs.

Let's now move into combinatorics and combinatorial counting.

#### Complexity Analysis
- **Time Complexity:** $O(\log \text{exp})$ modular multiplication steps.
- **Auxiliary Space:** $O(1)$ scalar variable workspace.

---

## Combinatorics & Advanced Number Theory

### Permutations & Combinations Fundamentals

Combinatorics studies methods for counting valid configurations of objects under specific selection rules.

We distinguish between Permutations (ordered arrangements $P(n, k)$) and Combinations (unordered selections $C(n, k)$).

```text
Choosing 2 items from {A, B, C}:
Permutations (Order Matters):   AB, BA, AC, CA, BC, CB  (6 outcomes)
Combinations (Order Neglected): {A,B}, {A,C}, {B,C}     (3 outcomes)
```

The mathematical formulas describe selection with and without ordering.

$$P(n, k) = \frac{n!}{(n-k)!}, \quad \binom{n}{k} = \frac{n!}{k!(n-k)!} = \frac{n(n-1)\cdots(n-k+1)}{k!}$$

When computing combinations without modulo, we interleave multiplication and division to prevent numerator overflow.

```cpp
// Direct O(k) Combination Calculator without Overflows
long long nCr_direct(int n, int r) {
    if (r < 0 || r > n) return 0;
    if (r == 0 || r == n) return 1;
    if (r > n / 2) r = n - r; // Take advantage of symmetry: nCr == nC(n-r)
    long long result = 1;
    for (int i = 1; i <= r; ++i) {
        result *= (n - i + 1);
        result /= i; // Divisible at every intermediate step!
    }
    return result;
}
```

| $n$ | $k$ | Factorial ($n!$) | Permutations ($P(n, k)$) | Combinations ($\binom{n}{k}$) |
| :--- | :--- | :--- | :--- | :--- |
| $4$ | $2$ | $24$ | $12$ | $6$ |
| $5$ | $3$ | $120$ | $60$ | $10$ |
| $6$ | $2$ | $720$ | $30$ | $15$ |
| $10$ | $4$ | $3,628,800$ | $5,040$ | $210$ |

```text
Distributing 'n' identical items into 'k' distinct bins:
Visual:  * * * | * * | * * * *   (n stars, k - 1 separator bars)
Formula: C(n + k - 1, k - 1) total valid assignments
```

> [!TIP]
> Use the symmetry property $\binom{n}{k} = \binom{n}{n-k}$ to reduce loop iterations whenever $k > n/2$.

Let's now look at constructing Pascal's Triangle for tabular combinations.

#### Complexity Analysis
- **Time Complexity:** $O(k)$ multiplication and division operations.
- **Auxiliary Space:** $O(1)$ scalar calculation storage.

---

### Pascal's Triangle & Binomial Coefficients

Pascal's Triangle arranges binomial coefficients into an additive triangle where each entry is the sum of the two values directly above it.

This additive property comes from Pascal's Identity: selecting $k$ items from $n$ either includes the $n$-th item or excludes it.

```text
Row 0:              1
Row 1:            1   1
Row 2:          1   2   1
Row 3:        1   3   3   1
Row 4:      1   4   6   4   1
Additive Rule: Row[n][k] = Row[n-1][k-1] + Row[n-1][k]
```

Pascal's Identity lets us precompute all combinations modulo $m$ in $O(N^2)$ time using 2D dynamic programming without division.

$$\binom{n}{k} \equiv \left(\binom{n-1}{k-1} + \binom{n-1}{k}\right) \pmod m \quad \text{with } \binom{n}{0} = \binom{n}{n} = 1$$

Let's implement Pascal precomputation for $O(1)$ combination queries.

```cpp
// Pascal's Triangle Precomputation: O(N^2) Time, O(1) Queries
const int MAXN = 2000;
int C[MAXN + 1][MAXN + 1];

void precompute_pascal(int n, int mod) {
    for (int i = 0; i <= n; ++i) {
        C[i][0] = C[i][i] = 1;
        for (int j = 1; j < i; ++j) {
            C[i][j] = (C[i - 1][j - 1] + C[i - 1][j]) % mod;
        }
    }
}
```

| Row ($n$) | $k=0$ | $k=1$ | $k=2$ | $k=3$ | $k=4$ | $k=5$ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Row $0$ | $1$ | $-$ | $-$ | $-$ | $-$ | $-$ |
| Row $1$ | $1$ | $1$ | $-$ | $-$ | $-$ | $-$ |
| Row $2$ | $1$ | $2$ | $1$ | $-$ | $-$ | $-$ |
| Row $3$ | $1$ | $3$ | $3$ | $1$ | $-$ | $-$ |
| Row $4$ | $1$ | $4$ | $6$ | $4$ | $1$ | $-$ |
| Row $5$ | $1$ | $5$ | $10$ | $10$ | $5$ | $1$ |

```text
Compute row 'n' using a single 1D vector of size n + 1:
Loop backwards: for j = i down to 1: row[j] = (row[j] + row[j-1])
Iterating backwards prevents overwriting data from the previous row!
```

> [!CAUTION]
> When updating a 1D Pascal row array in place, always iterate backwards from $k = n$ down to $1$ to avoid using already-updated values.

Let's now examine the Principle of Inclusion-Exclusion for counting unions of overlapping sets.

#### Complexity Analysis
- **Time Complexity:** $O(N^2)$ precomputation time, $O(1)$ combination query time.
- **Auxiliary Space:** $O(N^2)$ 2D lookup table storage (or $O(N)$ for a single row).

---

### Inclusion-Exclusion Principle & Set Unions

The Principle of Inclusion-Exclusion (PIE) computes the size of the union of multiple overlapping sets by correcting for overcounted intersections.

Simply summing individual set sizes counts elements in intersections multiple times, requiring us to alternately subtract and add intersection sizes.

```text
|A U B U C| = + |A| + |B| + |C|             (Add single sets)
              - |A n B| - |A n C| - |B n C| (Subtract pairs)
              + |A n B n C|                 (Add triple overlap)
```

The general mathematical formula alternates signs based on the number of participating sets in each intersection.

$$\left| \bigcup_{i=1}^n A_i \right| = \sum_{\emptyset \neq J \subseteq \{1,\dots,n\}} (-1)^{|J|-1} \left| \bigcap_{j \in J} A_j \right|$$

Let's use bitmask iteration to count integers in $[1, N]$ divisible by at least one prime in a given set.

```cpp
// Count integers in [1, N] divisible by any prime in 'primes'
long long count_divisible(long long n, const vector<long long>& primes) {
    int k = primes.size();
    long long total_count = 0;
    for (int mask = 1; mask < (1 << k); ++mask) {
        long long divisor_lcm = 1;
        int bits_set = 0;
        for (int i = 0; i < k; ++i) {
            if (mask & (1 << i)) {
                bits_set++;
                divisor_lcm = lcm_safe(divisor_lcm, primes[i]);
                if (divisor_lcm > n) break; // Exceeds upper range
            }
        }
        long long count = n / divisor_lcm;
        if (bits_set % 2 == 1) total_count += count; // Odd: Add
        else total_count -= count;                  // Even: Subtract
    }
    return total_count;
}
```

| Subset Mask | Primes Selected | Intersection Divisor | Multiples in $[1, 100]$ | Sign Term | Contribution |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `001_2` | $\{2\}$ | $2$ | $\lfloor 100/2 \rfloor = 50$ | $+1$ (Odd) | $+50$ |
| `010_2` | $\{3\}$ | $3$ | $\lfloor 100/3 \rfloor = 33$ | $+1$ (Odd) | $+33$ |
| `100_2` | $\{5\}$ | $5$ | $\lfloor 100/5 \rfloor = 20$ | $+1$ (Odd) | $+20$ |
| `011_2` | $\{2, 3\}$ | $6$ | $\lfloor 100/6 \rfloor = 16$ | $-1$ (Even) | $-16$ |
| `101_2` | $\{2, 5\}$ | $10$ | $\lfloor 100/10 \rfloor = 10$ | $-1$ (Even) | $-10$ |
| `110_2` | $\{3, 5\}$ | $15$ | $\lfloor 100/15 \rfloor = 6$ | $-1$ (Even) | $-6$ |
| `111_2` | $\{2, 3, 5\}$ | $30$ | $\lfloor 100/30 \rfloor = 3$ | $+1$ (Odd) | $+3$ |
| **Total** | Union Size | $-$ | $-$ | $-$ | **74** |

```text
Derangement D(n): Permutations of n elements where no item in place.
Recurrence: D(n) = (n - 1) * (D(n - 1) + D(n - 2)),  D(1)=0, D(2)=1
Closed form via PIE: D(n) = n! * sum_{i=0}^n [ (-1)^i / i! ] ~ n!/e
```

> [!WARNING]
> Inclusion-Exclusion evaluates all $2^k - 1$ subset intersections. The set count $k$ must be small ($k \le 20$) to avoid timing out.

Let's now examine Fermat's Little Theorem for computing modular multiplicative inverses.

#### Complexity Analysis
- **Time Complexity:** $O(2^k \cdot k)$ to evaluate all subsets of $k$ constraints.
- **Auxiliary Space:** $O(1)$ auxiliary workspace.

---

### Fermat's Little Theorem & Modular Multiplicative Inverses

Standard division does not exist in modular arithmetic. Instead, we multiply by the modular multiplicative inverse $a^{-1}$, satisfying $a \cdot a^{-1} \equiv 1 \pmod m$.

When modulo $p$ is a prime number and $\gcd(a, p) = 1$, Fermat's Little Theorem guarantees that $a^{p-1} \equiv 1 \pmod p$.

```text
Theorem:   a^(p - 1) === 1 (mod p)
Factor:    a * a^(p - 2) === 1 (mod p)
Result:    Modular Multiplicative Inverse: a^(-1) === a^(p-2) (mod p)
```

We compute the modular inverse in $O(\log p)$ time using fast modular exponentiation.

$$a^{-1} \equiv a^{p-2} \pmod p \implies \binom{n}{k} \equiv \text{fact}[n] \cdot \text{invFact}[k] \cdot \text{invFact}[n-k] \pmod p$$

Precomputing factorials and inverse factorials in $O(N)$ time allows us to answer combination queries in $O(1)$ time.

```cpp
// O(N) Factorial and Inverse Factorial Precomputation
const int MAXN = 1000000;
long long fact[MAXN + 1], invFact[MAXN + 1];

void precompute_factorials(int n, long long p) {
    fact[0] = 1;
    for (int i = 1; i <= n; ++i) fact[i] = (fact[i - 1] * i) % p;
    invFact[n] = mod_pow_safe(fact[n], p - 2, p); // 1 inverse via Fermat
    for (int i = n - 1; i >= 0; --i) {
        invFact[i] = (invFact[i + 1] * (i + 1)) % p; // Linear unwinding
    }
}

long long nCr_mod(int n, int r, long long p) {
    if (r < 0 || r > n) return 0;
    return fact[n] * invFact[r] % p * invFact[n - r] % p; // O(1) query!
}
```

| $n$ | Factorial ($n!$) | $n! \bmod (10^9 + 7)$ | $(n!)^{-1} \bmod (10^9 + 7)$ | Check: $n! \cdot (n!)^{-1} \bmod MOD$ |
| :--- | :--- | :--- | :--- | :--- |
| $1$ | $1$ | $1$ | $1$ | **1** |
| $2$ | $2$ | $2$ | $500000004$ | **1** |
| $3$ | $6$ | $6$ | $166666668$ | **1** |
| $4$ | $24$ | $24$ | $41666667$ | **1** |
| $5$ | $120$ | $120$ | $808333339$ | **1** |

```text
[ Compute fact[N] ] ===> [ Fermat: invFact[N] = fact[N]^(p-2) ]
                                      |
                         (Multiply downwards by i + 1)
                                      v
[ invFact[N-1] ] <=== [ invFact[N-2] ] <=== ... <=== [ invFact[0]=1]
```

```text
Invariant: p = k * i + r  ===>  k * i + r === 0 (mod p)
inv[i] = -(p / i) * inv[p % i] (mod p)
Formula computes all modular inverses 1..N in strictly O(N) time!
```

> [!IMPORTANT]
> The Fermat modular inverse formula $a^{p-2} \bmod p$ works only when modulo $p$ is strictly prime. Composite moduli require the Extended Euclidean algorithm.

Let's now examine the Chinese Remainder Theorem for solving systems of congruences.

#### Complexity Analysis
- **Time Complexity:** $O(N + \log p)$ precomputation time, $O(1)$ query time for $\binom{n}{k} \bmod p$.
- **Auxiliary Space:** $O(N)$ auxiliary memory for factorial and inverse factorial arrays.

---

### Chinese Remainder Theorem (CRT) & System of Congruences

The Chinese Remainder Theorem (CRT) solves a system of simultaneous linear congruences where moduli are pairwise coprime.

The classic Sunzi problem asks: what number gives remainder 2 when divided by 3, remainder 3 when divided by 5, and remainder 2 when divided by 7?

```text
x === a1 (mod m1)    (e.g., x === 2 mod 3)
x === a2 (mod m2)    (e.g., x === 3 mod 5)
x === a3 (mod m3)    (e.g., x === 2 mod 7)
Total Product M = m1 * m2 * m3 = 3 * 5 * 7 = 105
```

CRT constructs an explicit analytical solution using basis products $M_i = M / m_i$ and their modular inverses $y_i = M_i^{-1} \bmod m_i$.

$$x \equiv \sum_{i=1}^k a_i \cdot M_i \cdot y_i \pmod M \quad \text{where } M_i = \frac{M}{m_i} \text{ and } M_i y_i \equiv 1 \pmod{m_i}$$

Let's implement the complete Chinese Remainder Theorem solver.

```cpp
// Chinese Remainder Theorem Solver for Pairwise Coprime Moduli
long long solve_crt(const vector<long long>& a, const vector<long long>& m) {
    long long M = 1;
    for (long long mod_val : m) M *= mod_val;
    long long result = 0;
    for (int i = 0; i < a.size(); ++i) {
        long long Mi = M / m[i];
        long long xi, yi;
        ext_gcd(Mi, m[i], xi, yi); // Find modular inverse of Mi modulo m[i]
        xi = (xi % m[i] + m[i]) % m[i];
        long long term = (a[i] * Mi) % M;
        term = (term * xi) % M;
        result = (result + term) % M;
    }
    return result;
}
```

| Congruence Index | Remainder ($a_i$) | Modulo ($m_i$) | Partial Product ($M_i = M / m_i$) | Modular Inverse ($y_i = M_i^{-1} \bmod m_i$) | Term: $a_i M_i y_i$ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Equation 1 | $2$ | $3$ | $35$ | $35^{-1} \equiv 2^{-1} \equiv 2 \pmod 3$ | $2 \times 35 \times 2 = 140$ |
| Equation 2 | $3$ | $5$ | $21$ | $21^{-1} \equiv 1^{-1} \equiv 1 \pmod 5$ | $3 \times 21 \times 1 = 63$ |
| Equation 3 | $2$ | $7$ | $15$ | $15^{-1} \equiv 1^{-1} \equiv 1 \pmod 7$ | $2 \times 15 \times 1 = 30$ |
| **Sum Modulo 105** | $-$ | $M=105$ | $-$ | $-$ | $(140+63+30) \bmod 105 = \mathbf{23}$ |

```text
Mod 3 (rem 2):  2,  5,  8, 11, 14, 17, 20, [23], 26 ...
Mod 5 (rem 3):  3,  8, 13, 18, [23], 28, 33 ...
Mod 7 (rem 2):  2,  9, 16, [23], 30, 37 ...
Unique minimal positive solution synchronized at x = 23 (mod 105)!
```

```text
Express solution in mixed-radix form: x = v0 + v1*m1 + v2*m1*m2 ...
Computes coefficients sequentially without big integer multiplication!
```

> [!CAUTION]
> Standard CRT requires all moduli $m_i$ to be pairwise coprime ($\gcd(m_i, m_j) = 1$). Non-coprime systems require compatibility checks using Extended GCD.

This completes our Math & Number Theory chapter, establishing mathematical rigor for future algorithmic techniques.

#### Complexity Analysis
- **Time Complexity:** $O(k \log M)$ time across $k$ simultaneous modular congruences.
- **Auxiliary Space:** $O(1)$ workspace memory.

---

## Cheat Sheet & Quick Reference

| Concept | Mathematical Formula / Identity | Complexity | Core Application |
| :--- | :--- | :--- | :--- |
| Safe Modular Subtraction | $(a - b + m) \bmod m$ | $O(1)$ | Prevents negative C++ `%` remainders |
| Number of Digits | $\lfloor \log_b N \rfloor + 1$ | $O(1)$ | Positional digit memory allocation |
| Trial Division Primality | Test candidates up to $\sqrt{N}$ with $6k \pm 1$ | $O(\sqrt{N})$ | Fast prime check for single integer |
| Fermat Primality Test | $a^{n-1} \equiv 1 \pmod n$ | $O(k \log n)$ | Probabilistic check for large integers |
| Sieve of Eratosthenes | Cross out from $p^2$ in steps of $p$ | $O(N \log \log N)$ | All primes up to $N \le 10^7$ |
| Linear Sieve (Euler) | Mark with Smallest Prime Factor (SPF) | $\Theta(N)$ | $O(\log N)$ factorization queries |
| Euclidean GCD | $\gcd(a, b) = \gcd(b, a \bmod b)$ | $O(\log(\min(a,b)))$ | GCD, Coprimality, LCM computation |
| Extended Euclidean | $a x + b y = \gcd(a, b)$ | $O(\log(\min(a,b)))$ | Diophantine equations, Modular inverse |
| Binary Exponentiation | $a^b = (a^{b/2})^2 \cdot a^{b \bmod 2}$ | $O(\log b)$ | Fast power and matrix exponentiation |
| Fermat Modular Inverse | $a^{-1} \equiv a^{p-2} \pmod p$ | $O(\log p)$ | Division under prime modulo $p$ |
| Combination Precomputation | $\binom{n}{k} \equiv \text{fact}[n] \cdot \text{invFact}[k] \cdot \text{invFact}[n-k]$ | $O(N)$ build, $O(1)$ query | Fast binomial queries modulo $10^9+7$ |
| Chinese Remainder Theorem | $x \equiv \sum a_i M_i y_i \pmod M$ | $O(k \log M)$ | Solving simultaneous congruences |
