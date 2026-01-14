import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { loggers } from '@/lib/structured-logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HealthCheck {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    version: string;
    checks: {
        database: boolean;
        storage: boolean;
    };
    uptime: number;
}

export async function GET() {
    const startTime = Date.now();
    const checks = {
        database: false,
        storage: true // Asumimos storage saludable por ahora
    };

    // Check Database Connection
    try {
        await prisma.$queryRaw`SELECT 1`;
        checks.database = true;
    } catch (error) {
        console.error('Database health check failed:', error);
        checks.database = false;
    }

    const allHealthy = Object.values(checks).every(check => check === true);
    const status: 'healthy' | 'unhealthy' = allHealthy ? 'healthy' : 'unhealthy';

    // Log health check
    loggers.system.healthCheck(status, checks);

    const response: HealthCheck = {
        status,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        checks,
        uptime: process.uptime()
    };

    const statusCode = allHealthy ? 200 : 503;
    const responseTime = Date.now() - startTime;

    return NextResponse.json(
        {
            ...response,
            responseTime: `${responseTime}ms`
        },
        { status: statusCode }
    );
}
