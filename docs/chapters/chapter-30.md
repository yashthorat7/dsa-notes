# Chapter 30: Advanced Graph Algorithms

---

## Disjoint Sets & Minimum Spanning Trees

### Disjoint Set Union (DSU) & Inverse Ackermann Complexity

Let's begin at the whiteboard by examining Disjoint Set Union (Union-Find / DSU): maintaining partitions of disjoint sets to answer connectivity and merge queries in nearly constant time.

Path Compression (`parent[u] = find(parent[u])`) flattens pointer chains during search, while Union by Rank attaches shallower trees beneath deeper roots.

```text
Before Find(4): 4 -> 3 -> 2 -> 1 (Deep linear chain)

After Find(4) : 4 -> 1,  3 -> 1,  2 -> 1
Collapses all nodes directly under root 1 in a single recursive pass!
```

Combining Path Compression with Union by Rank achieves an amortized runtime bounded by the extremely slow-growing Inverse Ackermann function $\alpha(N)$.

$$T(M \text{ operations on } N \text{ elements}) = O(M \cdot \alpha(N)) \quad \text{where } \alpha(10^{80}) \le 4 \implies \text{Practically } O(1)$$

Let's implement the complete `DisjointSetUnion` class in C++.

```cpp
// Disjoint Set Union (Union-Find) with Path Compression & Union by Rank
class DisjointSetUnion {
    vector<int> parent, rank_val;
    int num_components;
public:
    DisjointSetUnion(int n) : num_components(n), parent(n), rank_val(n, 0) {
        for (int i = 0; i < n; ++i) parent[i] = i;
    }

    int find(int i) {
        if (parent[i] == i) return i;
        return parent[i] = find(parent[i]); // Path compression
    }

    bool unite(int i, int j) {
        int root_i = find(i), root_j = find(j);
        if (root_i == root_j) return false; // Already in same component

        // Union by rank
        if (rank_val[root_i] < rank_val[root_j]) {
            parent[root_i] = root_j;
        } else if (rank_val[root_i] > rank_val[root_j]) {
            parent[root_j] = root_i;
        } else {
            parent[root_j] = root_i;
            rank_val[root_i]++;
        }
        num_components--;
        return true;
    }

    int get_components_count() const { return num_components; }
};
```

| Operation | Arguments | Roots Identified | Action Taken | Active Components |
| :--- | :--- | :--- | :--- | :--- |
| `unite(1, 2)` | $(1, 2)$ | $\text{root}(1)=1, \text{root}(2)=2$ | Connect $2 \to 1$ | $N - 1$ |
| `unite(2, 3)` | $(2, 3)$ | $\text{root}(2)=1, \text{root}(3)=3$ | Connect $3 \to 1$ | $N - 2$ |
| `unite(1, 3)` | $(1, 3)$ | $\text{root}(1)=1, \text{root}(3)=1$ | **Cycle Detected (Same Root!)** | Unchanged |

```text
Tree A (Rank 2) + Tree B (Rank 1):
Root of B attaches under Root of A -> Tree depth does NOT increase!
```

> [!WARNING]
> Omitting Union by Rank or Size causes trees to degenerate into linear linked-list chains of height $O(N)$, degrading operations from $\alpha(N)$ to $O(N)$.

Let's now apply DSU to Minimum Spanning Trees.

#### Complexity Analysis
- **Time Complexity:** $O(\alpha(V)) \approx O(1)$ amortized per `find` and `unite` operation.
- **Auxiliary Space:** $O(V)$ memory for parent and rank arrays.

---

### Minimum Spanning Trees — Kruskal's & Prim's Algorithms

A Minimum Spanning Tree (MST) connects all $V$ vertices in a weighted graph using exactly $V - 1$ edges with the minimum total edge weight and zero cycles.

The Cut Property states that for any partition cut $(S, V \setminus S)$, the minimum-weight crossing edge belongs to every MST of the graph.

```text
Subset S: { 1, 2 }              Subset V \ S: { 3, 4, 5 }
Crossing Edges: (1-3, wt 10), (2-3, wt 4), (2-4, wt 7)
Minimum crossing edge is (2-3, wt 4) ===> GUARANTEED to be in MST!
```

Kruskal's algorithm sorts all edges ascendingly and unites endpoints via DSU, while Prim's algorithm expands an active tree using a Min-Heap.

