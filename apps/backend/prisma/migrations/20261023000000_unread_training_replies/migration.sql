CREATE TYPE "training_reply_kind" AS ENUM ('MESSAGE', 'PLAN_CHANGED');

CREATE TABLE "training_reply" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "workoutLogId" TEXT,
    "scheduledTrainingId" TEXT,
    "kind" "training_reply_kind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "training_reply_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "training_reply_target_check" CHECK ("workoutLogId" IS NOT NULL OR "scheduledTrainingId" IS NOT NULL),
    CONSTRAINT "training_reply_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "training_reply_workoutLogId_fkey" FOREIGN KEY ("workoutLogId") REFERENCES "workout_log"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "training_reply_scheduledTrainingId_fkey" FOREIGN KEY ("scheduledTrainingId") REFERENCES "scheduled_training"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "training_reply_recipientId_createdAt_idx" ON "training_reply"("recipientId", "createdAt");
CREATE INDEX "training_reply_workoutLogId_idx" ON "training_reply"("workoutLogId");
CREATE INDEX "training_reply_scheduledTrainingId_idx" ON "training_reply"("scheduledTrainingId");

-- Existing messages have no read history. Surface each existing thread once to
-- its current participants, without notifying an author about their own words.
INSERT INTO "training_reply" ("id", "recipientId", "workoutLogId", "kind", "createdAt")
SELECT 'legacy-owner-' || m."id", d."ownerId", w."id", 'MESSAGE', m."createdAt"
FROM "training_message" m
JOIN "workout_log" w ON w."id" = m."workoutLogId"
JOIN "dog" d ON d."id" = w."dogId"
WHERE m."authorId" IS DISTINCT FROM d."ownerId";

INSERT INTO "training_reply" ("id", "recipientId", "workoutLogId", "kind", "createdAt")
SELECT 'legacy-trainer-' || m."id" || '-' || s."trainerId", s."trainerId", w."id", 'MESSAGE', m."createdAt"
FROM "training_message" m
JOIN "workout_log" w ON w."id" = m."workoutLogId"
JOIN "dog" d ON d."id" = w."dogId"
JOIN "dog_share" s ON s."dogId" = d."id"
WHERE m."authorId" = d."ownerId" AND s."trainerId" <> d."ownerId";
