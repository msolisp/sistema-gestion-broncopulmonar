
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

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
      SELECT content, imageUrl, source, page, (embedding <=> ${vectorString}::vector) as distance
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
    1.  **Context First:** Always prioritize the provided 'Context' to answer the question. Cite the source if possible (e.g., "Según la guía...").
    2.  **Images:** If the Context includes a "[Reference Image]: URL", you MUST display it in your response using Markdown format: \`![Figura o Diagrama Relevant](URL)\`.
        *   Place the image near the relevant text.
        *   Do not invent image URLs. Only use the ones from Context.
    3.  **Greetings:** If the user greets you ("Hola", "Buenos días"), reply politely and ask how you can help.
    4.  **Fallback:** If the Context does not answer the question effectively:
        *   **Do NOT** say "No information found" immediately.
        *   Provide a helpful answer based on your general general medical knowledge.
        *   **CRITICAL:** You MUST start your answer with a disclaimer: "⚠️ **Nota:** Esta información es general y no aparece explícitamente en las guías subidas."
    
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
