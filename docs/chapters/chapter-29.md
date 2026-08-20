# Chapter 29: Graph Fundamentals & Traversals

---


## Graph Representations & Core Traversals


### Graph Memory Topologies & Representation Tradeoffs

Let's stand at the whiteboard and establish the core foundations of graph theory: Vertices $V$, Edges $E$, Directed vs Undirected orientations, and Weighted vs Unweighted graphs.

Graphs are stored using three primary memory topologies: Adjacency Matrices ($O(V^2)$ dense lookups), Adjacency Lists ($O(V + E)$ compact sparse storage), and Edge Lists ($O(E)$ edge scans).

```text
Graph with edges (0-1), (0-2), (1-2):

Adjacency Matrix (V x V Grid):        Adjacency List (Vector Chains):
      0   1   2                       0: [ 1, 2 ]
  0 [ 0,  1,  1 ]                     1: [ 0, 2 ]
  1 [ 1,  0,  1 ]                     2: [ 0, 1 ]
  2 [ 1,  1,  0 ]
Matrix uses V^2 space; List uses 2*E space for undirected graphs!
```

The Handshaking Lemma states that the sum of all vertex degrees equals twice the total number of undirected edges.

$$\sum_{v \in V} \text{deg}(v) = 2|E| \implies \text{Adjacency List Memory} = O(V + E)$$

Let's write graph adjacency list representations and the transpose graph generator in C++.

```cpp
// Graph Representations & Transpose Builder
struct Graph {
    int V;
    vector<vector<int>> adj; // Unweighted
    vector<vector<pair<int, int>>> weighted_adj; // Weighted: {neighbor, weight}

    Graph(int vertices) : V(vertices), adj(vertices) {}

    void add_edge(int u, int v, bool directed = false) {
        adj[u].push_back(v);
        if (!directed) adj[v].push_back(u);
    }
};

vector<vector<int>> transpose_graph(int V, const vector<vector<int>>& adj) {
    vector<vector<int>> rev_adj(V);
    for (int u = 0; u < V; ++u) {
        for (int v : adj[u]) {
            rev_adj[v].push_back(u); // Invert directed edge direction
        }
    }
    return rev_adj;
}
```

| Feature | Adjacency Matrix | Adjacency List | Edge List |
| :--- | :--- | :--- | :--- |
| **Memory Space** | $\Theta(V^2)$ | $\Theta(V + E)$ | $\Theta(E)$ |
| **Edge Lookup $(u, v)$** | $\Theta(1)$ constant time | $O(\text{deg}(u))$ | $O(E)$ linear scan |
| **Iterate All Neighbors** | $\Theta(V)$ | $\Theta(\text{deg}(u))$ (Optimal) | $\Theta(E)$ |
| **Best Used For** | Dense graphs ($E \approx V^2$) | Sparse graphs ($E \ll V^2$) | Kruskal's MST algorithm |

```text
Original Edge : u ----> v
Transpose Edge: v ----> u
Inverting all edge directions takes linear O(V + E) time.
```

> [!WARNING]
> In competitive programming and online platforms, vertex indices are often 1-based ($1 \dots N$). Always allocate `vector<vector<int>> adj(N + 1)` to prevent out-of-bounds segfaults.

Let's now examine fundamental BFS and DFS traversal invariants.


#### Complexity Analysis
- **Time Complexity:** $O(V + E)$ to initialize and transpose adjacency lists.
- **Auxiliary Space:** $O(V + E)$ memory for adjacency list storage.

---


### Traversal Foundations — Standard BFS & DFS Invariants

Extending Tree BFS (Chapter 22) and Tree DFS (Chapter 21) to general graphs requires tracking visited sets to prevent infinite cycles.

On unweighted graphs, the BFS Shortest Path Theorem guarantees that BFS visits vertices in strictly non-decreasing order of shortest distance from the source.

```text
BFS (Queue): Concentric rings expand outward: Layer 0 -> Layer 1 -> 2

DFS (Stack): Explores along one branch until dead end, then backtracks
Both traversals examine every vertex and edge in O(V + E) time!
```

