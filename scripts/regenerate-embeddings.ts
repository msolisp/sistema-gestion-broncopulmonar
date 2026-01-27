
import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.join(process.cwd(), '.env.production.local');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

const prisma = new PrismaClient({
    datasources: { db: { url: process.env.POSTGRES_URL || process.env.DATABASE_URL } }
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
    try {
        await prisma.$connect();

        // 1. Fetch all content
        // Since we can't easily filter by "embedding is null" with Prisma Typed Client for Unsupported fields,
        // we'll fetch all and just re-process them. 41 records is cheap.
        const records = await prisma.medicalKnowledge.findMany({
            select: { id: true, content: true }
        });

        console.log(`Processing ${records.length} records...`);

        for (const record of records) {
            console.log(`Generating embedding for ID: ${record.id} (${record.content.substring(0, 30)}...)`);

            try {
                const response = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: record.content,
                });
                const vector = response.data[0].embedding;
                const vectorString = `[${vector.join(',')}]`;

                // Update
                await prisma.$executeRawUnsafe(
                    `UPDATE "MedicalKnowledge" SET embedding = $1::vector WHERE id = $2`,
                    vectorString,
                    record.id
                );
                console.log('✅ Updated.');
            } catch (err) {
                console.error(`❌ Failed for ${record.id}:`, err);
            }

            // tiny delay to avoid rate limits if any
            await new Promise(r => setTimeout(r, 200));
        }

        console.log('Done.');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
