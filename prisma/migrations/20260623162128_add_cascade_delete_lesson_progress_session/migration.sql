/*
  Warnings:

  - A unique constraint covering the columns `[verification_code]` on the table `certificates` will be added. If there are existing duplicate values, this will fail.
  - The required column `verification_code` was added to the `certificates` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "CertificationMode" AS ENUM ('auto', 'manual');

-- DropForeignKey
ALTER TABLE "lesson_progress" DROP CONSTRAINT "lesson_progress_session_id_fkey";

-- AlterTable
ALTER TABLE "certificate_templates" ADD COLUMN     "qr_size" INTEGER NOT NULL DEFAULT 300;

-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "verification_code" TEXT NOT NULL,
ALTER COLUMN "pdf_url" DROP NOT NULL;

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "certificate_template_id" UUID,
ADD COLUMN     "certification_mode" "CertificationMode" NOT NULL DEFAULT 'auto',
ADD COLUMN     "constancia_template_id" UUID;

-- AlterTable
ALTER TABLE "enrollments" ADD COLUMN     "average_grade" DECIMAL(4,2);

-- CreateTable
CREATE TABLE "enrollment_module_grades" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "grade" DECIMAL(4,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollment_module_grades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_module_grades_enrollment_id_module_id_key" ON "enrollment_module_grades"("enrollment_id", "module_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_verification_code_key" ON "certificates"("verification_code");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_certificate_template_id_fkey" FOREIGN KEY ("certificate_template_id") REFERENCES "certificate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_constancia_template_id_fkey" FOREIGN KEY ("constancia_template_id") REFERENCES "certificate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_module_grades" ADD CONSTRAINT "enrollment_module_grades_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_module_grades" ADD CONSTRAINT "enrollment_module_grades_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
