-- CreateTable
CREATE TABLE "dog" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "breed" VARCHAR(100),
    "color" INTEGER NOT NULL,
    "ownerId" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "disciplines" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dog_ownerId_idx" ON "dog"("ownerId");

-- AddForeignKey
ALTER TABLE "dog" ADD CONSTRAINT "dog_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
