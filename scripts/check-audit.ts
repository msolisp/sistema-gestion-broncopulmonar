
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
    console.log('🔍 Checking Auditoria Table...');
    try {
        await prisma.$connect();
        const count = await prisma.auditoria.count();
        console.log(`Total Audit Logs: ${count}`);

        if (count > 0) {
            const logs = await prisma.auditoria.findMany({
                take: 5,
                orderBy: { fecha: 'desc' }
            });
            console.table(logs);
        }
    } catch (e: any) {
        console.error('❌ Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
