# Chapter 16: Simulation & Intervals

---


## Simulation Design


### Game Loop Simulation & Finite State Machines

Let's stand at the whiteboard and model deterministic discrete-event systems using state variables, tick updates, and transition functions.

A Finite State Machine (FSM) formalizes dynamic behavior into a set of discrete states $\mathcal{S}$, input triggers $\Sigma$, and a transition function $\delta(S, \sigma) \to S'$.

```text
  [ IDLE ] --- Button Pressed ---> [ MOVING ]
      ^                                |
      |                              Arrived
      |                                v
Door Closed <--- Timer Expired --- [ OPEN_DOOR ]
```

The mathematical transition rule updates the system state deterministically at each discrete clock tick.

$$S_{t+1} = \delta(S_t, I_t) \quad \text{where } S \in \mathcal{S}, \; I \in \Sigma$$

Let's write an elevator controller FSM using `enum class` and `switch-case` dispatch.

```cpp
// Finite State Machine: Elevator Control System
enum class ElevatorState { IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPEN };

class ElevatorController {
    ElevatorState current_state = ElevatorState::IDLE;
    int current_floor = 0;
public:
    void step(int target_floor) {
        switch (current_state) {
            case ElevatorState::IDLE:
                if (target_floor > current_floor) current_state = ElevatorState::MOVING_UP;
                else if (target_floor < current_floor) current_state = ElevatorState::MOVING_DOWN;
                break;
            case ElevatorState::MOVING_UP:
                current_floor++;
                if (current_floor == target_floor) current_state = ElevatorState::DOOR_OPEN;
                break;
            case ElevatorState::MOVING_DOWN:
                current_floor--;
                if (current_floor == target_floor) current_state = ElevatorState::DOOR_OPEN;
                break;
            case ElevatorState::DOOR_OPEN:
                current_state = ElevatorState::IDLE; // Doors close
                break;
        }
    }
};
```

We can also simulate cellular automata like Conway's Game of Life in-place using 2-bit state encoding.

```cpp
// Conway's Game of Life: O(1) Extra Space via 2-Bit State Encoding
void game_of_life(vector<vector<int>>& board) {
    int R = board.size(), C = board[0].size();
    int dr[] = {-1,-1,-1, 0, 0, 1, 1, 1};
    int dc[] = {-1, 0, 1,-1, 1,-1, 0, 1};

    for (int r = 0; r < R; ++r) {
        for (int c = 0; c < C; ++c) {
            int live_neighbors = 0;
            for (int k = 0; k < 8; ++k) {
                int nr = r + dr[k], nc = c + dc[k];
                if (nr >= 0 && nr < R && nc >= 0 && nc < C) {
                    live_neighbors += (board[nr][nc] & 1); // Extract bit 0 (past state)
                }
            }
            // Rule 1 & 2: Survives with 2 or 3 live neighbors
            if ((board[r][c] & 1) && (live_neighbors == 2 || live_neighbors == 3)) {
                board[r][c] |= 2; // Set bit 1 (future live state)
            }
            // Rule 4: Reproduction on exactly 3 live neighbors
            if (!(board[r][c] & 1) && live_neighbors == 3) {
                board[r][c] |= 2;
            }
        }
    }
    // Shift bits to materialize future state
    for (int r = 0; r < R; ++r) {
        for (int c = 0; c < C; ++c) board[r][c] >>= 1;
    }
}
```

| Current State (Bit 0) | Live Neighbors | Next State (Bit 1) | Encoded Value | Decoded Final State |
| :--- | :--- | :--- | :--- | :--- |
| `0` (Dead) | $3$ | `1` (Born) | `0b10` ($2$) | `1` (Live) |
| `1` (Live) | $2$ or $3$ | `1` (Survives) | `0b11` ($3$) | `1` (Live) |
| `1` (Live) | $< 2$ or $> 3$ | `0` (Dies) | `0b01` ($1$) | `0` (Dead) |
| `0` (Dead) | $\ne 3$ | `0` (Remains) | `0b00` ($0$) | `0` (Dead) |

