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
export function getClientIp(): string {
    const headersList = headers();

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
export function getUserAgent(): string | null {
    const headersList = headers();
    return headersList.get('user-agent');
}

/**
 * Log an action with enhanced audit information
 * @param options - Log options including user ID, action, resource, etc.
 * @returns Promise resolving to the created log entry
 */
export async function logAction(options: LogActionOptions) {
    const {
        usuarioSistemaId,
        accion,
        recurso,
        detalle,
        resultado = 'SUCCESS',
        sessionId
    } = options;

    const ipAddress = getClientIp();
    const userAgent = getUserAgent();

    try {
        const log = await prisma.logAccesoSistema.create({
            data: {
                usuarioSistemaId,
                accion,
                ipAddress,
                userAgent,
                recursoAccedido: recurso,
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
