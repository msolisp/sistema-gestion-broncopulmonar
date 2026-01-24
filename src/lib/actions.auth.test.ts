
/**
 * @jest-environment node
 */
import { authenticate, logout, changePassword } from './actions.auth';
import prisma from '@/lib/prisma';
import { signIn, signOut, auth } from '@/auth';
import { AuthError } from 'next-auth';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    user: {
        findUnique: jest.fn(),
    },
    persona: {
        findUnique: jest.fn(),
    },
    credencial: {
        update: jest.fn(),
    },
    usuarioSistema: {
        findFirst: jest.fn()
    },
    logAccesoSistema: {
        create: jest.fn()
    }
}));

jest.mock('@/auth', () => ({
    signIn: jest.fn(),
    signOut: jest.fn(),
    auth: jest.fn(),
}));

jest.mock('next-auth', () => ({
    AuthError: class extends Error {
        type: string;
        constructor(type: string) {
            super(type);
            this.type = type;
        }
    }
}));

jest.mock('./logger', () => ({
    logAction: jest.fn(),
}));

jest.mock('./structured-logger', () => ({
    loggers: {
        auth: {
            loginSuccess: jest.fn(),
            loginFailed: jest.fn(),
        },
        error: {
            api: jest.fn(),
        }
    }
}));

jest.mock('next/headers', () => ({
    headers: jest.fn().mockResolvedValue({
        get: jest.fn().mockReturnValue('127.0.0.1'),
    }),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}));

describe('Auth Actions', () => {

    describe('authenticate', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            global.fetch = jest.fn();
        });

        it('should validate Turnstile token if present', async () => {
            const formData = new FormData();
            formData.append('email', 'test@example.com');
            formData.append('password', 'password123');
            formData.append('cf-turnstile-response', 'valid-token');

            process.env.TURNSTILE_SECRET_KEY = 'secret';

            // Mock Fetch Success
            (global.fetch as jest.Mock).mockResolvedValue({
                json: jest.fn().mockResolvedValue({ success: true })
            });

            // Mock patient find
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({
                activo: true,
                email: 'test@example.com'
            });

            await authenticate(undefined, formData);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('siteverify'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        it('should return error if validation fails', async () => {
            const formData = new FormData();
            formData.append('email', 'invalid-email');
            formData.append('password', '123');

            const result = await authenticate(undefined, formData);
            expect(result).toBe('Datos inválidos');
        });

        it('should call signIn with correct credentials for patient', async () => {
            const formData = new FormData();
            formData.append('email', 'test@example.com');
            formData.append('password', 'password123');
            // No portal_type -> Patient

            // Mock patient find
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({
                activo: true,
                email: 'test@example.com'
            });

            await authenticate(undefined, formData);

            expect(signIn).toHaveBeenCalledWith('credentials', {
                email: 'test@example.com',
                password: 'password123',
                redirectTo: '/portal'
            });
        });

        it('should redirect admin to dashboard', async () => {
            const formData = new FormData();
            formData.append('email', 'admin@example.com');
            formData.append('password', 'admin123');
            formData.append('portal_type', 'internal');

            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({
                activo: true,
                email: 'admin@example.com',
                usuarioSistema: { rol: 'ADMIN', activo: true },
                credencial: { debeCambiarPassword: false }
            });

            await authenticate(undefined, formData);

            expect(signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
                email: 'admin@example.com',
                password: 'admin123',
                redirectTo: '/dashboard'
            }));
        });

        it('should handle CredentialsSignin error', async () => {
            const formData = new FormData();
            formData.append('email', 'test@example.com');
            formData.append('password', 'wrong-password');

            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({
                activo: true,
                email: 'test@example.com'
            });

            // Mock signIn throwing AuthError
            const error = new AuthError('CredentialsSignin');
            (error as any).type = 'CredentialsSignin';
            (signIn as jest.Mock).mockRejectedValue(error);

            const result = await authenticate(undefined, formData);

            expect(result).toBe('Credenciales inválidas.');
        });
    })

    describe('logout', () => {
        it('calls signOut', async () => {
            await logout();
            expect(signOut).toHaveBeenCalledWith({ redirectTo: '/login' });
        });
    });

    describe('changePassword', () => {
        it('returns unauthorized if not logged in', async () => {
            (auth as jest.Mock).mockResolvedValue(null)
            const formData = new FormData()
            const result = await changePassword(formData)
            expect(result).toEqual({ message: 'Unauthorized' }) // Updated to English
        })

        it('returns error if password too short', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'test@test.com' } })
            const formData = new FormData()
            formData.append('newPassword', '123')
            const result = await changePassword(formData)
            expect(result.message).toContain('debe tener al menos 6 caracteres')
        });

        it('changes password successfully', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'test@test.com' } })

            const formData = new FormData()
            formData.append('newPassword', 'NewPassword123')

            await changePassword(formData)

            expect(prisma.credencial.update).toHaveBeenCalled()
            // Should verify that it redirects or calls signOut
            expect(signOut).toHaveBeenCalled()
        })
    });
});
