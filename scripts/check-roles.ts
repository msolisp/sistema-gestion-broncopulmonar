
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
    console.log('🔍 Checking Roles in DB...');
    try {
        await prisma.$connect();
        const roles = await prisma.rol.findMany();
        console.table(roles);
    } catch (e: any) {
        console.error('❌ Error fetching roles:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
