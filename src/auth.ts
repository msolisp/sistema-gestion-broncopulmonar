import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyMfaToken, verifyBackupCode } from '@/lib/mfa';

/**
 * Custom authorize function with MFA support
 * 
 * Flow:
 * 1. User enters email + password
 * 2. If credentials valid and MFA enabled → redirect to MFA verification page
 * 3. User enters TOTP code or backup code
 * 4. If MFA code valid → grant access
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const { email, password, mfaCode } = credentials as {
                    email: string;
                    password: string;
                    mfaCode?: string;
                };

                if (!email || !password) {
                    throw new Error('Email y contraseña son requeridos');
                }

                // Try FHIR models first (Persona + Credencial)
                const persona = await prisma.persona.findUnique({
                    where: { email },
                    include: {
                        credencial: {
                            include: {
                                codigosBackup: true
                            }
                        },
                        usuarioSistema: {
                            include: { rol_rel: true }
                        },
                        fichaClinica: true,
                    },
                });

                if (persona && persona.credencial) {
                    const passwordMatch = await bcrypt.compare(
                        password,
                        persona.credencial.passwordHash
                    );

                    if (!passwordMatch) {
                        throw new Error('Credenciales inválidas');
                    }

                    // Check if MFA is enabled
                    if (persona.credencial.mfaHabilitado) {
                        // MFA is enabled - require MFA code
                        if (!mfaCode) {
                            // First step: password validated, need MFA code
                            // Return special signal to redirect to MFA page
                            throw new Error('MFA_REQUIRED');
                        }

                        // Verify MFA code
                        let mfaValid = false;

                        // Try TOTP first
                        if (persona.credencial.mfaSecret) {
                            mfaValid = verifyMfaToken(mfaCode, persona.credencial.mfaSecret);
                        }

                        // If TOTP failed, try backup codes
                        if (!mfaValid && persona.credencial.codigosBackup.length > 0) {
                            for (const backupCode of persona.credencial.codigosBackup) {
                                if (!backupCode.usado) {
                                    const isValid = await verifyBackupCode(mfaCode, backupCode.codigo);
                                    if (isValid) {
                                        // Mark backup code as used
                                        await prisma.codigoBackup.update({
                                            where: { id: backupCode.id },
                                            data: {
                                                usado: true,
                                                usadoEn: new Date()
                                            }
                                        });
                                        mfaValid = true;
                                        break;
                                    }
                                }
                            }
                        }

                        if (!mfaValid) {
                            throw new Error('Código MFA inválido');
                        }
                    }

                    // Update last access
                    await prisma.credencial.update({
                        where: { id: persona.credencial.id },
                        data: {
                            ultimoAcceso: new Date(),
                            intentosFallidos: 0,
                        },
                    });

                    // Determine role (staff or patient)
                    let role = 'PACIENTE';
                    if (persona.usuarioSistema) {
                        role = (persona.usuarioSistema as any).rol_rel.nombre;
                    }

                    return {
                        id: persona.id,
                        email: persona.email || undefined,
                        name: `${persona.nombre} ${persona.apellidoPaterno}`,
                        role: role,
                        usuarioSistemaId: persona.usuarioSistema?.id,
                        mustChangePassword: persona.credencial.debeCambiarPassword
                    };
                }

                // Legacy User table fallback removed.

                throw new Error('Credenciales inválidas');
            },
        }),
    ],
});
