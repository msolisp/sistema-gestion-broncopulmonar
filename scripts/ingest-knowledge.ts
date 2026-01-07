
import { PrismaClient } from '@prisma/client';
import ollama from 'ollama';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import os from 'os';
import cliProgress from 'cli-progress';

const prisma = new PrismaClient();

const KNOWLEDGE_BASE_DIR = path.join(process.cwd(), 'knowledge-base/education');

async function main() {
    console.log('🚀 Starting Knowledge Ingestion (SIPS Edition)...');

    if (!fs.existsSync(KNOWLEDGE_BASE_DIR)) {
        console.error(`❌ Directory not found: ${KNOWLEDGE_BASE_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(KNOWLEDGE_BASE_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
    console.log(`found ${files.length} PDF files.`);

    // Create Progress Bar
    const bar = new cliProgress.SingleBar({
        format: 'Ingesting [{bar}] {percentage}% | {value}/{total} Files | Current: {filename}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    }, cliProgress.Presets.shades_classic);

    bar.start(files.length, 0, { filename: 'Initializing...' });

    for (const file of files) {
        // bar.update(null, { filename: file }); -> Incorrect type
        bar.increment(0, { filename: file }); // Update payload without incrementing value yet

        const existing = await prisma.medicalKnowledge.findFirst({
            where: { source: file }
        });

        if (existing) {
            bar.increment();
            continue;
        }

        const tempImage = path.join(os.tmpdir(), `${file}_temp.jpg`);

        try {
            // Convert PDF to Image using SIPS (Native macOS tool)
            execSync(`sips -s format jpeg "${path.join(KNOWLEDGE_BASE_DIR, file)}" --out "${tempImage}" > /dev/null 2>&1`);

            if (!fs.existsSync(tempImage)) {
                // console.error(`   ❌ Failed to convert PDF to Image.`);
                bar.increment();
                continue;
            }

            const imageBuffer = fs.readFileSync(tempImage);

            // A. OCR / Description with LLaVA
            const ocrResponse = await ollama.generate({
                model: 'llava',
                prompt: 'Act as a medical scribe. Transcribe the text in this image exactly. If there are diagrams, describe them in detail including labels and values. Output ONLY the content, no conversational filler.',
                images: [imageBuffer]
            });

            const content = ocrResponse.response;
            if (!content || content.trim().length < 10) {
                bar.increment();
                continue;
            }

            // B. Embedding with Nomic
            const embedResponse = await ollama.embeddings({
                model: 'nomic-embed-text',
                prompt: content,
            });

            const vector = embedResponse.embedding; // number[]

            // C. Save to DB
            const vectorString = `[${vector.join(',')}]`;
            const id = crypto.randomUUID();

            await prisma.$executeRaw`
        INSERT INTO "MedicalKnowledge" (id, content, source, page, embedding, "createdAt")
        VALUES (${id}, ${content}, ${file}, 1, ${vectorString}::vector, NOW());
      `;

            bar.increment();

        } catch (e) {
            // console.error(`   ❌ Error processing file ${file}:`, e);
            bar.increment(); // Ensure progress check continues even on error
        } finally {
            if (fs.existsSync(tempImage)) {
                fs.unlinkSync(tempImage);
            }
        }
    }

    bar.stop();
    console.log('\n🏁 Ingestion Complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
