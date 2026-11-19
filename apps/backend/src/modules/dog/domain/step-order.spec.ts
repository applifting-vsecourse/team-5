import { displayOrder, walkOrder, walkOrderIds } from './step-order';

const step = (
  id: string,
  position: number,
  parentId: string | null = null,
) => ({ id, position, parentId });

describe('step order (#67)', () => {
  const plan = [
    step('a', 0),
    step('b', 1),
    step('b1', 0, 'b'),
    step('b2', 1, 'b'),
    step('c', 2),
  ];

  it('walks sub-steps before the parent, then the main path', () => {
    expect(walkOrderIds(plan)).toEqual(['a', 'b1', 'b2', 'b', 'c']);
  });

  it('shows the parent first with children underneath for the editor', () => {
    expect(displayOrder(plan).map((s) => s.id)).toEqual([
      'a',
      'b',
      'b1',
      'b2',
      'c',
    ]);
  });

  it('keeps a flat plan unchanged in both orders', () => {
    const flat = [step('a', 0), step('b', 1)];
    expect(walkOrder(flat).map((s) => s.id)).toEqual(['a', 'b']);
    expect(displayOrder(flat).map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('ignores orphan children whose parent is missing', () => {
    expect(walkOrderIds([step('a', 0), step('x', 0, 'gone')])).toEqual(['a']);
  });
});
