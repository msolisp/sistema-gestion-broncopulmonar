
import { addPulmonaryRecord, updatePulmonaryRecord, getPulmonaryHistory, deletePulmonaryRecord } from './pulmonary';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

jest.mock('@/lib/prisma', () => ({
    fichaClinica: {
        findUnique: jest.fn(),
    },
    pruebaFuncionPulmonar: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
    },
    usuarioSistema: {
        findFirst: jest.fn(),
    },
    logAccesoSistema: {
        create: jest.fn(),
    },
    persona: {
        findUnique: jest.fn(),
    }
}));

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

describe('Pulmonary Actions', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('addPulmonaryRecord', () => {
        it('requires auth', async () => {
            (auth as jest.Mock).mockResolvedValue(null);
            const fd = new FormData();
            const res = await addPulmonaryRecord(fd);
            expect(res.message).toBe('No autenticado');
        });

        it('requires appropriate role', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 't@t', role: 'MEDICO' } }); // Not ADMIN/KIN
            const fd = new FormData();
            const res = await addPulmonaryRecord(fd);
            expect(res.message).toContain('No autorizado');
        });

        it('handles missing patient ficha', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 't@t', role: 'KINESIOLOGO' } });
            (prisma.fichaClinica.findUnique as jest.Mock).mockResolvedValue(null);

            const fd = new FormData();
            fd.append('patientId', 'p1');
            fd.append('date', '2024-01-01');

            const res = await addPulmonaryRecord(fd);
            expect(res.message).toContain('Ficha clínica no encontrada');
        });

        it('creates record successfully', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'kine@test.com', role: 'KINESIOLOGO' } });
            (prisma.fichaClinica.findUnique as jest.Mock).mockResolvedValue({ id: 'f1' });
            (prisma.pruebaFuncionPulmonar.create as jest.Mock).mockResolvedValue({});
            (prisma.usuarioSistema.findFirst as jest.Mock).mockResolvedValue({ id: 'u1' });

            const fd = new FormData();
            fd.append('patientId', 'p1');
            fd.append('date', '2024-01-01');
            fd.append('walkDistance', '500');
            fd.append('spo2Rest', '98');

            const res = await addPulmonaryRecord(fd);
            expect(res.message).toContain('exitosamente');
            expect(prisma.pruebaFuncionPulmonar.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    walkDistance: 500,
                    spo2Rest: 98
                })
            }));
            expect(prisma.logAccesoSistema.create).toHaveBeenCalled();
        });

        it('handles db error', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'kine@test.com', role: 'ADMIN' } });
            (prisma.fichaClinica.findUnique as jest.Mock).mockResolvedValue({ id: 'f1' });
            (prisma.pruebaFuncionPulmonar.create as jest.Mock).mockRejectedValue(new Error('DB Fail'));

            const fd = new FormData();
            fd.append('patientId', 'p1');

            const res = await addPulmonaryRecord(fd);
            expect(res.message).toContain('Error al guardar');
        });
    });

    describe('updatePulmonaryRecord', () => {
        it('updates record and logs changes', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'kine@test.com', role: 'ADMIN' } });
            (prisma.pruebaFuncionPulmonar.findUnique as jest.Mock).mockResolvedValue({
                id: 'rec1',
                walkDistance: 400, // Old value
                notas: 'Old note'
            });
            (prisma.usuarioSistema.findFirst as jest.Mock).mockResolvedValue({ id: 'u1' });

            const fd = new FormData();
            fd.append('recordId', 'rec1');
            fd.append('patientId', 'p1');
            fd.append('date', '2024-01-01');
            fd.append('walkDistance', '500'); // New value
            fd.append('notes', 'Old note'); // No change

            const res = await updatePulmonaryRecord(fd);
            expect(res.message).toContain('actualizado exitosamente');

            // Check logging of diff
            expect(prisma.logAccesoSistema.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    accionDetalle: expect.stringContaining('TM6M Distancia: 400 -> 500')
                })
            }));
        });
    });

    describe('getPulmonaryHistory', () => {
        it('returns empty if no user', async () => {
            (auth as jest.Mock).mockResolvedValue(null);
            const res = await getPulmonaryHistory('p1');
            expect(res).toEqual([]);
        });

        it('blocks IDOR for patient', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'pat@test.com', role: 'PACIENTE' } });
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({ id: 'p2', email: 'pat@test.com' }); // User is p2

            // Requesting p1
            const res = await getPulmonaryHistory('p1');
            expect(res).toEqual([]);
        });

        it('allows correct patient access', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { id: 'user1', email: 'p1@test.com', role: 'PACIENTE' } });
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', email: 'p1@test.com' });
            (prisma.fichaClinica.findUnique as jest.Mock).mockResolvedValue({ id: 'f1' });
            (prisma.pruebaFuncionPulmonar.findMany as jest.Mock).mockResolvedValue([{ id: 'test1', fecha: new Date() }]);

            const res = await getPulmonaryHistory('p1');
            expect(res).toHaveLength(1);
        });

        it('allows staff access to any', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { id: 'staff1', role: 'MEDICO' } });
            (prisma.fichaClinica.findUnique as jest.Mock).mockResolvedValue({ id: 'f1' });
            (prisma.pruebaFuncionPulmonar.findMany as jest.Mock).mockResolvedValue([]);

            await getPulmonaryHistory('p1');
            expect(prisma.pruebaFuncionPulmonar.findMany).toHaveBeenCalled();
        });
    });

    describe('deletePulmonaryRecord', () => {
        it('deletes and logs', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } });
            (prisma.usuarioSistema.findFirst as jest.Mock).mockResolvedValue({ id: 'u1' });

            const res = await deletePulmonaryRecord('rec1', 'p1');
            expect(res.message).toContain('eliminado exitosamente');
            expect(prisma.pruebaFuncionPulmonar.delete).toHaveBeenCalledWith({ where: { id: 'rec1' } });
            expect(prisma.logAccesoSistema.create).toHaveBeenCalled();
        });
    });
});