$$\text{Kruskal: } O(E \log E) = O(E \log V), \quad \text{Prim (Binary Heap): } O(E \log V)$$

Let's implement Kruskal's Algorithm and Prim's Algorithm in C++.

```cpp
// Minimum Spanning Tree: Kruskal's & Prim's
struct Edge {
    int u, v, weight;
    bool operator<(const Edge& other) const { return weight < other.weight; }
};

int kruskal_mst(int V, vector<Edge>& edges) {
    sort(edges.begin(), edges.end());
    DisjointSetUnion dsu(V);
    int mst_weight = 0, edges_count = 0;

    for (const auto& e : edges) {
        if (dsu.unite(e.u, e.v)) {
            mst_weight += e.weight;
            if (++edges_count == V - 1) break;
        }
    }
    return mst_weight;
}

int prim_mst(int V, const vector<vector<pair<int, int>>>& adj) {
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> min_heap;
    vector<bool> in_mst(V, false);
    int mst_weight = 0, edges_count = 0;

    min_heap.push({0, 0}); // {weight, vertex}

    while (!min_heap.empty() && edges_count < V) {
        auto [wt, u] = min_heap.top();
        min_heap.pop();

        if (in_mst[u]) continue;
        in_mst[u] = true;
        mst_weight += wt;
        edges_count++;

        for (auto const& [v, weight] : adj[u]) {
            if (!in_mst[v]) min_heap.push({weight, v});
        }
    }
    return mst_weight;
}
```

| Algorithm | Best Graph Topology | Data Structures Used | Edge Consideration Order |
| :--- | :--- | :--- | :--- |
| **Kruskal's** | Sparse Graphs ($E \approx V$) | Edge List + DSU | Global ascending edge sort |
| **Prim's** | Dense Graphs ($E \approx V^2$) | Adjacency List + Min-Heap | Expanding cut boundary |

```text
Edge (1-2, wt 1) -> Unite (1, 2) -> Added to MST
Edge (2-3, wt 2) -> Unite (2, 3) -> Added to MST
Edge (1-3, wt 3) -> DSU: Same component -> DISCARDED (Forms cycle!)
```

> [!TIP]
> Kruskal's algorithm is optimal for sparse graphs with few edges, while Prim's algorithm using an adjacency matrix runs in $O(V^2)$ for ultra-dense graphs.

Let's now examine Single-Source Shortest Path algorithms.

#### Complexity Analysis
- **Time Complexity:** $O(E \log E) = O(E \log V)$ for Kruskal; $O(E \log V)$ for Prim.
- **Auxiliary Space:** $O(V + E)$ memory for DSU and priority queues.

---

## Shortest Path Algorithms

### Single-Source Shortest Paths — Dijkstra, Bellman-Ford & DAG DP

Single-Source Shortest Path (SSSP) algorithms find the shortest paths from a starting source vertex $S$ to all other vertices.

Dijkstra's Algorithm uses a greedy Min-Heap for non-negative weights, while Bellman-Ford uses dynamic programming over $V - 1$ passes to support negative edge weights.

```text
Dijkstra (Non-negative): Greedily finalizes nearest unvisited vertex.

Bellman-Ford (General): Relaxes all E edges V - 1 times.
If pass V continues to reduce distance ===> NEGATIVE CYCLE DETECTED!
```

The triangle inequality relaxation step updates distances whenever a shorter path is found.

$$\text{Relaxation: } \text{if } \text{dist}[v] > \text{dist}[u] + w(u, v) \implies \text{dist}[v] = \text{dist}[u] + w(u, v)$$

Let's implement Dijkstra's Algorithm and the Bellman-Ford Algorithm in C++.

