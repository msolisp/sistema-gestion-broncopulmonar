CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "MedicalKnowledge" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "page" INTEGER,
    "embedding" vector(768),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalKnowledge_pkey" PRIMARY KEY ("id")
);