Both BFS and DFS visit every reachable vertex once and traverse each incident edge once.

$$\text{Time Complexity} = \Theta(V + E), \quad \text{Space Complexity} = O(V)$$

Let's implement iterative Queue-based BFS and recursive timestamped DFS in C++.

```cpp
// BFS with Shortest Distance & DFS with Entry/Exit Timestamps
vector<int> bfs_shortest_paths(int start, int V, const vector<vector<int>>& adj) {
    vector<int> dist(V, -1);
    queue<int> q;

    dist[start] = 0;
    q.push(start);

    while (!q.empty()) {
        int u = q.front();
        q.pop();

        for (int v : adj[u]) {
            if (dist[v] == -1) { // Unvisited vertex
                dist[v] = dist[u] + 1;
                q.push(v); // Mark immediately upon push!
            }
        }
    }
    return dist;
}

void dfs_timestamped(int u, int& timer, vector<int>& tin, vector<int>& tout, 
                     vector<bool>& visited, const vector<vector<int>>& adj) {
    visited[u] = true;
    tin[u] = ++timer;

    for (int v : adj[u]) {
        if (!visited[v]) {
            dfs_timestamped(v, timer, tin, tout, visited, adj);
        }
    }
    tout[u] = ++timer;
}
```

| Step | Queue Contents | Vertex Dequeued | Neighbors Explored | Distances Recorded |
| :--- | :--- | :--- | :--- | :--- |
| $0$ | `[0]` | - | - | `dist[0] = 0` |
| $1$ | `[1, 2]` | `0` | `1, 2` | `dist[1]=1, dist[2]=1` |
| $2$ | `[2, 3]` | `1` | `3` | `dist[3]=2` |
| $3$ | `[3]` | `2` | Already visited | - |
| $4$ | `[]` | `3` | None | - |

```text
1. Tree Edge   : Leads to a newly discovered unvisited child
2. Back Edge   : Leads to an ancestor in active recursion (CYCLE!)
3. Forward Edge: Leads to a descendant already fully processed
4. Cross Edge  : Leads to another disconnected branch
```

> [!CAUTION]
> In graph BFS, mark vertices as visited IMMEDIATELY upon pushing into the queue, NOT when popping. Late marking causes exponential duplicate pushes into the queue.

Let's now examine Multi-Source BFS and 0-1 Deque BFS.


#### Complexity Analysis
- **Time Complexity:** $\Theta(V + E)$ linear time.
- **Auxiliary Space:** $O(V)$ memory for queue, visited, and distance arrays.

---


## Specialized BFS Paradigms & Grid Graphs


### Advanced BFS Paradigms — Multi-Source Expansion & 0-1 Deque BFS

Multi-Source BFS pushes all starting source vertices into the queue simultaneously, expanding outward in parallel like a propagating wildfire.

0-1 BFS finds shortest paths on graphs with edge weights restricted strictly to $\{0, 1\}$ in linear $O(V + E)$ time using a Double-Ended Queue (`deque`).

```text
Relaxing Edge (u -> v):
- If weight == 0: Push to FRONT of deque (Cost does not increase!)
- If weight == 1: Push to BACK of deque  (Advances distance by 1)
Elements inside deque differ by at most 1: { d, d+1 } at all times!
```

Pushing 0-weight edges to the front and 1-weight edges to the back maintains monotonic distance ordering without requiring a heap.

$$\text{0-1 BFS Time} = \Theta(V + E) \ll O(E \log V) \text{ (Standard Dijkstra)}$$

Let's implement Multi-Source BFS and 0-1 BFS in C++.

