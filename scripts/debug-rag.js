
const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
    const searchTerm = "Novedades en 2025";
    console.log(`🔎 Searching for exact text match: "${searchTerm}"...`);

    try {
        // 1. Check if text exists via basic LIKE query (Case insensitive)
        const exactMatches = await prisma.medicalKnowledge.findMany({
            where: {
                content: {
                    contains: searchTerm,
                    mode: 'insensitive',
                },
            },
            select: {
                source: true,
                content: true,
            }
        });

        if (exactMatches.length > 0) {
            console.log(`✅ Text found in ${exactMatches.length} chunks!`);
            exactMatches.forEach(m => console.log(`- Source: ${m.source}`));
        } else {
            console.log("❌ Text NOT found in database via text search. Ingestion might have missed this page.");
        }

        // 2. Check Vector Similarity
        console.log(`\n🧠 Checking Vector Similarity for query: "${searchTerm}"...`);
        const embedResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: searchTerm,
        });
        const vector = embedResponse.data[0].embedding;
        const vectorString = `[${vector.join(',')}]`;

        const results = await prisma.$queryRaw`
        SELECT content, source, (embedding <=> ${vectorString}::vector) as distance
        FROM "MedicalKnowledge"
        ORDER BY distance ASC
        LIMIT 5
      `;

        console.log("--- Top 5 Semantic Matches ---");
        results.forEach((r, i) => {
            console.log(`#${i + 1} [Dist: ${r.distance.toFixed(4)}] Source: ${r.source}`);
            console.log(`Preview: ${r.content.substring(0, 100)}...`);
        });

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
