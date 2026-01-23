
/**
 * @jest-environment node
 */
import { getPatientProfile } from './patient-profile';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    persona: {
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

        const mockPersona = {
            id: 'patient-1',
            nombre: 'Test',
            apellidoPaterno: 'Patient',
            apellidoMaterno: '',
            email: 'test@example.com',
            rut: '12345678-9',
            comuna: 'SANTIAGO',
            direccion: 'Calle Falsa 123',
            region: 'METROPOLITANA'
        };

        const expectedUser = {
            id: 'patient-1',
            name: 'Test Patient',
            email: 'test@example.com',
            rut: '12345678-9',
            commune: 'SANTIAGO',
            address: 'Calle Falsa 123',
            region: 'METROPOLITANA'
        };

        (prisma.persona.findUnique as jest.Mock).mockResolvedValue(mockPersona);

        const result = await getPatientProfile();

        expect(result).toEqual({ user: expectedUser });
    });

    it('should return error if user not found in DB', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { id: 'patient-1', email: 'test@example.com' }
        });

        (prisma.persona.findUnique as jest.Mock).mockResolvedValue(null);

        const result = await getPatientProfile();

        expect(result).toEqual({ error: "Perfil no encontrado" });
    });

    it('should return error if DB fails', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { id: 'user-1', email: 'test@example.com' }
        });

        (prisma.persona.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

        const result = await getPatientProfile();

        expect(result).toEqual({ error: "Error al cargar perfil" });
    });
});
