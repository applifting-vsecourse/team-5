ALTER TABLE "training_goal" ADD CONSTRAINT "training_goal_deadline_valid"
CHECK (
  "deadline" IS NULL OR (
    "deadline" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    AND "deadline"::date::text = "deadline"
  )
);