```text
Cell byte representation: [ ... | Bit 1: Future | Bit 0: Current ]
Neighbor checks read (cell & 1) -> Past truth is undisturbed!
Mutation writes (cell |= 2)     -> Encodes future without buffer
Final pass executes (cell >>= 1) -> Shifts future into current state
```

> [!WARNING]
> Mutating grid cells directly in place during simulation corrupts neighbor calculations for later cells. Always use a separate buffer or multi-bit state encoding.

Let's now study grid direction vectors and safe coordinate navigation.


#### Complexity Analysis
- **Time Complexity:** $O(R \cdot C)$ per simulation generation step.
- **Auxiliary Space:** $O(1)$ strictly in-place memory via bit encoding.

---


### Grid Direction Vectors & Safe Boundary Navigation

Writing separate nested if-statements for North, South, East, and West creates bug-prone code duplication when navigating 2D grids.

By using constant direction arrays `dr[]` and `dc[]`, we loop over all cardinal directions uniformly in a clean, maintainable loop.

```text
Direction Index 0 (Right) : dr = 0,  dc = +1
Direction Index 1 (Down)  : dr = +1, dc = 0
Direction Index 2 (Left)  : dr = 0,  dc = -1
Direction Index 3 (Up)    : dr = -1, dc = 0
Turn Right (Clockwise)    : dir = (dir + 1) % 4
```

The mathematical delta vectors specify 4-directional cardinal and 8-directional Moore neighbors.

$$\vec{D}_4 = \{(0, 1), (1, 0), (0, -1), (-1, 0)\}, \quad \vec{D}_8 = \vec{D}_4 \cup \{(1, 1), (1, -1), (-1, 1), (-1, -1)\}$$

#### Direction Vector Delta Cheat-Table

| Topology | Coordinate Deltas | Application |
| :--- | :--- | :--- |
| **4-Way Cardinal** | `dr = {-1, 0, 1, 0}`, `dc = {0, 1, 0, -1}` | Standard grid BFS/DFS maze paths |
| **8-Way Moore** | `dr = {-1,-1,-1, 0, 0, 1, 1, 1}`, `dc = {-1, 0, 1,-1, 1,-1, 0, 1}` | Minesweeper, Game of Life diagonal neighbors |
| **Knight Jumps** | `dr = {-2,-2,-1,-1, 1, 1, 2, 2}`, `dc = {-1, 1,-2, 2,-2, 2,-1, 1}` | Chess knight reachability & hop BFS |
| **3D 6-Way Voxel**| `dr = {-1, 1, 0, 0, 0, 0}`, `dc = {0, 0,-1, 1, 0, 0}`, `dz = {0, 0, 0, 0,-1, 1}`| 3D voxel volume search & 3D flood fill |

Let's implement a clean concentric perimeter grid traversal using directional delta arrays.

```cpp
// Concentric Perimeter Grid Traversal: O(R * C) Time, O(1) Aux Space
vector<int> spiral_order(const vector<vector<int>>& matrix) {
    if (matrix.empty()) return {};
    int R = matrix.size(), C = matrix[0].size();
    vector<int> result;

    int top = 0, bottom = R - 1, left = 0, right = C - 1;

    while (top <= bottom && left <= right) {
        // 1. Move Right across Top boundary
        for (int c = left; c <= right; ++c) result.push_back(matrix[top][c]);
        top++;

        // 2. Move Down across Right boundary
        for (int r = top; r <= bottom; ++r) result.push_back(matrix[r][right]);
        right--;

        // 3. Move Left across Bottom boundary
        if (top <= bottom) {
            for (int c = right; c >= left; --c) result.push_back(matrix[bottom][c]);
            bottom--;
        }

        // 4. Move Up across Left boundary
        if (left <= right) {
            for (int r = bottom; r >= top; --r) result.push_back(matrix[r][left]);
            left++;
        }
    }
    return result;
}
```