```cpp
// Dijkstra (Non-Negative Weights) & Bellman-Ford (Negative Weights & Cycles)
vector<int> dijkstra(int start, int V, const vector<vector<pair<int, int>>>& adj) {
    vector<int> dist(V, 1e9);
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;

    dist[start] = 0;
    pq.push({0, start});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();

        if (d > dist[u]) continue; // Stale queue entry

        for (auto const& [v, weight] : adj[u]) {
            if (dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}

bool bellman_ford(int start, int V, const vector<Edge>& edges, vector<int>& dist) {
    dist.assign(V, 1e9);
    dist[start] = 0;

    // V - 1 relaxation passes
    for (int i = 1; i <= V - 1; ++i) {
        for (const auto& e : edges) {
            if (dist[e.u] != 1e9 && dist[e.u] + e.weight < dist[e.v]) {
                dist[e.v] = dist[e.u] + e.weight;
            }
        }
    }

    // Pass V: Check for negative weight cycles
    for (const auto& e : edges) {
        if (dist[e.u] != 1e9 && dist[e.u] + e.weight < dist[e.v]) {
            return false; // Negative cycle detected!
        }
    }
    return true;
}
```

| Algorithm | Time Complexity | Negative Weights Allowed? | Negative Cycle Detection |
| :--- | :--- | :--- | :--- |
| **DAG SSSP (Topo)**| $\Theta(V + E)$ | **Yes** (on DAGs) | Not applicable |
| **Dijkstra** | $O(E \log V)$ | **No (Fails on negative)** | None |
| **Bellman-Ford** | $O(V \cdot E)$ | **Yes** | **Yes (on pass $V$)** |
| **Floyd-Warshall** | $\Theta(V^3)$ | **Yes** | **Yes (negative diagonal)**|

```text
Cycle: A --(-5)--> B --(2)--> C --(1)--> A  (Sum = -2)
Every loop around the cycle reduces distance by -2 indefinitely!
Dijkstra spins forever; Bellman-Ford catches cycle on pass V!
```

> [!CAUTION]
> Dijkstra's algorithm fails on graphs containing negative edge weights because greedy node finalization assumes distances can only increase. Always use Bellman-Ford when negative weights exist.

Let's now examine the Floyd-Warshall All-Pairs Shortest Path algorithm.

#### Complexity Analysis
- **Time Complexity:** $O(E \log V)$ for Dijkstra; $O(V \cdot E)$ for Bellman-Ford.
- **Auxiliary Space:** $O(V)$ memory for distances and priority queue.

---

### All-Pairs Shortest Paths — The Floyd-Warshall DP Matrix

The Floyd-Warshall Algorithm computes the shortest distances between all pairs of vertices in $O(V^3)$ time and $O(V^2)$ space.

The dynamic programming state considers whether routing a path between $i$ and $j$ through an intermediate pivot vertex $k$ yields a shorter distance.

```text
Direct edge (i -> j): Length 10
Detour via Pivot k  : (i -> k) + (k -> j) = 3 + 4 = 7
Update: dist[i][j] = min(10, 7) = 7!
```

The 3-nested loop recurrence updates the distance matrix across pivot iterations $k \in [0 \dots V-1]$.

$$D^{(k)}[i][j] = \min\left( D^{(k-1)}[i][j], \; D^{(k-1)}[i][k] + D^{(k-1)}[k][j] \right)$$

Let's implement Floyd-Warshall with path reconstruction in C++.

```cpp
// Floyd-Warshall All-Pairs Shortest Paths: O(V^3) Time, O(V^2) Space
void floyd_warshall(int V, vector<vector<long long>>& dist, vector<vector<int>>& next_node) {
    // k MUST be the outermost loop!
    for (int k = 0; k < V; ++k) {
        for (int i = 0; i < V; ++i) {
            for (int j = 0; j < V; ++j) {
                if (dist[i][k] != 1e18 && dist[k][j] != 1e18) {
                    if (dist[i][k] + dist[k][j] < dist[i][j]) {
                        dist[i][j] = dist[i][k] + dist[k][j];
                        next_node[i][j] = next_node[i][k]; // Update path reconstruction
                    }
                }
            }
        }
    }
}

vector<int> reconstruct_path(int u, int v, const vector<vector<int>>& next_node) {
    if (next_node[u][v] == -1) return {};
    vector<int> path = {u};
    while (u != v) {
        u = next_node[u][v];
        path.push_back(u);
    }
    return path;
}
```

| Pivot $k$ | Path Considered | Previous Distance `dist[i][j]` | Detour Distance `dist[i][k] + dist[k][j]` | Updated Value |
| :--- | :--- | :--- | :--- | :--- |
| Init | Direct edges | $10$ | - | $10$ |
| $k=0$ | $1 \to 0 \to 2$ | $10$ | $3 + 4 = 7$ | **$7$** |
| $k=1$ | $0 \to 1 \to 3$ | $\infty$ | $2 + 5 = 7$ | **$7$** |

