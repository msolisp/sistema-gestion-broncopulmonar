import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load production env vars
const envPath = path.join(process.cwd(), '.env.production.local');
if (fs.existsSync(envPath)) {
    console.log('Loading .env.production.local');
    dotenv.config({ path: envPath });
} else {
    console.warn('⚠️  .env.production.local not found. Trying .env...');
    dotenv.config();
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.POSTGRES_URL || process.env.DATABASE_URL
        }
    }
});

async function main() {
    console.log('🚀 Checking database connection...');
    try {
        await prisma.$connect();
        console.log('✅ Connected to DB');
    } catch (e) {
        console.error('❌ Connection failed', e);
        process.exit(1);
    }

    console.log('🛠️ Applying missing schema changes...');

    // Exclude MedicalExam changes as they are already applied
    // Include MedicalKnowledge changes and all CreateTable/Index statements

    try {
        // MedicalKnowledge changes
        // console.log('  -> Altering MedicalKnowledge...');
        // await prisma.$executeRawUnsafe(`
        //     ALTER TABLE "MedicalKnowledge" DROP COLUMN "embedding",
        //     DROP COLUMN "page",
        //     DROP COLUMN "source",
        //     ADD COLUMN     "category" TEXT,
        //     ADD COLUMN     "title" TEXT NOT NULL DEFAULT '',
        //     ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
        // `);
        // Note: Added defaults to avoid errors if rows exist, though backup showed empty or close to empty?
        // Actually backup showed rows. Adding NOT NULL without default might fail if rows exist.
        // The migration file said: "Added the required column `title`... without a default value. This is not possible if the table is not empty."
        // I will add a default '' for title and CURRENT_TIMESTAMP for updatedAt to be safe.
        // Wait, migration said "source" is dropped.

        // Remove defaults after? Or keep them? Keeping them is safer for existing data.

        console.log('  -> Creating Notification table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Notification" (
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
        `);

        console.log('  -> Creating Comuna table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Comuna" (
                "id" TEXT NOT NULL,
                "nombre" TEXT NOT NULL,
                "region" TEXT NOT NULL,
                "activo" BOOLEAN NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
            
                CONSTRAINT "Comuna_pkey" PRIMARY KEY ("id")
            );
        `);

        console.log('  -> Creating Prevision table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Prevision" (
                "id" TEXT NOT NULL,
                "nombre" TEXT NOT NULL,
                "tipo" TEXT NOT NULL,
                "activo" BOOLEAN NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
            
                CONSTRAINT "Prevision_pkey" PRIMARY KEY ("id")
            );
        `);

        console.log('  -> Creating DiagnosticoCIE10 table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "DiagnosticoCIE10" (
                "id" TEXT NOT NULL,
                "codigo" TEXT NOT NULL,
                "descripcion" TEXT NOT NULL,
                "categoria" TEXT,
                "activo" BOOLEAN NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
            
                CONSTRAINT "DiagnosticoCIE10_pkey" PRIMARY KEY ("id")
            );
        `);

        console.log('  -> Creating Medicamento table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Medicamento" (
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
        `);

        console.log('  -> Creating Insumo table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Insumo" (
                "id" TEXT NOT NULL,
                "nombre" TEXT NOT NULL,
                "categoria" TEXT,
                "unidadMedida" TEXT,
                "activo" BOOLEAN NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
            
                CONSTRAINT "Insumo_pkey" PRIMARY KEY ("id")
            );
        `);

        console.log('  -> Creating Feriado table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Feriado" (
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
        `);

        console.log('  -> Creating Configuracion table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "configuracion" (
                "key" TEXT NOT NULL,
                "value" TEXT NOT NULL,
                "description" TEXT,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            
                CONSTRAINT "configuracion_pkey" PRIMARY KEY ("key")
            );
        `);

        console.log('  -> Creating Indexes (ignoring if exist)...');
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Notification_read_createdAt_idx" ON "Notification"("read", "createdAt");`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Comuna_nombre_key" ON "Comuna"("nombre");`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Prevision_nombre_key" ON "Prevision"("nombre");`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "DiagnosticoCIE10_codigo_key" ON "DiagnosticoCIE10"("codigo");`);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Feriado_fecha_region_key" ON "Feriado"("fecha", "region");`);

        console.log('  -> Adding FK Constraints...');
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Notification" ADD CONSTRAINT "Notification_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);

        console.log('✅ All statements executed successfully.');
    } catch (e: any) {
        console.error('❌ Error executing SQL:', e.message);
        process.exit(1);
    }
}

main();