| Direction Index | Name | Delta $(dr, dc)$ | Next Turn `(dir + 1) % 4` | Opposite `(dir + 2) % 4` |
| :--- | :--- | :--- | :--- | :--- |
| `0` | East / Right | $(0, +1)$ | `1` (South / Down) | `2` (West / Left) |
| `1` | South / Down | $(+1, 0)$ | `2` (West / Left) | `3` (North / Up) |
| `2` | West / Left | $(0, -1)$ | `3` (North / Up) | `0` (East / Right) |
| `3` | North / Up | $(-1, 0)$ | `0` (East / Right) | `1` (South / Down) |

```text
[ top, left ]   ===================>  [ top, right ]
      ^                                     |
      |                                     |
      |                                     v
[ bottom, left ] <==================  [ bottom, right ]
Bounding borders shrink inward layer-by-layer!
```

> [!TIP]
> Define direction arrays as `const int dr[] = {0, 1, 0, -1};` statically or globally to prevent creating fresh vectors on every grid traversal call.

Let's now shift from discrete 2D grids to 1D continuous interval math.


#### Complexity Analysis
- **Time Complexity:** $\Theta(R \cdot C)$ visiting every grid cell exactly once.
- **Auxiliary Space:** $O(1)$ auxiliary scalar boundaries.

---


## Interval Math


### Interval Representations & In-Place Interval Merging

An interval $[s, e]$ represents a closed continuous line segment from start timestamp $s$ to end timestamp $e$.

To merge overlapping schedule intervals, we sort all intervals by start time and iteratively expand our active interval's end boundary whenever an overlap occurs.

```text
Interval A:  [ 1 ================= 6 ]
Interval B:        [ 3 ===== 5 ]        (Enclosed -> absorbed!)
Interval C:              [ 4 ============ 8 ] (Overlaps -> Extends 8!)
Merged Result: [ 1 ========================== 8 ]
```

Two sorted intervals $A$ and $B$ overlap if and only if:

$$B.\text{start} \le A.\text{end} \implies \text{Merge into } [A.\text{start}, \max(A.\text{end}, B.\text{end})]$$

Let's implement booking consolidation and new reservation splicing in C++.

```cpp
// Interval Data Structure Definition
struct Interval {
    int start, end;
};

// Consolidate Overlapping Reservations: O(N log N) Time, O(N) Space
vector<Interval> consolidate_booking_spans(vector<Interval>& intervals) {
    if (intervals.empty()) return {};

    sort(intervals.begin(), intervals.end(), [](const Interval& a, const Interval& b) {
        return a.start < b.start;
    });

    vector<Interval> merged;
    merged.push_back(intervals[0]);

    for (int i = 1; i < (int)intervals.size(); ++i) {
        if (intervals[i].start <= merged.back().end) {
            merged.back().end = max(merged.back().end, intervals[i].end); // Expand active end
        } else {
            merged.push_back(intervals[i]); // Disjoint interval; start new span
        }
    }
    return merged;
}

// Insert New Reservation into Sorted Disjoint Schedule: O(N) Time, O(N) Space
vector<Interval> insert_new_reservation(const vector<Interval>& intervals, Interval new_booking) {
    vector<Interval> result;
    int i = 0, n = intervals.size();

    // 1. Add all intervals ending before new_booking starts
    while (i < n && intervals[i].end < new_booking.start) {
        result.push_back(intervals[i++]);
    }

    // 2. Merge all overlapping intervals with new_booking
    while (i < n && intervals[i].start <= new_booking.end) {
        new_booking.start = min(new_booking.start, intervals[i].start);
        new_booking.end = max(new_booking.end, intervals[i].end);
        i++;
    }
    result.push_back(new_booking);

    // 3. Add all remaining intervals starting after new_booking ends
    while (i < n) {
        result.push_back(intervals[i++]);
    }
    return result;
}
```