```cpp
// Multi-Source BFS & 0-1 Deque BFS
int multi_source_diffusion(vector<vector<int>>& grid) {
    int R = grid.size(), C = grid[0].size();
    queue<pair<int, int>> q;
    int fresh = 0;

    // Enqueue all initial sources simultaneously
    for (int r = 0; r < R; ++r) {
        for (int c = 0; c < C; ++c) {
            if (grid[r][c] == 2) q.push({r, c});
            else if (grid[r][c] == 1) fresh++;
        }
    }

    int steps = 0;
    int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};

    while (!q.empty() && fresh > 0) {
        int sz = q.size();
        for (int i = 0; i < sz; ++i) {
            auto [r, c] = q.front();
            q.pop();

            for (int d = 0; d < 4; ++d) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr >= 0 && nr < R && nc >= 0 && nc < C && grid[nr][nc] == 1) {
                    grid[nr][nc] = 2; // Infect
                    fresh--;
                    q.push({nr, nc});
                }
            }
        }
        steps++;
    }
    return fresh == 0 ? steps : -1;
}

vector<int> zero_one_bfs(int start, int V, const vector<vector<pair<int, int>>>& adj) {
    vector<int> dist(V, 1e9);
    deque<int> dq;

    dist[start] = 0;
    dq.push_back(start);

    while (!dq.empty()) {
        int u = dq.front();
        dq.pop_front();

        for (auto const& [v, weight] : adj[u]) {
            if (dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
                if (weight == 0) dq.push_front(v); // 0-cost advance
                else dq.push_back(v);              // 1-cost advance
            }
        }
    }
    return dist;
}
```

| Step | Vertex Dequeued | Edge Relaxed | Edge Weight | Action | Deque Contents |
| :--- | :--- | :--- | :--- | :--- | :--- |
| $0$ | - | Source $0$ | - | `dist[0] = 0` | `[0]` |
| $1$ | `0` | $0 \to 1$ | $0$ | `dist[1] = 0` $\to$ Push Front | `[1]` |
| $2$ | `1` | $1 \to 2$ | $1$ | `dist[2] = 1` $\to$ Push Back | `[2]` |

```text
Sources S1, S2, S3 all ignited at t = 0
All wavefronts expand outward 1 step per clock tick simultaneously!
Runs in single O(V + E) pass instead of K independent BFS searches!
```

> [!TIP]
> Multi-Source BFS computes distances from multiple origins in a single $O(V + E)$ pass, avoiding $K$ separate searches which would take $O(K(V + E))$.

Let's now examine 2D grid graph traversals and connected island components.


#### Complexity Analysis
- **Time Complexity:** $\Theta(V + E)$ for both Multi-Source BFS and 0-1 Deque BFS.
- **Auxiliary Space:** $O(V)$ memory for queues and distance arrays.

---


### 2D Grid Graph Traversals & Connected Cluster Identification

A 2D matrix can be modeled as an implicit graph where each cell $(r, c)$ is a vertex connected to its 4-directionally adjacent neighbors.

To count distinct contaminant spill clusters (`'1'`), we traverse the grid cell-by-cell. When an active cluster cell is encountered, we launch a DFS/BFS to sink or mark all connected components in the cluster.

```text
Sensor Grid:                          After Sinking First Cluster:
[ 1, 1, 0, 0 ]                        [ 0, 0, 0, 0 ]
[ 1, 1, 0, 0 ]  --- Launch DFS --->   [ 0, 0, 0, 0 ]
[ 0, 0, 1, 1 ]                        [ 0, 0, 1, 1 ]
Sinking avoids extra visited matrix! Cluster counter increments to 1.
```

The implicit graph traversal covers all $R \times C$ vertices and $4RC$ edges in linear time:

$$T(R, C) = O(R \times C) \text{ total operations}$$

Let's implement contaminant cluster identification in C++.

