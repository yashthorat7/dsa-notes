# Chapter 7: Matrix Algorithms

---


## Matrix Representation


### Matrix Storage Models & 2D-to-1D Index Flattening

As covered in Chapter 6's multi-dimensional array layouts, physical RAM is strictly linear. We map 2D coordinates $(r, c)$ in an $R \times C$ grid to a 1D contiguous offset using Row-Major or Column-Major order.

```text
2D Grid (3 Rows x 4 Cols):
  Row 0: [ M00 ][ M01 ][ M02 ][ M03 ]
  Row 1: [ M10 ][ M11 ][ M12 ][ M13 ]
  Row 2: [ M20 ][ M21 ][ M22 ][ M23 ]

1D RAM Buffer:
  [ M00, M01, M02, M03 | M10, M11, M12, M13 | M20, M21, M22, M23 ]
  Offset = row * NUM_COLS + col
```

In Row-Major Order (standard in C and C++), row elements are packed contiguously, providing standard algebraic coordinate mapping formulas for 2D grids and 3D tensors.

$$\text{Index}_{2D}(r, c) = r \cdot C + c, \quad \text{Row}(i) = \left\lfloor \frac{i}{C} \right\rfloor, \quad \text{Col}(i) = i \bmod C$$

$$\text{Index}_{3D}(d, r, c) = d \cdot (R \cdot C) + r \cdot C + c \quad (\text{Depth } d, \; \text{Row } r, \; \text{Col } c)$$

Let's construct a cache-friendly `Matrix2D` class that encapsulates a single dynamic 1D buffer with intuitive `(r, c)` indexing.

```cpp
// Cache-Friendly Flattened 2D Matrix Class
class Matrix2D {
    int rows, cols;
    vector<int> data;

public:
    Matrix2D(int r, int c, int init_val = 0)
        : rows(r), cols(c), data(r * c, init_val) {}

    int& operator()(int r, int c) {
        return data[r * cols + c]; // O(1) single-cycle index math
    }

    const int& operator()(int r, int c) const {
        return data[r * cols + c];
    }
};
```

In contrast, nested vectors (`vector<vector<int>>`) allocate an outer vector of pointers, where each row lives in a separate heap chunk, creating pointer chasing and cache misses.

```cpp
// Nested Vector vs Flattened 1D Allocation
void demonstrate_matrix_layouts(int r, int c) {
    // Nested: r + 1 separate heap allocations (Scattered memory)
    vector<vector<int>> jagged_mat(r, vector<int>(c, 0));

    // Flattened: Exactly 1 contiguous heap allocation (Cache optimal)
    vector<int> flat_mat(r * c, 0);
}
```

| Metric | Single Flattened Buffer (`vector<int>`) | Vector of Vectors (`vector<vector<int>>`) |
| :--- | :--- | :--- |
| Heap Allocations | **1 single allocation** | $R + 1$ separate allocations |
| Cache Spatial Locality | **Optimal** (Contiguous rows) | **Poor** (Scattered row pointers) |
| Memory Overhead | **0 bytes** pointer bloat | $24 \times R$ bytes vector headers |
| SIMD Vectorization | **Supported** directly | **Hard** across fragmented rows |

```text
Nested:   mat[r][c] ===> Read ptr mat[r] -> Fetch heap row -> Read c
Flat:     mat(r, c) ===> Direct read at base + (r * C + c) * 4 bytes
```

> [!WARNING]
> Passing `vector<vector<int>>` by value into functions creates an expensive deep copy of $O(R \cdot C)$ elements. Always pass matrices by `const reference`.

Let's now examine matrix transposition across square and rectangular dimensions.


#### Complexity Analysis
- **Time Complexity:** $\Theta(1)$ constant time coordinate-to-offset calculation.
- **Auxiliary Space:** $O(R \cdot C)$ memory to store matrix elements.

---


### Matrix Transposition — Square In-Place vs Rectangular Out-of-Place

Matrix transposition swaps rows and columns such that element $(r, c)$ moves to coordinate position $(c, r)$, mirroring values across the main diagonal.

For square $N \times N$ matrices, transposition can be performed in-place with $O(1)$ extra space by iterating strictly above the main diagonal ($c > r$).

