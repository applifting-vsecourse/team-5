-- CreateTable
CREATE TABLE "trainer_note" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dogId" TEXT,
    "date" DATE NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "text" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trainer_note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trainer_note_trainerId_clientId_isPinned_date_idx" ON "trainer_note"("trainerId", "clientId", "isPinned" DESC, "date" DESC);

-- CreateIndex
CREATE INDEX "trainer_note_trainerId_dogId_isPinned_date_idx" ON "trainer_note"("trainerId", "dogId", "isPinned" DESC, "date" DESC);

-- CreateIndex
CREATE INDEX "trainer_note_clientId_idx" ON "trainer_note"("clientId");

-- CreateIndex
CREATE INDEX "trainer_note_dogId_idx" ON "trainer_note"("dogId");

-- AddForeignKey
ALTER TABLE "trainer_note" ADD CONSTRAINT "trainer_note_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_note" ADD CONSTRAINT "trainer_note_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainer_note" ADD CONSTRAINT "trainer_note_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
