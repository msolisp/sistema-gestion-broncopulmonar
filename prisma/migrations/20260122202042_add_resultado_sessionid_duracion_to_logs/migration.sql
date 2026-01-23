/*
  Warnings:

  - You are about to drop the column `detalles` on the `log_acceso_sistema` table. All the data in the column will be lost.
  - You are about to drop the column `fichaClinicaId` on the `log_acceso_sistema` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `log_acceso_sistema` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "log_acceso_sistema_accion_timestamp_idx";

-- DropIndex
DROP INDEX "log_acceso_sistema_fichaClinicaId_timestamp_idx";

-- DropIndex
DROP INDEX "log_acceso_sistema_usuarioId_timestamp_idx";

-- AlterTable
ALTER TABLE "log_acceso_sistema" DROP COLUMN "detalles",
DROP COLUMN "fichaClinicaId",
DROP COLUMN "timestamp",
ADD COLUMN     "accionDetalle" TEXT,
ADD COLUMN     "duracionMs" INTEGER,
ADD COLUMN     "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "resultado" TEXT,
ADD COLUMN     "sessionId" TEXT,
ALTER COLUMN "ipAddress" SET DEFAULT 'unknown';

-- CreateIndex
CREATE INDEX "log_acceso_sistema_usuarioId_fecha_idx" ON "log_acceso_sistema"("usuarioId", "fecha");

-- CreateIndex
CREATE INDEX "log_acceso_sistema_recursoId_fecha_idx" ON "log_acceso_sistema"("recursoId", "fecha");

-- CreateIndex
CREATE INDEX "log_acceso_sistema_ipAddress_idx" ON "log_acceso_sistema"("ipAddress");

-- CreateIndex
CREATE INDEX "log_acceso_sistema_resultado_idx" ON "log_acceso_sistema"("resultado");
