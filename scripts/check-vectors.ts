
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load production env vars
const envPath = path.join(process.cwd(), '.env.production.local');
if (fs.existsSync(envPath)) {
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
    try {
        await prisma.$connect();
        const count = await prisma.medicalKnowledge.count();
        console.log(`📚 Medical Knowledge Records: ${count}`);

        if (count > 0) {
            const sample = await prisma.medicalKnowledge.findFirst();
            console.log('Sample Record:', sample);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