#### Complexity Analysis
- **Time Complexity:** $O(N \log N)$ for Booking Consolidation (due to sorting); $O(N)$ for Reservation Splicing on sorted input.
- **Auxiliary Space:** $O(N)$ to hold the merged interval collection.

---


### Interval Scheduling & Maximum Concurrency Tracking

The Activity Selection problem asks us to select the maximum number of non-overlapping meetings from a list of candidate intervals.

The optimal greedy strategy sorts intervals by earliest finish time: picking the meeting that ends earliest leaves the maximum possible free time for subsequent meetings.

```text
Meeting A: [ 1 ======= 4 ]  (Ends at 4) -> PICK!
Meeting B:      [ 3 ============= 8 ] (Overlaps A -> Discard!)
Meeting C:              [ 5 === 7 ]  (Ends at 7) -> PICK!
Meeting D:                  [ 6 ============ 10 ] (Overlaps C)
Max non-overlapping meetings selected = 2 (A and C)
```

To calculate the minimum number of meeting rooms required to accommodate all meetings simultaneously, we use a min-heap to track ongoing room end times.

$$\text{Room Condition: } \text{If } \text{start}_{i} \ge \text{min\_heap.top()} \implies \text{Reuse room (pop)}; \quad \text{Else } \implies \text{Allocate new room}$$

Let's write both the Activity Selection scheduler and the Meeting Rooms II solver.

```cpp
// Interval Scheduling & Min Meeting Rooms
int max_activities(vector<Interval>& intervals) {
    // Greedy heuristic: Sort by EARLIEST END TIME
    sort(intervals.begin(), intervals.end(), [](const Interval& a, const Interval& b) {
        return a.end < b.end;
    });

    int count = 0, last_end = -1e9;
    for (const auto& iv : intervals) {
        if (iv.start >= last_end) {
            count++;
            last_end = iv.end;
        }
    }
    return count;
}

int min_meeting_rooms(vector<Interval>& intervals) {
    if (intervals.empty()) return 0;

    // Sort by START TIME
    sort(intervals.begin(), intervals.end(), [](const Interval& a, const Interval& b) {
        return a.start < b.start;
    });

    priority_queue<int, vector<int>, greater<int>> min_heap; // Active room end times
    min_heap.push(intervals[0].end);

    for (size_t i = 1; i < intervals.size(); ++i) {
        if (intervals[i].start >= min_heap.top()) {
            min_heap.pop(); // Room is free; reuse it
        }
        min_heap.push(intervals[i].end); // Book room until intervals[i].end
    }
    return min_heap.size(); // Heap size represents total rooms needed
}
```

| Incoming Meeting $[S, E]$ | Earliest Free Room (`min_heap.top()`) | Room Reuse? | Heap State After Event |
| :--- | :--- | :--- | :--- |
| `[0, 30]` | - | Base room allocated | `{30}` (Size: 1) |
| `[5, 10]` | `30` ($5 < 30$) | No room free $\to$ New room | `{10, 30}` (Size: 2) |
| `[15, 20]` | `10` ($15 \ge 10$) | Reuse room $\to$ Pop `10`, push `20` | `{20, 30}` (Size: 2) |

```text
Room 1: [ 0 =================================================== 30 ]
Room 2:      [ 5 ========= 10 ]        [ 15 ========= 20 ]
Peak simultaneous overlap = 2 rooms
```

> [!IMPORTANT]
> To maximize non-overlapping meetings, sort by **END TIME**. To calculate minimum required meeting rooms, sort by **START TIME**.

Let's now examine the Sweep Line algorithm for point-based event processing.


#### Complexity Analysis
- **Time Complexity:** $O(N \log N)$ to sort and maintain the min-heap.
- **Auxiliary Space:** $O(N)$ heap memory storing room release timestamps.

---


## Advanced Event Scans


### Sweep Line Algorithm & Event-Driven Interval Processing

The Sweep Line algorithm processes geometric intervals by decomposing each interval $[s, e]$ into two discrete events: a Start Event $(s, +1)$ and an End Event $(e, -1)$.

