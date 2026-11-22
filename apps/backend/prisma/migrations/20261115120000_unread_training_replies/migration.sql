CREATE TABLE "training_reply" (
 "id" TEXT PRIMARY KEY, "recipientId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
 "workoutLogId" TEXT REFERENCES "workout_log"("id") ON DELETE CASCADE,
 "scheduledTrainingId" TEXT REFERENCES "scheduled_training"("id") ON DELETE CASCADE,
 "kind" TEXT NOT NULL CHECK ("kind" IN ('MESSAGE','PLAN_CHANGED')),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK ("workoutLogId" IS NOT NULL OR "scheduledTrainingId" IS NOT NULL)
);
CREATE INDEX "training_reply_recipientId_idx" ON "training_reply"("recipientId");
-- Existing conversations start read: do not flood users with historical messages.
