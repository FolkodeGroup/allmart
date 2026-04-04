-- CreateEnum
CREATE TYPE "promotion_type" AS ENUM ('percentage', 'fixed', 'bogo');

-- CreateEnum
CREATE TYPE "collection_display_position" AS ENUM ('home', 'category');

-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "promotion_type" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "min_purchase_amount" DECIMAL(12,2),
    "max_discount" DECIMAL(12,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "promotion_id" UUID NOT NULL,
    "product_id" UUID,
    "category_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "display_position" "collection_display_position" NOT NULL,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "collection_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_promotions_is_active" ON "promotions"("is_active");

-- CreateIndex
CREATE INDEX "idx_promotions_dates" ON "promotions"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "idx_promotions_priority" ON "promotions"("priority");

-- CreateIndex
CREATE INDEX "idx_promotion_rules_promotion_id" ON "promotion_rules"("promotion_id");

-- CreateIndex
CREATE INDEX "idx_promotion_rules_product_id" ON "promotion_rules"("product_id");

-- CreateIndex
CREATE INDEX "idx_promotion_rules_category_id" ON "promotion_rules"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_rules_unique" ON "promotion_rules"("promotion_id", "product_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "collections_slug_unique" ON "collections"("slug");

-- CreateIndex
CREATE INDEX "idx_collections_slug" ON "collections"("slug");

-- CreateIndex
CREATE INDEX "idx_collections_is_active" ON "collections"("is_active");

-- CreateIndex
CREATE INDEX "idx_collections_display_position" ON "collections"("display_position");

-- CreateIndex
CREATE INDEX "idx_collection_items_collection_id" ON "collection_items"("collection_id");

-- CreateIndex
CREATE INDEX "idx_collection_items_product_id" ON "collection_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "collection_items_unique" ON "collection_items"("collection_id", "product_id");

-- AddForeignKey
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_promotion_fk" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_product_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_category_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collection_fk" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_product_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
