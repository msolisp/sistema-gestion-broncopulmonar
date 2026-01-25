
import {
    getPersonaByEmail,
    getPersonaByRut,
    getPersonaById,
    createPatient,
    createStaffUser,
    updatePatient,
    updateStaffUser,
    checkPersonaExists,
    adaptPulmonaryToFHIRObservations
} from './fhir-adapters';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    persona: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    credencial: {
        create: jest.fn(),
        update: jest.fn(),
    },
    fichaClinica: {
        create: jest.fn(),
        update: jest.fn(),
    },
    usuarioSistema: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
}));

jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('FHIR Adapters', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Getters', () => {
        it('getPersonaByEmail calls findUnique', async () => {
            await getPersonaByEmail('test@test.com');
            expect(prisma.persona.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@test.com' },
                include: expect.any(Object)
            });
        });

        it('getPersonaByRut calls findUnique', async () => {
            await getPersonaByRut('12345678-9');
            expect(prisma.persona.findUnique).toHaveBeenCalledWith({
                where: { rut: '12345678-9' },
                include: expect.any(Object)
            });
        });

        it('getPersonaById calls findUnique', async () => {
            await getPersonaById('p1');
            expect(prisma.persona.findUnique).toHaveBeenCalledWith({
                where: { id: 'p1' },
                include: expect.any(Object)
            });
        });
    });

    describe('checkPersonaExists', () => {
        it('returns null if no conditions provided', async () => {
            const result = await checkPersonaExists();
            expect(result).toBeNull();
        });

        it('checks by rut', async () => {
            await checkPersonaExists('1-9');
            expect(prisma.persona.findFirst).toHaveBeenCalledWith(expect.objectContaining({
                where: { OR: [{ rut: '1-9' }] }
            }));
        });

        it('checks by email', async () => {
            await checkPersonaExists(undefined, 'a@b.c');
            expect(prisma.persona.findFirst).toHaveBeenCalledWith(expect.objectContaining({
                where: { OR: [{ email: 'a@b.c' }] }
            }));
        });

        it('excludes id if provided', async () => {
            await checkPersonaExists('1-9', undefined, 'exclude-id');
            expect(prisma.persona.findFirst).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    OR: [{ rut: '1-9' }],
                    id: { not: 'exclude-id' }
                }
            }));
        });
    });

    describe('createPatient', () => {
        it('creates persona, credencial, and fichaClinica in transaction', async () => {
            (prisma.persona.create as jest.Mock).mockResolvedValue({ id: 'p1' });

            const data = {
                rut: '1-9',
                nombre: 'John',
                apellidoPaterno: 'Doe',
                email: 'john@test.com',
                password: 'pass',
                comuna: 'Santiago',
                creadoPor: 'admin'
            };

            const result = await createPatient(data);

            expect(prisma.persona.create).toHaveBeenCalled();
            expect(prisma.credencial.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ personaId: 'p1', tipoAcceso: 'PACIENTE' })
            }));
            expect(prisma.fichaClinica.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ personaId: 'p1' })
            }));
            expect(result).toEqual({ id: 'p1' });
        });
    });

    describe('createStaffUser', () => {
        it('creates persona, credencial, and usuarioSistema', async () => {
            (prisma.persona.create as jest.Mock).mockResolvedValue({ id: 'p1' });

            const data = {
                rut: '2-8',
                nombre: 'Dr',
                apellidoPaterno: 'House',
                email: 'dr@test.com',
                password: 'pass',
                rol: 'MEDICO',
                creadoPor: 'admin'
            };

            const result = await createStaffUser(data);

            expect(prisma.persona.create).toHaveBeenCalled();
            expect(prisma.credencial.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ personaId: 'p1', tipoAcceso: 'STAFF' })
            }));
            expect(prisma.usuarioSistema.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ personaId: 'p1', rolId: 'MEDICO' })
            }));
            expect(result).toEqual({ id: 'p1' });
        });
    });

    describe('updatePatient', () => {
        it('updates persona and fichaClinica if medical fields present', async () => {
            const data = {
                nombre: 'Jane',
                prevision: 'FONASA', // Medical field
                modificadoPor: 'admin'
            };

            await updatePatient('p1', data);

            expect(prisma.persona.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'p1' },
                data: expect.objectContaining({ nombre: 'Jane' })
            }));

            expect(prisma.fichaClinica.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { personaId: 'p1' },
                data: expect.objectContaining({ prevision: 'FONASA' })
            }));
        });

        it('updates password if provided', async () => {
            await updatePatient('p1', { password: 'new', modificadoPor: 'self' });
            expect(bcrypt.hash).toHaveBeenCalled();
            expect(prisma.credencial.update).toHaveBeenCalled();
        });
    });

    describe('updateStaffUser', () => {
        it('updates persona and usuarioSistema', async () => {
            (prisma.usuarioSistema.findUnique as jest.Mock).mockResolvedValue({ id: 'us1', personaId: 'p1' });

            const data = {
                nombre: 'Staff',
                rol: 'KINE',
                active: false,
                modificadoPor: 'admin'
            };

            await updateStaffUser('us1', data);

            expect(prisma.persona.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'p1' },
                data: expect.objectContaining({ activo: false })
            }));

            expect(prisma.usuarioSistema.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'us1' },
                data: expect.objectContaining({ rolId: 'KINE' })
            }));
        });

        it('throws if staff not found', async () => {
            (prisma.usuarioSistema.findUnique as jest.Mock).mockResolvedValue(null);
            await expect(updateStaffUser('us1', { modificadoPor: 'admin' })).rejects.toThrow('Staff user not found');
        });
    });

    describe('adaptPulmonaryToFHIRObservations', () => {
        it('creates a bundle with observations', () => {
            const date = new Date();
            const record = {
                id: '1',
                fecha: date,
                cvfValue: 4.5,
                personaId: 'p1'
            };

            const bundle = adaptPulmonaryToFHIRObservations(record);
            expect(bundle.resourceType).toBe('Bundle');
            expect(bundle.entry).toHaveLength(1); // Only CVF
            expect(bundle.entry[0].resource.valueQuantity.value).toBe(4.5);
            expect(bundle.entry[0].resource.code.coding[0].code).toBe('19868-9');
        });
    });
});