```text
CRITICAL: Pivot k MUST be the outermost loop!
Loops i and j iterate across all pairs using {0..k} as valid pivots.
```

> [!WARNING]
> Guard the relaxation sum with `dist[i][k] != INF && dist[k][j] != INF` to prevent integer addition overflow and numeric wraparound with sentinel values.

Let's now examine Strongly Connected Components in directed graphs.

#### Complexity Analysis
- **Time Complexity:** $\Theta(V^3)$ cubic time across three nested loops.
- **Auxiliary Space:** $O(V^2)$ memory for distance and predecessor matrices.

---

## Connectivity, Vulnerability & Bipartiteness

### Strongly Connected Components — Kosaraju's & Tarjan's Algorithms

A Strongly Connected Component (SCC) in a directed graph is a maximal subgraph where every vertex is mutually reachable from every other vertex.

Kosaraju's Algorithm finds SCCs in two DFS passes (topological stack + transpose graph), while Tarjan's Algorithm finds them in a single DFS pass using discovery times and Low-Link values.

```text
Component 1: { 1, 2, 3 } (Mutually reachable cycle)
Component 2: { 4, 5 }    (Mutually reachable cycle)
Condensation DAG: [ SCC 1 ] --------> [ SCC 2 ]
Collapses complex cyclic graphs into clean Directed Acyclic Graphs!
```

Tarjan's Low-Link invariant calculates the lowest discovery timestamp reachable via subtree edges or active stack back edges.

$$\text{low}[u] = \min\left( \text{tin}[u], \; \min_{(u, v) \in E} \begin{cases} \text{low}[v] & \text{if tree edge} \\ \text{tin}[v] & \text{if } v \text{ is in stack} \end{cases} \right)$$

Let's implement Tarjan's single-pass SCC algorithm in C++.

```cpp
// Tarjan's Single-Pass SCC Algorithm: O(V + E) Time, O(V) Space
class TarjanSCC {
    int V, timer = 0;
    vector<int> tin, low;
    vector<bool> in_stack;
    stack<int> st;
    vector<vector<int>> sccs;

    void dfs(int u, const vector<vector<int>>& adj) {
        tin[u] = low[u] = ++timer;
        st.push(u);
        in_stack[u] = true;

        for (int v : adj[u]) {
            if (tin[v] == 0) { // Tree edge
                dfs(v, adj);
                low[u] = min(low[u], low[v]);
            } else if (in_stack[v]) { // Back edge to active stack ancestor
                low[u] = min(low[u], tin[v]);
            }
        }

        // Root of SCC found
        if (low[u] == tin[u]) {
            vector<int> component;
            while (true) {
                int node = st.top();
                st.pop();
                in_stack[node] = false;
                component.push_back(node);
                if (node == u) break;
            }
            sccs.push_back(component);
        }
    }
public:
    TarjanSCC(int n, const vector<vector<int>>& adj) : V(n), tin(n, 0), low(n, 0), in_stack(n, false) {
        for (int i = 0; i < V; ++i) {
            if (tin[i] == 0) dfs(i, adj);
        }
    }
    vector<vector<int>> get_sccs() const { return sccs; }
};
```

| Vertex | Discovery $\text{tin}$ | Low-Link $\text{low}$ | Stack Contents | Condition $\text{low}[u] == \text{tin}[u]$ | Emitted SCC |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `0` | $1$ | $1$ | `[0]` | - | - |
| `1` | $2$ | $1$ (via $2 \to 0$) | `[0, 1]` | - | - |
| `2` | $3$ | $1$ (via $2 \to 0$) | `[0, 1, 2]` | - | - |
| Exit `0` | $1$ | $1$ | `[0, 1, 2]` | **Match!** | `{2, 1, 0}` |

```text
Edge 2 -> 0 is a back edge to active stack node 0 (tin = 1)
low[2] becomes 1 -> bubbles back to low[1] = 1 -> bubbles to low[0] =1
```

> [!TIP]
> Condensing a cyclic directed graph into its SCC DAG allows topological sorting and dynamic programming to be executed on previously cyclic structures.

