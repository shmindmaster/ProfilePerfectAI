-- ProfilePerfect AI Schema Migration
-- Phase 2: Database Schema Updates for gpt-image-1 and Nano Banana integration

-- Step 1: Add new columns to images table first (safe operation)
ALTER TABLE "public"."images" 
ADD COLUMN "is_favorited" BOOLEAN DEFAULT FALSE,
ADD COLUMN "parent_image_id" BIGINT REFERENCES "public"."images"("id") ON DELETE SET NULL,
ADD COLUMN "style_preset" TEXT,
ADD COLUMN "background_preset" TEXT,
ADD COLUMN "source" TEXT DEFAULT 'generated' CHECK (source IN ('uploaded', 'generated'));

-- Step 2: Rename tables (preserves data and relationships)
ALTER TABLE "public"."models" RENAME TO "generation_jobs";
ALTER TABLE "public"."samples" RENAME TO "uploaded_photos";

-- Step 3: Update foreign key constraints to reference renamed table
-- Note: The foreign key names remain the same but now reference generation_jobs table
-- The existing foreign key constraints should automatically reference the renamed table

-- Step 4: Update RLS policies to reference renamed tables and new columns
DROP POLICY IF EXISTS "Enable insert for signed in users" ON "public"."generation_jobs";
CREATE POLICY "Enable insert for signed in users" ON "public"."generation_jobs" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."generation_jobs";
CREATE POLICY "Enable read access for authenticated users" ON "public"."generation_jobs" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));

DROP POLICY IF EXISTS "Enable update from service role" ON "public"."generation_jobs";
CREATE POLICY "Enable update from service role" ON "public"."generation_jobs" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "public"."generation_jobs";
CREATE POLICY "Enable delete for authenticated users" ON "public"."generation_jobs" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));

-- Update uploaded_photos policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."uploaded_photos";
CREATE POLICY "Enable insert for authenticated users only" ON "public"."uploaded_photos" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = ( SELECT "generation_jobs"."user_id"
   FROM "public"."generation_jobs"
  WHERE ("generation_jobs"."id" = "uploaded_photos"."modelId"))));

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."uploaded_photos";
CREATE POLICY "Enable read access for authenticated users" ON "public"."uploaded_photos" FOR SELECT TO "authenticated" USING (("auth"."uid"() = ( SELECT "generation_jobs"."user_id"
   FROM "public"."generation_jobs"
  WHERE ("generation_jobs"."id" = "uploaded_photos"."modelId"))));

DROP POLICY IF EXISTS "Enable updates for authenticated users to samples" ON "public"."uploaded_photos";
CREATE POLICY "Enable updates for authenticated users to uploaded_photos" ON "public"."uploaded_photos" FOR UPDATE TO "authenticated" WITH CHECK (("auth"."uid"() = ( SELECT "generation_jobs"."user_id"
   FROM "public"."generation_jobs"
  WHERE ("generation_jobs"."id" = "uploaded_photos"."modelId"))));

-- Update images policies to include new source column
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON "public"."images";
CREATE POLICY "Enable read access for all authenticated users" ON "public"."images" FOR SELECT TO "authenticated" USING (("auth"."uid"() = ( SELECT "generation_jobs"."user_id"
   FROM "public"."generation_jobs"
  WHERE ("generation_jobs"."id" = "images"."modelId"))));

-- Create index for performance on new columns
CREATE INDEX IF NOT EXISTS "idx_images_source" ON "public"."images"("source");
CREATE INDEX IF NOT EXISTS "idx_images_favorited" ON "public"."images"("is_favorited");
CREATE INDEX IF NOT EXISTS "idx_images_parent" ON "public"."images"("parent_image_id");

-- Create index for uploaded_photos performance
CREATE INDEX IF NOT EXISTS "idx_uploaded_photos_modelId" ON "public"."uploaded_photos"("modelId");

-- Create index for generation_jobs performance
CREATE INDEX IF NOT EXISTS "idx_generation_jobs_user_id" ON "public"."generation_jobs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_generation_jobs_status" ON "public"."generation_jobs"("status");
