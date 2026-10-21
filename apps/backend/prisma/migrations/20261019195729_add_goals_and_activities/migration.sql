-- CreateEnum
CREATE TYPE "goal_status" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "workout_status" AS ENUM ('COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "focus_level" AS ENUM ('YES', 'PARTIALLY', 'NO');

-- CreateEnum
CREATE TYPE "mistake_level" AS ENUM ('YES', 'PARTIALLY', 'NO');

-- CreateTable
CREATE TABLE "training_goal" (
    "id" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "discipline" VARCHAR(60),
    "principle" TEXT,
    "status" "goal_status" NOT NULL DEFAULT 'ACTIVE',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_log" (
    "id" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "goalId" TEXT,
    "authorId" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "discipline" VARCHAR(60),
    "status" "workout_status" NOT NULL DEFAULT 'COMPLETED',
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "successRate" INTEGER,
    "rating" INTEGER,
    "focus" "focus_level",
    "repeatedMistakes" "mistake_level",
    "note" TEXT,
    "videoUrl" VARCHAR(500),
    "skipReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "training_goal_dogId_status_idx" ON "training_goal"("dogId", "status");

-- CreateIndex
CREATE INDEX "training_goal_dogId_order_idx" ON "training_goal"("dogId", "order");

-- CreateIndex
CREATE INDEX "workout_log_dogId_completedAt_idx" ON "workout_log"("dogId", "completedAt" DESC);

-- AddForeignKey
ALTER TABLE "training_goal" ADD CONSTRAINT "training_goal_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_goal" ADD CONSTRAINT "training_goal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_log" ADD CONSTRAINT "workout_log_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_log" ADD CONSTRAINT "workout_log_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "training_goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_log" ADD CONSTRAINT "workout_log_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
