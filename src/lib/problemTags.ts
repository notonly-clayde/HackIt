export const PROBLEM_TAG_SLUGS = [
  "array",
  "string",
  "hash-map",
  "hash-set",
  "stack",
  "queue",
  "linked-list",
  "heap",
  "tree",
  "bst",
  "graph",
  "trie",
  "matrix",
  "interval",
  "two-pointers",
  "sliding-window",
  "binary-search",
  "prefix-sum",
  "sorting",
  "greedy",
  "recursion",
  "backtracking",
  "dfs",
  "bfs",
  "dynamic-programming",
  "bit-manipulation",
  "math",
  "simulation",
  "union-find",
  "topological-sort",
  "monotonic-stack",
] as const

export type ProblemTagSlug = (typeof PROBLEM_TAG_SLUGS)[number]

export const PROBLEM_TAG_LABELS: Record<ProblemTagSlug, string> = {
  array: "Array",
  string: "String",
  "hash-map": "Hash Map",
  "hash-set": "Hash Set",
  stack: "Stack",
  queue: "Queue",
  "linked-list": "Linked List",
  heap: "Heap",
  tree: "Tree",
  bst: "BST",
  graph: "Graph",
  trie: "Trie",
  matrix: "Matrix",
  interval: "Interval",
  "two-pointers": "Two Pointers",
  "sliding-window": "Sliding Window",
  "binary-search": "Binary Search",
  "prefix-sum": "Prefix Sum",
  sorting: "Sorting",
  greedy: "Greedy",
  recursion: "Recursion",
  backtracking: "Backtracking",
  dfs: "DFS",
  bfs: "BFS",
  "dynamic-programming": "Dynamic Programming",
  "bit-manipulation": "Bit Manipulation",
  math: "Math",
  simulation: "Simulation",
  "union-find": "Union Find",
  "topological-sort": "Topological Sort",
  "monotonic-stack": "Monotonic Stack",
}

export const PROBLEM_TAG_OPTIONS = PROBLEM_TAG_SLUGS.map((slug) => ({
  slug,
  label: PROBLEM_TAG_LABELS[slug],
}))

const slugSet = new Set<string>(PROBLEM_TAG_SLUGS)

export function isProblemTagSlug(value: string): value is ProblemTagSlug {
  return slugSet.has(value)
}

export function labelForProblemTag(slug: string): string {
  if (isProblemTagSlug(slug)) return PROBLEM_TAG_LABELS[slug]
  return slug
}