```text
[ A00 ]   ( A01 )   ( A02 )        [ A00 ]   ( A10 )   ( A20 )
( A10 )   [ A11 ]   ( A12 )  ===>  ( A01 )   [ A11 ]   ( A21 )
( A20 )   ( A21 )   [ A22 ]        ( A02 )   ( A12 )   [ A22 ]
Diagonal elements [Aii] stay fixed; Symmetric pairs swap once!
```

The mathematical identity maps coordinates across the main diagonal axis.

$$M^T[c][r] = M[r][c] \quad \text{for all } 0 \le r < R, \; 0 \le c < C$$

Let's implement in-place transposition for square matrices.

```cpp
// In-Place Square Matrix Transposition: O(N^2) Time, O(1) Space
void transpose_square(vector<vector<int>>& mat) {
    int n = mat.size();
    for (int r = 0; r < n; ++r) {
        for (int c = r + 1; c < n; ++c) {
            swap(mat[r][c], mat[c][r]); // Symmetric off-diagonal swap
        }
    }
}
```

For rectangular matrices of dimensions $R \times C$ (where $R \neq C$), in-place transposition changes dimensions to $C \times R$, requiring an out-of-place output buffer.

```cpp
// Out-of-Place Rectangular Matrix Transposition (R x C -> C x R)
vector<vector<int>> transpose_rectangular(const vector<vector<int>>& mat) {
    int r = mat.size();
    int c = mat[0].size();
    vector<vector<int>> transposed(c, vector<int>(r));
    for (int i = 0; i < r; ++i) {
        for (int j = 0; j < c; ++j) {
            transposed[j][i] = mat[i][j];
        }
    }
    return transposed;
}
```

| Original Coordinate | Initial Value ($3 \times 3$) | Target Coordinate | Final Value | Swap Status |
| :--- | :--- | :--- | :--- | :--- |
| $(0, 0)$ | $1$ | $(0, 0)$ | $1$ | Main diagonal (Fixed) |
| $(0, 1)$ | $2$ | $(1, 0)$ | $4$ | Swapped with $(1, 0)$ |
| $(0, 2)$ | $3$ | $(2, 0)$ | $7$ | Swapped with $(2, 0)$ |
| $(1, 1)$ | $5$ | $(1, 1)$ | $5$ | Main diagonal (Fixed) |
| $(1, 2)$ | $6$ | $(2, 1)$ | $8$ | Swapped with $(2, 1)$ |
| $(2, 2)$ | $9$ | $(2, 2)$ | $9$ | Main diagonal (Fixed) |

```text
In-place rectangular transposition on 1D buffers requires cycle-
following algorithms with complex permutation orbits -> Prefer 2D buf
```

> [!CAUTION]
> In square in-place transposition, start the inner loop at `c = r + 1`. Starting at `c = 0` swaps elements twice, restoring the original matrix.

Let's now examine spiral traversals with boundary contraction.


#### Complexity Analysis
- **Time Complexity:** $\Theta(R \cdot C)$ operations visiting each cell in the matrix.
- **Auxiliary Space:** $O(1)$ for in-place square transpose, $O(R \cdot C)$ for rectangular transpose buffer.

---


## Matrix Traversals


### Concentric Perimeter Matrix Traversal & Layer Boundary Shrinking

Concentric perimeter matrix traversal visits all cells of an $R \times C$ grid in a clockwise inward path from the top-left outer perimeter toward the center.

We maintain four perimeter boundaries: `top`, `bottom`, `left`, and `right`, shrinking each boundary inward after completing its corresponding directional sweep.

```text
top ->    [ 1 ] ------> [ 2 ] ------> [ 3 ]
                                        |
          [ 8 ] ------> [ 9 ]         [ 4 ]
            ^                           |
bottom -> [ 7 ] <------ [ 6 ] <------ [ 5 ]
          ^
          left                       right
Perimeter Rule: Top -> Right -> Bottom -> Left, then shrink bounds!
```

Boundary conditions ensure rectangular matrices don't double-process rows or columns when bounds overlap.

$$\text{top} \le \text{bottom} \quad \land \quad \text{left} \le \text{right}$$

Let's implement the complete layer-shrinking perimeter traversal in C++.

