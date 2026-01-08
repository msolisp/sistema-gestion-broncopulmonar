
import { POST } from './route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { openai } from '@/lib/openai';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for Request/Response/Stream in JSDOM
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;
if (typeof ReadableStream === 'undefined') {
    // @ts-ignore
    global.ReadableStream = class ReadableStream {
        constructor(underlyingSource: any) {
            // No-op for mock
        }
    }
}

// Mock NextResponse
jest.mock('next/server', () => {
    return {
        NextRequest: jest.fn((url, init) => {
            // console.log('Mock NextRequest init:', init);
            return {
                url,
                method: init?.method,
                json: async () => {
                    const body = init?.body as string || '{}';
                    // console.log('Mock json() body:', body);
                    return JSON.parse(body);
                },
            };
        }),
        NextResponse: class {
            static json(body: any, init?: any) {
                return {
                    status: init?.status || 200,
                    json: async () => body,
                };
            }
            constructor(body: any, init?: any) {
                return {
                    headers: new Map([['Content-Type', init?.headers?.['Content-Type'] || 'text/plain']]),
                    status: init?.status || 200,
                } as any;
            }
        },
    };
});


// Mock dependencies
jest.mock('@/auth', () => ({
    auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: {
        $queryRaw: jest.fn(),
    },
}));

jest.mock('@/lib/openai', () => ({
    openai: {
        embeddings: {
            create: jest.fn(),
        },
        chat: {
            completions: {
                create: jest.fn(),
            },
        },
    },
}));

describe('POST /api/chat', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 if user is not authenticated', async () => {
        (auth as jest.Mock).mockResolvedValue(null);
        const req = new NextRequest('http://localhost:3000/api/chat', {
            method: 'POST',
        });

        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(401);
        expect(json.error).toBe('Unauthorized');
    });

    it('should return 400 if message is missing', async () => {
        (auth as jest.Mock).mockResolvedValue({ user: { id: '1' } });
        const req = new NextRequest('http://localhost:3000/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: [] }),
        });

        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.error).toBe('Message required');
    });

    it('should return 400 if last message content is empty', async () => {
        (auth as jest.Mock).mockResolvedValue({ user: { id: '1' } });
        const req = new NextRequest('http://localhost:3000/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: [{ role: 'user', content: '' }] }),
        });

        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.error).toBe('Message required');
    });

    it('should process request and include image URL in system prompt', async () => {
        (auth as jest.Mock).mockResolvedValue({ user: { id: '1' } });

        // Mock Embedding
        (openai.embeddings.create as jest.Mock).mockResolvedValue({
            data: [{ embedding: [0.1, 0.2, 0.3] }],
        });

        // Mock Prisma Search Result with Image
        (prisma.$queryRaw as jest.Mock).mockResolvedValue([
            {
                content: 'Test content',
                imageUrl: 'https://example.com/image.jpg',
                source: 'doc.pdf',
                page: 1,
                distance: 0.1
            }
        ]);

        // Mock OpenAI Chat Completion (Stream)
        const mockStream = {
            async *[Symbol.asyncIterator]() {
                yield { choices: [{ delta: { content: 'Hello' } }] };
            },
        };
        (openai.chat.completions.create as jest.Mock).mockResolvedValue(mockStream);

        const req = new NextRequest('http://localhost:3000/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: [{ role: 'user', content: 'Show figure 1' }] }),
        });

        const res = await POST(req);

        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');

        // Verify OpenAI call includes Reference Image in context
        const createCall = (openai.chat.completions.create as jest.Mock).mock.calls[0][0];
        const systemMessage = createCall.messages.find((m: any) => m.role === 'system');

        // Check that the Context section (implied by presence of URL) has the image
        expect(systemMessage.content).toContain('[Reference Image]: https://example.com/image.jpg');
    });

    it('should process request correctly when no images are found', async () => {
        (auth as jest.Mock).mockResolvedValue({ user: { id: '1' } });

        // Mock Embedding
        (openai.embeddings.create as jest.Mock).mockResolvedValue({
            data: [{ embedding: [0.1, 0.2, 0.3] }],
        });

        // Mock Prisma Search Result WITHOUT Image
        (prisma.$queryRaw as jest.Mock).mockResolvedValue([
            {
                content: 'Text only content',
                imageUrl: null,
                source: 'doc.pdf',
                page: 1,
                distance: 0.1
            }
        ]);

        const mockStream = {
            async *[Symbol.asyncIterator]() {
                yield { choices: [{ delta: { content: 'Hello' } }] };
            },
        };
        (openai.chat.completions.create as jest.Mock).mockResolvedValue(mockStream);

        const req = new NextRequest('http://localhost:3000/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: [{ role: 'user', content: 'Explain text' }] }),
        });

        await POST(req);

        // Verify OpenAI call does NOT include Reference Image tag
        const createCall = (openai.chat.completions.create as jest.Mock).mock.calls[0][0];
        const systemMessage = createCall.messages.find((m: any) => m.role === 'system');

        const parts = systemMessage.content.split('Context:');
        const contextPart = parts[1] || '';
        expect(contextPart).not.toContain('[Reference Image]:');
    });

    it('should handle OpenAI errors correctly', async () => {
        (auth as jest.Mock).mockResolvedValue({ user: { id: '1' } });
        (openai.embeddings.create as jest.Mock).mockRejectedValue(new Error('OpenAI Error'));

        const req = new NextRequest('http://localhost:3000/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: [{ role: 'user', content: 'Fail' }] }),
        });

        // Supress console.error for this test
        jest.spyOn(console, 'error').mockImplementation(() => { });

        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(500);
        expect(json.error).toBe('OpenAI Error');
    });
});
