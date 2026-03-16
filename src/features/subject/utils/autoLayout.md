# autoLayout.ts Specification

## 1. Goal

computeAutoLayout computes node coordinates for a DAG.

The layout uses a recursive block-tree algorithm.

Blocks are processed from deepest to root.

Structure

partition  
 subpartition  
 subpartition  
 ...

Layout order

1. layout deepest block
2. layout parent block

---

## 2. Hard Constraints

1. Nodes must not overlap.
2. Minimum spacing must be respected.

horizontal gap ≥ LAYOUT_COL_GAP  
vertical gap ≥ LAYOUT_ROW_GAP  
partition gap ≥ LAYOUT_PART_GAP

3. Subpartition internal layout must remain unchanged in upper levels.
4. Nodes in the same town share identical y coordinate.

---

## 3. Node Data

Each node has

idx : number  
x : number (center)  
y : number (center)  
w : number  
h : number

Mappings

idx2chain : idx → { pre, nxt, preSet, nxtSet }  
idx2sbj : idx → { x, y }  
sizes : idx → { w, h }

Graph is DAG.

---

## 4. Graph Relations

Directed edge

A → B

Sets

A.pre = { x.idx | x → A }  
A.nxt = { x.idx | A → x }

Transitive sets

A.preSet = { x.idx | x → ... → A }  
A.nxtSet = { x.idx | A → ... → x }

---

## 5. Bounding Box

Coordinates use center reference.

left(A) = A.x - A.w / 2  
right(A) = A.x + A.w / 2  
top(A) = A.y - A.h / 2  
bottom(A) = A.y + A.h / 2

---

## 6. Level

Level is defined independently for each partition.

Levels must satisfy the edge direction constraint.

For every edge

A → B

A.level < B.level

Levels are computed in two stages.

### 1. Base layering

First compute the most compact forward layering.

- Every source node is assigned level 0.
- Process nodes in topological order.
- For each edge A → B, enforce

B.level ≥ A.level + 1

- Assign each node the smallest level satisfying all incoming-edge constraints.

Equivalently,

B.level = max { A.level + 1 | A ∈ B.pre }

with source nodes taking level 0.

### 2. Merge alignment

Then repeatedly apply the following rule until no level changes.

If a node M has two or more parents, then every parent of M
must be placed immediately above M.

That is, for every P ∈ M.pre,

P.level ≥ M.level − 1

If a parent level is increased by this rule, then outgoing edge constraints
must be propagated forward again so that for every edge A → B,

B.level ≥ A.level + 1

This merge-alignment step may raise levels of additional nodes.

After all levels stabilize, normalize the partition so that

min(level) = 0

This definition ensures:

- edge directions are respected
- ordinary branches stay compact
- parents of a merge node are aligned immediately above the merge
- the effect propagates consistently through the DAG

## 7. Partition

Partition = connected component ignoring edge direction.

Each node has

partId

Partitions are processed independently.

---

## 8. Town

A town is the set of nodes with

same partition  
same level

All nodes in a town share identical y coordinate.

Town bounding box = envelope(nodes)

---

## 9. House

house(A) = envelope(A.nxt)

Used to compute parent alignment.

Nodes with no children have no house.

---

## 10. Kinship

Nodes A and B are kin if

A.nxt ∩ B.nxt ≠ ∅

Strength

kinship(A,B) = |A.nxt ∩ B.nxt|

Kinship is used only inside the same median group.

Heuristic rule (1-pass adjacent swap):

Given nodes ordered

A B C

If

kinship(A,C) > kinship(A,B)

then swap B and C

Result

A C B

This heuristic runs once per median group.

---

## 11. Block Decomposition

Block S

1. find nodes with minimum level
2. remove them
3. compute connected components ignoring direction

components(T) means connected components of the induced subgraph on T.

children(S) = components(S − minLevelNodes)

---

## 12. Recursive Layout

layout_block(S)

1 children = components(remove_min_level_nodes(S))

2 for each child  
 layout_block(child)

3 order(children)

4 place(children)

5 parent_nodes = nodes in S with level = minLevel(S)

6 order(parent_nodes)

7 compute ideal x

8 spacing sweep

9 recenter

Only parent_nodes are directly arranged.