Let's now examine graph vulnerability analysis, Bridges, and Articulation Points.

#### Complexity Analysis
- **Time Complexity:** $\Theta(V + E)$ linear time in a single DFS pass.
- **Auxiliary Space:** $O(V)$ memory for timestamps, low-links, and stack.

---

### Graph Vulnerability Analysis — Bridges & Articulation Points

In an undirected network, an Articulation Point (Cut Vertex) is a vertex whose removal increases disconnected components, while a Bridge (Cut Edge) is an edge whose removal disconnects the graph.

Using DFS discovery times $\text{tin}[u]$ and lowest reachable ancestor $\text{low}[v]$, we detect vulnerabilities in a single $O(V + E)$ pass.

```text
Component A: { 1, 2 } ======= Bridge Edge (2 - 3) ======= Component B

Node 2 and Node 3 are Articulation Points!
If Edge (2-3) is severed, Component A cannot communicate with B!
```

Vulnerability theorems define exact mathematical criteria for bridges and cut vertices.

$$\text{Bridge: } \text{low}[v] > \text{tin}[u], \quad \text{Cut Vertex: } \text{low}[v] \ge \text{tin}[u] \text{ (non-root) } \lor \text{children} > 1 \text{ (root)}$$

Let's implement Bridge Finding (Critical Connections in a Network) and Articulation Point detection in C++.

```cpp
// Bridge (Cut Edge) and Articulation Point (Cut Vertex) Detection
class NetworkVulnerability {
    int V, timer = 0;
    vector<int> tin, low;
    vector<bool> visited, is_cut_vertex;
    vector<pair<int, int>> bridges;

    void dfs(int u, int parent, const vector<vector<int>>& adj) {
        visited[u] = true;
        tin[u] = low[u] = ++timer;
        int children = 0;

        for (int v : adj[u]) {
            if (v == parent) continue; // Skip immediate parent edge

            if (visited[v]) {
                low[u] = min(low[u], tin[v]); // Back edge
            } else {
                dfs(v, u, adj);
                low[u] = min(low[u], low[v]);

                // Bridge Condition
                if (low[v] > tin[u]) {
                    bridges.push_back({u, v});
                }

                // Articulation Point Condition (Non-root)
                if (low[v] >= tin[u] && parent != -1) {
                    is_cut_vertex[u] = true;
                }
                children++;
            }
        }

        // Articulation Point Condition (Root)
        if (parent == -1 && children > 1) {
            is_cut_vertex[u] = true;
        }
    }
public:
    NetworkVulnerability(int n, const vector<vector<int>>& adj) : 
        V(n), tin(n, 0), low(n, 0), visited(n, false), is_cut_vertex(n, false) {
        for (int i = 0; i < V; ++i) {
            if (!visited[i]) dfs(i, -1, adj);
        }
    }
    vector<pair<int, int>> get_bridges() const { return bridges; }
    vector<bool> get_cut_vertices() const { return is_cut_vertex; }
};
```

| Edge $(u, v)$ | Discovery $\text{tin}[u]$ | Child Reach $\text{low}[v]$ | Evaluation $\text{low}[v] > \text{tin}[u]$ | Vulnerability Status |
| :--- | :--- | :--- | :--- | :--- |
| $(0, 1)$ | $1$ | $1$ | $1 > 1$ (False) | Safe (in cycle) |
| $(1, 2)$ | $2$ | $1$ | $1 > 2$ (False) | Safe (in cycle) |
| $(2, 3)$ | $3$ | $4$ | **$4 > 3$ (True)** | **CRITICAL BRIDGE!** |

```text
A back edge provides an alternate detour back to an ancestor!
If low[v] <= tin[u], child v can reach u or above without edge (u, v).
```

> [!IMPORTANT]
> The root of the DFS tree is an articulation point IF AND ONLY IF it has two or more independent DFS children (`parent == -1 && children > 1`).

Let's now examine graph bipartiteness and 2-color partitioning.

#### Complexity Analysis
- **Time Complexity:** $\Theta(V + E)$ linear time.
- **Auxiliary Space:** $O(V)$ memory for timestamp and low-link arrays.

---

### Graph Bipartiteness & 2-Color Partitioning

A graph is Bipartite if its vertices can be partitioned into two disjoint sets $U$ and $V$ such that every edge connects a vertex in $U$ to a vertex in $V$.

