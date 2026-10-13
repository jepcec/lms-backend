-- CreateTable
CREATE TABLE "upcoming_launches" (
    "id" UUID NOT NULL,
    "category_label" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "image_url" TEXT,
    "image_public_id" TEXT,
    "link_url" TEXT,
    "display_order" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upcoming_launches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_members" (
    "id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "image_public_id" TEXT,
    "display_order" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);
