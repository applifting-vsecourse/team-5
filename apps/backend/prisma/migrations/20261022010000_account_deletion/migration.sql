-- Authorship is not ownership. A trainer leaving must not erase client data.
ALTER TABLE "training_goal" DROP CONSTRAINT "training_goal_createdById_fkey";
ALTER TABLE "training_goal" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "training_goal" ADD CONSTRAINT "training_goal_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "scheduled_training" DROP CONSTRAINT "scheduled_training_createdById_fkey";
ALTER TABLE "scheduled_training" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "scheduled_training" ADD CONSTRAINT "scheduled_training_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "workout_log" DROP CONSTRAINT "workout_log_authorId_fkey";
ALTER TABLE "workout_log" ALTER COLUMN "authorId" DROP NOT NULL;
ALTER TABLE "workout_log" ADD CONSTRAINT "workout_log_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "dog_note" (
    "id" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dog_note_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "dog_note_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "dog"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "dog_note_dogId_idx" ON "dog_note"("dogId");

CREATE TABLE "training_message" (
    "id" TEXT NOT NULL,
    "workoutLogId" TEXT NOT NULL,
    "authorId" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "training_message_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "training_message_workoutLogId_fkey" FOREIGN KEY ("workoutLogId") REFERENCES "workout_log"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "training_message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "training_message_workoutLogId_createdAt_idx" ON "training_message"("workoutLogId", "createdAt");
CREATE INDEX "training_message_authorId_idx" ON "training_message"("authorId");
