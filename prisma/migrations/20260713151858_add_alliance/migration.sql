-- CreateTable
CREATE TABLE "alliances" (
    "id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "image_public_id" TEXT,
    "display_order" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alliances_pkey" PRIMARY KEY ("id")
);
