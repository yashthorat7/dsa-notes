# Chapter 20: Monotonic Structures

---




## Monotonic Stacks & Queues




### Monotonic Stack Mechanics & Nearest Smaller/Greater Invariants

Let's begin at the whiteboard by examining Monotonic Stacks: maintaining elements in strictly increasing or decreasing order to resolve nearest-element relationship queries in linear time.

Whenever an incoming element violates the stack's monotonic order, we repeatedly pop violating elements, recording boundary relationships before pushing the incoming element.

```text
Stack stores elements in decreasing order: [ 25, 10, 5 ]
Incoming element: 12
1. Element 5 < 12 (Violates decreasing order!) -> Pop 5
   For popped item 5, Next Greater Element is 12!
2. Element 10 < 12 (Violates decreasing order!) -> Pop 10
   For popped item 10, Next Greater Element is 12!
3. Element 25 > 12 -> Push 12: Stack becomes [ 25, 12 ]
```

Because every element is pushed onto the stack exactly once and popped at most once, the amortized runtime across the entire array is strictly linear.

$$\text{Total Stack Operations} \le 2N \implies \Theta(N) \text{ Amortized Linear Time}$$

Let's implement Next Greater Element and Previous Smaller Element using monotonic stacks.

```cpp
// Next Greater Element (NGE) & Previous Smaller Element (PSE)
vector<int> next_greater_element(const vector<int>& arr) {
    int n = arr.size();
    vector<int> nge(n, -1);
    stack<int> st; // Stores indices

    for (int i = n - 1; i >= 0; --i) {
        while (!st.empty() && arr[st.top()] <= arr[i]) {
            st.pop();
        }
        if (!st.empty()) {
            nge[i] = arr[st.top()];
        }
        st.push(i);
    }
    return nge;
}

vector<int> previous_smaller_element(const vector<int>& arr) {
    int n = arr.size();
    vector<int> pse(n, -1);
    stack<int> st; // Stores indices

    for (int i = 0; i < n; ++i) {
        while (!st.empty() && arr[st.top()] >= arr[i]) {
            st.pop();
        }
        if (!st.empty()) {
            pse[i] = arr[st.top()];
        }
        st.push(i);
    }
    return pse;
}
```

| Index $i$ | Element $A[i]$ | Stack Before Pop | Popped Elements | NGE Assigned $A[\text{top}]$ |
| :--- | :--- | :--- | :--- | :--- |
| $3$ | $25$ | `[]` | None | $-1$ (None) |
| $2$ | $2$ | `[3 (25)]` | None | $25$ |
| $1$ | $5$ | `[3 (25), 2 (2)]` | Pop index 2 (Val 2) | $25$ |
| $0$ | $4$ | `[3 (25), 1 (5)]` | None | $5$ |

```text
Looking rightward across buildings of heights: [ 4,  5,  2,  25 ]
Building 4 sees Building 5 (Next Greater = 5)
Building 5 sees Building 25 (Next Greater = 25)
Taller buildings occlude shorter buildings behind them!
```

> [!IMPORTANT]
> To find the Next Greater Element, maintain a monotonic decreasing stack and pop while `!st.empty() && arr[st.top()] <= arr[i]`.

#### Monotonic Stack Invariant Matrix

| Target Query | Traversal Direction | Stack Monotonicity | Pop Condition (`while`) |
| :--- | :--- | :--- | :--- |
| **Next Greater Element (NGE)** | Right-to-Left ($N-1 \to 0$) | Decreasing | `arr[st.top()] <= arr[i]` |
| **Next Smaller Element (NSE)** | Right-to-Left ($N-1 \to 0$) | Increasing | `arr[st.top()] >= arr[i]` |
| **Previous Greater Element (PGE)** | Left-to-Right ($0 \to N-1$) | Decreasing | `arr[st.top()] <= arr[i]` |
| **Previous Smaller Element (PSE)** | Left-to-Right ($0 \to N-1$) | Increasing | `arr[st.top()] >= arr[i]` |

Let's now examine monotonic deques for sliding window minimum and maximum tracking.




#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ amortized linear time across the entire scan.
- **Auxiliary Space:** $O(N)$ auxiliary stack memory.

---




### Monotonic Deques & Sliding Window Extremums

Tracking the rolling extremum across continuous telemetry streams requires discarding values that can never become future maximums.

In a sliding window of size $K$, as new element $x$ arrives, any smaller elements residing in the deque behind $x$ are permanently dominated by $x$ and can be safely purged.

