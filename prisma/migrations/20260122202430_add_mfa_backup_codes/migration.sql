-- CreateTable
CREATE TABLE "codigo_backup" (
    "id" TEXT NOT NULL,
    "credencialId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "usadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codigo_backup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "codigo_backup_codigo_key" ON "codigo_backup"("codigo");

-- CreateIndex
CREATE INDEX "codigo_backup_credencialId_idx" ON "codigo_backup"("credencialId");

-- CreateIndex
CREATE INDEX "codigo_backup_codigo_idx" ON "codigo_backup"("codigo");

-- AddForeignKey
ALTER TABLE "codigo_backup" ADD CONSTRAINT "codigo_backup_credencialId_fkey" FOREIGN KEY ("credencialId") REFERENCES "credencial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
