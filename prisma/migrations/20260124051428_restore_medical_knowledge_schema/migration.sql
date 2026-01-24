/*
  Warnings:

  - Added the required column `source` to the `MedicalKnowledge` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MedicalKnowledge" ADD COLUMN     "embedding" vector(1536),
ADD COLUMN     "page" INTEGER,
ADD COLUMN     "source" TEXT NOT NULL,
ALTER COLUMN "title" DROP NOT NULL;
