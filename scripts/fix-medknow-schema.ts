
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
    console.log('🛠️ Fixing MedicalKnowledge Schema...');

    try {
        await prisma.$connect();

        // 1. Enable pgvector extension
        console.log('  -> Enabling vector extension...');
        await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);

        // 2. Add columns
        console.log('  -> Adding missing columns...');

        // Add 'source' column
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "MedicalKnowledge" 
            ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'uploaded';
        `);

        // Add 'page' column
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "MedicalKnowledge" 
            ADD COLUMN IF NOT EXISTS "page" INTEGER;
        `);

        // Add 'embedding' column (vector 1536 for text-embedding-3-small)
        // Note: vector type might need to be cast explicitly or handled carefully
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "MedicalKnowledge" 
            ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
        `);

        console.log('✅ Schema fixed successfully.');

    } catch (e: any) {
        console.error('❌ Error fixing schema:', e.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
