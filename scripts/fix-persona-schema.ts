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
    console.log('🚀 Deploying FHIR columns to Persona table...');
    try {
        await prisma.$connect();

        console.log('  -> Adding fhirId and fhirResourceType...');
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "persona" ADD COLUMN "fhirId" TEXT;`);
        } catch (e) {
            console.log('     (fhirId already exists)');
        }

        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "persona" ADD COLUMN "fhirResourceType" TEXT DEFAULT 'Patient';`);
        } catch (e) {
            console.log('     (fhirResourceType already exists)');
        }

        console.log('  -> Creating index for fhirId...');
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "persona_fhirId_key" ON "persona"("fhirId");`);

        console.log('✅ Persona schema fixed successfully.');

    } catch (e: any) {
        console.error('❌ Fix failed:', e.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
