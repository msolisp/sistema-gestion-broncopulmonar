
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import OpenAI from 'openai';
import { put } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Image to process (hardcoded to the one the user restored manually for now)
const TARGET_IMAGE_PATH = "/Users/max/.gemini/antigravity/brain/af40181b-f1e7-4afd-ab47-838067685739/uploaded_image_0_1767885924990.png";

async function main() {
    if (!fs.existsSync(TARGET_IMAGE_PATH)) {
        console.error(`❌ Image not found: ${TARGET_IMAGE_PATH}`);
        process.exit(1);
    }

    console.log(`📸 Analyzing image for smart cropping: ${path.basename(TARGET_IMAGE_PATH)}`);

    // 1. Get Bounding Box from GPT-4o
    const imageBuffer = fs.readFileSync(TARGET_IMAGE_PATH);
    const base64Image = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: "Identify the bounding box of the main chart, table, or figure in this page. Ignore headers, footers, and body text if possible. Return specific JSON: {\"ymin\": 0-100, \"xmin\": 0-100, \"ymax\": 0-100, \"xmax\": 0-100}. Percentages." },
                    { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                ]
            }
        ],
        response_format: { type: "json_object" },
        max_tokens: 100
    });

    const box = JSON.parse(response.choices[0].message.content || "{}");
    console.log("📦 Bounding Box identified:", box);

    if (!box.ymin || !box.xmin) {
        console.error("❌ Failed to get bounding box.");
        return;
    }

    // 2. Crop with Sharp
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    const extractRegion = {
        left: Math.floor((box.xmin / 100) * width),
        top: Math.floor((box.ymin / 100) * height),
        width: Math.floor(((box.xmax - box.xmin) / 100) * width),
        height: Math.floor(((box.ymax - box.ymin) / 100) * height)
    };

    console.log("✂️ Cropping to:", extractRegion);

    const croppedBuffer = await sharp(imageBuffer)
        .extract(extractRegion)
        .toBuffer();

    // Save locally for verification (optional, but good for debug)
    const localCropPath = "./cropped_debug.png";
    fs.writeFileSync(localCropPath, croppedBuffer);
    console.log(`✅ Cropped image saved locally for check: ${localCropPath}`);

    // 3. Upload to Vercel Blob
    console.log("☁️ Uploading cropped version to Vercel Blob...");
    const blob = await put(`knowledge-base/cropped-${path.basename(TARGET_IMAGE_PATH)}`, croppedBuffer, {
        access: 'public',
        addRandomSuffix: true,
        token: process.env.BLOB_READ_WRITE_TOKEN
    });

    console.log(`🔗 New Image URL: ${blob.url}`);

    // 4. Update Database
    // We need to find the specific record. Since we don't have the ID easily, we might search by source/content or just insert a new one?
    // Actually, let's just update the most recent entry matching this source filename "manual-upload" or similar.
    // For this specific task, let's assume we update the entry corresponding to the manual upload we just did.
    // The previous script used source = path.basename(imagePath).

    // CAUTION: The previous script used 'uploaded_image_0_...' as source? 
    // Let's check the database for the record created recently.

    const record = await prisma.medicalKnowledge.findFirst({
        where: { source: path.basename(TARGET_IMAGE_PATH) },
        orderBy: { createdAt: 'desc' }
    });

    if (record) {
        await prisma.medicalKnowledge.update({
            where: { id: record.id },
            data: { imageUrl: blob.url }
        });
        console.log("✅ Database updated with cropped image URL.");
    } else {
        console.warn("⚠️ Could not find database record to update. You might need to manually check.");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
