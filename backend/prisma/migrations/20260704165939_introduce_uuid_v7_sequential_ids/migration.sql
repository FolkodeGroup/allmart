-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "banners" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "cart_items" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "carts" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "category_images_storage" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "collection_items" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "collections" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "contacts" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "favorites" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "low_stock_alerts" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "order_status_history" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "product_features" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "product_images_storage" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "product_option_values" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "product_options" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "product_reviews" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "product_sku_images_storage" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "product_skus" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "product_suppliers" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "promotion_rules" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "promotions" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "shipments" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "staff_notes" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "supplier_product_prices" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "suppliers" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "tags" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();
