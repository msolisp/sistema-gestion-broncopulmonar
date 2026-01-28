import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🛠️ Adding missing FHIR columns to prueba_funcion_pulmonar...');
    try {
        await prisma.$executeRawUnsafe(`
      ALTER TABLE "prueba_funcion_pulmonar" 
      ADD COLUMN IF NOT EXISTS "fhirId" TEXT,
      ADD COLUMN IF NOT EXISTS "fhirResourceType" TEXT DEFAULT 'Observation';
    `);

        await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "prueba_funcion_pulmonar_fhirId_key" 
      ON "prueba_funcion_pulmonar"("fhirId");
    `);

        console.log('✅ Columns added successfully.');
    } catch (e) {
        console.error('❌ Error applying changes:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
