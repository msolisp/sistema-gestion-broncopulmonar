
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
}));

jest.mock('@/auth', () => ({
    signIn: jest.fn(),
}));

jest.mock('./logger', () => ({
    logAction: jest.fn(),
}));

describe('authenticate action', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return error if validation fails', async () => {
        const formData = new FormData();
        formData.append('email', 'invalid-email');
        formData.append('password', '123');

        const result = await authenticate(undefined, formData);
        expect(result).toBe('Datos inválidos');
    });

    it('should call signIn with correct credentials', async () => {
        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'password123');

        // Mock prisma user find for redirection logic
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            role: 'PATIENT',
            mustChangePassword: false,
            email: 'test@example.com'
        });

        await authenticate(undefined, formData);

        expect(signIn).toHaveBeenCalledWith('credentials', {
            email: 'test@example.com',
            password: 'password123',
            redirectTo: '/portal'
        });
    });

    it('should handle CredentialsSignin error', async () => {
        const formData = new FormData();
        formData.append('email', 'test@example.com');
        formData.append('password', 'wrong-password');

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            role: 'PATIENT',
            mustChangePassword: false,
            email: 'test@example.com'
        });

        // Mock signIn throwing AuthError
        const error = new AuthError('CredentialsSignin');
        (error as any).type = 'CredentialsSignin';
        (signIn as jest.Mock).mockRejectedValue(error);

        const result = await authenticate(undefined, formData);

        expect(result).toBe('Credenciales inválidas.');
    });

    it('should redirect admin to dashboard', async () => {
        const formData = new FormData();
        formData.append('email', 'admin@example.com');
        formData.append('password', 'admin123');

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            role: 'ADMIN',
            mustChangePassword: false,
            email: 'admin@example.com'
        });

        await authenticate(undefined, formData);

        expect(signIn).toHaveBeenCalledWith('credentials', {
            email: 'admin@example.com',
            password: 'admin123',
            redirectTo: '/dashboard'
        });
    });
});
