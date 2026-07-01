/*
  Warnings:

  - You are about to drop the column `user_id` on the `carts` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `favorites` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `product_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `products` on the `suppliers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[session_id]` on the table `carts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[session_id,product_id]` on the table `favorites` will be added. If there are existing duplicate values, this will fail.
  - Made the column `session_id` on table `carts` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `session_id` to the `favorites` table without a default value. This is not possible if the table is not empty.
  - Made the column `reviewer_name` on table `product_reviews` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password_hash` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "carts" DROP CONSTRAINT "carts_user_fk";

-- DropForeignKey
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_user_fk";

-- DropForeignKey
ALTER TABLE "product_reviews" DROP CONSTRAINT "product_reviews_user_fk";

-- DropIndex
DROP INDEX "carts_user_unique";

-- DropIndex
DROP INDEX "idx_carts_user_id";

-- DropIndex
DROP INDEX "favorites_unique";

-- DropIndex
DROP INDEX "idx_favorites_user_id";

-- DropIndex
DROP INDEX "idx_product_reviews_user_id";

-- DropIndex
DROP INDEX "product_reviews_unique";

-- AlterTable
ALTER TABLE "carts" DROP COLUMN "user_id",
ALTER COLUMN "session_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "favorites" DROP COLUMN "user_id",
ADD COLUMN     "session_id" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "product_reviews" DROP COLUMN "user_id",
ALTER COLUMN "reviewer_name" SET NOT NULL;

-- AlterTable
ALTER TABLE "suppliers" DROP COLUMN "products";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "carts_session_unique" ON "carts"("session_id");

-- CreateIndex
CREATE INDEX "idx_favorites_session_id" ON "favorites"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_unique" ON "favorites"("session_id", "product_id");
