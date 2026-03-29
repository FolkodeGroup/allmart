-- AlterTable
ALTER TABLE "products" ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "idx_products_is_featured" ON "products"("is_featured");
