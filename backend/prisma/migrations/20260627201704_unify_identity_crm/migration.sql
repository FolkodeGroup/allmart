/*
  Warnings:

  - You are about to drop the column `customer_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `customers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_customer_fk";

-- DropIndex
DROP INDEX "idx_orders_customer_id";

-- DropIndex
DROP INDEX "idx_orders_customer_phone";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "customer_id",
ADD COLUMN     "user_id" UUID;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" VARCHAR(30),
ADD COLUMN     "total_orders" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_spent" DECIMAL(12,2) NOT NULL DEFAULT 0,
ALTER COLUMN "password_hash" DROP NOT NULL;

-- DropTable
DROP TABLE "customers";

-- CreateIndex
CREATE INDEX "idx_orders_user_id" ON "orders"("user_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- RenameIndex
ALTER INDEX "users_email_unique" RENAME TO "users_email_key";