Sorting these events along a single 1D timeline allows an imaginary vertical line to sweep left-to-right, maintaining a running count of active intervals.

```text
Interval [ 1, 5 ] -> Events: (1, +1) and (5, -1)
Interval [ 2, 8 ] -> Events: (2, +1) and (8, -1)
Sorted Timeline Events:
Time:    1       2       5       8
Delta:  +1      +1      -1      -1
Active:  1  ->   2  ->   1  ->   0    (Peak Concurrency = 2!)
```

The peak concurrency across all intervals equals the maximum prefix sum of event deltas.

$$\text{Peak Concurrency} = \max_{t} \left( \sum_{t_i \le t} \Delta_i \right)$$

Let's implement Meeting Rooms II using the Sweep Line event approach.

```cpp
// Sweep Line Event Algorithm: O(N log N) Time, O(N) Space
struct Event {
    int time;
    int type; // +1 for START, -1 for END
};

int min_meeting_rooms_sweep_line(const vector<Interval>& intervals) {
    vector<Event> events;
    for (const auto& iv : intervals) {
        events.push_back({iv.start, +1});
        events.push_back({iv.end, -1});
    }

    // Sort by timestamp; if times match, process END (-1) before START (+1)
    sort(events.begin(), events.end(), [](const Event& a, const Event& b) {
        if (a.time != b.time) return a.time < b.time;
        return a.type < b.type; // -1 comes before +1 on same timestamp
    });

    int active_rooms = 0, peak_rooms = 0;
    for (const auto& ev : events) {
        active_rooms += ev.type;
        peak_rooms = max(peak_rooms, active_rooms);
    }
    return peak_rooms;
}
```

| Event Time $t$ | Event Type | Delta | Running Active Rooms | Peak Rooms Recorded |
| :--- | :--- | :--- | :--- | :--- |
| $0$ | Start | $+1$ | $1$ | $1$ |
| $5$ | Start | $+1$ | $2$ | **2 (Peak)** |
| $10$ | End | $-1$ | $1$ | $2$ |
| $15$ | Start | $+1$ | $2$ | $2$ |
| $20$ | End | $-1$ | $1$ | $2$ |
| $30$ | End | $-1$ | $0$ | $2$ |

```text
Rooms
  2 |         +-------+       +-------+
  1 | +-------+       +-------+       +-------+
  0 +-+-------+-------+-------+-------+-------+---> Time
      0       5      10      15      20      30
```

> [!CAUTION]
> If meetings can touch at endpoints without needing an extra room (e.g. $[0, 5]$ and $[5, 10]$), always sort End events ($-1$) before Start events ($+1$) on tied timestamps.

Let's now study Coordinate Compression for handling massive sparse coordinate spaces.


#### Complexity Analysis
- **Time Complexity:** $\Theta(N \log N)$ to sort $2N$ event points.
- **Auxiliary Space:** $\Theta(N)$ auxiliary storage for the event vector.

---


### Coordinate Compression & Discretization

When algorithms require indexing arrays by coordinates (e.g. difference arrays or segment trees) but coordinates span $[-10^9, 10^9]$, allocating a physical array of size $10^9$ is impossible.

Coordinate Compression maps sparse values down to compact ranks $[0 \dots K-1]$ while preserving their relative order.

```text
Sparse Raw Values: [ 10,   5000,   1000000000,   10,   5000 ]
Unique Sorted    : [ 10,   5000,   1000000000 ]
Dense Ranks      :    0       1             2
Compressed Array : [  0,      1,            2,    0,      1 ]
```

Compressing $N$ endpoints reduces an intractable $O(X_{\max})$ space complexity to optimal $O(N)$ space.

$$\text{Rank}(x) = \text{lower\_bound}(\text{unique\_coords.begin}(), \text{unique\_coords.end}(), x) - \text{unique\_coords.begin}()$$

Let's implement a reusable `CoordinateCompressor` class and solve large-scale interval coverage.

