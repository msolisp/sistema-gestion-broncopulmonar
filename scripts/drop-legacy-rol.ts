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
    console.log('🚀 Dropping legacy rol column...');
    try {
        await prisma.$connect();
        await prisma.$executeRawUnsafe(`ALTER TABLE "usuario_sistema" DROP COLUMN IF EXISTS "rol";`);
        console.log('✅ Legacy rol column dropped.');
    } catch (e: any) {
        console.error('❌ Failed to drop column:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
