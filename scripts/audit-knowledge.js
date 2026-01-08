
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const KNOWLEDGE_BASE_DIR = path.join(process.cwd(), 'knowledge-base/education');

async function main() {
    console.log('🕵️‍♂️ Starting Knowledge Base Audit...');

    // 1. Get Local Files
    if (!fs.existsSync(KNOWLEDGE_BASE_DIR)) {
        console.error(`❌ Directory not found: ${KNOWLEDGE_BASE_DIR}`);
        process.exit(1);
    }
    const localFiles = fs.readdirSync(KNOWLEDGE_BASE_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
    console.log(`📂 Local PDF Files: ${localFiles.length}`);

    // 2. Get Database Records
    try {
        const dbRecords = await prisma.medicalKnowledge.findMany({
            select: { source: true }
        });

        // Group by source
        const dbSources = new Set(dbRecords.map(r => r.source));
        console.log(`🗄️  Database Unique Sources: ${dbSources.size}`);
        console.log(`Total DB Records: ${dbRecords.length}`);

        // 3. Compare
        const missingInDb = localFiles.filter(f => !dbSources.has(f));
        const extraInDb = [...dbSources].filter(s => !localFiles.includes(s) && !s.includes('uploaded_image')); // Ignore the manual uploads

        console.log('\n--- Audit Results ---');

        if (missingInDb.length === 0) {
            console.log('✅ All local files are present in the Database.');
        } else {
            console.log(`❌ Missing ${missingInDb.length} files in Database:`);
            missingInDb.forEach(f => console.log(`   - ${f}`));
        }

        if (extraInDb.length > 0) {
            console.log(`⚠️  ${extraInDb.length} sources in DB not found locally (orphaned?):`);
            extraInDb.forEach(f => console.log(`   - ${f}`));
        }

        // Check for empty content
        const emptyContent = await prisma.medicalKnowledge.count({
            where: {
                content: {
                    equals: ""
                }
            }
        });

        if (emptyContent > 0) {
            console.log(`\n❌ WARNING: ${emptyContent} records have EMPTY content (OCR failure).`);
        } else {
            console.log(`\n✅ No empty content records found.`);
        }

    } catch (e) {
        console.error("Error connecting to DB:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
