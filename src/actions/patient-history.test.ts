
/**
 * @jest-environment node
 */
import { getPatientHistory } from './patient-history';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    persona: {
        findUnique: jest.fn(),
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
            user: { email: 'test@test.com' }
        });

        const mockTests = [
            { id: 1, fecha: new Date(), cvfPercent: 80 }
        ];

        (prisma.persona.findUnique as jest.Mock).mockResolvedValue({
            id: 'p1',
            fichaClinica: {
                pruebasFuncion: mockTests
            }
        });

        const result = await getPatientHistory();

        expect(result).toHaveProperty('tests');
        const expectedTests = mockTests.map(t => ({
            id: t.id,
            date: t.fecha,
            cvfPercent: t.cvfPercent
        }));
        expect(result.tests).toMatchObject(expectedTests);
    });

    it('should handle errors gracefully', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { email: 'test@test.com' }
        });

        (prisma.persona.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

        const result = await getPatientHistory();

        expect(result).toEqual({ error: "Error al cargar historial" });
    });
});