The Odd-Cycle Theorem states that a graph is Bipartite if and only if it contains NO cycles of odd length.

```text
Even Cycle (Length 4): 0(Red) -> 1(Blue) -> 2(Red) -> 3(Blue) -> 0
Perfectly 2-colorable!

Odd Cycle (Triangle):  A(Red) -> B(Blue) -> C(Red) -> A(Red)
Edge (C - A) connects RED to RED ===> COLOR COLLISION (Not Bipartite!)
```

A valid 2-coloring assigns opposing colors $\{0, 1\}$ across every edge in the graph.

$$\forall (u, v) \in E \implies \text{color}[u] \neq \text{color}[v] \quad (\text{with } \text{color} \in \{0, 1\})$$

Let's implement BFS and DFS 2-Coloring in C++.

```cpp
// Graph Bipartiteness Validation via BFS 2-Coloring
bool is_bipartite(const vector<vector<int>>& graph) {
    int n = graph.size();
    vector<int> color(n, -1); // -1: Uncolored, 0: Red, 1: Blue

    for (int start = 0; start < n; ++start) {
        if (color[start] != -1) continue;

        queue<int> q;
        color[start] = 0;
        q.push(start);

        while (!q.empty()) {
            int u = q.front();
            q.pop();

            for (int v : graph[u]) {
                if (color[v] == -1) {
                    color[v] = 1 - color[u]; // Alternate color
                    q.push(v);
                } else if (color[v] == color[u]) {
                    return false; // Adjacent vertices share same color!
                }
            }
        }
    }
    return true;
}
```

| Vertex $u$ | Color Assigned | Neighbor $v$ | Neighbor Color | Validation Status |
| :--- | :--- | :--- | :--- | :--- |
| Node $0$ | `0` (Red) | Node $1$ | `-1` $\to$ Assign `1` (Blue) | Valid |
| Node $1$ | `1` (Blue) | Node $2$ | `-1` $\to$ Assign `0` (Red) | Valid |
| Node $2$ | `0` (Red) | Node $0$ | `0` (Red) | **Collision ($0 == 0$) $\to$ Not Bipartite!** |

```text
Outer loop runs over all vertices 0 to n-1:
Guarantees every disconnected component is validated for bipartiteness
```

> [!TIP]
> In disconnected graphs, always run the 2-coloring loop over all unvisited vertices to ensure every independent component is checked for bipartiteness.

Let's now conclude with network flow fundamentals and maximum bipartite matching.

#### Complexity Analysis
- **Time Complexity:** $\Theta(V + E)$ linear time.
- **Auxiliary Space:** $O(V)$ color array and queue memory.

---

## Network Flow & Matching

### Network Flow Fundamentals & Bipartite Matching

A Flow Network is a directed graph with edge capacities $c(u, v)$, a Source $S$, and a Sink $T$, where flow conservation holds at all intermediate vertices.

The Max-Flow Min-Cut Theorem establishes that the maximum flow passing from $S$ to $T$ equals the total capacity of the minimum $S-T$ cut.

```text
Source (S) ----(cap 1)----> [ Left Set U ]
                                 |
                            (cap 1 edges)
                                 v
[ Right Set V ] ----------(cap 1)---------> Sink (T)
Max Bipartite Matching ===> Compute Max Flow on this transformed DAG!
```

The residual graph maintains forward capacity $(c - f)$ and backward capacity $f$ to permit flow redirection.

$$\text{Maximum Flow} \equiv \text{Capacity of Minimum Cut } (S, T)$$

Let's implement the Edmonds-Karp Max-Flow algorithm using BFS augmenting paths in C++.

