
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
    console.log('🔍 Inspecting MedicalKnowledge Table...');

    try {
        await prisma.$connect();

        const columns: any[] = await prisma.$queryRawUnsafe(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'MedicalKnowledge' 
            AND table_schema = 'public';
        `);

        console.table(columns);

    } catch (e: any) {
        console.error('❌ Error inspecting table:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
