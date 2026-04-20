-- CreateTable
CREATE TABLE IF NOT EXISTS "staff_notes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "content" text NOT NULL,
    "created_at" timestamptz(6) NOT NULL DEFAULT now(),
    "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
    "user_id" uuid NOT NULL,
    CONSTRAINT "staff_notes_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "idx_staff_notes_user_id" ON "staff_notes" ("user_id");
