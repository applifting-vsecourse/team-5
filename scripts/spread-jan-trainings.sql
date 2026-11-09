-- PostgreSQL: spread Jan's PLANNED trainings from today (Europe/Prague).
-- Randomly mix one/two-training days with rest days, including weekends.
-- Dogs alternate; a two-training day can include both Rex and Baryk.
-- At most two trainings total and one per dog/day. Rerunning reshuffles dates.
-- Completed/skipped trainings and workout logs are unchanged. Nothing is deleted.
BEGIN;
SET LOCAL lock_timeout = '5s';

-- Prevent concurrent scheduling while dates are moved in two collision-free steps.
LOCK TABLE scheduled_training IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE jan_training_dates ON COMMIT DROP AS
WITH per_dog AS (
  SELECT s.id, s.date AS old_date, s."dogId",
    row_number() OVER (
      PARTITION BY s."dogId"
      ORDER BY s.date, s."goalId", s."trainingId", s.id
    ) AS dog_position
  FROM scheduled_training s
  JOIN dog d ON d.id = s."dogId"
  JOIN "user" u ON u.id = d."ownerId"
  WHERE u.email = 'jan.novak@seznam.cz'
    AND s.status = 'PLANNED'
), numbered AS (
  SELECT id, old_date, "dogId",
    row_number() OVER (ORDER BY dog_position, "dogId") AS position
  FROM per_dog
), batches AS MATERIALIZED (
  -- Each pair either shares a day or occupies two consecutive days.
  -- When one dog's remaining terms outnumber the other's, split its pair
  -- to avoid putting the same dog/training on a day twice.
  SELECT ((position - 1) / 2)::integer AS batch,
    CASE
      WHEN count(*) > count(DISTINCT "dogId") THEN 2
      WHEN random() < 0.5 THEN 2
      ELSE 1
    END AS span,
    CASE WHEN random() < 0.35 THEN 1 ELSE 0 END AS rest_days
  FROM numbered
  GROUP BY 1
), batch_dates AS (
  SELECT batch, span,
    sum(span + rest_days) OVER (ORDER BY batch) - span AS day_offset
  FROM batches
)
SELECT n.id, n.old_date,
  (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Prague')::date
    + (b.day_offset
      + CASE WHEN b.span = 2 THEN (n.position - 1) % 2 ELSE 0 END)::integer
    AS new_date,
  n.position
FROM numbered n
JOIN batch_dates b ON b.batch = (n.position - 1) / 2;

-- Park beyond all existing and destination dates first. A direct UPDATE could
-- temporarily violate the unique PLANNED (trainingId, date) index.
WITH parking AS (
  SELECT greatest(
    coalesce((SELECT max(date) FROM scheduled_training), CURRENT_DATE),
    coalesce((SELECT max(new_date) FROM jan_training_dates), CURRENT_DATE)
  ) AS base_date
)
UPDATE scheduled_training s
SET date = parking.base_date + changes.position::integer
FROM jan_training_dates changes CROSS JOIN parking
WHERE s.id = changes.id;

UPDATE scheduled_training s
SET date = changes.new_date,
    "updatedAt" = CURRENT_TIMESTAMP
FROM jan_training_dates changes
WHERE s.id = changes.id;

-- Show the resulting plan, including each original date.
SELECT changes.old_date, changes.new_date,
  d.name AS dog, g.title AS goal, t.title AS training
FROM jan_training_dates changes
JOIN scheduled_training s ON s.id = changes.id
JOIN dog d ON d.id = s."dogId"
JOIN training_goal g ON g.id = s."goalId"
JOIN goal_training t ON t.id = s."trainingId"
ORDER BY changes.new_date;

COMMIT;
