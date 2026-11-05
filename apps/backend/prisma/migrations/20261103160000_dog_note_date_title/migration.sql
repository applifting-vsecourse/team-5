-- AlterTable
ALTER TABLE "dog_note" ADD COLUMN "date" DATE,
ADD COLUMN "title" VARCHAR(100);

-- Existing rows (if any) get a usable default before NOT NULL.
UPDATE "dog_note" SET "date" = CURRENT_DATE WHERE "date" IS NULL;
UPDATE "dog_note" SET "title" = 'Poznámka' WHERE "title" IS NULL;

ALTER TABLE "dog_note" ALTER COLUMN "date" SET NOT NULL,
ALTER COLUMN "title" SET NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "dog_note_dogId_idx";

-- CreateIndex
CREATE INDEX "dog_note_dogId_date_idx" ON "dog_note"("dogId", "date" DESC);