'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Retrieves a system configuration value by key.
 * Returns null if not found.
 */
export async function getSystemConfig(key: string): Promise<string | null> {
    try {
        const config = await prisma.configuracion.findUnique({
            where: { key }
        });
        return config?.value || null;
    } catch (error) {
        console.error(`Error fetching config ${key}:`, error);
        return null;
    }
}

/**
 * Updates a system configuration value.
 */
export async function updateSystemConfig(key: string, value: string) {
    try {
        await prisma.configuracion.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
        try {
            revalidatePath('/dashboard');
        } catch (e) {
            console.error('Error revalidating path:', e);
        }
        return { success: true };
    } catch (error) {
        console.error(`Error updating config ${key}:`, error);
        return { success: false, message: `Error: ${(error as Error).message}` };
    }
}
