
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import os from 'os';
import cliProgress from 'cli-progress';

// Instantiate clients
const prisma = new PrismaClient();

if (!process.env.OPENAI_API_KEY) {
    console.error("❌ Missing OPENAI_API_KEY in environment variables.");
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const KNOWLEDGE_BASE_DIR = path.join(process.cwd(), 'knowledge-base/education');

async function main() {
    console.log('🚀 Starting Knowledge Ingestion (OpenAI Edition)...');

    if (!fs.existsSync(KNOWLEDGE_BASE_DIR)) {
        console.error(`❌ Directory not found: ${KNOWLEDGE_BASE_DIR}`);
        process.exit(1);
    }

    // 1. Clear existing data (Incompatible vectors)
    console.log('🧹 Clearing old data (Vectors 768 -> 1536)...');
    await prisma.$executeRaw`TRUNCATE TABLE "MedicalKnowledge";`;
    // Force update vector dimension if it was created with 768
    try {
        await prisma.$executeRaw`ALTER TABLE "MedicalKnowledge" ALTER COLUMN embedding TYPE vector(1536);`;
        console.log('✅ Vector column updated to 1536 dimensions.');
    } catch (e) {
        console.log('⚠️ Could not alter column (might already be correct or index issue), proceeding...', e);
    }
    console.log('✅ Database cleared.');

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
        bar.increment(0, { filename: file });

        const tempImage = path.join(os.tmpdir(), `${file}_temp.jpg`);

        try {
            // Convert PDF to Image using SIPS (Native macOS tool)
            execSync(`sips -s format jpeg "${path.join(KNOWLEDGE_BASE_DIR, file)}" --out "${tempImage}" > /dev/null 2>&1`);

            if (!fs.existsSync(tempImage)) {
                bar.increment();
                continue;
            }

            const imageBuffer = fs.readFileSync(tempImage);
            const base64Image = imageBuffer.toString('base64');
            const dataUrl = `data:image/jpeg;base64,${base64Image}`;

            // A. OCR / Description with GPT-4o-mini (Vision)
            const ocrResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Act as a medical scribe. Transcribe the text in this image exactly. If there are diagrams, describe them in detail including labels and values. Output ONLY the content, no conversational filler." },
                            {
                                type: "image_url",
                                image_url: {
                                    url: dataUrl,
                                }
                            }
                        ],
                    },
                ],
                max_tokens: 1000,
            });

            const content = ocrResponse.choices[0].message.content;
            if (!content || content.trim().length < 10) {
                bar.increment();
                continue;
            }

            // B. Embedding with OpenAI (text-embedding-3-small)
            const embedResponse = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: content,
            });

            const vector = embedResponse.data[0].embedding; // number[]

            // C. Save to DB
            const vectorString = `[${vector.join(',')}]`;
            const id = crypto.randomUUID();

            await prisma.$executeRaw`
        INSERT INTO "MedicalKnowledge" (id, content, source, page, embedding, "createdAt")
        VALUES (${id}, ${content}, ${file}, 1, ${vectorString}::vector, NOW());
      `;

            bar.increment();

        } catch (e) {
            console.error(`\n❌ Error processing file ${file}:`, e);
            bar.increment();
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
