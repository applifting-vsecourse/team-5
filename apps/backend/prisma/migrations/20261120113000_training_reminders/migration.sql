-- AlterTable
ALTER TABLE "user" ADD COLUMN "trainingRemindersEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "scheduled_training" ADD COLUMN "reminderSentForDate" DATE;

-- CreateIndex
CREATE INDEX "scheduled_training_status_date_idx" ON "scheduled_training"("status", "date");
