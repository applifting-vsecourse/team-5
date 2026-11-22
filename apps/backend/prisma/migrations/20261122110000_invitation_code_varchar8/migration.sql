-- Allow 8-char invitation codes while keeping legacy 6-char rows.
ALTER TABLE "invitation" ALTER COLUMN "code" TYPE VARCHAR(8);
