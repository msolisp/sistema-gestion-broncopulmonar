
/**
 * @jest-environment node
 */
import { getPatientProfile } from './patient-profile';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    patient: {
        findUnique: jest.fn(),
    },
}));

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}));

describe('getPatientProfile', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return unauthorized error if not logged in', async () => {
        (auth as jest.Mock).mockResolvedValue(null);

        const result = await getPatientProfile();

        expect(result).toEqual({ error: "No autorizado" });
    });

    it('should return user and patient profile', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { id: 'patient-1', email: 'test@example.com' }
        });

        const mockPatient = {
            id: 'patient-1',
            name: 'Test Patient',
            email: 'test@example.com',
            rut: '12345678-9',
            commune: 'SANTIAGO'
        };

        (prisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient);

        const result = await getPatientProfile();

        expect(result).toEqual({ user: mockPatient });
    });

    it('should return error if user not found in DB', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { id: 'patient-1', email: 'test@example.com' }
        });

        (prisma.patient.findUnique as jest.Mock).mockResolvedValue(null);

        const result = await getPatientProfile();

        expect(result).toEqual({ error: "Perfil no encontrado" });
    });

    it('should return error if DB fails', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { id: 'user-1', email: 'test@example.com' }
        });

        (prisma.patient.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

        const result = await getPatientProfile();

        expect(result).toEqual({ error: "Error al cargar perfil" });
    });
});
