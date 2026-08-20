# Chapter 28: Backtracking Techniques

---





## Backtracking Foundations & State Machines





### The Backtracking State Machine — Choice, Explore, Undo & Bounding

Building on Chapter 2's state-space search and Chapter 5's tree recursion, the universal four-step Backtracking State Machine formalizes: Choose $\to$ Explore $\to$ Unchoose (Undo) $\to$ Prune.

Bounding Functions evaluate constraints at intermediate decision nodes to prune massive subtrees before descending into invalid branches.

```text
1. Choose  : Mutate state (e.g. path.push_back(val), visited[r][c]=1)
2. Explore : Recurse deeper into next decision tier
3. Unchoose: Symmetrically undo mutation (path.pop_back(), visited=0)
4. Bounding: If candidate violates constraint, PRUNE immediately!
```

An unpruned search tree explores $B^D$ states, whereas effective bounding functions prune dead ends early, reducing the effective branching factor $b_{\text{eff}} \ll B$.

$$\text{Unpruned Search Space} = O(B^D) \quad \xrightarrow{\text{Bounding Functions}} \quad O(b_{\text{eff}}^D) \ll O(B^D)$$

Let's implement the generic C++ backtracking template using pass-by-reference and explicit state restoration.

```cpp
// Universal Backtracking Driver Template: Pass-by-Reference with Undo
void backtrack_template(int depth, vector<int>& state, vector<vector<int>>& solutions) {
    if (depth == 5) { // Base Goal Condition
        solutions.push_back(state);
        return;
    }

    for (int choice = 1; choice <= 3; ++choice) {
        // Bounding Function: Prune invalid choices immediately
        if (choice == 2 && depth > 2) continue; 

        // 1. Choose
        state.push_back(choice);

        // 2. Explore
        backtrack_template(depth + 1, state, solutions);

        // 3. Unchoose (Restore state symmetrically)
        state.pop_back();
    }
}
```

| Decision Level | Choice Evaluated | Bounding Check | State Vector Before Call | Action Taken |
| :--- | :--- | :--- | :--- | :--- |
| Level 0 | Choice $1$ | Valid | `[]` | Push $1 \to$ Recurse Level 1 |
| Level 1 | Choice $2$ | Valid | `[1]` | Push $2 \to$ Recurse Level 2 |
| Level 2 | Choice $2$ | **Invalid (Pruned)**| `[1, 2]` | Prune $\to$ Skip branch |
| Backtrack | - | - | `[1, 2]` | Pop $2 \to$ State restored to `[1]` |

```text
Forward Descent:  [] ---> [1] ---> [1, 2] ---> [1, 2, 3] (Record)
Backward Recovery:[] <--- [1] <--- [1, 2] <--- (pop_back 3)
Memory overhead stays bounded strictly to O(Depth) vector space!
```

> [!WARNING]
> Forgetting to undo even a single mutated variable (such as `visited[r][c] = false`) corrupts all subsequent sibling branches in the search tree.

Let's now examine combinatorial search spaces for subsets and permutations.





#### Complexity Analysis
- **Time Complexity:** $O(b_{\text{eff}}^D)$ bounded by depth and constraint pruning.
- **Auxiliary Space:** $O(D)$ recursion stack and active path vector memory.

---





## Combinatorial Search Spaces





### Combinatorial Generators — Power Sets & Permutations with Duplicates

Generating unique hardware bundle configurations and ordered pipelines from components containing duplicate items requires systematically pruning duplicate branches.

To avoid generating duplicate subsets or permutations, we sort the input first. At each decision point, if an element equals its predecessor and the predecessor was skipped at the current recursion level, we prune that branch.

```text
Sorted Specs: [ 1,  2,  2' ]
At Level 1: Choose 2 (index 1)  -> Valid branch: explores [1, 2]
At Level 1: Choose 2' (index 2) -> Duplicate! (2' == 2 and index 1
                                   was not chosen) -> PRUNE BRANCH!
Generates only UNIQUE configurations: [ [], [1], [1,2], [1,2,2], [2], [2,2] ]
```

The duplicate pruning predicate guarantees that duplicate elements are only selected in contiguous prefix order:

