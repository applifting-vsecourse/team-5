-- Training context fields (#96): optional sleep quality and environment on a workout log.
CREATE TYPE "sleep_quality" AS ENUM ('GOOD', 'POOR');
CREATE TYPE "training_environment" AS ENUM ('HOME', 'OUTDOORS', 'TRAINING_GROUND');

ALTER TABLE "workout_log"
  ADD COLUMN "sleepQuality" "sleep_quality",
  ADD COLUMN "environment" "training_environment";