```cpp
// Count Contaminant Spill Clusters via In-Place DFS: O(R * C) Time
void sink_contaminant_cluster(vector<vector<char>>& grid, int r, int c) {
    int rows = grid.size(), cols = grid[0].size();
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] != '1') {
        return;
    }

    grid[r][c] = '0'; // Sink current cell in-place

    sink_contaminant_cluster(grid, r + 1, c);
    sink_contaminant_cluster(grid, r - 1, c);
    sink_contaminant_cluster(grid, r, c + 1);
    sink_contaminant_cluster(grid, r, c - 1);
}

int count_contaminant_clusters(vector<vector<char>>& sensor_grid) {
    if (sensor_grid.empty() || sensor_grid[0].empty()) return 0;
    int clusters = 0;

    for (int r = 0; r < (int)sensor_grid.size(); ++r) {
        for (int c = 0; c < (int)sensor_grid[0].size(); ++c) {
            if (sensor_grid[r][c] == '1') {
                clusters++;
                sink_contaminant_cluster(sensor_grid, r, c);
            }
        }
    }
    return clusters;
}
```

#### Complexity Analysis
- **Time Complexity:** $\Theta(R \cdot C)$ visiting each grid cell once.
- **Auxiliary Space:** $O(R \cdot C)$ recursion call stack in the worst case.

---


## Connectivity, Pathfinding & Cycles


### Graph Connectivity & All-Paths Backtracking

Decomposing an undirected graph into Disjoint Connected Components iterates through all vertices, launching a BFS or DFS whenever an unvisited vertex is encountered.

On a Directed Acyclic Graph (DAG), we can find All Paths from Source to Target by pushing the current vertex on entry and popping on return.

```text
Component 1: { 0, 1, 2 }      Component 2: { 3, 4 }    Component 3:{5}
Outer loop launches DFS on 0, then on 3, then on 5.
Total Disjoint Connected Components = 3
```

The outer loop identifies connected component boundaries in linear time.

$$\text{Connected Components} = \sum_{v \in V} [\text{visited}[v] == \text{false} \land \text{run\_DFS}(v)]$$

Let's implement connected component counting and DAG all-paths search.

```cpp
// Connected Components Count & All Paths on DAG
void dfs_component(int u, vector<bool>& vis, const vector<vector<int>>& adj) {
    vis[u] = true;
    for (int v : adj[u]) {
        if (!vis[v]) dfs_component(v, vis, adj);
    }
}

int count_components(int V, const vector<vector<int>>& adj) {
    vector<bool> vis(V, false);
    int components = 0;
    for (int i = 0; i < V; ++i) {
        if (!vis[i]) {
            components++;
            dfs_component(i, vis, adj);
        }
    }
    return components;
}

void all_paths_dag(int curr, int target, vector<int>& path, 
                   vector<vector<int>>& result, const vector<vector<int>>& adj) {
    path.push_back(curr);
    if (curr == target) {
        result.push_back(path);
    } else {
        for (int v : adj[curr]) {
            all_paths_dag(v, target, path, result, adj);
        }
    }
    path.pop_back(); // Backtrack
}
```

| Outer Loop Index | Visited Status | DFS Traversal | Components Count |
| :--- | :--- | :--- | :--- |
| Vertex $0$ | False | Visits $\{0, 1, 2\}$ | $1$ |
| Vertex $1$ | True | Skip | $1$ |
| Vertex $3$ | False | Visits $\{3, 4\}$ | $2$ |
| Vertex $5$ | False | Visits $\{5\}$ | **$3$ (Final)** |

```text
Path Vector: [ 0 ] -> [ 0, 1 ] -> [ 0, 1, 3 ] (Target! Record path)
Backtrack  : [ 0, 1 ] -> [ 0 ] -> [ 0, 2 ] -> [ 0, 2, 3 ] (Record!)
```

> [!CAUTION]
> On general graphs containing cycles, All Paths requires `visited[u] = false` backtracking to prevent infinite loops. On DAGs, cycles are impossible so no visited array is needed.

Let's now examine cycle detection in undirected and directed graphs.


#### Complexity Analysis
- **Time Complexity:** $O(V + E)$ for connected components; $O(2^V)$ for all DAG paths.
- **Auxiliary Space:** $O(V)$ recursion stack memory.

---


### Cycle Detection in Undirected & Directed Graphs

