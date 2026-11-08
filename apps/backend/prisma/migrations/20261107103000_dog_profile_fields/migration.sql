ALTER TABLE "dog" ADD COLUMN "birthDate" VARCHAR(10), ADD COLUMN "weightKg" DOUBLE PRECISION;
ALTER TABLE "dog" ADD CONSTRAINT "dog_weight_range" CHECK ("weightKg" IS NULL OR ("weightKg" >= 0.1 AND "weightKg" <= 200));
