-- Strengthen unread/cascade lookups for training_reply (review findings).
DROP INDEX IF EXISTS "training_reply_recipientId_idx";

CREATE INDEX "training_reply_recipientId_createdAt_idx" ON "training_reply"("recipientId", "createdAt" DESC);
CREATE INDEX "training_reply_workoutLogId_idx" ON "training_reply"("workoutLogId");
CREATE INDEX "training_reply_scheduledTrainingId_idx" ON "training_reply"("scheduledTrainingId");