In an undirected graph, a cycle exists if BFS or DFS encounters an already-visited neighbor that is NOT the immediate parent of the current vertex.

In a directed graph, a cycle exists if and only if DFS encounters a Back Edge to an ancestor currently active in the call stack, tracked using a 3-Color state array.

```text
State 0 (WHITE): Unvisited vertex
State 1 (GRAY) : Currently active in recursion call stack
State 2 (BLACK): Fully processed (all descendants finished)
If DFS sees neighbor with State == 1 (GRAY) ===> BACK EDGE = CYCLE!
```

The 3-color theorem confirms that back edges correspond directly to directed cycles.

$$\text{Directed Cycle Exists} \iff \exists (u, v) \in E \text{ such that } \text{color}[v] == \text{GRAY (1)}$$

Let's implement both Undirected BFS Cycle Detection and Directed 3-Color DFS Cycle Detection.

```cpp
// Cycle Detection: Undirected (BFS) & Directed (3-Color DFS)
bool has_cycle_undirected(int start, int V, const vector<vector<int>>& adj, vector<bool>& vis) {
    queue<pair<int, int>> q; // {vertex, parent}
    vis[start] = true;
    q.push({start, -1});

    while (!q.empty()) {
        auto [u, parent] = q.front();
        q.pop();

        for (int v : adj[u]) {
            if (!vis[v]) {
                vis[v] = true;
                q.push({v, u});
            } else if (v != parent) {
                return true; // Visited non-parent neighbor indicates cycle!
            }
        }
    }
    return false;
}

bool dfs_directed_cycle(int u, vector<int>& color, const vector<vector<int>>& adj) {
    color[u] = 1; // Mark GRAY (visiting)

    for (int v : adj[u]) {
        if (color[v] == 1) return true; // Back edge to active ancestor!
        if (color[v] == 0 && dfs_directed_cycle(v, color, adj)) return true;
    }

    color[u] = 2; // Mark BLACK (finished)
    return false;
}
```

| Vertex $u$ | Neighbor $v$ | Edge Orientation | Neighbor Color | Cycle Detected? |
| :--- | :--- | :--- | :--- | :--- |
| Node $1$ | Node $2$ | Directed $1 \to 2$ | `color[2] = 0` (White) | No $\to$ Recurse |
| Node $2$ | Node $3$ | Directed $2 \to 3$ | `color[3] = 0` (White) | No $\to$ Recurse |
| Node $3$ | Node $1$ | Directed $3 \to 1$ | `color[1] = 1` **(GRAY!)** | **YES $\to$ Directed Cycle!** |

```text
Call Stack: Node 1 (Gray) -> Node 2 (Gray) -> Node 3 (Gray)
Edge 3 -> 1 points back to Node 1 which is still active on stack!
```

> [!IMPORTANT]
> Undirected cycle detection fails on directed graphs because a vertex visited via an alternate cross branch does not imply a cycle. Always use 3-color DFS for directed graphs.

Let's now examine Topological Sorting on Directed Acyclic Graphs.


#### Complexity Analysis
- **Time Complexity:** $\Theta(V + E)$ linear time.
- **Auxiliary Space:** $O(V)$ state array and call stack memory.

---


## Topological Sorting & Dependency Resolvers


### Topological Sorting & Dependency Scheduling (Kahn's vs DFS)

A Topological Sort of a Directed Acyclic Graph (DAG) produces a linear ordering of vertices such that for every directed edge $(u, v)$, vertex $u$ appears before $v$.

Kahn's Algorithm (BFS Topological Sort) tracks in-degrees of all vertices, enqueuing nodes with zero in-degrees and decrementing neighbor in-degrees upon dequeue.

```text
Vertices with In-Degree == 0 have all prerequisites met!
1. Enqueue all vertices with in_degree == 0
2. Pop vertex u, append to result schedule
3. For each neighbor v: decrement in_degree[v]--
4. If in_degree[v] drops to 0, push v into queue
If emitted count < V ===> Graph contains a CYCLE (Invalid DAG)!
```

