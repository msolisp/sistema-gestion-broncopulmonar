/*
  Warnings:

  - You are about to drop the column `embedding` on the `MedicalKnowledge` table. All the data in the column will be lost.
  - You are about to drop the column `page` on the `MedicalKnowledge` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `MedicalKnowledge` table. All the data in the column will be lost.
  - Added the required column `title` to the `MedicalKnowledge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MedicalKnowledge` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MedicalExam" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'portal interno',
ADD COLUMN     "uploadedByUserId" TEXT;

-- AlterTable
ALTER TABLE "MedicalKnowledge" DROP COLUMN "embedding",
DROP COLUMN "page",
DROP COLUMN "source",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "examId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comuna" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comuna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prevision" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticoCIE10" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticoCIE10_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicamento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "principioActivo" TEXT,
    "presentacion" TEXT,
    "laboratorio" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medicamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insumo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT,
    "unidadMedida" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feriado" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "region" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feriado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_read_createdAt_idx" ON "Notification"("read", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Comuna_nombre_key" ON "Comuna"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Prevision_nombre_key" ON "Prevision"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticoCIE10_codigo_key" ON "DiagnosticoCIE10"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Feriado_fecha_region_key" ON "Feriado"("fecha", "region");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
