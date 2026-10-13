-- Replace Course.access_duration (enum one_year|lifetime) with a numeric access_duration_months.
ALTER TABLE "courses" ADD COLUMN "access_duration_months" INTEGER;

-- One-time backfill: one_year -> 12 months, lifetime -> 999 months (practical "unlimited" convention).
UPDATE "courses" SET "access_duration_months" = CASE
  WHEN "access_duration" = 'one_year' THEN 12
  ELSE 999
END;

ALTER TABLE "courses" ALTER COLUMN "access_duration_months" SET NOT NULL;
ALTER TABLE "courses" DROP COLUMN "access_duration";
DROP TYPE "CourseAccessDuration";

-- Add access expiration to enrollments. No backfill: existing enrollments stay NULL (no
-- retroactive expiry) — only new enrollments created going forward get a computed date.
ALTER TABLE "enrollments" ADD COLUMN "access_expires_at" TIMESTAMP(3);