$$\text{if } (i > \text{start} \land \text{specs}[i] == \text{specs}[i-1]) \implies \text{continue (Skip branch)}$$

Let's implement unique hardware bundle generation with duplicate pruning in C++.

```cpp
// Hardware Bundle Assembly with Duplicate Component Pruning
void generate_unique_hardware_configurations(int start, vector<int>& specs,
                                            vector<int>& current,
                                            vector<vector<int>>& result) {
    result.push_back(current); // Record valid subset

    for (int i = start; i < (int)specs.size(); ++i) {
        // Prune duplicate branches at current tree depth
        if (i > start && specs[i] == specs[i - 1]) continue;

        current.push_back(specs[i]);
        generate_unique_hardware_configurations(i + 1, specs, current, result);
        current.pop_back(); // Backtrack
    }
}

// Generate All Unique Hardware Configurations
vector<vector<int>> build_hardware_configurations(vector<int>& specs) {
    sort(specs.begin(), specs.end()); // Essential for duplicate grouping
    vector<vector<int>> result;
    vector<int> current;
    generate_unique_hardware_configurations(0, specs, current, result);
    return result;
}
```




#### Complexity Analysis
- **Time Complexity:** $O(N \cdot 2^N)$ for Power Sets; $O(N \cdot N!)$ for Permutations.
- **Auxiliary Space:** $O(N)$ recursion depth and active path buffers.

---





### Target Budget Combinations & Pruning Monotonicity

Target budget combination searches find all unique sets of numbers that sum to a target value $T$, supporting either unbounded reuse or single-use with duplicate values.

Sorting candidates upfront allows early termination: once a candidate element exceeds the remaining target amount, all subsequent candidates will also exceed it and can be immediately broken out of the loop.

```text
Denominations: [ 2,  3,  6,  7 ],  Remaining Target = 5
Candidate 2: 5 - 2 = 3 >= 0 -> Valid! Recurse on remaining = 3
Candidate 3: 5 - 3 = 2 >= 0 -> Valid! Recurse on remaining = 2
Candidate 6: 5 - 6 = -1 < 0 -> INVALID! Break loop! (Skip 7 as well!)
```

The sorted candidate invariant enables deterministic loop breakout:

$$\text{candidates}[i] > \text{remaining} \implies \text{break (All subsequent elements also invalid)}$$

Let's implement payment combination schemes with unbounded coin reuse and single-use coins in C++.

```cpp
// Scheme 1: Unbounded Denomination Reuse
void find_unbounded_payment_schemes(int idx, int remaining, const vector<int>& coins,
                                   vector<int>& current, vector<vector<int>>& result) {
    if (remaining == 0) {
        result.push_back(current);
        return;
    }
    for (int i = idx; i < (int)coins.size(); ++i) {
        if (coins[i] > remaining) break; // Prune all larger candidates

        current.push_back(coins[i]);
        find_unbounded_payment_schemes(i, remaining - coins[i], coins, current, result); // Same index i allows reuse
        current.pop_back(); // Backtrack
    }
}

// Scheme 2: Single-Use Coins with Duplicate Denominations
void find_unique_coin_payment_schemes(int start, int remaining, const vector<int>& coins,
                                     vector<int>& current, vector<vector<int>>& result) {
    if (remaining == 0) {
        result.push_back(current);
        return;
    }
    for (int i = start; i < (int)coins.size(); ++i) {
        if (coins[i] > remaining) break;
        if (i > start && coins[i] == coins[i - 1]) continue; // Skip identical duplicates

        current.push_back(coins[i]);
        find_unique_coin_payment_schemes(i + 1, remaining - coins[i], coins, current, result);
        current.pop_back(); // Backtrack
    }
}
```



#### Complexity Analysis
- **Time Complexity:** $O(2^{\text{Target}/\min})$ bounded by the smallest candidate value.
- **Auxiliary Space:** $O(\text{Target}/\min)$ recursion call stack memory.

---





### Constraint Satisfaction Games — Non-Interfering Grid Placements

The guarded perimeter placement problem positions $N$ non-interfering defense sensors on an $N \times N$ grid such that no two sensors share the same row, column, or diagonal line of sight.

