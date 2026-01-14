import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Readiness probe - indica si la aplicación está lista para recibir tráfico
 * Más estricto que /health - verifica que todos los servicios críticos estén disponibles
 */
export async function GET() {
    try {
        // Verifica conexión a DB con un timeout
        const dbCheck = await Promise.race([
            prisma.$queryRaw`SELECT 1`,
            new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 3000))
        ]);

        return NextResponse.json(
            {
                ready: true,
                timestamp: new Date().toISOString()
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Readiness check failed:', error);
        return NextResponse.json(
            {
                ready: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 503 }
        );
    }
}
