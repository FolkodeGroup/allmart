-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "filter_config" JSONB NOT NULL DEFAULT '{}';
