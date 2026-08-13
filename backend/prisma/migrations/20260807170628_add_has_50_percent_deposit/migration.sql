-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "has_50_percent_deposit" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "product_suppliers" ADD COLUMN     "lead_time_unit" VARCHAR(20) DEFAULT 'dias',
ADD COLUMN     "lead_time_value" INTEGER DEFAULT 3;

-- AlterTable
ALTER TABLE "supplier_product_prices" ADD COLUMN     "lead_time_unit" VARCHAR(20),
ADD COLUMN     "lead_time_value" INTEGER;
