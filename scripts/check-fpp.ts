
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

        // Simple text search (ilike equivalent)
        const relevant = await prisma.medicalKnowledge.findMany({
            where: {
                content: {
                    contains: 'Fibrosis',
                    mode: 'insensitive'
                }
            },
            take: 5
        });

        console.log(`🔎 Found ${relevant.length} records containing 'Fibrosis'`);
        if (relevant.length > 0) {
            console.log('Sample match:', relevant[0].content.substring(0, 100));
        } else {
            const all = await prisma.medicalKnowledge.findMany({ take: 3, select: { content: true } });
            console.log('⚠️ Random content samples:', all.map(r => r.content.substring(0, 50)));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