```cpp
// Concentric Layer-by-Layer Field Survey: O(R * C) Time, O(1) Extra Space
vector<int> concentric_layer_traversal(const vector<vector<int>>& grid) {
    if (grid.empty() || grid[0].empty()) return {};

    int top = 0, bottom = grid.size() - 1;
    int left = 0, right = grid[0].size() - 1;
    vector<int> result;

    while (top <= bottom && left <= right) {
        // 1. Sweep Top Row: Left to Right
        for (int c = left; c <= right; ++c) result.push_back(grid[top][c]);
        top++;

        // 2. Sweep Right Column: Top to Bottom
        for (int r = top; r <= bottom; ++r) result.push_back(grid[r][right]);
        right--;

        // 3. Sweep Bottom Row: Right to Left (Guarded)
        if (top <= bottom) {
            for (int c = right; c >= left; --c) result.push_back(grid[bottom][c]);
            bottom--;
        }

        // 4. Sweep Left Column: Bottom to Top (Guarded)
        if (left <= right) {
            for (int r = bottom; r >= top; --r) result.push_back(grid[r][left]);
            left++;
        }
    }
    return result;
}
```

#### Complexity Analysis
- **Time Complexity:** $\Theta(R \cdot C)$ visiting each matrix element exactly once.
- **Auxiliary Space:** $O(1)$ extra space excluding the output vector.

---


### Main and Anti-Diagonal Traversals & Grouping Invariants

Matrix diagonals follow consistent geometric invariants: main diagonals share constant coordinate differences ($r - c = \text{const}$), while anti-diagonals share constant coordinate sums ($r + c = \text{const}$).

Anti-diagonal grouping maps every element on the same top-right to bottom-left stripe to an identical integer key $S = r + c$.

```text
Coordinates:      Col 0      Col 1      Col 2
  Row 0:         [ 0+0=0 ]  [ 0+1=1 ]  [ 0+2=2 ]
  Row 1:         [ 1+0=1 ]  [ 1+1=2 ]  [ 1+2=3 ]
  Row 2:         [ 2+0=2 ]  [ 2+1=3 ]  [ 2+2=4 ]
  Total anti-diagonals = R + C - 1 (Keys range from 0 to R+C-2)
```

The mathematical formulas describe all elements belonging to a specific diagonal slice.

$$\text{Anti-Diagonal}(k) = \{(r, c) \mid r + c = k\}, \quad \text{Main Diagonal}(d) = \{(r, c) \mid r - c = d\}$$

Let's implement a zigzag diagonal traversal that alternates scan directions on each anti-diagonal stripe.

```cpp
// Zigzag Diagonal Matrix Traversal: O(R * C) Time
vector<int> find_diagonal_order(const vector<vector<int>>& mat) {
    if (mat.empty() || mat[0].empty()) return {};
    int r = mat.size(), c = mat[0].size();
    vector<vector<int>> diagonals(r + c - 1);

    for (int i = 0; i < r; ++i) {
        for (int j = 0; j < c; ++j) {
            diagonals[i + j].push_back(mat[i][j]); // Bucket by sum key
        }
    }

    vector<int> result;
    for (int k = 0; k < r + c - 1; ++k) {
        if (k % 2 == 0) {
            // Even diagonal: reverse order (Up-Right sweep)
            result.insert(result.end(), diagonals[k].rbegin(), diagonals[k].rend());
        } else {
            // Odd diagonal: normal order (Down-Left sweep)
            result.insert(result.end(), diagonals[k].begin(), diagonals[k].end());
        }
    }
    return result;
}
```

| Diagonal Key ($k = r + c$) | Member Coordinates $(r, c)$ | Raw Values | Scan Direction | Emitted Values |
| :--- | :--- | :--- | :--- | :--- |
| $k = 0$ | $(0, 0)$ | `[1]` | Up-Right | `1` |
| $k = 1$ | $(0, 1), (1, 0)$ | `[2, 4]` | Down-Left | `2, 4` |
| $k = 2$ | $(0, 2), (1, 1), (2, 0)$ | `[3, 5, 7]` | Up-Right | `7, 5, 3` |
| $k = 3$ | $(1, 2), (2, 1)$ | `[6, 8]` | Down-Left | `6, 8` |
| $k = 4$ | $(2, 2)$ | `[9]` | Up-Right | `9` |

```text
Stripe 0 (Up-Right)  ---> [ 1 ]
Stripe 1 (Down-Left) ---> [ 2 ] -> [ 4 ]
Stripe 2 (Up-Right)  ---> [ 7 ] -> [ 5 ] -> [ 3 ]
Stripe 3 (Down-Left) ---> [ 6 ] -> [ 8 ]
Stripe 4 (Up-Right)  ---> [ 9 ]
```

