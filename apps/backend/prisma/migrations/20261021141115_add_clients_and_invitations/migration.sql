-- CreateTable
CREATE TABLE "client_connection" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dog_share" (
    "id" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dog_share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "trainerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_connection_trainerId_idx" ON "client_connection"("trainerId");

-- CreateIndex
CREATE INDEX "client_connection_clientId_idx" ON "client_connection"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "client_connection_trainerId_clientId_key" ON "client_connection"("trainerId", "clientId");

-- CreateIndex
CREATE INDEX "dog_share_trainerId_idx" ON "dog_share"("trainerId");

-- CreateIndex
CREATE INDEX "dog_share_dogId_idx" ON "dog_share"("dogId");

-- CreateIndex
CREATE UNIQUE INDEX "dog_share_dogId_trainerId_key" ON "dog_share"("dogId", "trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "invitation_code_key" ON "invitation"("code");

-- CreateIndex
CREATE INDEX "invitation_trainerId_idx" ON "invitation"("trainerId");

-- AddForeignKey
ALTER TABLE "client_connection" ADD CONSTRAINT "client_connection_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_connection" ADD CONSTRAINT "client_connection_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dog_share" ADD CONSTRAINT "dog_share_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dog_share" ADD CONSTRAINT "dog_share_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
