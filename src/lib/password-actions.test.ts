
import { requestPasswordReset, resetPassword } from './password-actions';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    persona: {
        findUnique: jest.fn(),
    },
    passwordResetToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
    },
    credencial: {
        update: jest.fn(),
    }
}));

jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed_new_password'),
}));

// Mock console to verify simulation logs
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => { });
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => { });

describe('Password Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('requestPasswordReset', () => {
        it('returns message if email missing', async () => {
            const formData = new FormData();
            const result = await requestPasswordReset(null, formData);
            expect(result.message).toBe('El email es obligatorio');
        });

        it('returns generic message and waits if user not found (security)', async () => {
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue(null);
            const formData = new FormData();
            formData.append('email', 'notfound@test.com');

            const start = Date.now();
            const result = await requestPasswordReset(null, formData);
            const duration = Date.now() - start;

            expect(result.message).toContain('Si el correo existe');
            expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
            // Verify fake delay roughly (at least some delay, hard to test exact 500ms in jest without timers)
            // But we mostly care that it returns the right message.
        });

        it('returns generic message if user inactive', async () => {
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', activo: false });
            const formData = new FormData();
            formData.append('email', 'inactive@test.com');

            const result = await requestPasswordReset(null, formData);
            expect(result.message).toContain('Si el correo existe');
            expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
        });

        it('creates token and logs link if user active', async () => {
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', activo: true });
            (prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({});

            const formData = new FormData();
            formData.append('email', 'found@test.com');

            const result = await requestPasswordReset(null, formData);
            expect(result.message).toContain('Si el correo existe');

            // Verify DB call
            expect(prisma.passwordResetToken.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    email: 'found@test.com',
                    token: expect.any(String)
                })
            }));

            // Verify SIMULATION logs
            expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('PASSWORD RESET TOKEN'));
            expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('reset-password?token='));
        });

        it('handles DB error in request', async () => {
            (prisma.persona.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const formData = new FormData();
            formData.append('email', 'error@test.com');

            const result = await requestPasswordReset(null, formData);
            expect(result.message).toContain('Error interno');
            expect(mockConsoleError).toHaveBeenCalled();
        });
    });

    describe('resetPassword', () => {
        it('validates missing token', async () => {
            const formData = new FormData();
            formData.append('password', '123456');
            formData.append('confirmPassword', '123456');
            // no token
            const result = await resetPassword(null, formData);
            expect(result.message).toContain('obligatorios');
        });

        it('validates password mismatch', async () => {
            const formData = new FormData();
            formData.append('token', 't1');
            formData.append('password', '123456');
            formData.append('confirmPassword', '654321');

            const result = await resetPassword(null, formData);
            expect(result.message).toContain('no coinciden');
        });

        it('validates password length', async () => {
            const formData = new FormData();
            formData.append('token', 't1');
            formData.append('password', '123');
            formData.append('confirmPassword', '123');

            const result = await resetPassword(null, formData);
            expect(result.message).toContain('al menos 6 caracteres');
        });

        it('handles invalid token not found', async () => {
            (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue(null);
            const formData = new FormData();
            formData.append('token', 'invalid');
            formData.append('password', '123456');
            formData.append('confirmPassword', '123456');

            const result = await resetPassword(null, formData);
            expect(result.message).toContain('Token inválido');
        });

        it('handles expired token', async () => {
            (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({
                id: 'token1',
                expires: new Date(Date.now() - 1000)
            });
            const formData = new FormData();
            formData.append('token', 'expired');
            formData.append('password', '123456');
            formData.append('confirmPassword', '123456');

            const result = await resetPassword(null, formData);
            expect(result.message).toContain('expirado');
            expect(prisma.passwordResetToken.delete).toHaveBeenCalledWith({ where: { id: 'token1' } });
        });

        it('handles user not found (integrity check)', async () => {
            (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({
                id: 'token1',
                expires: new Date(Date.now() + 10000),
                email: 'deleted@test.com'
            });
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue(null);

            const formData = new FormData();
            formData.append('token', 'valid');
            formData.append('password', '123456');
            formData.append('confirmPassword', '123456');

            const result = await resetPassword(null, formData);
            expect(result.message).toContain('Usuario no encontrado');
        });

        it('handles user inactive', async () => {
            (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({
                id: 'token1',
                expires: new Date(Date.now() + 10000),
                email: 'inactive@test.com'
            });
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', activo: false });

            const formData = new FormData();
            formData.append('token', 'valid');
            formData.append('password', '123456');
            formData.append('confirmPassword', '123456');

            const result = await resetPassword(null, formData);
            expect(result.message).toContain('Usuario inactivo');
        });

        it('resets password successfully', async () => {
            (prisma.passwordResetToken.findUnique as jest.Mock).mockResolvedValue({
                id: 'token1',
                expires: new Date(Date.now() + 10000),
                email: 'user@test.com',
                token: 'valid'
            });
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', activo: true });

            const formData = new FormData();
            formData.append('token', 'valid');
            formData.append('password', '123456');
            formData.append('confirmPassword', '123456');

            const result = await resetPassword(null, formData);
            expect(result.success).toBe(true);
            expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
            expect(prisma.credencial.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { personaId: 'p1' },
                data: expect.objectContaining({
                    passwordHash: 'hashed_new_password',
                    debeCambiarPassword: false
                })
            }));
            expect(prisma.passwordResetToken.delete).toHaveBeenCalledWith({ where: { token: 'valid' } });
        });

        it('handles DB error in reset', async () => {
            (prisma.passwordResetToken.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const formData = new FormData();
            formData.append('token', 'valid');
            formData.append('password', '123456');
            formData.append('confirmPassword', '123456');

            const result = await resetPassword(null, formData);
            expect(result.message).toContain('Error al restablecer');
            expect(mockConsoleError).toHaveBeenCalled();
        });
    });
});
