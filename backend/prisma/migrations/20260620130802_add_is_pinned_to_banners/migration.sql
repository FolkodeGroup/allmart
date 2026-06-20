-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "is_pinned" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "idx_banners_is_pinned" ON "banners"("is_pinned");
