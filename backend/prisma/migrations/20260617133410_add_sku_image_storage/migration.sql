-- CreateTable
CREATE TABLE "product_sku_images_storage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sku_id" UUID NOT NULL,
    "data" BYTEA NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "thumbnail" BYTEA,
    "thumb_width" INTEGER,
    "thumb_height" INTEGER,
    "mime_type" VARCHAR(50) NOT NULL DEFAULT 'image/webp',
    "original_filename" VARCHAR(255),
    "size_bytes" INTEGER NOT NULL,
    "alt_text" VARCHAR(500),
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_sku_images_storage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_product_sku_images_sku_id" ON "product_sku_images_storage"("sku_id");

-- CreateIndex
CREATE INDEX "idx_product_sku_images_position" ON "product_sku_images_storage"("sku_id", "position");

-- CreateIndex
CREATE INDEX "idx_collections_active_home" ON "collections"("display_position", "display_order") WHERE (is_active = true);

-- AddForeignKey
ALTER TABLE "product_sku_images_storage" ADD CONSTRAINT "product_sku_images_sku_fk" FOREIGN KEY ("sku_id") REFERENCES "product_skus"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
