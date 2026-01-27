/**
 * Enhanced Logging Utilities for MINSAL Compliance
 * Provides comprehensive audit trail with IP tracking, user-agent, and action details
 */

import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export type LogResultado = 'SUCCESS' | 'DENIED' | 'ERROR';

export interface LogActionOptions {
    usuarioSistemaId: string;
    accion: string;
    recurso?: string;
    detalle?: Record<string, any>;
    resultado?: LogResultado;
    sessionId?: string;
}

/**
 * Extract client IP address from request headers
 * Supports various proxy headers (Vercel, Cloudflare, standard)
 */
export async function getClientIp(): Promise<string> {
    const headersList = await headers();

    // Try various headers in order of preference
    const forwardedFor = headersList.get('x-forwarded-for');
    if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwardedFor.split(',')[0].trim();
    }

    const realIp = headersList.get('x-real-ip');
    if (realIp) {
        return realIp.trim();
    }

    const cfConnectingIp = headersList.get('cf-connecting-ip'); // Cloudflare
    if (cfConnectingIp) {
        return cfConnectingIp.trim();
    }

    // Fallback
    return 'unknown';
}

/**
 * Extract user agent from request headers
 */
export async function getUserAgent(): Promise<string | null> {
    const headersList = await headers();
    return headersList.get('user-agent');
}

/**
 * Log an action with enhanced audit information
 * Supports both new object-based options and legacy positional arguments
 */
export async function logAction(options: LogActionOptions): Promise<any>;
export async function logAction(
    accion: string,
    detalle?: string | Record<string, any> | null,
    usuarioSistemaId?: string | null,
    userEmail?: string | null,
    ipAddress?: string | null,
    recurso?: string | null
): Promise<any>;
export async function logAction(
    arg1: LogActionOptions | string,
    arg2?: string | Record<string, any> | null,
    arg3?: string | null,
    arg4?: string | null,
    arg5?: string | null,
    arg6?: string | null
) {
    let options: LogActionOptions;

    if (typeof arg1 === 'string') {
        // Legacy positional arguments
        options = {
            accion: arg1,
            detalle: typeof arg2 === 'string' ? { message: arg2 } : (arg2 || undefined) as Record<string, any>,
            usuarioSistemaId: arg3 || '',
            recurso: arg6 || 'SYSTEM',
        };

        // Resolve user ID from email if ID is missing but email is present
        if (!options.usuarioSistemaId && arg4) {
            try {
                const staff = await prisma.usuarioSistema.findFirst({
                    where: { persona: { email: arg4 } },
                    select: { id: true }
                });
                if (staff) options.usuarioSistemaId = staff.id;
            } catch (e) {
                console.error('Failed to resolve system user by email:', e);
            }
        }

        // Use provided IP if any
        if (arg5) {
            // We'll need to manually handle this in the main implementation below
        }
    } else {
        options = arg1;
    }

    const {
        usuarioSistemaId,
        accion,
        recurso,
        detalle,
        resultado = 'SUCCESS',
        sessionId
    } = options;

    const ipAddress = (typeof arg1 === 'string' && arg5) ? arg5 : await getClientIp();
    const userAgent = await getUserAgent();

    // If still no usuarioSistemaId, we might be in a public action (like failed login)
    // In that case, we might need a special system user or allow null if the schema allows it
    // But based on schema, it seems it might be required.

    try {
        const log = await prisma.logAccesoSistema.create({
            data: {
                usuarioSistemaId: usuarioSistemaId || undefined, // Prisma will handle optional/required
                accion,
                ipAddress,
                userAgent,
                recursoAccedido: recurso || 'SYSTEM',
                accionDetalle: detalle ? JSON.stringify(detalle) : null,
                resultado,
                sessionId,
            }
        });

        return log;
    } catch (error) {
        // Log to console but don't throw - logging failure shouldn't break the app
        console.error('Failed to create audit log:', error);
        return null;
    }
}

/**
 * Log with timing - wrap an async operation and log its duration
 * @param options - Log options
 * @param operation - Async operation to execute and time
 * @returns Result of the operation
 */
export async function logActionWithTiming<T>(
    options: LogActionOptions,
    operation: () => Promise<T>
): Promise<T> {
    const startTime = Date.now();
    let resultado: LogResultado = 'SUCCESS';
    let error: any = null;

    try {
        const result = await operation();
        return result;
    } catch (err) {
        error = err;
        resultado = 'ERROR';
        throw err;
    } finally {
        const duracionMs = Date.now() - startTime;

        await logAction({
            ...options,
            resultado,
            detalle: {
                ...options.detalle,
                duracionMs,
                ...(error && { error: error.message })
            }
        });
    }
}

/**
 * Predefined action constants for consistency
 */
export const LogActions = {
    // Authentication
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    LOGIN_FAILED: 'LOGIN_FAILED',

    // Patient Management
    CREATE_PATIENT: 'CREATE_PATIENT',
    UPDATE_PATIENT: 'UPDATE_PATIENT',
    DELETE_PATIENT: 'DELETE_PATIENT',
    VIEW_PATIENT: 'VIEW_PATIENT',

    // Clinical Data
    CREATE_APPOINTMENT: 'CREATE_APPOINTMENT',
    UPDATE_APPOINTMENT: 'UPDATE_APPOINTMENT',
    CANCEL_APPOINTMENT: 'CANCEL_APPOINTMENT',
    UPLOAD_EXAM: 'UPLOAD_EXAM',
    DOWNLOAD_EXAM: 'DOWNLOAD_EXAM',
    VIEW_EXAM: 'VIEW_EXAM',

    // User Management
    CREATE_USER: 'CREATE_USER',
    UPDATE_USER: 'UPDATE_USER',
    DELETE_USER: 'DELETE_USER',
    CHANGE_PASSWORD: 'CHANGE_PASSWORD',
    UPDATE_PERMISSIONS: 'UPDATE_PERMISSIONS',

    // System
    EXPORT_DATA: 'EXPORT_DATA',
    IMPORT_DATA: 'IMPORT_DATA',
    BACKUP: 'BACKUP',
    RESTORE: 'RESTORE',
} as const;

/**
 * Helper to create resource identifiers
 */
export function createResourceId(type: string, id: string): string {
    return `${type}:${id}`;
}

/**
 * Parse resource identifier
 */
export function parseResourceId(resourceId: string): { type: string; id: string } | null {
    const parts = resourceId.split(':');
    if (parts.length !== 2) return null;

    return {
        type: parts[0],
        id: parts[1]
    };
}