> [!TIP]
> Allocating a vector of $R + C - 1$ buckets groups diagonal elements in a single pass without boundary checks.

Let's now study in-place 90-degree matrix rotations.


#### Complexity Analysis
- **Time Complexity:** $\Theta(R \cdot C)$ to bucket and traverse all elements.
- **Auxiliary Space:** $O(R \cdot C)$ memory to store diagonal buckets.

---


## Matrix Rotations & Simulations


### Matrix 90-Degree Rotations — Clockwise & Counter-Clockwise Invariants

Rotating an $N \times N$ square matrix clockwise by 90 degrees in-place can be decomposed into two simple geometric steps: Transposition + Row Reversal.

This two-step decomposition performs the entire rotation with $O(1)$ auxiliary space without complex coordinate math.

```text
Initial Matrix:        Step 1: Transpose         Step 2: Reverse Rows
  [ 1  2  3 ]             [ 1  4  7 ]               [ 7  4  1 ]
  [ 4  5  6 ]    ===>     [ 2  5  8 ]      ===>     [ 8  5  2 ]
  [ 7  8  9 ]             [ 3  6  9 ]               [ 9  6  3 ]
```

The geometric composition formulas govern both clockwise and counter-clockwise rotations.

$$\text{Rotate 90° CW} = \text{RevRows}(\text{Transpose}(M)), \quad \text{Rotate 90° CCW} = \text{RevCols}(\text{Transpose}(M))$$

Let's implement in-place 90-degree clockwise and counter-clockwise rotations in C++.

```cpp
// In-Place 90-Degree Clockwise Rotation: O(N^2) Time, O(1) Space
void rotate_matrix_clockwise(vector<vector<int>>& matrix) {
    int n = matrix.size();
    // Step 1: Transpose matrix in-place
    for (int r = 0; r < n; ++r) {
        for (int c = r + 1; c < n; ++c) {
            swap(matrix[r][c], matrix[c][r]);
        }
    }
    // Step 2: Reverse each row horizontally
    for (int r = 0; r < n; ++r) {
        reverse(matrix[r].begin(), matrix[r].end());
    }
}
```

For counter-clockwise rotation, transpose the matrix and reverse each column vertically.

```cpp
// In-Place 90-Degree Counter-Clockwise Rotation
void rotate_matrix_counter_clockwise(vector<vector<int>>& matrix) {
    int n = matrix.size();
    // Step 1: Transpose matrix in-place
    for (int r = 0; r < n; ++r) {
        for (int c = r + 1; c < n; ++c) {
            swap(matrix[r][c], matrix[c][r]);
        }
    }
    // Step 2: Reverse each column vertically
    for (int c = 0; c < n; ++c) {
        for (int r = 0; r < n / 2; ++r) {
            swap(matrix[r][c], matrix[n - 1 - r][c]);
        }
    }
}
```

| Operation | Step 1 Transformation | Step 2 Transformation | Net Rotation Result |
| :--- | :--- | :--- | :--- |
| 90° Clockwise | Transpose ($M^T$) | Reverse each Row | **90° CW** |
| 90° Counter-Clockwise | Transpose ($M^T$) | Reverse each Column | **90° CCW** |
| 180° Rotation | Reverse each Row | Reverse each Column | **180° Inversion** |

```text
(r, c) --------------> (c, n-1-r)
   ^                       |
   |                       v
(n-1-c, r) <---------- (n-1-r, n-1-c)
4 corners rotate cyclically in-place using a single temp variable!
```

> [!IMPORTANT]
> Transpose + Reverse Rows yields a Clockwise rotation. Transpose + Reverse Columns yields a Counter-Clockwise rotation.

Let's now examine cellular automata and grid state simulations.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N^2)$ operations visiting each cell twice.
- **Auxiliary Space:** $O(1)$ in-place swapping workspace.

---


### Grid State Simulations & Cellular Automata Rules

Grid state simulations update matrix cells synchronously based on local neighborhood rules, as in Conway's Game of Life.

To update the board in-place with $O(1)$ auxiliary memory, we use 2-bit state encoding: Bit 0 stores the current state and Bit 1 stores the next state.

