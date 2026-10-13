-- AlterEnum
ALTER TYPE "SliderType" ADD VALUE 'catalog';

-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "revoked_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "module_certificates" ADD COLUMN     "revoked_at" TIMESTAMP(3);
