import { logAction } from './logger';
import prisma from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: {
        logAccesoSistema: {
            create: jest.fn(),
        }
    }
}));

describe('logger', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => { }); // Silence console.error
    });

    it('logs action successfully', async () => {
        (prisma.logAccesoSistema.create as jest.Mock).mockResolvedValue({});

        await logAction('TEST_ACTION', 'Details', 'user-id', 'user@test.com');

        expect(prisma.logAccesoSistema.create).toHaveBeenCalledWith({
            data: {
                accion: 'TEST_ACTION',
                accionDetalle: 'Details',
                usuarioId: 'user-id',
                recurso: 'SYSTEM',
                recursoId: 'GENERAL',
                ipAddress: '::1'
            }
        });
    });

    it('handles logging error gracefully', async () => {
        (prisma.logAccesoSistema.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

        await expect(logAction('TEST_ACTION', 'Details', 'u1', 'test@test.com')).resolves.not.toThrow();
        expect(console.error).toHaveBeenCalled();
    });
});
