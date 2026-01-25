
import {
    registerPatient,
    updatePatientProfile,
    adminCreatePatient,
    adminUpdatePatient,
    deletePatient
} from './actions.patients';
import { checkPersonaExists, createPatient, updatePatient } from '@/lib/fhir-adapters';
import { validarRutChileno } from '@/lib/validators';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/fhir-adapters', () => ({
    checkPersonaExists: jest.fn(),
    createPatient: jest.fn(),
    updatePatient: jest.fn(),
}));

jest.mock('@/lib/validators', () => ({
    validarRutChileno: jest.fn(),
}));

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
    fichaClinica: { findUnique: jest.fn(), update: jest.fn() },
    persona: { update: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn() },
    usuarioSistema: { findFirst: jest.fn() },
    logAccesoSistema: { create: jest.fn() },
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

jest.mock('next/headers', () => ({
    headers: jest.fn().mockReturnValue({ get: () => '127.0.0.1' }),
}));

describe('Actions Patients', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('registerPatient', () => {
        it('fails if invalid format', async () => {
            const formData = new FormData();
            formData.append('email', 'invalid');
            const result = await registerPatient(null, formData);
            expect(result.message).toContain('Datos inválidos');
        });

        it('fails if RUT invalid', async () => {
            const formData = new FormData();
            formData.append('email', 'test@test.com');
            formData.append('password', '123456');
            formData.append('name', 'John');
            formData.append('rutBody', '1');
            formData.append('rutDv', '9');
            formData.append('commune', 'Stgo');

            (validarRutChileno as jest.Mock).mockReturnValue(false);

            const result = await registerPatient(null, formData);
            expect(result.message).toContain('RUT inválido');
        });

        it('fails if user exists', async () => {
            const formData = new FormData();
            formData.append('email', 'test@test.com');
            formData.append('password', 'Pass123!@#');
            formData.append('name', 'John');
            formData.append('rutBody', '1');
            formData.append('rutDv', '9');
            formData.append('commune', 'Stgo');

            (validarRutChileno as jest.Mock).mockReturnValue(true);
            (checkPersonaExists as jest.Mock).mockResolvedValue({ email: 'test@test.com' });

            const result = await registerPatient(null, formData);
            expect(result.message).toContain('email ya está registrado');
        });

        it('creates patient if valid', async () => {
            const formData = new FormData();
            formData.append('email', 'new@test.com');
            formData.append('password', 'Pass123!@#');
            formData.append('name', 'John Doe');
            formData.append('rutBody', '1');
            formData.append('rutDv', '9');
            formData.append('commune', 'Stgo');

            (validarRutChileno as jest.Mock).mockReturnValue(true);
            (checkPersonaExists as jest.Mock).mockResolvedValue(null);

            const result = await registerPatient(null, formData);
            expect(result.message).toBe('Success');
            expect(createPatient).toHaveBeenCalled();
        });
    });

    describe('updatePatientProfile', () => {
        it('fails if unauthenticated', async () => {
            (auth as jest.Mock).mockResolvedValue(null);
            const formData = new FormData();
            const result = await updatePatientProfile(null, formData);
            expect(result.message).toBe('Unauthorized');
        });

        it('updates profile successfully', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'test@test.com', id: 'p1' } });
            const formData = new FormData();
            formData.append('name', 'Jane Doe');
            formData.append('rut', '1-9');

            const result = await updatePatientProfile(null, formData);
            expect(result.message).toBe('Success');
            expect(updatePatient).toHaveBeenCalledWith('p1', expect.anything());
        });
    });

    describe('adminCreatePatient', () => {
        it('fails if not admin', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { role: 'PACIENTE' } });
            const result = await adminCreatePatient(null, new FormData());
            expect(result.message).toContain('Unauthorized');
        });

        it('creates patient if admin', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { role: 'ADMIN', email: 'admin@test.com' } });
            (validarRutChileno as jest.Mock).mockReturnValue(true);
            (checkPersonaExists as jest.Mock).mockResolvedValue(null);

            const formData = new FormData();
            formData.append('email', 'new@test.com');
            formData.append('password', 'Pass123!@#');
            formData.append('name', 'John Doe');
            formData.append('rut', '1-9');
            formData.append('commune', 'Stgo');
            formData.append('region', 'RM');
            formData.append('address', 'Calle 1');
            formData.append('gender', 'Masculino');
            formData.append('healthSystem', 'FONASA');

            const result = await adminCreatePatient(null, formData);
            expect(result.message).toBe('Success');
            expect(createPatient).toHaveBeenCalled();
        });
    });

    describe('deletePatient', () => {
        it('soft deletes patient', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { role: 'ADMIN', email: 'admin@test.com' } });
            (prisma.fichaClinica.findUnique as jest.Mock).mockResolvedValue({ id: 'f1', personaId: 'p1' });

            const formData = new FormData();
            formData.append('id', 'p1');

            const result = await deletePatient(null, formData);
            expect(result.message).toBe('Success');
            expect(prisma.persona.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'p1' },
                data: expect.objectContaining({ activo: false })
            }));
        });
    });
});
