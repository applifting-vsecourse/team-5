// Mirrors backend step-order (#67): display parent-first, walk children-then-parent.

export type OrderedStep = {
  id: string
  parentId: string | null
  position: number
}

function rootsThenChildren<T extends OrderedStep>(
  steps: T[],
  emit: (root: T, children: T[]) => T[],
): T[] {
  const roots = steps
    .filter((step) => step.parentId == null)
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
  const childrenOf = (parentId: string) =>
    steps
      .filter((step) => step.parentId === parentId)
      .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
  return roots.flatMap((root) => emit(root, childrenOf(root.id)))
}

export function walkOrderIds(steps: OrderedStep[]): string[] {
  return rootsThenChildren(steps, (root, children) => [...children, root]).map((step) => step.id)
}
