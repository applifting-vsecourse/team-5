-- CreateEnum
CREATE TYPE "training_notification_kind" AS ENUM ('NEW_RECORD', 'CLIENT_MESSAGE', 'TRAINER_REPLY');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "training_email_notification" (
    "id" TEXT NOT NULL,
    "workoutLogId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "lastSentAt" TIMESTAMP(3),
    "nextDigestAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_email_notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_email_notification_event" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "kind" "training_notification_kind" NOT NULL,
    "actorId" TEXT,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_email_notification_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "training_email_notification_nextDigestAt_idx" ON "training_email_notification"("nextDigestAt");

-- CreateIndex
CREATE UNIQUE INDEX "training_email_notification_workoutLogId_recipientId_key" ON "training_email_notification"("workoutLogId", "recipientId");

-- CreateIndex
CREATE INDEX "training_email_notification_event_notificationId_createdAt_idx" ON "training_email_notification_event"("notificationId", "createdAt");

-- AddForeignKey
ALTER TABLE "training_email_notification" ADD CONSTRAINT "training_email_notification_workoutLogId_fkey" FOREIGN KEY ("workoutLogId") REFERENCES "workout_log"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_email_notification" ADD CONSTRAINT "training_email_notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_email_notification_event" ADD CONSTRAINT "training_email_notification_event_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "training_email_notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_email_notification_event" ADD CONSTRAINT "training_email_notification_event_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
