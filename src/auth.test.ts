
import { authConfig } from './auth.config';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyMfaToken, verifyBackupCode } from '@/lib/mfa';

// Mocks for dependencies
jest.mock('@/lib/prisma', () => ({
    persona: {
        findUnique: jest.fn(),
    },
    codigoBackup: {
        update: jest.fn(),
    },
    credencial: {
        update: jest.fn(),
    }
}));

jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
}));

jest.mock('@/lib/mfa', () => ({
    verifyMfaToken: jest.fn(),
    verifyBackupCode: jest.fn(),
}));

jest.mock('next-auth', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        handlers: {},
        signIn: jest.fn(),
        signOut: jest.fn(),
        auth: jest.fn(),
    })),
}));

jest.mock('next-auth/providers/credentials', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        id: 'credentials',
        name: 'Credentials'
    })),
}));

import CredentialsProvider from 'next-auth/providers/credentials';
// Import auth.ts to trigger the capturing
import './auth';

// Mock global Response.redirect for Next.js middleware usage in node environment
global.Response.redirect = jest.fn((url: string | URL, status?: number) => {
    return {
        headers: {
            get: (name: string) => name === 'Location' ? url.toString() : null
        }
    } as any;
});

describe('Auth Logic Coverage', () => {
    let capturedAuthorize: any;

    beforeAll(() => {
        // Capture authorize from the mock call
        const mockCredentials = CredentialsProvider as unknown as jest.Mock;
        if (mockCredentials.mock.calls.length > 0) {
            capturedAuthorize = mockCredentials.mock.calls[0][0].authorize;
        }
    });

    describe('authConfig', () => {
        describe('callbacks.authorized', () => {
            const authorized = authConfig.callbacks?.authorized;

            it('should exist', () => {
                expect(authorized).toBeDefined();
            });

            if (!authorized) return;

            it('redirects to login if accessing protected route while logged out', async () => {
                const nextUrl = new URL('http://localhost:3000/dashboard');
                const auth = null;
                const result = await authorized({ auth, request: { nextUrl } } as any);

                // Check for redirect response structure from our mock
                expect(result).toHaveProperty('headers');
                if (result && 'headers' in result) {
                    expect((result as any).headers.get('Location')).toContain('/intranet/login');
                }
            });

            it('allows access to protected route if logged in', async () => {
                const nextUrl = new URL('http://localhost:3000/dashboard');
                const auth = { user: { role: 'ADMIN' } };
                const result = await authorized({ auth, request: { nextUrl } } as any);
                expect(result).toBe(true);
            });

            it('redirects patient trying to access dashboard', async () => {
                const nextUrl = new URL('http://localhost:3000/dashboard');
                const auth = { user: { role: 'PACIENTE' } };
                const result = await authorized({ auth, request: { nextUrl } } as any);

                // Check for redirect response structure from our mock
                expect(result).toHaveProperty('headers');
                if (result && 'headers' in result) {
                    expect((result as any).headers.get('Location')).toContain('/portal');
                }
            });
        });

        describe('callbacks.jwt', () => {
            const jwt = authConfig.callbacks?.jwt;
            it('copies user properties to token', async () => {
                const token = {};
                const user = { id: 'u1', role: 'ADMIN', mustChangePassword: true, usuarioSistemaId: 'us1' };
                const result = await jwt!({ token, user } as any);
                expect(result).toMatchObject({
                    id: 'u1',
                    role: 'ADMIN',
                    mustChangePassword: true,
                    usuarioSistemaId: 'us1'
                });
            });
        });

        describe('callbacks.session', () => {
            const sessionCallback = authConfig.callbacks?.session;
            it('copies token properties to session', async () => {
                const session = { user: {} };
                const token = { id: 'u1', role: 'ADMIN', mustChangePassword: true, usuarioSistemaId: 'us1' };
                const result = await sessionCallback!({ session, token } as any);
                expect(result.user).toMatchObject({
                    id: 'u1',
                    role: 'ADMIN',
                    mustChangePassword: true,
                    usuarioSistemaId: 'us1'
                });
            });
        });
    });

    describe('Credentials authorize', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('throws if email or password missing', async () => {
            await expect(capturedAuthorize({})).rejects.toThrow('Email y contraseña son requeridos');
        });

        it('throws if user not found', async () => {
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue(null);
            await expect(capturedAuthorize({ email: 'test@test.com', password: '123' }))
                .rejects.toThrow('Credenciales inválidas');
        });

        it('throws if password mismatch', async () => {
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({
                credencial: { passwordHash: 'hashed' }
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(capturedAuthorize({ email: 'test@test.com', password: '123' }))
                .rejects.toThrow('Credenciales inválidas');
        });

        it('throws if MFA required but code missing', async () => {
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({
                credencial: { passwordHash: 'hashed', mfaHabilitado: true }
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await expect(capturedAuthorize({ email: 'test@test.com', password: '123' }))
                .rejects.toThrow('MFA_REQUIRED');
        });

        it('validates MFA TOTP', async () => {
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({
                id: 'p1',
                nombre: 'Test',
                apellidoPaterno: 'User',
                credencial: {
                    id: 'c1',
                    passwordHash: 'hashed',
                    mfaHabilitado: true,
                    mfaSecret: 'secret',
                    codigosBackup: []
                },
                usuarioSistema: {
                    id: 'us1',
                    rol_rel: { nombre: 'ADMIN' }
                }
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (verifyMfaToken as jest.Mock).mockReturnValue(true); // Valid Code

            const result = await capturedAuthorize({ email: 'test@test.com', password: '123', mfaCode: '123456' });

            expect(result).toHaveProperty('id', 'p1');
            expect(result).toHaveProperty('role', 'ADMIN');
            expect(prisma.credencial.update).toHaveBeenCalled();
        });

        it('validates MFA Backup Code', async () => {
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({
                id: 'p1',
                nombre: 'Test',
                apellidoPaterno: 'User',
                credencial: {
                    id: 'c1',
                    passwordHash: 'hashed',
                    mfaHabilitado: true,
                    mfaSecret: 'secret',
                    codigosBackup: [{ id: 'bk1', codigo: 'backup-hash', usado: false }]
                },
                usuarioSistema: {
                    id: 'us1',
                    rol_rel: { nombre: 'ADMIN' }
                }
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (verifyMfaToken as jest.Mock).mockReturnValue(false); // Invalid TOTP
            (verifyBackupCode as jest.Mock).mockResolvedValue(true); // Valid Backup

            const result = await capturedAuthorize({ email: 'test@test.com', password: '123', mfaCode: 'backup-code' });

            expect(result).toHaveProperty('id', 'p1');
            expect(prisma.codigoBackup.update).toHaveBeenCalledWith({ where: { id: 'bk1' }, data: expect.any(Object) });
        });

        it('returns patient role if no usuarioSistema', async () => {
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({
                id: 'p1',
                nombre: 'Test',
                apellidoPaterno: 'Patient',
                credencial: {
                    id: 'c1',
                    passwordHash: 'hashed',
                    mfaHabilitado: false
                }
                // No usuarioSistema
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const result = await capturedAuthorize({ email: 'patient@test.com', password: '123' });

            expect(result).toHaveProperty('role', 'PACIENTE');
        });
    });
});
