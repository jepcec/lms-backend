-- The StaffMember model already exposes these optional fields, but the
-- original staff_members migration did not create their columns.
ALTER TABLE "staff_members"
    ADD COLUMN IF NOT EXISTS "full_name" TEXT,
    ADD COLUMN IF NOT EXISTS "title" TEXT,
    ADD COLUMN IF NOT EXISTS "description" TEXT;
