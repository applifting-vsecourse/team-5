import { StepOutcome } from '@/generated/prisma/client';

export type CurrentStepAction = 'advance' | 'skip' | 'back';

// What to persist after moving the pointer: the new pointer and the outcome
// each touched step ends up with (null clears it).
export type CurrentStepMove = {
  currentStepId: string;
  outcomes: Map<string, StepOutcome | null>;
};

const OUTCOME_OF_ACTION = {
  advance: StepOutcome.MASTERED,
  skip: StepOutcome.SKIPPED,
} as const;

// Stored null/stale means the first step of the whole goal. Resolve before
// returning the pointer to clients so FE never treats null as "this training".
export function effectiveCurrentStepId(
  stepIds: string[],
  currentStepId: string | null,
): string | null {
  if (stepIds.length === 0) return null;
  if (currentStepId && stepIds.includes(currentStepId)) return currentStepId;
  return stepIds[0];
}

// `stepIds` is the goal's whole plan in walking order (non-archived trainings
// by position, steps by position). A missing or stale pointer means the first
// step. Returns null for an empty plan.
export function moveCurrentStep(
  stepIds: string[],
  currentStepId: string | null,
  action: CurrentStepAction,
): CurrentStepMove | null {
  if (stepIds.length === 0) return null;
  const index = Math.max(0, stepIds.indexOf(currentStepId ?? ''));
  const current = stepIds[index];

  if (action === 'back') {
    // At the first step there is nothing to go back to. Leaving the current
    // step also takes back its own outcome (the last step stays MASTERED).
    const previous = stepIds[Math.max(0, index - 1)];
    return {
      currentStepId: previous,
      outcomes: new Map([
        [previous, null],
        [current, null],
      ]),
    };
  }

  // After the last step the pointer stays on it; the goal is not completed.
  return {
    currentStepId: stepIds[Math.min(index + 1, stepIds.length - 1)],
    outcomes: new Map([[current, OUTCOME_OF_ACTION[action]]]),
  };
}
