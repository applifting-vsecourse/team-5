-- AlterTable
ALTER TABLE "workout_log" ADD COLUMN     "scheduledTrainingId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "workout_log_scheduledTrainingId_key" ON "workout_log"("scheduledTrainingId");

-- AddForeignKey
ALTER TABLE "workout_log" ADD CONSTRAINT "workout_log_scheduledTrainingId_fkey" FOREIGN KEY ("scheduledTrainingId") REFERENCES "scheduled_training"("id") ON DELETE SET NULL ON UPDATE CASCADE;

