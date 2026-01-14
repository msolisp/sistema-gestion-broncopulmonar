import { logAction } from './logger';
import prisma from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    systemLog: {
        create: jest.fn(),
    },
}));

describe('logger', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => { }); // Silence console.error
    });

    it('logs action successfully', async () => {
        (prisma.systemLog.create as jest.Mock).mockResolvedValue({});

        await logAction('TEST_ACTION', 'Details', 'user-id', 'user@test.com');

        expect(prisma.systemLog.create).toHaveBeenCalledWith({
            data: {
                action: 'TEST_ACTION',
                details: 'Details',
                userId: 'user-id',
                userEmail: 'user@test.com',
                ipAddress: null
            }
        });
    });

    it('handles logging error gracefully', async () => {
        (prisma.systemLog.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

        await expect(logAction('TEST_ACTION')).resolves.not.toThrow();
        expect(console.error).toHaveBeenCalled();
    });
});
