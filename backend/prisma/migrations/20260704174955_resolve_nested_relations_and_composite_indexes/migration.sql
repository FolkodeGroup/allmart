-- CreateIndex
CREATE INDEX "idx_orders_status_created_at" ON "orders"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_product_sku_values_option_value_id" ON "product_sku_values"("option_value_id");

-- CreateIndex
CREATE INDEX "idx_product_tags_tag_id" ON "product_tags"("tag_id");
