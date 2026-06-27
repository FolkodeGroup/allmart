-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "storage_key" VARCHAR(500),
ADD COLUMN     "storage_thumb_key" VARCHAR(500),
ALTER COLUMN "data" DROP NOT NULL;

-- AlterTable
ALTER TABLE "category_images_storage" ADD COLUMN     "storage_key" VARCHAR(500),
ADD COLUMN     "storage_thumb_key" VARCHAR(500),
ALTER COLUMN "data" DROP NOT NULL;

-- AlterTable
ALTER TABLE "product_images_storage" ADD COLUMN     "storage_key" VARCHAR(500),
ADD COLUMN     "storage_thumb_key" VARCHAR(500),
ALTER COLUMN "data" DROP NOT NULL;

-- AlterTable
ALTER TABLE "product_sku_images_storage" ADD COLUMN     "storage_key" VARCHAR(500),
ADD COLUMN     "storage_thumb_key" VARCHAR(500),
ALTER COLUMN "data" DROP NOT NULL;
