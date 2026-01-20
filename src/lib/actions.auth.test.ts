
/**
 * @jest-environment node
 */
import { authenticate } from './actions';
import prisma from '@/lib/prisma';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    user: {
        findUnique: jest.fn(),
    },
    patient: {
        findUnique: jest.fn(),
    }
}));

jest.mock('@/auth', () => ({
    signIn: jest.fn(),
}));

jest.mock('./logger', () => ({
    logAction: jest.fn(),
}));

jest.mock('next/headers', () => ({
    headers: jest.fn().mockResolvedValue({
        get: jest.fn().mockReturnValue('127.0.0.1'),
    }),
}));

describe('authenticate action', () => {
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
        (prisma.patient.findUnique as jest.Mock).mockResolvedValue({
            active: true,
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
        (prisma.patient.findUnique as jest.Mock).mockResolvedValue({
            active: true,
            email: 'test@example.com'
        });

        await authenticate(undefined, formData);

        expect(signIn).toHaveBeenCalledWith('credentials', {
            email: 'test@example.com',
            password: 'password123',
            redirectTo: '/portal'
        });
    });

    // Correction: In actions.ts, we probably append portal_type or pass it.
    // Let's verify what we pass to signIn.
    // However, I will update this assuming we need `portal_type` for admin.

    it('should redirect admin to dashboard', async () => {
        const formData = new FormData();
        formData.append('email', 'admin@example.com');
        formData.append('password', 'admin123');
        formData.append('portal_type', 'internal');

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            role: 'ADMIN',
            mustChangePassword: false,
            active: true,
            email: 'admin@example.com'
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
        // No portal_type -> Patient

        (prisma.patient.findUnique as jest.Mock).mockResolvedValue({
            active: true,
            email: 'test@example.com'
        });

        // Mock signIn throwing AuthError
        const error = new AuthError('CredentialsSignin');
        (error as any).type = 'CredentialsSignin';
        (signIn as jest.Mock).mockRejectedValue(error);

        const result = await authenticate(undefined, formData);

        expect(result).toBe('Credenciales inválidas.');
    });
});