```text
Bit Representation: [ Bit 1: Next State ][ Bit 0: Current State ]
  State 0 (00_2): Dead now, stays Dead
  State 1 (01_2): Live now, becomes Dead
  State 2 (10_2): Dead now, becomes Live
  State 3 (11_2): Live now, stays Live
Extract Current State: (cell & 1)  |  Extract Next State: (cell >> 1)
```

The mathematical bit-packing formula allows synchronous updates without extra grid buffers.

$$\text{cell} = (\text{next\_state} \ll 1) \mid \text{current\_state} \implies \text{curr} = \text{cell} \mathbin{\&} 1, \; \text{next} = \text{cell} \gg 1$$

Let's implement Game of Life in-place using 2-bit state transitions.

```cpp
// Game of Life: In-Place Simulation via 2-Bit Encoding
void game_of_life(vector<vector<int>>& board) {
    int r = board.size(), c = board[0].size();
    int dr[] = {-1, -1, -1, 0, 0, 1, 1, 1};
    int dc[] = {-1, 0, 1, -1, 1, -1, 0, 1};

    for (int i = 0; i < r; ++i) {
        for (int j = 0; j < c; ++j) {
            int live_neighbors = 0;
            for (int d = 0; d < 8; ++d) {
                int ni = i + dr[d], nj = j + dc[d];
                if (ni >= 0 && ni < r && nj >= 0 && nj < c) {
                    live_neighbors += (board[ni][nj] & 1); // Read original bit 0
                }
            }
            // Rule Evaluation
            if ((board[i][j] & 1) == 1) {
                if (live_neighbors == 2 || live_neighbors == 3) board[i][j] |= 2; // Stays live (11_2)
            } else {
                if (live_neighbors == 3) board[i][j] |= 2; // Becomes live (10_2)
            }
        }
    }
    // Decode: Shift bit 1 into final position
    for (int i = 0; i < r; ++i) {
        for (int j = 0; j < c; ++j) board[i][j] >>= 1;
    }
}
```

| Current Bit 0 | Live Neighbors | Next Bit 1 | Encoded State | Final Decoded State (`>> 1`) |
| :--- | :--- | :--- | :--- | :--- |
| $1$ (Live) | $< 2$ (Underpopulation) | $0$ (Dead) | $01_2 = 1$ | $0$ (Dead) |
| $1$ (Live) | $2 \text{ or } 3$ (Survival) | $1$ (Live) | $11_2 = 3$ | $1$ (Live) |
| $1$ (Live) | $> 3$ (Overpopulation) | $0$ (Dead) | $01_2 = 1$ | $0$ (Dead) |
| $0$ (Dead) | Exactly $3$ (Reproduction) | $1$ (Live) | $10_2 = 2$ | $1$ (Live) |

```text
Pass 1: Encode next state into bit 1 while reading original bit 0
Pass 2: Right-shift all cells by 1 (board[i][j] >>= 1) to finalize
```

> [!CAUTION]
> When reading neighbor states during the simulation pass, always extract the original state with `board[nr][nc] & 1` to ignore pending state transitions.

Let's now examine searching in 2D sorted matrices.


#### Complexity Analysis
- **Time Complexity:** $\Theta(R \cdot C)$ across two sequential passes over the grid.
- **Auxiliary Space:** $O(1)$ in-place bitwise workspace.

---


## 2D Sorted Grid Search


### Bi-Dimensionally Sorted Matrix Search & Staircase Elimination

Consider searching for a target value in a 2D matrix where every individual row is sorted left-to-right, and every individual column is sorted top-to-bottom.

Staircase Search starts at the top-right corner $(0, C-1)$. If the current value is greater than the target, we move Left; if smaller, we move Down.

```text
Matrix: [ 10,  20,  30,  40 ] <--- Start at Top-Right (0, 3): 40
        [ 15,  25,  35,  45 ]      Target = 29
        [ 27,  29,  37,  48 ]      40 > 29 -> Move Left to 30
        [ 32,  33,  39,  50 ]      30 > 29 -> Move Left to 20
                                   20 < 29 -> Move Down to 25
                                   25 < 29 -> Move Down to 29 (Hit!)
```

Each step eliminates an entire row or column from consideration, finding the target in at most $R + C$ steps.

$$\text{Staircase Search Time} = O(R + C) \ll O(R \cdot C)$$

