
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import OpenAI from 'openai';
import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
// import cliProgress from 'cli-progress';

dotenv.config();

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function runWithRetry(fn: () => Promise<any>, retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
                const waittime = delay * Math.pow(2, i);
                console.log(`\n⏳ Rate limit hit, waiting ${waittime}ms...`);
                await new Promise(res => setTimeout(res, waittime));
            } else {
                throw error;
            }
        }
    }
    throw new Error("Max retries exceeded");
}

async function main() {
    console.log("🔍 Fetching records with images...");
    const records = await prisma.medicalKnowledge.findMany({
        where: { imageUrl: { not: null } },
        orderBy: { page: 'asc' }
    });

    console.log(`📊 Found ${records.length} images to refine.`);

    // const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    // bar.start(records.length, 0);

    let processedRequestCount = 0;
    let index = 0;

    for (const record of records) {
        if (!record.imageUrl) continue;

        // Skip if already refined (hacky check: URL contains 'cropped-')
        if (record.imageUrl.includes('cropped-')) {
            // bar.increment();
            index++;
            continue;
        }

        console.log(`[${index + 1}/${records.length}] Processing ${record.id}...`);

        try {
            // 1. Download Image
            const imgRes = await fetch(record.imageUrl);
            if (!imgRes.ok) throw new Error(`Failed to fetch ${record.imageUrl}`);
            const arrayBuffer = await imgRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // 2. GPT-4o Analysis (Smart Crop)
            const base64Image = buffer.toString('base64');

            const completion = await runWithRetry(async () => openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Identify the bounding box of the main chart, table, or figure. Ignore page headers/footers. JSON: {\"ymin\": 0-100, \"xmin\": 0-100, \"ymax\": 0-100, \"xmax\": 0-100}. If full page is content, return 0,0,100,100." },
                            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                        ]
                    }
                ],
                response_format: { type: "json_object" },
                max_tokens: 100
            }));

            processedRequestCount++;
            const box = JSON.parse(completion.choices[0].message.content || "{}");

            // 3. Crop
            if (box.ymin !== undefined && box.xmin !== undefined) {
                const metadata = await sharp(buffer).metadata();
                const width = metadata.width || 0;
                const height = metadata.height || 0;

                const extractRegion = {
                    left: Math.floor((box.xmin / 100) * width),
                    top: Math.floor((box.ymin / 100) * height),
                    width: Math.floor(((box.xmax - box.xmin) / 100) * width),
                    height: Math.floor(((box.ymax - box.ymin) / 100) * height)
                };

                // Validate dimensions
                if (extractRegion.width > 10 && extractRegion.height > 10) {
                    const croppedBuffer = await sharp(buffer)
                        .extract(extractRegion)
                        .toBuffer();

                    // 4. Upload
                    const filename = `cropped-${path.basename(record.imageUrl)}`; // This might be a blob url basename, usually fine
                    const blob = await put(`knowledge-base/${filename}`, croppedBuffer, {
                        access: 'public',
                        addRandomSuffix: true,
                        token: process.env.BLOB_READ_WRITE_TOKEN
                    });

                    // 5. Update DB
                    await prisma.medicalKnowledge.update({
                        where: { id: record.id },
                        data: { imageUrl: blob.url }
                    });
                }
            }

        } catch (e) {
            // Log but don't stop
            // console.error(`\n❌ Error processing ${record.id}:`, e);
        }

        // bar.increment();
        // Friendly throttle to avoid aggressive rate limits despite retry logic
        if (processedRequestCount % 5 === 0) await new Promise(r => setTimeout(r, 1000));
    }

    // bar.stop();
    console.log("\n✅ Image refinement complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