```text
Incoming: Val = 8 at Index = 3,  Window Size K = 3
Deque before: [ (idx 1, val 5), (idx 2, val 3) ]
8 is >= 3 and 8 >= 5 -> Pop both 3 and 5 from back!
Deque after:  [ (idx 3, val 8) ]
Front element is ALWAYS the peak maximum of the active window!
```

The monotonic decreasing property guarantees that the front of the deque always holds the active window maximum:

$$\forall i < j \in \text{Deque}, \; A[\text{Deque}[i]] > A[\text{Deque}[j]]$$

Let's implement the rolling peak sensor tracker using `deque`.

```cpp
// Track Rolling Sensor Anomaly Peaks: O(N) Time, O(K) Space
vector<int> track_rolling_sensor_peaks(const vector<int>& sensor_readings, int window_k) {
    deque<int> dq;
    vector<int> peaks;
    int n = sensor_readings.size();

    for (int i = 0; i < n; ++i) {
        // Evict elements outside active sliding horizon
        if (!dq.empty() && dq.front() <= i - window_k) {
            dq.pop_front();
        }

        // Maintain monotonic decreasing order in deque
        while (!dq.empty() && sensor_readings[dq.back()] <= sensor_readings[i]) {
            dq.pop_back();
        }

        dq.push_back(i);

        // Record peak once window reaches full capacity k
        if (i >= window_k - 1) {
            peaks.push_back(sensor_readings[dq.front()]);
        }
    }
    return peaks;
}
```



#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ amortized time; each index is pushed and popped at most once.
- **Auxiliary Space:** $O(K)$ deque memory storing at most $K$ window indices.

---




## Specialized Stack Architectures & Geometry




### Constant-Time Extremum Stack — Auxiliary Memory vs Mathematical Encoding

An extremum metric buffer supports standard stack operations (`push`, `pop`, `top`) while retrieving the minimum element across the stack in deterministic $O(1)$ constant time.

We can implement this using either an auxiliary parallel min-stack, or mathematical delta encoding ($2v - \text{min}$) to achieve $O(1)$ auxiliary space.

```text
Push Sequence: 5 -> 3 -> 7 -> 2
Approach 1 (Auxiliary Stack):
Primary Stack: [ 5,  3,  7,  2 ]
Extremum Stack:[ 5,  3,  3,  2 ]  (Tracks running minimum at each tier
Approach 2 (Delta Inversion): Store 2*val - min when new min pushed
```

The delta encoding formula allows reconstruction of the previous minimum upon popping:

$$\text{encoded} = 2v - \text{old\_min} < v \implies \text{old\_min} = 2v - \text{encoded}$$

Let's implement both the auxiliary stack and the delta-encoded constant-time metric stack in C++.

```cpp
// Approach 1: Dual Auxiliary Stack (O(1) Time, O(N) Auxiliary Space)
struct ExtremumMetricStackDual {
    stack<int> main_st;
    stack<int> min_st;

    void push(int val) {
        main_st.push(val);
        if (min_st.empty() || val <= min_st.top()) {
            min_st.push(val);
        } else {
            min_st.push(min_st.top());
        }
    }

    void pop() {
        main_st.pop();
        min_st.pop();
    }

    int top() { return main_st.top(); }
    int get_min() { return min_st.top(); }
};

// Approach 2: Mathematical Delta Inversion (O(1) Time, O(1) Auxiliary Space)
struct ExtremumMetricStackOptimized {
    stack<long long> st;
    long long current_min;

    void push(int val) {
        if (st.empty()) {
            st.push(val);
            current_min = val;
        } else if (val >= current_min) {
            st.push(val);
        } else {
            st.push(2LL * val - current_min); // Encoded delta value
            current_min = val;
        }
    }

    void pop() {
        long long top_val = st.top();
        st.pop();
        if (top_val < current_min) {
            current_min = 2LL * current_min - top_val; // Reconstruct previous min
        }
    }

    int top() {
        long long top_val = st.top();
        return (top_val < current_min) ? current_min : top_val;
    }

    int get_min() { return current_min; }
};
```


#### Complexity Analysis
- **Time Complexity:** $\Theta(1)$ constant time for all operations.
- **Auxiliary Space:** $O(1)$ extra space beyond standard storage.

---




### Geometric Boundary Scans & Monotonic Boundary Width

The discretized column span problem finds the largest contiguous cross-sectional area bounded beneath discrete elevation columns in $O(N)$ time.

For each column $i$ with height $H[i]$, its maximal horizontal rectangle extends leftward to the first column shorter than $H[i]$ and rightward to the first column shorter than $H[i]$.