Placing one sensor per row reduces the search space from $\binom{N^2}{N}$ down to $N!$. Using three boolean lookup tables or bitmasks allows testing column and diagonal collisions in $O(1)$ time.

```text
Grid Size N = 4:
Major Diagonals (\): Row - Col is constant -> Index: (r - c + N - 1)
Minor Diagonals (/): Row + Col is constant -> Index: (r + c)
3 Boolean arrays: cols[c], diag1[r-c+N-1], diag2[r+c] test safety in O(1)!
```

The conflict-free invariant verifies that no collision flag is active:

$$\text{safe}(r, c) = \neg (\text{cols}[c] \lor \text{d1}[r - c + N - 1] \lor \text{d2}[r + c])$$

Let's implement the guarded grid sensor placement solver in C++.

```cpp
// Guarded Perimeter Sensor Placement: O(N!) Time, O(N) Space
void place_non_interfering_sensors(int row, int n, vector<bool>& cols,
                                   vector<bool>& d1, vector<bool>& d2,
                                   vector<string>& grid,
                                   vector<vector<string>>& result) {
    if (row == n) {
        result.push_back(grid);
        return;
    }

    for (int col = 0; col < n; ++col) {
        if (!cols[col] && !d1[row - col + n - 1] && !d2[row + col]) {
            // Apply placement
            cols[col] = d1[row - col + n - 1] = d2[row + col] = true;
            grid[row][col] = 'S';

            place_non_interfering_sensors(row + 1, n, cols, d1, d2, grid, result);

            // Backtrack
            grid[row][col] = '.';
            cols[col] = d1[row - col + n - 1] = d2[row + col] = false;
        }
    }
}
```


### 2D Grid Backtracking & Hamiltonian Path Tours