```cpp
// Edmonds-Karp Maximum Flow Algorithm: O(V * E^2)
int bfs_augmenting_path(int s, int t, const vector<vector<int>>& capacity, 
                        const vector<vector<int>>& adj, vector<int>& parent) {
    fill(parent.begin(), parent.end(), -1);
    parent[s] = -2;
    queue<pair<int, int>> q;
    q.push({s, 1e9}); // {node, bottleneck_flow}

    while (!q.empty()) {
        auto [u, flow] = q.front();
        q.pop();

        for (int v : adj[u]) {
            if (parent[v] == -1 && capacity[u][v] > 0) {
                parent[v] = u;
                int new_flow = min(flow, capacity[u][v]);
                if (v == t) return new_flow; // Augmenting path reached sink
                q.push({v, new_flow});
            }
        }
    }
    return 0;
}

int edmonds_karp_max_flow(int s, int t, int V, vector<vector<int>>& capacity, const vector<vector<int>>& adj) {
    int max_flow = 0;
    vector<int> parent(V);
    int new_flow = 0;

    while ((new_flow = bfs_augmenting_path(s, t, capacity, adj, parent)) > 0) {
        max_flow += new_flow;
        int curr = t;
        while (curr != s) {
            int prev = parent[curr];
            capacity[prev][curr] -= new_flow; // Reduce forward capacity
            capacity[curr][prev] += new_flow; // Increase backward residual capacity
            curr = prev;
        }
    }
    return max_flow;
}
```

| Augmentation Step | Path Found | Bottleneck Capacity | Total Flow Accumulated |
| :--- | :--- | :--- | :--- |
| Step 1 | $S \to 1 \to 3 \to T$ | $10$ | $+10$ (Total 10) |
| Step 2 | $S \to 2 \to 4 \to T$ | $8$ | $+8$ (Total 18) |
| Step 3 | $S \to 1 \to 4 \to T$ | $2$ | $+2$ (Total 20) |
| Step 4 | No path | $0$ | **Max Flow = 20** |

```text
Backward capacity allows earlier suboptimal routing decisions to be
undone cleanly as later augmenting paths discover better flows!
```

> [!TIP]
> On unit-capacity networks (such as Bipartite Matching), Dinic's algorithm computes maximum flow in $O(E \sqrt{V})$ time, matching Hopcroft-Karp efficiency.

This completes the Advanced Graph Algorithms chapter, establishing mastery over DSU, MST algorithms, SSSP/APSP shortest paths, SCCs, Bridges/Cut Vertices, Bipartite coloring, and Max-Flow matching.

#### Complexity Analysis
- **Time Complexity:** $O(V \cdot E^2)$ for Edmonds-Karp; $O(E \sqrt{V})$ for unit-capacity matching.
- **Auxiliary Space:** $O(V^2)$ memory for capacity matrix and residual adjacency lists.

---

## Cheat Sheet & Quick Reference

| Advanced Graph Algorithm | Primary Problem | Core Invariant / Mechanism | Complexity |
| :--- | :--- | :--- | :--- |
| **Disjoint Set Union (DSU)**| Disjoint sets & cycles | Path compression + Union by rank | $O(\alpha(V)) \approx O(1)$ |
| **Kruskal's MST** | Minimum Spanning Tree | Sort edges + DSU cycle rejection | $O(E \log V)$ / $O(V)$ |
| **Prim's MST** | Minimum Spanning Tree | Min-Heap priority queue on cut boundary | $O(E \log V)$ / $O(V)$ |
| **Dijkstra** | SSSP (Non-negative) | Min-Heap greedy distance relaxation | $O(E \log V)$ / $O(V)$ |
| **Bellman-Ford** | SSSP (Negative edges) | Relax all $E$ edges $V - 1$ times; detect cycle | $O(V \cdot E)$ / $O(V)$ |
| **Floyd-Warshall** | APSP All-Pairs Distances| 3 nested loops: $\min(D[i][j], D[i][k]+D[k][j])$ | $\Theta(V^3)$ / $O(V^2)$ |
| **Tarjan's SCC** | Strongly Connected Comps| Low-link $\text{low}[u] == \text{tin}[u]$ root check | $\Theta(V + E)$ / $O(V)$ |
| **Bridges & Cut Vertices** | Network Vulnerabilities | Bridge: $\text{low}[v] > \text{tin}[u]$; Cut: $\text{low}[v] \ge \text{tin}[u]$ | $\Theta(V + E)$ / $O(V)$ |
| **Bipartite 2-Coloring**| Odd cycle detection | BFS/DFS color alternation $\{0, 1\}$ | $\Theta(V + E)$ / $O(V)$ |
| **Edmonds-Karp Max Flow**| Network Flow & Matching | BFS augmenting paths + residual matrix | $O(V \cdot E^2)$ / $O(V^2)$ |
