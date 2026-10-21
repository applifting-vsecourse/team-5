-- CreateTable
CREATE TABLE "plan_block" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "instruction" TEXT,
    "criterion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plan_block_goalId_position_idx" ON "plan_block"("goalId", "position");

-- AddForeignKey
ALTER TABLE "plan_block" ADD CONSTRAINT "plan_block_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "training_goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
