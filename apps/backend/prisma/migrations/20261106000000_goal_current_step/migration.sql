-- Current step of a goal (#66): a pointer into the plan plus how each step was left.
CREATE TYPE "step_outcome" AS ENUM ('MASTERED', 'SKIPPED');

ALTER TABLE "plan_block" ADD COLUMN "outcome" "step_outcome";

-- NULL pointer means "the first step of the first active training".
ALTER TABLE "training_goal" ADD COLUMN "currentStepId" TEXT;
ALTER TABLE "training_goal" ADD CONSTRAINT "training_goal_currentStepId_fkey"
  FOREIGN KEY ("currentStepId") REFERENCES "plan_block"("id") ON DELETE SET NULL ON UPDATE CASCADE;
