
const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const { put } = require('@vercel/blob');
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const HAS_BLOB_TOKEN = !!process.env.BLOB_READ_WRITE_TOKEN;

async function main() {
    // Use the absolute path to the uploaded image located in the user's gemini directory
    const imagePath = "/Users/max/.gemini/antigravity/brain/af40181b-f1e7-4afd-ab47-838067685739/uploaded_image_0_1767868891531.png";

    if (!fs.existsSync(imagePath)) {
        console.error(`❌ Image not found: ${imagePath}`);
        process.exit(1);
    }

    console.log(`🚀 Starting Emergency Ingestion for: ${path.basename(imagePath)}`);

    // Read image as Base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    // 1. OCR (Vision)
    console.log("👀 Analyzing image with GPT-4o-mini Vision...");
    const ocrResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: "Transcribe the text in this image exactly. This is a page from a medical book about Pulmonary Fibrosis (Module VII). Output ONLY the text content, no conversational filler." },
                    {
                        type: "image_url",
                        image_url: {
                            url: dataUrl,
                        }
                    }
                ],
            },
        ],
        max_tokens: 1500,
    });

    const content = ocrResponse.choices[0].message.content;
    console.log("📝 Extracted Content Length:", content.length);
    // console.log("Preview:", content.substring(0, 200));

    if (!content || content.length < 50) {
        console.error("❌ Content too short, skipping.");
        return;
    }

    // 1.b Upload to Blob
    let publicImageUrl = null;
    if (HAS_BLOB_TOKEN) {
        try {
            const blob = await put(`knowledge-base/${path.basename(imagePath)}`, fs.readFileSync(imagePath), {
                access: 'public',
                addRandomSuffix: true,
                token: process.env.BLOB_READ_WRITE_TOKEN
            });
            publicImageUrl = blob.url;
            console.log(`📸 Image uploaded: ${publicImageUrl}`);
        } catch (e) {
            console.error("Blob Upload Error:", e);
        }
    }

    // 2. Embedding
    console.log("🧠 Generating Embeddings...");
    const embedResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: content,
    });

    const vector = embedResponse.data[0].embedding;
    const vectorString = `[${vector.join(',')}]`;

    // 3. Insert into DB
    console.log("💾 Saving to Production Database...");
    const id = crypto.randomUUID();
    const sourceName = "Módulo VII - Novedades 2025 (Suplemento)";

    await prisma.$executeRaw`
    INSERT INTO "MedicalKnowledge" (id, content, "imageUrl", source, page, embedding, "createdAt")
    VALUES (${id}, ${content}, ${publicImageUrl}, ${sourceName}, 30, ${vectorString}::vector, NOW());
  `;

    console.log("✅ Successfully ingested missing page!");
}

const crypto = require('crypto');

main()
    .catch((e) => {
        console.error("Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
