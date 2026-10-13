-- CreateTable
CREATE TABLE "scroll_popups" (
    "id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "image_public_id" TEXT,
    "destination_url" TEXT,
    "display_order" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scroll_popups_pkey" PRIMARY KEY ("id")
);
