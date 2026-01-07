
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import ollama from 'ollama';

export async function POST(req: NextRequest) {
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
        const embedResponse = await ollama.embeddings({
            model: 'nomic-embed-text',
            prompt: userQuery,
        });
        const vector = embedResponse.embedding;

        // 2. Retrieve Relevant Context
        // Use raw query for cosine similarity (<=>) or inner product (<#>) or L2 (<->).
        // pgvector uses <-> for L2 distance (Euclidean). Cosine distance is <=>
        // We want content most similar, so smallest distance.
        const vectorString = `[${vector.join(',')}]`;

        // Cast to vector type for query
        const results = await prisma.$queryRaw`
      SELECT content, source, page, (embedding <=> ${vectorString}::vector) as distance
      FROM "MedicalKnowledge"
      ORDER BY distance ASC
      LIMIT 3
    ` as any[];

        // 3. Construct Prompt
        const contextText = results.map((r: any) => `[Source: ${r.source}, Page: ${r.page}] ${r.content}`).join('\n\n');

        // System instruction
        // System instruction (Optimized for speed)
        const systemPrompt = `You are a clinical assistant. Use the provided context to answer the question.
    Context:
    ${contextText}
    
    If no answer found, say "No information found." Be concise.`;

        // 4. Generate Response Streaming
        // Ollama supports streaming.
        const stream = await ollama.chat({
            model: 'llama3',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userQuery }
            ],
            stream: true,
            options: {
                num_ctx: 2048, // Limit context window to save RAM
                num_predict: 256, // Limit max output tokens for speed
                temperature: 0.7,
            },
        });

        // Create a ReadableStream for the response
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                for await (const part of stream) {
                    if (part.message.content) {
                        controller.enqueue(encoder.encode(part.message.content));
                    }
                }
                controller.close();
            },
        });

        return new NextResponse(readable, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