If the emitted topological order contains fewer than $V$ vertices, the graph contains at least one cycle.

$$\text{Valid Topological Sort} \iff \text{Emitted Count} == V$$

Let's implement Kahn's Algorithm and the DFS postorder topological sort in C++.

```cpp
// Topological Sort: Kahn's Algorithm (BFS) & DFS Stack
vector<int> kahns_topological_sort(int V, const vector<vector<int>>& adj) {
    vector<int> in_degree(V, 0);
    for (int u = 0; u < V; ++u) {
        for (int v : adj[u]) in_degree[v]++;
    }

    queue<int> q;
    for (int i = 0; i < V; ++i) {
        if (in_degree[i] == 0) q.push(i);
    }

    vector<int> topo_order;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        topo_order.push_back(u);

        for (int v : adj[u]) {
            if (--in_degree[v] == 0) {
                q.push(v);
            }
        }
    }

    if (topo_order.size() != V) return {}; // Cycle detected!
    return topo_order;
}
```

| Step | Queue Contents | Dequeued Node | In-Degree Adjustments | Emitted Schedule |
| :--- | :--- | :--- | :--- | :--- |
| Init | `[0, 1]` | - | Nodes 0 and 1 have in-degree $0$ | `[]` |
| $1$ | `[1]` | `0` | `in_degree[2]--` $\to 0$ (Push 2) | `[0]` |
| $2$ | `[2]` | `1` | `in_degree[3]--` $\to 0$ (Push 3) | `[0, 1]` |
| $3$ | `[3]` | `2` | `in_degree[3]--` | `[0, 1, 2]` |
| $4$ | `[]` | `3` | None | `[0, 1, 2, 3]` |

```text
Course 0 ----> Course 2
Course 1 ----> Course 3
Output: Take 0 and 1 first -> Take 2 -> Take 3 (Valid schedule!)
```

> [!TIP]
> Kahn's algorithm is the standard cycle detection and task scheduler engine used in build automation systems like Make, CMake, and build pipelines.

This completes the Graph Fundamentals & Traversals chapter, covering memory topologies, BFS/DFS invariants, multi-source/0-1 deques, grid components, connectivity backtracks, cycle colorings, and topological dependency resolvers.


#### Complexity Analysis
- **Time Complexity:** $\Theta(V + E)$ linear time.
- **Auxiliary Space:** $O(V)$ in-degree array and queue memory.

---


## Cheat Sheet & Quick Reference

| Graph Algorithm | Target Graph | Core Mechanism / Invariant | Complexity |
| :--- | :--- | :--- | :--- |
| **Adjacency List** | General Graph | Vector of neighbor lists; $O(V + E)$ space | $\Theta(V + E)$ Space |
| **Standard BFS** | Unweighted Graph | FIFO Queue; marks on push; shortest path | $\Theta(V + E)$ / $O(V)$ |
| **Multi-Source BFS**| Multi-Origin Grid | Enqueue all sources at $t=0$; parallel waves | $\Theta(V + E)$ / $O(V)$ |
| **0-1 Deque BFS** | Edge weights $\{0, 1\}$| Push 0 to `front`, 1 to `back` of deque | $\Theta(V + E)$ / $O(V)$ |
| **Grid Flood Fill** | 2D Spatial Grid | In-place sinking `'1' -> '0'` via 4-way deltas | $\Theta(R \cdot C)$ / $O(R \cdot C)$ |
| **Undirected Cycle**| Undirected Graph | BFS/DFS: visited neighbor $\neq$ parent | $\Theta(V + E)$ / $O(V)$ |
| **Directed Cycle** | Directed Graph | 3-Color DFS: encounters Gray vertex (1) | $\Theta(V + E)$ / $O(V)$ |
| **Kahn's Topo Sort**| Directed DAG | Queue zero in-degrees; detects cycles if $< V$ | $\Theta(V + E)$ / $O(V)$ |
