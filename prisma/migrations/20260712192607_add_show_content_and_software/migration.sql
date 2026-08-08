-- AlterTable
ALTER TABLE "sliders" ADD COLUMN     "show_content" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "softwares" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "image_public_id" TEXT,
    "display_order" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "softwares_pkey" PRIMARY KEY ("id")
);
