-- CreateEnum
CREATE TYPE "training_status" AS ENUM ('PLANNED', 'COMPLETED', 'SKIPPED');

-- CreateTable
CREATE TABLE "scheduled_training" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "training_status" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_training_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_training_dogId_date_idx" ON "scheduled_training"("dogId", "date");

-- CreateIndex
CREATE INDEX "scheduled_training_goalId_status_idx" ON "scheduled_training"("goalId", "status");

-- AddForeignKey
ALTER TABLE "scheduled_training" ADD CONSTRAINT "scheduled_training_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "training_goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_training" ADD CONSTRAINT "scheduled_training_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_training" ADD CONSTRAINT "scheduled_training_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
