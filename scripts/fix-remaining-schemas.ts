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
    console.log('🚀 Deploying FHIR columns to remaining tables...');
    try {
        await prisma.$connect();

        // UsuarioSistema (Practitioner)
        console.log('  -> Fixing UsuarioSistema...');
        try { await prisma.$executeRawUnsafe(`ALTER TABLE "usuario_sistema" ADD COLUMN "fhirId" TEXT;`); } catch (e) { }
        try { await prisma.$executeRawUnsafe(`ALTER TABLE "usuario_sistema" ADD COLUMN "fhirResourceType" TEXT DEFAULT 'Practitioner';`); } catch (e) { }
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "usuario_sistema_fhirId_key" ON "usuario_sistema"("fhirId");`);

        // FichaClinica (ClinicalImpression? Or Composition? Or just Patient links?)
        // Let's check schema.prisma output first, but assuming standard fields
        console.log('  -> Fixing FichaClinica...');
        try { await prisma.$executeRawUnsafe(`ALTER TABLE "ficha_clinica" ADD COLUMN "fhirId" TEXT;`); } catch (e) { }
        try { await prisma.$executeRawUnsafe(`ALTER TABLE "ficha_clinica" ADD COLUMN "fhirResourceType" TEXT DEFAULT 'Encounter';`); } catch (e) { }
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ficha_clinica_fhirId_key" ON "ficha_clinica"("fhirId");`);

        // Cita (Appointment)
        console.log('  -> Fixing Cita...');
        try { await prisma.$executeRawUnsafe(`ALTER TABLE "cita" ADD COLUMN "fhirId" TEXT;`); } catch (e) { }
        try { await prisma.$executeRawUnsafe(`ALTER TABLE "cita" ADD COLUMN "fhirResourceType" TEXT DEFAULT 'Appointment';`); } catch (e) { }
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "cita_fhirId_key" ON "cita"("fhirId");`);

        // ExamenMedico (DiagnosticReport)
        console.log('  -> Fixing ExamenMedico...');
        try { await prisma.$executeRawUnsafe(`ALTER TABLE "examen_medico" ADD COLUMN "fhirId" TEXT;`); } catch (e) { }
        try { await prisma.$executeRawUnsafe(`ALTER TABLE "examen_medico" ADD COLUMN "fhirResourceType" TEXT DEFAULT 'DiagnosticReport';`); } catch (e) { }
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "examen_medico_fhirId_key" ON "examen_medico"("fhirId");`);

        console.log('✅ All schemas fixed successfully.');

    } catch (e: any) {
        console.error('❌ Fix failed:', e.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
