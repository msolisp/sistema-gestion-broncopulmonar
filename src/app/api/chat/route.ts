
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

console.log('API: route.ts loaded');
export async function POST(req: NextRequest) {
    console.log('API: POST called');
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messages } = await req.json();
        const lastMessage = messages[messages.length - 1]; // User's latest question

        if (!lastMessage || !lastMessage.content) {
            return NextResponse.json({ error: 'Message required' }, { status: 400 });
        }

        const userQuery = lastMessage.content;

        // 1. Generate Embedding for Query
        const embedResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: userQuery,
        });
        const vector = embedResponse.data[0].embedding;

        // 2. Retrieve Relevant Context
        // Use raw query for cosine similarity (<=>) or inner product (<#>) or L2 (<->).
        // pgvector uses <-> for L2 distance (Euclidean). Cosine distance is <=>
        // We want content most similar, so smallest distance.
        const vectorString = `[${vector.join(',')}]`;

        // Cast to vector type for query
        const results = await prisma.$queryRaw`
      SELECT content, "imageUrl", source, page, (embedding <=> ${vectorString}::vector) as distance
      FROM "MedicalKnowledge"
      ORDER BY distance ASC
      LIMIT 3
    ` as any[];

        // 3. Construct Prompt
        const contextText = results.map((r: any) => {
            let text = `[Source: ${r.source}, Page: ${r.page}] ${r.content}`;
            if (r.imageUrl) {
                text += `\n[Reference Image]: ${r.imageUrl}`;
            }
            return text;
        }).join('\n\n');

        // System instruction
        // System instruction (Optimized for speed)
        // System instruction (Optimized for helpfulness and context-awareness)
        const systemPrompt = `You are a clinical assistant specialized in Pulmonary Fibrosis. 
    
    Instructions:
    1.  **Context Priority:** You must answer the question using **PRIMARILY** the provided 'Context' below.
    2.  **No General Knowledge:** Do **NOT** use your general medical knowledge, internet information, or any external sources unless absolutely necessary or if the context is insufficient (but highly relevant). 
    3.  **Strict Limitation:** If the 'Context' does not contain the answer, you MUST state explicitly: "No dispongo de información sobre este tema en mi base de conocimientos o documentos."
    4.  **Images:** If the Context includes a "[Reference Image]: URL", you MUST display it in your response using Markdown format: \`![Figura o Diagrama Relevant](URL)\`.
        *   Place the image near the relevant text.
    5.  **Source Warning:** If for ANY reason you use information not present in the provided context (e.g. general medical knowledge), you MUST start your response with exactly: "[[INTERNET_SOURCE]]".
    6.  **Greetings:** If the user greets you (e.g., "Hola"), reply politely and ask how you can help, but remind them you only answer based on the documents.
    
    Context:
    ${contextText}`;

        // 4. Generate Response Streaming
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userQuery }
            ],
            stream: true,
            temperature: 0.7,
            max_tokens: 1000,
        });

        // Create a ReadableStream for the response
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                for await (const part of response) {
                    const content = part.choices[0]?.delta?.content || '';
                    if (content) {
                        controller.enqueue(encoder.encode(content));
                    }
                }
                controller.close();
            },
        });

        return new NextResponse(readable, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        const errorMessage = error.message || 'Internal Server Error';

        // Check for specific OpenAI errors
        if (error.status === 401) {
            return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
