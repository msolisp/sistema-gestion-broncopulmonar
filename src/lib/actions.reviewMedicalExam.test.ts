
import { reviewMedicalExam } from './actions';
import prisma from './prisma';
import { auth } from '@/auth';

// Mocks
jest.mock('./prisma', () => ({
    examenMedico: {
        update: jest.fn(),
    },
}));

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

describe('reviewMedicalExam server action', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return Unauthorized if no session', async () => {
        (auth as jest.Mock).mockResolvedValue(null);
        const result = await reviewMedicalExam('exam-123');
        expect(result).toEqual({ message: 'Unauthorized' });
    });

    it('should return Unauthorized if user is not ADMIN or KINESIOLOGIST', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { email: 'patient@test.com', role: 'PACIENTE' }
        });
        const result = await reviewMedicalExam('exam-123');
        expect(result).toEqual({ message: 'Unauthorized' });
    });

    it('should mark exam as reviewed successfully for KINESIOLOGIST', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { email: 'kine@test.com', role: 'KINESIOLOGO' }
        });
        (prisma.examenMedico.update as jest.Mock).mockResolvedValue({});

        const result = await reviewMedicalExam('exam-123');

        expect(prisma.examenMedico.update).toHaveBeenCalledWith({
            where: { id: 'exam-123' },
            data: { revisado: true }
        });
        expect(result).toEqual({ message: 'Success' });
    });

    it('should handle database errors', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { email: 'admin@test.com', role: 'ADMIN' }
        });
        (prisma.examenMedico.update as jest.Mock).mockRejectedValue(new Error('DB Error'));

        const result = await reviewMedicalExam('exam-123');
        expect(result).toEqual({ message: 'Error marking exam as reviewed' });
    });
});
