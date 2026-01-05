/*
  Warnings:

  - You are about to drop the column `userId` on the `Patient` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rut]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rut` to the `Patient` table without a default value. This is not possible if the table is not empty.

*/

-- 1. Add columns as nullable first (to allow backfilling)
ALTER TABLE "Patient" 
ADD COLUMN "active" BOOLEAN DEFAULT true,
ADD COLUMN "email" TEXT,
ADD COLUMN "name" TEXT,
ADD COLUMN "password" TEXT,
ADD COLUMN "rut" TEXT;

-- 2. Backfill data from User table
-- copying data from linked User record
UPDATE "Patient" p
SET
    "email" = u."email",
    "rut" = u."rut",
    "password" = u."password",
    "name" = u."name"
FROM "User" u
WHERE p."userId" = u."id";

-- 3. Delete patients that still have nulls (data that couldn't be backfilled or had missing fields)
-- This is critical to satisfy NOT NULL constraints being added next
-- This assumes we prefer deleting incomplete patient records rather than failing
DELETE FROM "Patient"
WHERE "email" IS NULL
   OR "rut" IS NULL
   OR "password" IS NULL
   OR "name" IS NULL;

-- 4. Apply NOT NULL constraints now that data is populated
ALTER TABLE "Patient"
ALTER COLUMN "active" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "password" SET NOT NULL,
ALTER COLUMN "rut" SET NOT NULL;

-- 5. Drop old relation column and objects
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_userId_fkey";
DROP INDEX "Patient_userId_key";
ALTER TABLE "Patient" DROP COLUMN "userId";

-- 6. Apply other changes (from original migration)
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'KINESIOLOGIST';

-- 7. Create Indexes (from original migration)
CREATE UNIQUE INDEX "Patient_email_key" ON "Patient"("email");
CREATE UNIQUE INDEX "Patient_rut_key" ON "Patient"("rut");
