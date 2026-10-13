-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "certificate_template_id" UUID;

-- CreateTable
CREATE TABLE "module_certificates" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "verification_code" TEXT NOT NULL,
    "pdf_url" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "module_certificates_verification_code_key" ON "module_certificates"("verification_code");

-- CreateIndex
CREATE UNIQUE INDEX "module_certificates_enrollment_id_module_id_key" ON "module_certificates"("enrollment_id", "module_id");

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_certificate_template_id_fkey" FOREIGN KEY ("certificate_template_id") REFERENCES "certificate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_certificates" ADD CONSTRAINT "module_certificates_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_certificates" ADD CONSTRAINT "module_certificates_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_certificates" ADD CONSTRAINT "module_certificates_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "certificate_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
