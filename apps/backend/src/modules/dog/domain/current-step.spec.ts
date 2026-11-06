import { effectiveCurrentStepId, moveCurrentStep } from './current-step';

const steps = ['a', 'b', 'c'];

describe('effectiveCurrentStepId', () => {
  it('returns null for an empty plan', () => {
    expect(effectiveCurrentStepId([], null)).toBeNull();
    expect(effectiveCurrentStepId([], 'a')).toBeNull();
  });

  it('keeps a pointer that still exists in the plan', () => {
    expect(effectiveCurrentStepId(steps, 'b')).toBe('b');
  });

  it('resolves null or stale pointers to the first step of the goal', () => {
    expect(effectiveCurrentStepId(steps, null)).toBe('a');
    expect(effectiveCurrentStepId(steps, 'deleted-or-archived')).toBe('a');
  });
});

describe('moveCurrentStep', () => {
  it('has nothing to move in an empty plan', () => {
    expect(moveCurrentStep([], null, 'advance')).toBeNull();
  });

  it('starts at the first step when the pointer is null or stale', () => {
    for (const pointer of [null, 'deleted-or-archived']) {
      expect(moveCurrentStep(steps, pointer, 'advance')).toEqual({
        currentStepId: 'b',
        outcomes: new Map([['a', 'MASTERED']]),
      });
    }
  });

  it('marks the current step mastered or skipped and moves to the next', () => {
    expect(moveCurrentStep(steps, 'b', 'advance')).toEqual({
      currentStepId: 'c',
      outcomes: new Map([['b', 'MASTERED']]),
    });
    expect(moveCurrentStep(steps, 'b', 'skip')).toEqual({
      currentStepId: 'c',
      outcomes: new Map([['b', 'SKIPPED']]),
    });
  });

  it('stays on the last step with the outcome after the end', () => {
    expect(moveCurrentStep(steps, 'c', 'advance')).toEqual({
      currentStepId: 'c',
      outcomes: new Map([['c', 'MASTERED']]),
    });
    expect(moveCurrentStep(steps, 'c', 'skip')?.outcomes.get('c')).toBe(
      'SKIPPED',
    );
  });

  it('goes back and clears the outcome of the step it returns to', () => {
    const move = moveCurrentStep(steps, 'c', 'back');
    expect(move?.currentStepId).toBe('b');
    expect(move?.outcomes.get('b')).toBeNull();
    // The finished last step is reopened too.
    expect(move?.outcomes.get('c')).toBeNull();
  });

  it('stays on the first step when going back from it', () => {
    expect(moveCurrentStep(steps, 'a', 'back')?.currentStepId).toBe('a');
    expect(moveCurrentStep(steps, null, 'back')?.currentStepId).toBe('a');
  });
});
