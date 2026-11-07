ALTER TABLE "training_goal" ADD COLUMN "deadline" VARCHAR(10);
ALTER TABLE "plan_block" ADD COLUMN "durationMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "plan_block" ADD CONSTRAINT "plan_block_duration_range" CHECK ("durationMinutes" BETWEEN 0 AND 480);
