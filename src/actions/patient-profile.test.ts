
/**
 * @jest-environment node
 */
import { getPatientProfile } from './patient-profile';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    user: {
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
            user: { id: 'user-1' }
        });

        const mockUser = {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
            patientProfile: {
                id: 'patient-1',
                rut: '12345678-9',
                commune: 'SANTIAGO'
            }
        };

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

        const result = await getPatientProfile();

        expect(result).toEqual({ user: mockUser });
    });

    it('should return error if user not found in DB', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { id: 'user-1' }
        });

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        const result = await getPatientProfile();

        expect(result).toEqual({ error: "Usuario no encontrado" });
    });

    it('should return error if DB fails', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { id: 'user-1' }
        });

        (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

        const result = await getPatientProfile();

        expect(result).toEqual({ error: "Error al cargar perfil" });
    });
});