2D spatial backtracking explores grid pathfinding, word searches on boggle boards, and Hamiltonian paths (such as the Knight's Tour).

To mark visited cells without allocating extra matrices, we mutate the grid in-place (`grid[r][c] = '#'`) and restore the original character on backtracking return.

```text
Cell (r, c) = 'A':
1. Mark: grid[r][c] = '#' (Acts as an impassable wall)
2. Explore: Recurse into 4 neighbors (Up, Down, Left, Right)
3. Restore: grid[r][c] = 'A' (Restored for sibling search paths!)
```

Worst-case grid exploration branches in 4 directions, pruned by boundary guards and character match checks.

$$T(R, C) = O(4^{R \cdot C}) \quad \xrightarrow{\text{Word Length } L} \quad O(R \cdot C \cdot 4^L)$$

Let's implement 2D Word Search with in-place cell mutation in C++.

```cpp
// 2D Word Search with In-Place Grid Backtracking
bool word_search_dfs(vector<vector<char>>& board, const string& word, int idx, int r, int c) {
    if (idx == word.size()) return true;
    int R = board.size(), C = board[0].size();

    // Boundary guards and character mismatch bounding
    if (r < 0 || r >= R || c < 0 || c >= C || board[r][c] != word[idx]) {
        return false;
    }

    char original_char = board[r][c];
    board[r][c] = '#'; // Mark cell visited in-place

    // 4-Directional exploration
    int dr[] = {-1, 1, 0, 0};
    int dc[] = {0, 0, -1, 1};
    bool found = false;

    for (int d = 0; d < 4; ++d) {
        if (word_search_dfs(board, word, idx + 1, r + dr[d], c + dc[d])) {
            found = true;
            break;
        }
    }

    board[r][c] = original_char; // Restore cell state
    return found;
}
```

| Step Index | Coordinate $(r, c)$ | Board Character | Word Target `word[idx]` | Action |
| :--- | :--- | :--- | :--- | :--- |
| $0$ | $(0, 0)$ | `'A'` | `'A'` | Mark `#` $\to$ Explore neighbors |
| $1$ | $(0, 1)$ | `'B'` | `'B'` | Mark `#` $\to$ Explore neighbors |
| $2$ | $(0, 2)$ | `'C'` | `'C'` | Mark `#` $\to$ Explore neighbors |
| $3$ | $(0, 3)$ | `'E'` | `'E'` | **Word Match Complete!** |

```text
dr = { -1, 1,  0, 0 }
dc = {  0, 0, -1, 1 }
Cleanly loops through North, South, West, East in 4 compact lines!
```

> [!WARNING]
> Do not allocate new `vector<vector<bool>>` visited matrices on every recursive step. Mutate the grid in-place or pass a single shared `visited` matrix by reference.

#### Complexity Analysis
- **Time Complexity:** $O(R \cdot C \cdot 4^L)$ where $L$ is the target word length.
- **Auxiliary Space:** $O(L)$ recursion call stack frames.

---

### Constraint Satisfaction Games — Guarded Perimeter Sensor Placement

The guarded perimeter placement problem positions $N$ non-interfering defense sensors on an $N \times N$ perimeter grid such that no two sensors share the same row, column, or diagonal line of sight.

Placing one sensor per row reduces the search space from $\binom{N^2}{N}$ down to $N!$. Using three boolean lookup tables or bitmasks allows testing column and diagonal collisions in $O(1)$ time.

```text
Grid Size N = 4:
Major Diagonals (\): Row - Col is constant -> Index: (r - c + N - 1)
Minor Diagonals (/): Row + Col is constant -> Index: (r + c)
3 Boolean arrays: cols[c], d1[r-c+N-1], d2[r+c] test safety in O(1)!
```

The collision lookup invariant evaluates diagonal and column guards simultaneously:

$$\text{safe}(r, c) = \neg (\text{cols}[c] \lor \text{d1}[r - c + N - 1] \lor \text{d2}[r + c])$$

Let's implement guarded perimeter sensor placement using $O(1)$ collision lookup vectors alongside fast bitmasks in C++.

```cpp
// Guarded Perimeter Sensor Placement: O(N!) Time, O(N) Space
void place_non_interfering_sensors(int row, int n, vector<bool>& cols,
                                   vector<bool>& d1, vector<bool>& d2,
                                   vector<string>& grid,
                                   vector<vector<string>>& result) {
    if (row == n) {
        result.push_back(grid);
        return;
    }

    for (int col = 0; col < n; ++col) {
        if (!cols[col] && !d1[row - col + n - 1] && !d2[row + col]) {
            // Place sensor
            cols[col] = d1[row - col + n - 1] = d2[row + col] = true;
            grid[row][col] = 'S';

            place_non_interfering_sensors(row + 1, n, cols, d1, d2, grid, result);

            // Backtrack
            grid[row][col] = '.';
            cols[col] = d1[row - col + n - 1] = d2[row + col] = false;
        }
    }
}

// Bitmask Sensor Count: Ultra-Fast Register-Level Bit Operations
int total_sensor_layouts_bits(int row, int n, int cols, int d1, int d2) {
    if (row == n) return 1;

    int count = 0;
    int available = ((1 << n) - 1) & ~(cols | d1 | d2);

    while (available) {
        int bit = available & (-available); // Extract lowest available position
        available &= (available - 1);       // Clear extracted position
        count += total_sensor_layouts_bits(row + 1, n, cols | bit, (d1 | bit) << 1, (d2 | bit) >> 1);
    }
    return count;
}
```

| Row ($r$) | Sensor Col Placement ($c$) | Column Index ($c$) | Major Diag ($r - c + N - 1$) | Minor Diag ($r + c$) |
| :--- | :--- | :--- | :--- | :--- |
| $0$ | $1$ | $1$ | $0 - 1 + 3 = 2$ | $0 + 1 = 1$ |
| $1$ | $3$ | $3$ | $1 - 3 + 3 = 1$ | $1 + 3 = 4$ |
| $2$ | $0$ | $0$ | $2 - 0 + 3 = 5$ | $2 + 0 = 2$ |
| $3$ | $2$ | $2$ | $3 - 2 + 3 = 4$ | $3 + 2 = 5$ |

```text
Row 0 Placement bit: 0010 (Col 1)
Next Row Column mask:   cols | bit = 0010
Next Row Left Diag (/): (d1 | bit) << 1 = 0100
Next Row Right Diag (\): (d2 | bit) >> 1 = 0001
Combined Attacks: (0010 | 0100 | 0001) = 0111 -> Available: 1000
```

> [!TIP]
> Using boolean lookup arrays reduces collision checking from an $O(N)$ ray scan to an $O(1)$ constant-time lookup. Passing bitmasks in integer registers further replaces entire arrays with 1-cycle bitwise operations.

#### Complexity Analysis
- **Time Complexity:** $O(N!)$ upper bounded by factorial search branches with rapid pruning.
- **Auxiliary Space:** $O(N)$ recursion depth and constraint tracking tables.

---

### Grid Constraint Puzzles — Latin Square & Matrix Partition Solvers

The partitioned matrix puzzle fills an $N \times N$ grid satisfying concurrent constraints: each symbol must appear exactly once in each row, column, and sub-block region.

We scan for the next unassigned cell, test all valid symbol candidates, apply the choice, and recursively attempt to solve the remaining grid, rolling back on dead ends.

```text
Cell Coordinate: (r, c) in 9x9 grid
Row Constraint:    rows[r][num]
Column Constraint: cols[c][num]
Block Constraint:  boxes[(r/3)*3 + c/3][num]
A candidate is valid iff all 3 region flags are false!
```

The complete constraint validity check runs in deterministic $O(1)$ time:

$$\text{valid}(r, c, d) = \neg (\text{row}[r][d] \lor \text{col}[c][d] \lor \text{box}[\text{idx}(r, c)][d])$$

Let's implement the constraint matrix solver in C++.

```cpp
// Partitioned Constraint Matrix Solver: O(9^K) Time, O(1) Space
bool solve_constraint_matrix_grid(vector<vector<char>>& board) {
    for (int r = 0; r < 9; ++r) {
        for (int c = 0; c < 9; ++c) {
            if (board[r][c] == '.') {
                for (char ch = '1'; ch <= '9'; ++ch) {
                    // Check row, col, and 3x3 box validity
                    bool valid = true;
                    for (int i = 0; i < 9; ++i) {
                        if (board[r][i] == ch || board[i][c] == ch ||
                            board[3 * (r / 3) + i / 3][3 * (c / 3) + i % 3] == ch) {
                            valid = false;
                            break;
                        }
                    }

                    if (valid) {
                        board[r][c] = ch; // Apply candidate
                        if (solve_constraint_matrix_grid(board)) return true;
                        board[r][c] = '.'; // Backtrack
                    }
                }
                return false; // No valid digit worked here; trigger backtrack
            }
        }
    }
    return true; // Grid fully and correctly completed
}
```

#### Complexity Analysis
- **Time Complexity:** $O(9^{K})$ where $K$ is the count of empty cells ($< 10^4$ states in practice).
- **Auxiliary Space:** $O(81) = O(1)$ recursion depth bounded by total grid cells.

---





## Cheat Sheet & Quick Reference

| Backtracking Pattern | State & Choice Mechanism | Pruning / Bounding Rule | Complexity |
| :--- | :--- | :--- | :--- |
| **Power Set Deduplication** | Choose / Exclude elements | `i > start && nums[i] == nums[i-1]` | $O(N \cdot 2^N)$ / $O(N)$ Space |
| **Unique Permutations** | Track `used[i]` array | `nums[i] == nums[i-1] && !used[i-1]` | $O(N \cdot N!)$ / $O(N)$ Space |
| **Target Budget Combinations** | Unbounded reuse (Index $i$) | `cands[i] > target -> break` (Sorted) | $O(2^{T/\min})$ / $O(T)$ Space |
| **Grid Word Search** | 4-way spatial navigation | Mutate `board[r][c] = '#'` in-place | $O(R \cdot C \cdot 4^L)$ / $O(L)$ |
| **Guarded Sensor Grid** | Place 1 item per row | cols[c] \|\| d1[r-c+N] \|\| d2[r+c] | (N!) / (N)$ Space |
| **Bitmask Grid Placement** | Register shifts per row | `pos = avail & (-avail)` LSB extraction | $O(N!)$ with $1$-cycle ops |
| **Latin Matrix Solver** | Test digits $1 \dots 9$ | `row[r] \|\| col[c] \|\| box[(r/3)*3 + c/3]` | $O(9^K)$ / $O(1)$ Space |
