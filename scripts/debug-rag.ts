
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

        const query = "¿Cuáles son los criterios para definir una fibrosis pulmonar progresiva?";
        console.log(`❓ Query: ${query}`);

        // 1. Generate Embedding
        console.log('Generating embedding (text-embedding-3-small)...');
        const embedResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: query,
        });
        const vector = embedResponse.data[0].embedding;
        const vectorString = `[${vector.join(',')}]`;

        // 2. Query
        // Note: pgvector distance: <-> (L2), <=> (Cosine). Usually Cosine is matched with OpenAI.
        // The API route uses <=> (Cosine).
        console.log('Searching...');
        const results = await prisma.$queryRaw`
            SELECT id, content, (embedding <=> ${vectorString}::vector) as distance
            FROM "MedicalKnowledge"
            ORDER BY distance ASC
            LIMIT 5
        ` as any[];

        console.log(`\n🔎 Results (${results.length}):`);
        results.forEach((r, i) => {
            console.log(`\n--- Result ${i + 1} (Dist: ${r.distance}) ---`);
            console.log(r.content.substring(0, 200) + '...');
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
