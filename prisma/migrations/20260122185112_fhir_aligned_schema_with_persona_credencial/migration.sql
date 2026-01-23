-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('M', 'F', 'OTRO', 'NO_ESPECIFICADO');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('KINESIOLOGO', 'MEDICO', 'ENFERMERA', 'TECNICO_PARVULARIO', 'ADMIN', 'RECEPCIONISTA');

-- CreateEnum
CREATE TYPE "TipoAcceso" AS ENUM ('PACIENTE', 'STAFF');

-- CreateTable
CREATE TABLE "persona" (
    "id" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidoPaterno" TEXT NOT NULL,
    "apellidoMaterno" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "comuna" TEXT,
    "region" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "sexo" "Sexo",
    "creadoPor" TEXT NOT NULL,
    "modificadoPor" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoEn" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPor" TEXT,

    CONSTRAINT "persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credencial" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "tipoAcceso" "TipoAcceso" NOT NULL,
    "ultimoAcceso" TIMESTAMP(3),
    "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoHasta" TIMESTAMP(3),
    "debeCambiarPassword" BOOLEAN NOT NULL DEFAULT false,
    "mfaHabilitado" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credencial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ficha_clinica" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "numeroFicha" TEXT NOT NULL,
    "prevision" TEXT,
    "planSalud" TEXT,
    "diagnosticoPrincipal" TEXT,
    "fechaDiagnostico" TIMESTAMP(3),
    "cota" DOUBLE PRECISION,
    "creadoPor" TEXT NOT NULL,
    "modificadoPor" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoEn" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPor" TEXT,
    "motivoEliminacion" TEXT,

    CONSTRAINT "ficha_clinica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_sistema" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "registroProfesional" TEXT,
    "especialidad" TEXT,
    "creadoPor" TEXT NOT NULL,
    "modificadoPor" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoEn" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPor" TEXT,

    CONSTRAINT "usuario_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cita" (
    "id" TEXT NOT NULL,
    "fichaClinicaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examen_medico" (
    "id" TEXT NOT NULL,
    "fichaClinicaId" TEXT NOT NULL,
    "nombreCentro" TEXT NOT NULL,
    "nombreDoctor" TEXT NOT NULL,
    "fechaExamen" TIMESTAMP(3) NOT NULL,
    "archivoUrl" TEXT NOT NULL,
    "archivoNombre" TEXT,
    "revisado" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoEn" TIMESTAMP(3) NOT NULL,
    "origen" TEXT NOT NULL DEFAULT 'portal interno',
    "subidoPor" TEXT,

    CONSTRAINT "examen_medico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacion_medica" (
    "id" TEXT NOT NULL,
    "fichaClinicaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "examenId" TEXT,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacion_medica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prueba_funcion_pulmonar" (
    "id" TEXT NOT NULL,
    "fichaClinicaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "cvfValue" DOUBLE PRECISION,
    "cvfPercent" INTEGER,
    "vef1Value" DOUBLE PRECISION,
    "vef1Percent" INTEGER,
    "dlcoPercent" INTEGER,
    "walkDistance" DOUBLE PRECISION,
    "spo2Rest" INTEGER,
    "spo2Final" INTEGER,
    "heartRateRest" INTEGER,
    "heartRateFinal" INTEGER,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prueba_funcion_pulmonar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permiso_usuario" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "recurso" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "otorgadoPor" TEXT NOT NULL,
    "otorgadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permiso_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_acceso_sistema" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "recurso" TEXT NOT NULL,
    "recursoId" TEXT NOT NULL,
    "fichaClinicaId" TEXT,
    "exitoso" BOOLEAN NOT NULL DEFAULT true,
    "detalles" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_acceso_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "persona_rut_key" ON "persona"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "persona_email_key" ON "persona"("email");

-- CreateIndex
CREATE INDEX "persona_rut_idx" ON "persona"("rut");

-- CreateIndex
CREATE INDEX "persona_nombre_apellidoPaterno_idx" ON "persona"("nombre", "apellidoPaterno");

-- CreateIndex
CREATE UNIQUE INDEX "credencial_personaId_key" ON "credencial"("personaId");

-- CreateIndex
CREATE INDEX "credencial_personaId_tipoAcceso_idx" ON "credencial"("personaId", "tipoAcceso");

-- CreateIndex
CREATE UNIQUE INDEX "ficha_clinica_personaId_key" ON "ficha_clinica"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "ficha_clinica_numeroFicha_key" ON "ficha_clinica"("numeroFicha");

-- CreateIndex
CREATE INDEX "ficha_clinica_numeroFicha_idx" ON "ficha_clinica"("numeroFicha");

-- CreateIndex
CREATE INDEX "ficha_clinica_prevision_idx" ON "ficha_clinica"("prevision");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_sistema_personaId_key" ON "usuario_sistema"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_sistema_registroProfesional_key" ON "usuario_sistema"("registroProfesional");

-- CreateIndex
CREATE INDEX "usuario_sistema_registroProfesional_idx" ON "usuario_sistema"("registroProfesional");

-- CreateIndex
CREATE INDEX "usuario_sistema_rol_idx" ON "usuario_sistema"("rol");

-- CreateIndex
CREATE INDEX "cita_fichaClinicaId_fecha_idx" ON "cita"("fichaClinicaId", "fecha");

-- CreateIndex
CREATE INDEX "examen_medico_fichaClinicaId_fechaExamen_idx" ON "examen_medico"("fichaClinicaId", "fechaExamen");

-- CreateIndex
CREATE INDEX "notificacion_medica_leido_creadoEn_idx" ON "notificacion_medica"("leido", "creadoEn");

-- CreateIndex
CREATE INDEX "notificacion_medica_fichaClinicaId_idx" ON "notificacion_medica"("fichaClinicaId");

-- CreateIndex
CREATE INDEX "prueba_funcion_pulmonar_fichaClinicaId_fecha_idx" ON "prueba_funcion_pulmonar"("fichaClinicaId", "fecha");

-- CreateIndex
CREATE INDEX "permiso_usuario_usuarioId_activo_idx" ON "permiso_usuario"("usuarioId", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "permiso_usuario_usuarioId_recurso_accion_key" ON "permiso_usuario"("usuarioId", "recurso", "accion");

-- CreateIndex
CREATE INDEX "log_acceso_sistema_usuarioId_timestamp_idx" ON "log_acceso_sistema"("usuarioId", "timestamp");

-- CreateIndex
CREATE INDEX "log_acceso_sistema_fichaClinicaId_timestamp_idx" ON "log_acceso_sistema"("fichaClinicaId", "timestamp");

-- CreateIndex
CREATE INDEX "log_acceso_sistema_accion_timestamp_idx" ON "log_acceso_sistema"("accion", "timestamp");

-- AddForeignKey
ALTER TABLE "credencial" ADD CONSTRAINT "credencial_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ficha_clinica" ADD CONSTRAINT "ficha_clinica_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_sistema" ADD CONSTRAINT "usuario_sistema_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cita" ADD CONSTRAINT "cita_fichaClinicaId_fkey" FOREIGN KEY ("fichaClinicaId") REFERENCES "ficha_clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examen_medico" ADD CONSTRAINT "examen_medico_fichaClinicaId_fkey" FOREIGN KEY ("fichaClinicaId") REFERENCES "ficha_clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion_medica" ADD CONSTRAINT "notificacion_medica_fichaClinicaId_fkey" FOREIGN KEY ("fichaClinicaId") REFERENCES "ficha_clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prueba_funcion_pulmonar" ADD CONSTRAINT "prueba_funcion_pulmonar_fichaClinicaId_fkey" FOREIGN KEY ("fichaClinicaId") REFERENCES "ficha_clinica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permiso_usuario" ADD CONSTRAINT "permiso_usuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario_sistema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_acceso_sistema" ADD CONSTRAINT "log_acceso_sistema_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario_sistema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
