
/**
 * @jest-environment node
 */
import { updatePatientProfile } from './actions';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    user: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    patient: {
        update: jest.fn(),
    },
    $transaction: jest.fn((callback) => {
        if (Array.isArray(callback)) {
            return Promise.all(callback);
        }
        return callback(prisma);
    }),
}));

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

jest.mock('./logger', () => ({
    logAction: jest.fn(),
}));

describe('updatePatientProfile action', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update profile successfully', async () => {
        const { auth } = require('@/auth');
        auth.mockResolvedValue({ user: { email: 'test@example.com' } });

        const formData = new FormData();
        formData.append('name', 'Updated Name');
        formData.append('phone', '123456789');
        formData.append('address', 'New Address');
        formData.append('commune', 'SANTIAGO');

        // Mock finding user
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-id',
            email: 'test@example.com',
            patientProfile: { id: 'patient-id' }
        });

        const result = await updatePatientProfile(undefined, formData);

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 'user-id' },
            data: { name: 'Updated Name' }
        });

        expect(prisma.patient.update).toHaveBeenCalledWith({
            where: { id: 'patient-id' },
            data: expect.objectContaining({
                phone: '123456789',
                address: 'New Address',
                commune: 'SANTIAGO'
            })
        });

        expect(revalidatePath).toHaveBeenCalledWith('/portal');
        expect(revalidatePath).toHaveBeenCalledWith('/portal/perfil');
        expect(result).toEqual({ message: 'Success' });
    });

    it('should return error if user not found', async () => {
        const { auth } = require('@/auth');
        auth.mockResolvedValue({ user: { email: 'test@example.com' } });

        const formData = new FormData();
        formData.append('name', 'Updated Name');

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        const result = await updatePatientProfile(undefined, formData);

        expect(result).toEqual({ message: 'Profile not found' });
    });

    it('should return validation error for invalid data', async () => {
        const { auth } = require('@/auth');
        auth.mockResolvedValue({ user: { email: 'test@example.com' } });

        const formData = new FormData();
        formData.append('name', ''); // Invalid name

        const result = await updatePatientProfile(undefined, formData);

        expect(result.message).toContain('Datos inválidos');
    });

    it('should return unauthorized if not logged in', async () => {
        const { auth } = require('@/auth');
        auth.mockResolvedValue(null);

        const formData = new FormData();
        const result = await updatePatientProfile(undefined, formData);

        expect(result).toEqual({ message: 'Unauthorized' });
    });
});