Child blocks behave as rigid bodies.

---

## 13. Child Block Ordering

Children blocks are ordered using

1 median score  
2 existing x  
3 idx2chain order

Median score = median x of the child block's top-level nodes.

existing x means the current x at this stage of layout.

---

## 14. Parent Node Ordering

Parent row nodes are ordered by

1 median(x of A.nxt)  
2 kinship heuristic (within same median group)  
3 existing x  
4 idx2chain order

Median equality

abs(a − b) ≤ EPS_MEDIAN

EPS_MEDIAN = 1e-6

existing x refers to the current x at the time ordering is executed.

---

## 15. Ideal X

For node A

ideal(A) = center(house(A))

Nodes with no children have no ideal.

---

## 16. Layout Item Abstraction

All compact placement and sweep steps operate on layout items.

A layout item may be

1. a node
2. a child block

A node is treated as a special case of a block occupying exactly one level.

Each layout item provides

levels(item) = set of occupied levels

levelLeft(item, level) = left boundary at that level  
levelRight(item, level) = right boundary at that level

centerX(item) = current center x  
idealX(item) = ideal center x if defined

shiftX(item, dx) = rigid x shift of the entire item

For a node occupying level L

levels(node) = {L}  
levelLeft(node, L) = x - w / 2  
levelRight(node, L) = x + w / 2

For a child block

levels(block) = levels occupied by the block  
levelLeft(block, level) = row bbox left at that level  
levelRight(block, level) = row bbox right at that level

---

## 17. Item Spacing Rule

For two items A and B with fixed order

A on the left  
B on the right

Let

commonLevels = intersection(levels(A), levels(B))

If commonLevels is empty, A and B impose no horizontal constraint.

For each level in commonLevels define

requiredShift(level) = levelRight(A, level) + LAYOUT_COL_GAP − levelLeft(B, level)

Then

requiredShift(A,B) = max(0, max over commonLevels requiredShift(level))

This rule applies to

node-node  
node-block  
block-block

---

## 18. Child Block Compact Placement

Child blocks may span multiple levels.

Given ordered child blocks

B1, B2, ..., Bk

place them in order while preserving internal layout.

For each adjacent pair

Bi, Bi+1

shift Bi+1 by at least

requiredShift(Bi, Bi+1)

Nodes are treated as blocks occupying a single level.

---

## 19. Bilateral Sweep

Parent-row items are already ordered.

Each item initially sits at its ideal position if ideal exists.

Items without ideal are assigned a temporary ideal before sweep.

Rules for assigning temporary ideals:

1. If n consecutive items have no ideal and are between two items A and B with ideals,
   divide the interval between ideal(A) and ideal(B) into n+1 equal segments
   and assign the intermediate points as their ideals.

2. If n consecutive items have no ideal and only one side has an item A with ideal,
   assign ideals by placing the items compactly adjacent to A using spacing rules.

3. If the entire row contains only items without ideal,
   compact them using spacing rules and normalize afterward.

Anchor = center of the union bbox of all ideal positions.

Split items by ideal center

left chain = idealCenter ≤ anchor  
right chain = idealCenter ≥ anchor

Right chain is compacted left → right.

Left chain is compacted right → left.

Ideal positions are never violated.

Spacing constraints use the layout item spacing rule.

---

## 20. Recenter

anchor = center of ideal bbox

current_center = center of actual bbox

shift = anchor − current_center

Apply shift to the entire row.

Recenter affects x only.

---

## 21. Nodes Without Children

Nodes with

A.nxt = ∅

have no house and no ideal.

They participate in spacing and bilateral sweep using the temporary ideal rules.

---

## 22. Row Layout (Y axis)

row height = max node height in that level

Rows are placed so that bbox gap ≥ LAYOUT_ROW_GAP.

Partitions preserve internal vertical layout.

All partitions are vertically shifted so that level 0 rows share the same y.

Finally the global layout bbox center y becomes 0.

---

## 23. Partition Placement

Partitions are ordered by

1 partition bbox center x  
2 earliest idx2chain among level 0 nodes

Partitions are packed left → right with gap

LAYOUT_PART_GAP

---

## 24. Final Normalize

Translate layout so that

center_x = 0  
center_y = 0
