-- Sub-steps under a plan block (#67): one nesting level, parts then whole.
ALTER TABLE "plan_block" ADD COLUMN "parentId" TEXT;

ALTER TABLE "plan_block" ADD CONSTRAINT "plan_block_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "plan_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "plan_block_parentId_position_idx" ON "plan_block"("parentId", "position");
