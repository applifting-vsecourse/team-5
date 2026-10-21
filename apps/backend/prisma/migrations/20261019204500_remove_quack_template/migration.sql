-- DropForeignKey
ALTER TABLE "quack" DROP CONSTRAINT IF EXISTS "quack_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "quack";
