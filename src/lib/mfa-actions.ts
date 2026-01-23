'use server'

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { generateMfaSecret, verifyMfaToken, generateBackupCodes, verifyBackupCode } from './mfa';

/**
 * Enable MFA for the current user
 * Step 1: Generate secret and return QR code data
 */
export async function initiateMfaSetup() {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'No autenticado' };
    }

    try {
        // Get user's credencial
        const credencial = await prisma.credencial.findFirst({
            where: { personaId: session.user.id }
        });

        if (!credencial) {
            return { error: 'Credenciales no encontradas' };
        }

        // Check if MFA already enabled
        if (credencial.mfaHabilitado) {
            return { error: 'MFA ya está habilitado. Deshabilítalo primero si quieres reconfigurarlo.' };
        }

        // Generate secret
        const email = session.user.email || 'user@sistema.cl';
        const secret = generateMfaSecret(email);

        // Store secret temporarily (not yet enabled)
        await prisma.credencial.update({
            where: { id: credencial.id },
            data: { mfaSecret: secret.base32 }
        });

        return {
            success: true,
            secret: secret.base32,
            otpauthUrl: secret.otpauth_url
        };
    } catch (error) {
        console.error('Error initiating MFA setup:', error);
        return { error: 'Error al iniciar configuración MFA' };
    }
}

/**
 * Verify setup and enable MFA
 * Step 2: User scans QR and provides first token to verify
 */
export async function completeMfaSetup(token: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'No autenticado' };
    }

    try {
        const credencial = await prisma.credencial.findFirst({
            where: { personaId: session.user.id }
        });

        if (!credencial || !credencial.mfaSecret) {
            return { error: 'No hay configuración MFA pendiente' };
        }

        // Verify the token
        const isValid = verifyMfaToken(token, credencial.mfaSecret);

        if (!isValid) {
            return { error: 'Código inválido. Verifica e intenta de nuevo.' };
        }

        // Generate backup codes
        const backupCodes = await generateBackupCodes(10);

        // Save backup codes to database
        await prisma.codigoBackup.createMany({
            data: backupCodes.map(code => ({
                credencialId: credencial.id,
                codigo: code.hashed
            }))
        });

        // Enable MFA
        await prisma.credencial.update({
            where: { id: credencial.id },
            data: { mfaHabilitado: true }
        });

        revalidatePath('/admin/security');
        revalidatePath('/portal/security');

        return {
            success: true,
            backupCodes: backupCodes.map(c => c.plain) // Return plain codes ONCE
        };
    } catch (error) {
        console.error('Error completing MFA setup:', error);
        return { error: 'Error al completar configuración MFA' };
    }
}

/**
 * Disable MFA for current user
 * Requires password confirmation
 */
export async function disableMfa(password: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'No autenticado' };
    }

    try {
        const credencial = await prisma.credencial.findFirst({
            where: { personaId: session.user.id }
        });

        if (!credencial) {
            return { error: 'Credenciales no encontradas' };
        }

        // Verify password (important security check)
        const bcrypt = await import('bcryptjs');
        const passwordMatch = await bcrypt.compare(password, credencial.passwordHash);

        if (!passwordMatch) {
            return { error: 'Contraseña incorrecta' };
        }

        // Delete backup codes
        await prisma.codigoBackup.deleteMany({
            where: { credencialId: credencial.id }
        });

        // Disable MFA
        await prisma.credencial.update({
            where: { id: credencial.id },
            data: {
                mfaHabilitado: false,
                mfaSecret: null
            }
        });

        revalidatePath('/admin/security');
        revalidatePath('/portal/security');

        return { success: true };
    } catch (error) {
        console.error('Error disabling MFA:', error);
        return { error: 'Error al deshabilitar MFA' };
    }
}

/**
 * Get MFA status for current user
 */
export async function getMfaStatus() {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'No autenticado' };
    }

    try {
        const credencial = await prisma.credencial.findFirst({
            where: { personaId: session.user.id },
            include: {
                codigosBackup: {
                    select: {
                        usado: true
                    }
                }
            }
        });

        if (!credencial) {
            return { error: 'Credenciales no encontradas' };
        }

        const totalBackupCodes = credencial.codigosBackup.length;
        const usedBackupCodes = credencial.codigosBackup.filter(c => c.usado).length;

        return {
            success: true,
            mfaEnabled: credencial.mfaHabilitado,
            backupCodesRemaining: totalBackupCodes - usedBackupCodes,
            totalBackupCodes
        };
    } catch (error) {
        console.error('Error getting MFA status:', error);
        return { error: 'Error al obtener estado MFA' };
    }
}

/**
 * Regenerate backup codes
 * Deletes old codes and creates new ones
 */
export async function regenerateBackupCodes(password: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'No autenticado' };
    }

    try {
        const credencial = await prisma.credencial.findFirst({
            where: { personaId: session.user.id }
        });

        if (!credencial) {
            return { error: 'Credenciales no encontradas' };
        }

        if (!credencial.mfaHabilitado) {
            return { error: 'MFA no está habilitado' };
        }

        // Verify password
        const bcrypt = await import('bcryptjs');
        const passwordMatch = await bcrypt.compare(password, credencial.passwordHash);

        if (!passwordMatch) {
            return { error: 'Contraseña incorrecta' };
        }

        // Delete old backup codes
        await prisma.codigoBackup.deleteMany({
            where: { credencialId: credencial.id }
        });

        // Generate new backup codes
        const backupCodes = await generateBackupCodes(10);

        await prisma.codigoBackup.createMany({
            data: backupCodes.map(code => ({
                credencialId: credencial.id,
                codigo: code.hashed
            }))
        });

        revalidatePath('/admin/security');
        revalidatePath('/portal/security');

        return {
            success: true,
            backupCodes: backupCodes.map(c => c.plain)
        };
    } catch (error) {
        console.error('Error regenerating backup codes:', error);
        return { error: 'Error al regenerar códigos de respaldo' };
    }
}
