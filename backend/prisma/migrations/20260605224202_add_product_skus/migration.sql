-- CreateTable
CREATE TABLE "product_skus" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "sku" VARCHAR(100) NOT NULL,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(12,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_skus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_skus_sku_unique" ON "product_skus"("sku");

-- CreateIndex
CREATE INDEX "idx_product_skus_product_id" ON "product_skus"("product_id");

-- AddForeignKey
ALTER TABLE "product_skus" ADD CONSTRAINT "product_skus_product_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
