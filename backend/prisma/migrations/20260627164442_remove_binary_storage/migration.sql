/*
  Warnings:

  - You are about to drop the column `data` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `category_images_storage` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail` on the `category_images_storage` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `product_images_storage` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail` on the `product_images_storage` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `product_sku_images_storage` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail` on the `product_sku_images_storage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "banners" DROP COLUMN "data",
DROP COLUMN "thumbnail";

-- AlterTable
ALTER TABLE "category_images_storage" DROP COLUMN "data",
DROP COLUMN "thumbnail";

-- AlterTable
ALTER TABLE "product_images_storage" DROP COLUMN "data",
DROP COLUMN "thumbnail";

-- AlterTable
ALTER TABLE "product_sku_images_storage" DROP COLUMN "data",
DROP COLUMN "thumbnail";
