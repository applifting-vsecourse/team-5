ALTER TABLE "workout_log" ADD COLUMN "mistakeDetails" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
