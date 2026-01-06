
/**
 * @jest-environment node
 */
import { getPatientHistory } from './patient-history';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    patient: {
        findUnique: jest.fn(),
        create: jest.fn(),
    },
    pulmonaryFunctionTest: {
        findMany: jest.fn(),
    }
}));

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}));

describe('getPatientHistory', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return unauthorized error if not logged in', async () => {
        (auth as jest.Mock).mockResolvedValue(null);

        const result = await getPatientHistory();

        expect(result).toEqual({ error: "No autorizado" });
    });

    it('should return history for existing patient', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { id: 'user-1' }
        });

        (prisma.patient.findUnique as jest.Mock).mockResolvedValue({
            id: 'patient-1'
        });

        const mockTests = [
            { id: 1, date: new Date(), cvfPercent: 80 }
        ];
        (prisma.pulmonaryFunctionTest.findMany as jest.Mock).mockResolvedValue(mockTests);

        const result = await getPatientHistory();

        expect(result).toHaveProperty('tests');
        expect(result.tests).toEqual(mockTests);
    });

    // Auto-recover test removed as feature was deprecated due to schema changes
    // it('should auto-recover if patient not found', async () => ...

    it('should handle errors gracefully', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { id: 'user-1' }
        });

        (prisma.patient.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

        const result = await getPatientHistory();

        expect(result).toEqual({ error: "Error al cargar historial" });
    });
});
