
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const key = process.env.OPENAI_API_KEY;

    return NextResponse.json({
        exists: !!key,
        length: key ? key.length : 0,
        prefix: key ? key.substring(0, 7) : 'NONE',
        isDummy: key === 'dummy-key-for-build',
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
}