Let's implement Staircase Search in C++.

```cpp
// Staircase Search on Bi-Dimensionally Sorted Matrix: O(R + C)
bool search_matrix_staircase(const vector<vector<int>>& mat, int target) {
    if (mat.empty() || mat[0].empty()) return false;
    int r = 0;
    int c = mat[0].size() - 1; // Start at Top-Right corner

    while (r < mat.size() && c >= 0) {
        if (mat[r][c] == target) return true; // Target found!
        else if (mat[r][c] > target) c--;      // Eliminate entire column
        else r++;                              // Eliminate entire row
    }
    return false; // Target not present
}
```

If the matrix is strictly row-major sorted (where the first element of each row is greater than the last of the previous row), we can perform a 1D binary search in $O(\log(R \cdot C))$ time.

```cpp
// Virtual 1D Binary Search on Row-Major Sorted Matrix: O(log(R * C))
bool search_matrix_binary(const vector<vector<int>>& mat, int target) {
    if (mat.empty() || mat[0].empty()) return false;
    int rows = mat.size(), cols = mat[0].size();
    int low = 0, high = rows * cols - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2;
        int val = mat[mid / cols][mid % cols]; // Virtual 2D mapping
        if (val == target) return true;
        else if (val < target) low = mid + 1;
        else high = mid - 1;
    }
    return false;
}
```

| Step | Coordinate $(r, c)$ | Examined Value | Comparison (Target = 29) | Action Taken | Search Space Discarded |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Step 1 | $(0, 3)$ | $40$ | $40 > 29$ | Move Left (`c--`) | Column 3 eliminated |
| Step 2 | $(0, 2)$ | $30$ | $30 > 29$ | Move Left (`c--`) | Column 2 eliminated |
| Step 3 | $(0, 1)$ | $20$ | $20 < 29$ | Move Down (`r++`) | Row 0 eliminated |
| Step 4 | $(1, 1)$ | $25$ | $25 < 29$ | Move Down (`r++`) | Row 1 eliminated |
| Step 5 | $(2, 1)$ | $29$ | $29 == 29$ | **Target Found!** | Search completes |

```text
Path: (0,3) -> (0,2) -> (0,1) -> (1,1) -> (2,1) [Found in 5 steps!]
Max possible steps for 4x4 matrix: 4 + 4 = 8 steps vs 16 scan items
```

> [!TIP]
> Always start Staircase Search from the Top-Right $(0, C-1)$ or Bottom-Left $(R-1, 0)$ corners where directional moves strictly increase or decrease values.

This completes the Matrix Algorithms chapter, establishing mastery over 2D-to-1D memory layouts, transpositions, spirals, diagonal invariants, in-place rotations, cellular simulations, and staircase searches.


#### Complexity Analysis
- **Time Complexity:** $O(R + C)$ for Staircase Search; $O(\log(R \cdot C))$ for virtual 1D binary search.
- **Auxiliary Space:** $O(1)$ scalar index workspace.

---


## Cheat Sheet & Quick Reference

| Matrix Operation / Algorithm | Implementation Formula / Pattern | Time Complexity | Auxiliary Space |
| :--- | :--- | :--- | :--- |
| 2D-to-1D Flattening | `r * NUM_COLS + c` | $\Theta(1)$ | $O(1)$ calculation |
| Square Transposition | `swap(mat[r][c], mat[c][r])` for $c > r$ | $\Theta(N^2)$ | $O(1)$ in-place |
| Spiral Traversal | 4-boundary contraction (`top, bottom, left, right`) | $\Theta(R \cdot C)$ | $O(1)$ extra space |
| Anti-Diagonal Key | $r + c = \text{constant}$ | $\Theta(R \cdot C)$ | $O(R + C)$ buckets |
| 90° Clockwise Rotation | Transpose + Reverse Each Row | $\Theta(N^2)$ | $O(1)$ in-place |
| 90° Counter-Clockwise | Transpose + Reverse Each Column | $\Theta(N^2)$ | $O(1)$ in-place |
| 2-Bit Cellular State | `curr = cell & 1`, `next = cell >> 1` | $\Theta(R \cdot C)$ | $O(1)$ in-place |
| Staircase Grid Search | Start Top-Right: `val > target ? c-- : r++` | $O(R + C)$ | $O(1)$ workspace |
