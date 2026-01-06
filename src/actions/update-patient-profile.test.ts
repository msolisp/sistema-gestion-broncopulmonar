/**
 * @jest-environment node
 */
import { updatePatientProfile } from '@/lib/actions';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

jest.mock('@/lib/prisma', () => ({
    patient: {
        update: jest.fn(),
    },
}));

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

describe('updatePatientProfile', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update profile with valid data', async () => {
        (auth as jest.Mock).mockResolvedValue({ user: { id: 'p1', email: 'test@test.com' } });
        (prisma.patient.update as jest.Mock).mockResolvedValue({});

        const formData = new FormData();
        formData.append('name', 'New Name');
        formData.append('phone', '+56912345678');
        formData.append('address', 'New Address');
        formData.append('commune', 'PROVIDENCIA');
        formData.append('gender', 'Masculino');
        formData.append('healthSystem', 'FONASA');
        formData.append('birthDate', '1990-01-01');

        const result = await updatePatientProfile(null, formData);

        expect(result).toEqual({ message: 'Success' });
        expect(prisma.patient.update).toHaveBeenCalledWith({
            where: { id: 'p1' },
            data: expect.objectContaining({
                name: 'New Name',
                commune: 'PROVIDENCIA'
            })
        });
    });

    it('should handle empty optional strings (form reset)', async () => {
        (auth as jest.Mock).mockResolvedValue({ user: { id: 'p1', email: 'test@test.com' } });

        const formData = new FormData();
        formData.append('name', 'New Name');
        // sending empty strings for optional fields as forms often do
        formData.append('phone', '');
        formData.append('address', '');
        formData.append('birthDate', '');

        const result = await updatePatientProfile(null, formData);

        // If validation fails on empty strings for optional fields, this will return an error message
        expect(result).toEqual({ message: 'Success' });
    });
});
