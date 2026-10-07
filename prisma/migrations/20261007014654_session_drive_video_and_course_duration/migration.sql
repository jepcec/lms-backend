-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('youtube', 'drive');

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "drive_url" TEXT,
ADD COLUMN     "video_provider" "VideoProvider" NOT NULL DEFAULT 'youtube',
ALTER COLUMN "youtube_url" DROP NOT NULL,
ALTER COLUMN "youtube_video_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "staff_members" ALTER COLUMN "display_order" SET DEFAULT 0;

-- Toda sesión debe tener el video de su fuente: nunca una sesión sin video.
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_video_source_check" CHECK (
  ("video_provider" = 'youtube' AND "youtube_url" IS NOT NULL AND "youtube_video_id" IS NOT NULL)
  OR ("video_provider" = 'drive' AND "drive_url" IS NOT NULL)
);

-- total_duration_minutes nunca se recalculaba al agregar sesiones (quedaba en
-- 0 y el certificado imprimía "0 horas"). Desde ahora se recalcula en cada
-- cambio de sesiones/módulos; esto corrige los cursos ya existentes.
UPDATE "courses" c
SET "total_duration_minutes" = COALESCE((
  SELECT SUM(s."duration_minutes")
  FROM "sessions" s
  JOIN "modules" m ON m."id" = s."module_id"
  WHERE m."course_id" = c."id"
), 0);
