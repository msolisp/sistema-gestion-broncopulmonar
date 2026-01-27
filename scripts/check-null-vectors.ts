
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.join(process.cwd(), '.env.production.local');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

const prisma = new PrismaClient({
    datasources: { db: { url: process.env.POSTGRES_URL || process.env.DATABASE_URL } }
});

async function main() {
    try {
        await prisma.$connect();

        // Count records with null embeddings
        // Prisma doesn't always support vector natively in 'where' depending on schema, 
        // but let's try via raw query for safety
        const result = await prisma.$queryRaw`
            SELECT 
                COUNT(*) as total, 
                COUNT(embedding) as with_embedding,
                COUNT(*) - COUNT(embedding) as missing_embedding
            FROM "MedicalKnowledge"
        `;

        console.log('Embedding Stats:', result);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
