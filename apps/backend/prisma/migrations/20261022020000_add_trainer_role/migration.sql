-- AlterEnum
-- IF NOT EXISTS: the trainer registration story (#50) adds the same value, so
-- whichever migration runs first wins and the other one is a no-op.
ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'trainer';
