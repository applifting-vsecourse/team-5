-- DropForeignKey
ALTER TABLE "training_goal" DROP CONSTRAINT "training_goal_currentStepId_fkey";

-- AlterTable
ALTER TABLE "plan_block" DROP COLUMN "outcome";

-- AlterTable
ALTER TABLE "training_goal" DROP COLUMN "currentStepId";

-- DropEnum
DROP TYPE "step_outcome";
