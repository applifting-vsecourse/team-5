// Parts-then-whole (#67): sub-steps walk before their parent, then the main path.
// Display keeps the parent first with children indented underneath.

export type OrderedStep = {
  id: string;
  parentId: string | null;
  position: number;
};

function rootsThenChildren<T extends OrderedStep>(
  steps: T[],
  emit: (root: T, children: T[]) => T[],
): T[] {
  const roots = steps
    .filter((step) => step.parentId == null)
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
  const childrenOf = (parentId: string) =>
    steps
      .filter((step) => step.parentId === parentId)
      .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
  return roots.flatMap((root) => emit(root, childrenOf(root.id)));
}

export function walkOrder<T extends OrderedStep>(steps: T[]): T[] {
  return rootsThenChildren(steps, (root, children) => [...children, root]);
}

export function displayOrder<T extends OrderedStep>(steps: T[]): T[] {
  return rootsThenChildren(steps, (root, children) => [root, ...children]);
}

export function walkOrderIds(steps: OrderedStep[]): string[] {
  return walkOrder(steps).map((step) => step.id);
}