```cpp
// Coordinate Compression Utility: O(N log N) Setup, O(log N) Query
class CoordinateCompressor {
    vector<long long> coords;
public:
    void add(long long x) { coords.push_back(x); }

    void build() {
        sort(coords.begin(), coords.end());
        coords.erase(unique(coords.begin(), coords.end()), coords.end());
    }

    int get_rank(long long x) const {
        return lower_bound(coords.begin(), coords.end(), x) - coords.begin();
    }

    long long get_val(int rank) const { return coords[rank]; }
    size_t size() const { return coords.size(); }
};

long long total_covered_length(const vector<pair<long long, long long>>& intervals) {
    CoordinateCompressor comp;
    for (const auto& iv : intervals) {
        comp.add(iv.first);
        comp.add(iv.second);
    }
    comp.build();

    vector<int> diff(comp.size(), 0);
    for (const auto& iv : intervals) {
        diff[comp.get_rank(iv.first)]++;
        diff[comp.get_rank(iv.second)]--;
    }

    long long total_length = 0, active = 0;
    for (size_t i = 0; i < comp.size() - 1; ++i) {
        active += diff[i];
        if (active > 0) {
            total_length += comp.get_val(i + 1) - comp.get_val(i);
        }
    }
    return total_length;
}
```

| Raw Value | Compressed Rank | Original Meaning Preserved? | Absolute Distance Preserved? |
| :--- | :--- | :--- | :--- |
| $10$ | $0$ | Smallest element | Scaled down |
| $5,000$ | $1$ | Middle element | Scaled down |
| $1,000,000,000$ | $2$ | Largest element | Scaled down |

```text
Interval 1: [ 10, 5000 ]           -> Rank [ 0 ... 1 ]
Interval 2: [ 5000, 1000000000 ]   -> Rank [ 1 ... 2 ]
Segment (0->1) active: Length = val(1) - val(0) = 5000 - 10 = 4990
Segment (1->2) active: Length = val(2) - val(1) = 10^9 - 5000
```

> [!TIP]
> Coordinate compression preserves relative order and equality while collapsing empty space. When recovering segment lengths, multiply by the difference between consecutive raw coordinates.

This completes the Simulation and Intervals chapter, covering FSM game loops, grid directions, interval merges, activity selections, sweep line events, and coordinate compression.


#### Complexity Analysis
- **Time Complexity:** $O(N \log N)$ to sort, deduplicate, and query ranks.
- **Auxiliary Space:** $O(N)$ memory to store unique coordinate entries.

---


## Cheat Sheet & Quick Reference

| Technique | Purpose | Core Invariant / Mechanism | Complexity |
| :--- | :--- | :--- | :--- |
| **Finite State Machine** | Deterministic simulation | `next_state = delta(curr_state, input)` | $O(1)$ per tick |
| **2-Bit Grid Encoding** | In-place cellular updates | Bit 0: Past state, Bit 1: Future state | $\Theta(R \cdot C)$ / $O(1)$ Space |
| **Grid Direction Deltas** | Boundary traversal | `dr[] = {0, 1, 0, -1}`, `dc[] = {1, 0, -1, 0}` | $O(1)$ per step |
| **Merge Intervals** | Consolidate overlaps | Sort by START; `end = max(endA, endB)` | $O(N \log N)$ / $O(1)$ |
| **Activity Selection** | Max non-overlapping | Sort greedily by EARLIEST FINISH time | $O(N \log N)$ / $O(1)$ |
| **Meeting Rooms II** | Min simultaneous rooms | Min-heap of release times OR Sweep Line | $O(N \log N)$ / $O(N)$ |
| **Sweep Line Algorithm** | Overlap concurrency | Split into `(s, +1)` and `(e, -1)` events | $O(N \log N)$ / $O(N)$ |
| **Coordinate Compression**| Sparse range reduction | `sort + unique + lower_bound` | $O(N \log N)$ / $O(N)$ |
