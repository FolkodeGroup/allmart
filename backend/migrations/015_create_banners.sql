-- Create banners table with binary image storage (idempotent)
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  data BYTEA NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  thumbnail BYTEA,
  thumb_width INTEGER,
  thumb_height INTEGER,
  mime_type VARCHAR(50) NOT NULL DEFAULT 'image/webp',
  original_filename VARCHAR(255),
  size_bytes INTEGER NOT NULL,
  alt_text VARCHAR(500),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON banners(display_order);