```text
Heights: [ 2,  1,  5,  6,  2,  3 ]
For bar at index 2 (height 5):
Extends left to index 1 (height 1 < 5)  -> Left boundary = 2
Extends right to index 4 (height 2 < 5) -> Right boundary = 3
Width = (4 - 1 - 1) = 2 columns -> Area = 5 * 2 = 10
```

The geometric rectangle area formula evaluated at each column pivot is:

$$\text{Area}(i) = H[i] \times (\text{NSE}[i] - \text{PSE}[i] - 1)$$

Let's implement the single-pass skyline billboard area solver in C++.

```cpp
// Maximal Skyline Billboard Area: O(N) Time, O(N) Space
int maximal_skyline_billboard_area(vector<int>& building_heights) {
    building_heights.push_back(0); // Sentinel bar to flush remaining stack elements
    stack<int> st;
    int max_area = 0;
    int n = building_heights.size();

    for (int i = 0; i < n; ++i) {
        while (!st.empty() && building_heights[st.top()] > building_heights[i]) {
            int h = building_heights[st.top()];
            st.pop();

            int left_bound = st.empty() ? -1 : st.top();
            int width = i - left_bound - 1;
            max_area = max(max_area, h * width);
        }
        st.push(i);
    }
    building_heights.pop_back(); // Restore input vector
    return max_area;
}
```

#### Complexity Analysis
- **Time Complexity:** $O(N)$ for 1D histogram; $O(R \cdot C)$ for 2D maximal rectangle.
- **Auxiliary Space:** $O(C)$ column height buffer and stack.

---




## Algebraic Parsers & Evaluators




### Expression Parsers — Infix to Postfix (Shunting-Yard Algorithm)

Expressions can be represented in Infix ($A + B$), Postfix ($A B +$), or Prefix ($+ A B$) notation.

Dijkstra's Shunting-Yard Algorithm converts standard Infix expressions to Postfix (Reverse Polish Notation) using an operator stack and operator precedence rules.

```text
Operands (A, B, C)      ----------------------> Output Token Stream
Operators (+, *, ^)     ------> [ Operator Stack Siding ]
Higher precedence operators pop lower ones to preserve order.
Parentheses '(' push as barriers; ')' pops until matching '('.
```

Operator precedence rules govern when operators on the stack must be popped.

$$\text{Precedence}(\text{'^'}) = 3 \ (\text{right-assoc}) > \text{Precedence}(\text{'*'}, \text{'/'}) = 2 > \text{Precedence}(\text{'+'}, \text{'-'}) = 1$$

Let's implement the Shunting-Yard Infix-to-Postfix converter.

```cpp
// Infix to Postfix Converter (Shunting-Yard Algorithm)
int precedence(char op) {
    if (op == '^') return 3;
    if (op == '*' || op == '/') return 2;
    if (op == '+' || op == '-') return 1;
    return 0;
}

string infix_to_postfix(const string& expr) {
    string postfix = "";
    stack<char> st;

    for (char c : expr) {
        if (isalnum(c)) {
            postfix += c; // Operands go directly to output
        } else if (c == '(') {
            st.push(c);
        } else if (c == ')') {
            while (!st.empty() && st.top() != '(') {
                postfix += st.top();
                st.pop();
            }
            if (!st.empty()) st.pop(); // Discard '('
        } else {
            // Operator encountered: pop operators of >= precedence
            while (!st.empty() && (precedence(st.top()) > precedence(c) || 
                  (precedence(st.top()) == precedence(c) && c != '^'))) {
                postfix += st.top();
                st.pop();
            }
            st.push(c);
        }
    }
    while (!st.empty()) {
        postfix += st.top();
        st.pop();
    }
    return postfix;
}
```

| Token Processed | Token Type | Operator Stack | Postfix Output Buffer |
| :--- | :--- | :--- | :--- |
| `'A'` | Operand | `[]` | `"A"` |
| `'+'` | Operator | `['+']` | `"A"` |
| `'B'` | Operand | `['+']` | `"AB"` |
| `'*'` | Operator ($* > +$) | `['+', '*']` | `"AB"` |
| `'C'` | Operand | `['+', '*']` | `"ABC"` |
| End | Flush stack | `[]` | `"ABC*+"` |

```text
Infix  : A + B * C
Postfix: A B C * +
Postfix removes all ambiguous parentheses while preserving execution!
```

> [!IMPORTANT]
> The exponentiation operator `'^'` is right-associative ($2^{3^2} = 2^9 = 512$). For right-associative operators, do NOT pop identical precedence operators from the stack.

Let's now study arithmetic expression evaluation engines.




#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear pass over expression characters.
- **Auxiliary Space:** $O(N)$ operator stack memory.

---




### Expression Evaluation Engines & Arithmetic Calculators

