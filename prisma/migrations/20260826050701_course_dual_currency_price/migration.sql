-- Add dual-currency price columns to courses (price_pen/discount_price_pen + price_usd/discount_price_usd),
-- backfill from the existing single price/discount_price/currency, then drop the old columns and enum.
ALTER TABLE "courses" ADD COLUMN "price_pen" DECIMAL(10,2);
ALTER TABLE "courses" ADD COLUMN "discount_price_pen" DECIMAL(10,2);
ALTER TABLE "courses" ADD COLUMN "price_usd" DECIMAL(10,2);
ALTER TABLE "courses" ADD COLUMN "discount_price_usd" DECIMAL(10,2);

-- One-time backfill only, using an approximate PEN/USD reference rate (3.75), so existing rows
-- don't end up NULL once price_pen/price_usd become NOT NULL. Admins should review/correct
-- these auto-filled values afterwards; new courses must enter both prices explicitly.
UPDATE "courses" SET
  "price_pen" = CASE WHEN "currency" = 'PEN' THEN "price" ELSE ROUND("price" * 3.75, 2) END,
  "discount_price_pen" = CASE
    WHEN "discount_price" IS NULL THEN NULL
    WHEN "currency" = 'PEN' THEN "discount_price"
    ELSE ROUND("discount_price" * 3.75, 2)
  END,
  "price_usd" = CASE WHEN "currency" = 'USD' THEN "price" ELSE ROUND("price" / 3.75, 2) END,
  "discount_price_usd" = CASE
    WHEN "discount_price" IS NULL THEN NULL
    WHEN "currency" = 'USD' THEN "discount_price"
    ELSE ROUND("discount_price" / 3.75, 2)
  END;

ALTER TABLE "courses" ALTER COLUMN "price_pen" SET NOT NULL;
ALTER TABLE "courses" ALTER COLUMN "price_usd" SET NOT NULL;

ALTER TABLE "courses" DROP COLUMN "price";
ALTER TABLE "courses" DROP COLUMN "discount_price";
ALTER TABLE "courses" DROP COLUMN "currency";

DROP TYPE "CourseCurrency";