Evaluating Postfix expressions uses an operand stack: numbers are pushed onto the stack, and operators pop the top two numbers, apply the operation, and push the result back.

Building a full arithmetic calculator requires handling multi-digit integers, operator precedence, parentheses, and unary signs in a single pass.

```text
Postfix Expression: " 3  4  +  2  * "
Push 3, Push 4 -> Stack: [ 3, 4 ]
Encounter '+': b = 4, a = 3 -> Push (3 + 4 = 7) -> Stack: [ 7 ]
Push 2         -> Stack: [ 7, 2 ]
Encounter '*': b = 2, a = 7 -> Push (7 * 2 = 14) -> Stack: [ 14 ]
Final Result = 14
```

When evaluating binary operations, operand order is critical for non-commutative operations like subtraction and division.

$$b = \text{pop}(), \quad a = \text{pop}() \implies \text{Result} = a - b \quad (\text{not } b - a)$$

Let's implement the arithmetic calculator evaluating mathematical strings with parentheses and operators.

```cpp
// Basic Calculator II: Evaluating Infix Expressions with +, -, *, /
int calculate_infix(string s) {
    stack<int> st;
    long long current_num = 0;
    char op = '+';
    s += '+'; // Sentinel to evaluate last number

    for (char c : s) {
        if (isdigit(c)) {
            current_num = current_num * 10 + (c - '0');
        } else if (c != ' ') {
            if (op == '+') {
                st.push(current_num);
            } else if (op == '-') {
                st.push(-current_num);
            } else if (op == '*') {
                int top_val = st.top(); st.pop();
                st.push(top_val * current_num);
            } else if (op == '/') {
                int top_val = st.top(); st.pop();
                st.push(top_val / current_num);
            }
            op = c;
            current_num = 0;
        }
    }

    int total = 0;
    while (!st.empty()) {
        total += st.top();
        st.pop();
    }
    return total;
}
```

| Token Processed | Current Number | Active Op | Stack State | Sub-Result Evaluated |
| :--- | :--- | :--- | :--- | :--- |
| `'3'` | $3$ | `'+'` | `[]` | - |
| `'+'` | $0$ | `'+'` | `[3]` | Pushed $+3$ |
| `'2'` | $2$ | `'+'` | `[3]` | - |
| `'*'` | $0$ | `'*'` | `[3, 2]` | Pushed $+2$ |
| `'2'` | $2$ | `'*'` | `[3, 2]` | - |
| End (`'+'`) | $0$ | `'+'` | `[3, 4]` | $2 \times 2 = 4$ pushed |
| Sum Stack | - | - | `[]` | **Final Total = 3 + 4 = 7** |

```text
When encountering '*' or '/', pop the top operand and immediately
multiply/divide with current_num before pushing back onto the stack!
Stack retains only additive terms for final summation.
```

> [!CAUTION]
> When popping operands for subtraction or division, the first popped value is the second operand $b$, and the next is the first operand $a$. Always compute $a / b$ and $a - b$.

This completes the Monotonic Structures chapter, covering monotonic stacks, sliding window deques, min stacks, histogram geometric scans, shunting-yard parsers, and calculator engines.




#### Complexity Analysis
- **Time Complexity:** $\Theta(N)$ linear pass over expression string.
- **Auxiliary Space:** $O(N)$ operand stack memory.

---




## Cheat Sheet & Quick Reference

| Technique | Goal | Core Invariant / Mechanism | Complexity |
| :--- | :--- | :--- | :--- |
| **Monotonic Decreasing Stack**| Next Greater Element | Pop while `top <= arr[i]`; records NGE | $\Theta(N)$ / $O(N)$ Space |
| **Monotonic Increasing Stack**| Next Smaller Element | Pop while `top >= arr[i]`; records NSE | $\Theta(N)$ / $O(N)$ Space |
| **Monotonic Deque** | Sliding Window Extrema | Pop dominated back; pop expired front | $\Theta(N)$ / $O(K)$ Space |
| **Extremum Stack ($O(1)$ Extra)** | Constant time minimum | Store encoded $2x - \text{min}$ on new min | $O(1)$ / $O(1)$ Space |
| **Histogram Area** | Max bounded rectangle | Width $= \text{NSE} - \text{PSE} - 1$ via stack | $\Theta(N)$ / $O(N)$ Space |
| **Shunting-Yard Algorithm** | Infix $\to$ Postfix | Operator stack buffers by precedence | $\Theta(N)$ / $O(N)$ Space |
| **Calculator Evaluator** | Arithmetic parsing | Immediate reduction of $*$ and $/$ on stack | $\Theta(N)$ / $O(N)$ Space |
