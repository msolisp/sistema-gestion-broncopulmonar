
import {
    getComunas, createComuna, updateComuna, deleteComuna,
    getPrevisiones, createPrevision, updatePrevision, deletePrevision
} from './master-tables';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    comuna: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    prevision: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    diagnosticoCIE10: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    medicamento: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    insumo: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    feriado: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn()
}));

describe('Master Tables Actions', () => {

    describe('Comunas', () => {
        it('getComunas returns data', async () => {
            (prisma.comuna.findMany as jest.Mock).mockResolvedValue([{ id: '1', nombre: 'Santiago' }]);
            const result = await getComunas();
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
        });

        it('createComuna creates successfully', async () => {
            (prisma.comuna.create as jest.Mock).mockResolvedValue({ id: '1' });
            const formData = new FormData();
            formData.append('nombre', 'New Comuna');
            formData.append('region', 'RM');

            const result = await createComuna(formData);
            expect(result.message).toBe('Success');
            expect(revalidatePath).toHaveBeenCalledWith('/admin');
        });

        it('createComuna handles duplicates', async () => {
            (prisma.comuna.create as jest.Mock).mockRejectedValue({ code: 'P2002' });
            const formData = new FormData();
            const result = await createComuna(formData);
            expect(result.message).toContain('ya existe');
        });

        it('updateComuna updates successfully', async () => {
            (prisma.comuna.update as jest.Mock).mockResolvedValue({ id: '1' });
            const formData = new FormData();
            formData.append('id', '1');
            formData.append('nombre', 'Updated');
            formData.append('activo', 'on');

            const result = await updateComuna(formData);
            expect(result.message).toBe('Success');
            expect(prisma.comuna.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: '1' },
                data: expect.objectContaining({ activo: true })
            }));
        });

        it('deleteComuna deletes successfully', async () => {
            (prisma.comuna.delete as jest.Mock).mockResolvedValue({ id: '1' });
            const result = await deleteComuna('1');
            expect(result.message).toBe('Success');
        });
    });

    describe('Previsiones', () => {
        it('getPrevisiones returns data', async () => {
            (prisma.prevision.findMany as jest.Mock).mockResolvedValue([{ id: '1', nombre: 'Fonasa' }]);
            const result = await getPrevisiones();
            expect(result.success).toBe(true);
        });

        it('createPrevision success', async () => {
            (prisma.prevision.create as jest.Mock).mockResolvedValue({});
            const formData = new FormData();
            formData.append('nombre', 'Isapre');
            formData.append('tipo', 'ISAPRE');
            const result = await createPrevision(formData);
            expect(result.message).toBe('Success');
        });

        it('updatePrevision success', async () => {
            (prisma.prevision.update as jest.Mock).mockResolvedValue({});
            const formData = new FormData();
            formData.append('id', '1');
            formData.append('nombre', 'Fonasa Updated');
            const result = await updatePrevision(formData);
            expect(result.message).toBe('Success');
        });

        it('deletePrevision success', async () => {
            (prisma.prevision.delete as jest.Mock).mockResolvedValue({});
            const result = await deletePrevision('1');
            expect(result.message).toBe('Success');
        });
    });

    describe('Diagnosticos', () => {
        it('returns data', async () => {
            const { getDiagnosticos } = require('./master-tables');
            (prisma.diagnosticoCIE10.findMany as jest.Mock).mockResolvedValue([{ id: '1', codigo: 'A00' }]);
            const result = await getDiagnosticos();
            expect(result.success).toBe(true);
        });

        it('creates successfully', async () => {
            const { createDiagnostico } = require('./master-tables');
            (prisma.diagnosticoCIE10.create as jest.Mock).mockResolvedValue({});
            const formData = new FormData();
            formData.append('codigo', 'A00');
            formData.append('descripcion', 'Cholera');
            const result = await createDiagnostico(formData);
            expect(result.message).toBe('Success');
        });

        it('updates successfully', async () => {
            const { updateDiagnostico } = require('./master-tables');
            (prisma.diagnosticoCIE10.update as jest.Mock).mockResolvedValue({});
            const formData = new FormData();
            formData.append('id', '1');
            formData.append('codigo', 'A00');
            formData.append('descripcion', 'Cholera Updated');
            const result = await updateDiagnostico(formData);
            expect(result.message).toBe('Success');
        });

        it('deletes successfully', async () => {
            const { deleteDiagnostico } = require('./master-tables');
            (prisma.diagnosticoCIE10.delete as jest.Mock).mockResolvedValue({});
            const result = await deleteDiagnostico('1');
            expect(result.message).toBe('Success');
        });
    });

    describe('Medicamentos', () => {
        it('returns data', async () => {
            const { getMedicamentos } = require('./master-tables');
            (prisma.medicamento.findMany as jest.Mock).mockResolvedValue([]);
            const result = await getMedicamentos();
            expect(result.success).toBe(true);
        });

        it('createMedicamento success', async () => {
            const { createMedicamento } = require('./master-tables');
            (prisma.medicamento.create as jest.Mock).mockResolvedValue({});
            const formData = new FormData();
            formData.append('nombre', 'Paracetamol');
            const result = await createMedicamento(formData);
            expect(result.message).toBe('Success');
        });

        it('updateMedicamento success', async () => {
            const { updateMedicamento } = require('./master-tables');
            (prisma.medicamento.update as jest.Mock).mockResolvedValue({});
            const formData = new FormData();
            formData.append('id', '1');
            formData.append('nombre', 'Paracetamol 500mg');
            const result = await updateMedicamento(formData);
            expect(result.message).toBe('Success');
        });

        it('deleteMedicamento success', async () => {
            const { deleteMedicamento } = require('./master-tables');
            (prisma.medicamento.delete as jest.Mock).mockResolvedValue({});
            const result = await deleteMedicamento('1');
            expect(result.message).toBe('Success');
        });
    });

    describe('Insumos', () => {
        it('returns data', async () => {
            const { getInsumos } = require('./master-tables');
            (prisma.insumo.findMany as jest.Mock).mockResolvedValue([]);
            const result = await getInsumos();
            expect(result.success).toBe(true);
        });

        it('createInsumo success', async () => {
            const { createInsumo } = require('./master-tables');
            (prisma.insumo.create as jest.Mock).mockResolvedValue({});
            const formData = new FormData();
            formData.append('nombre', 'Jeringa');
            const result = await createInsumo(formData);
            expect(result.message).toBe('Success');
        });

        it('updateInsumo success', async () => {
            const { updateInsumo } = require('./master-tables');
            (prisma.insumo.update as jest.Mock).mockResolvedValue({});
            const formData = new FormData();
            formData.append('id', '1');
            formData.append('nombre', 'Jeringa 5ml');
            const result = await updateInsumo(formData);
            expect(result.message).toBe('Success');
        });

        it('deleteInsumo success', async () => {
            const { deleteInsumo } = require('./master-tables');
            (prisma.insumo.delete as jest.Mock).mockResolvedValue({});
            const result = await deleteInsumo('1');
            expect(result.message).toBe('Success');
        });
    });

    describe('Feriados', () => {
        it('returns data', async () => {
            const { getFeriados } = require('./master-tables');
            (prisma.feriado.findMany as jest.Mock).mockResolvedValue([]);
            const result = await getFeriados();
            expect(result.success).toBe(true);
        });

        it('createFeriado success', async () => {
            const { createFeriado } = require('./master-tables');
            (prisma.feriado.create as jest.Mock).mockResolvedValue({});
            const formData = new FormData();
            formData.append('nombre', 'Navidad');
            formData.append('fecha', '2025-12-25');
            formData.append('tipo', 'CIVIL');
            const result = await createFeriado(formData);
            expect(result.message).toBe('Success');
        });

        it('updateFeriado success', async () => {
            const { updateFeriado } = require('./master-tables');
            (prisma.feriado.update as jest.Mock).mockResolvedValue({});
            const formData = new FormData();
            formData.append('id', '1');
            formData.append('nombre', 'Navidad Modified');
            formData.append('fecha', '2025-12-25');
            formData.append('tipo', 'RELIGIOSO');
            const result = await updateFeriado(formData);
            expect(result.message).toBe('Success');
        });

        it('deleteFeriado success', async () => {
            const { deleteFeriado } = require('./master-tables');
            (prisma.feriado.delete as jest.Mock).mockResolvedValue({});
            const result = await deleteFeriado('1');
            expect(result.message).toBe('Success');
        });
    });

    describe('Error Handling', () => {
        // Comunas Error
        it('getComunas handles errors', async () => {
            (prisma.comuna.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const result = await getComunas();
            expect(result.success).toBe(false);
        });

        it('createComuna handles database error', async () => {
            (prisma.comuna.create as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const formData = new FormData();
            formData.append('nombre', 'Error Comuna');
            const result = await createComuna(formData);
            expect(result.message).toContain('Error al crear comuna');
        });

        it('updateComuna handles errors', async () => {
            (prisma.comuna.update as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const formData = new FormData();
            formData.append('id', '1');
            const result = await updateComuna(formData);
            expect(result.message).toContain('Error al actualizar comuna');
        });

        it('deleteComuna handles errors', async () => {
            (prisma.comuna.delete as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const result = await deleteComuna('1');
            expect(result.message).toContain('Error al eliminar comuna');
        });

        // Previsiones Error
        it('createPrevision handles duplicate error', async () => {
            const error = new Error('P2002');
            (error as any).code = 'P2002';
            (prisma.prevision.create as jest.Mock).mockRejectedValue(error);
            const formData = new FormData();
            const result = await createPrevision(formData);
            expect(result.message).toContain('Una previsión con ese nombre ya existe');
        });

        it('createPrevision handles generic error', async () => {
            (prisma.prevision.create as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const formData = new FormData();
            const result = await createPrevision(formData);
            expect(result.message).toContain('Error al crear previsión');
        });

        it('getPrevisiones handles errors', async () => {
            (prisma.prevision.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const result = await getPrevisiones();
            expect(result.success).toBe(false);
        });

        it('updatePrevision handles errors', async () => {
            (prisma.prevision.update as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const formData = new FormData();
            const result = await updatePrevision(formData);
            expect(result.message).toContain('Error al actualizar previsión');
        });

        it('deletePrevision handles errors', async () => {
            (prisma.prevision.delete as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const result = await deletePrevision('1');
            expect(result.message).toContain('Error al eliminar previsión');
        });

        // Diagnosticos Error
        it('getDiagnosticos handles errors', async () => {
            const { getDiagnosticos } = require('./master-tables');
            (prisma.diagnosticoCIE10.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const result = await getDiagnosticos();
            expect(result.success).toBe(false);
        });

        it('createDiagnostico handles duplicate error', async () => {
            const { createDiagnostico } = require('./master-tables');
            const error = new Error('P2002');
            (error as any).code = 'P2002';
            (prisma.diagnosticoCIE10.create as jest.Mock).mockRejectedValue(error);

            const formData = new FormData();
            formData.append('codigo', 'X99');
            const result = await createDiagnostico(formData);
            expect(result.message).toContain('ya existe');
        });

        it('createDiagnostico handles generic error', async () => {
            const { createDiagnostico } = require('./master-tables');
            (prisma.diagnosticoCIE10.create as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const formData = new FormData();
            const result = await createDiagnostico(formData);
            expect(result.message).toContain('Error al crear diagnóstico');
        });

        it('updateDiagnostico handles errors', async () => {
            const { updateDiagnostico } = require('./master-tables');
            (prisma.diagnosticoCIE10.update as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const formData = new FormData();
            const result = await updateDiagnostico(formData);
            expect(result.message).toContain('Error al actualizar diagnóstico');
        });

        it('deleteDiagnostico handles errors', async () => {
            const { deleteDiagnostico } = require('./master-tables');
            (prisma.diagnosticoCIE10.delete as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const result = await deleteDiagnostico('1');
            expect(result.message).toContain('Error al eliminar diagnóstico');
        });

        // Medicamentos Error
        it('getMedicamentos handles errors', async () => {
            const { getMedicamentos } = require('./master-tables');
            (prisma.medicamento.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const result = await getMedicamentos();
            expect(result.success).toBe(false);
        });

        it('createMedicamento handles errors', async () => {
            const { createMedicamento } = require('./master-tables');
            (prisma.medicamento.create as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const formData = new FormData();
            const result = await createMedicamento(formData);
            expect(result.message).toContain('Error al crear medicamento');
        });

        it('updateMedicamento handles errors', async () => {
            const { updateMedicamento } = require('./master-tables');
            (prisma.medicamento.update as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const formData = new FormData();
            const result = await updateMedicamento(formData);
            expect(result.message).toContain('Error al actualizar medicamento');
        });

        it('deleteMedicamento handles errors', async () => {
            const { deleteMedicamento } = require('./master-tables');
            (prisma.medicamento.delete as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const result = await deleteMedicamento('1');
            expect(result.message).toContain('Error al eliminar medicamento');
        });

        // Insumos Error
        it('getInsumos handles errors', async () => {
            const { getInsumos } = require('./master-tables');
            (prisma.insumo.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const result = await getInsumos();
            expect(result.success).toBe(false);
        });

        it('createInsumo handles errors', async () => {
            const { createInsumo } = require('./master-tables');
            (prisma.insumo.create as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const formData = new FormData();
            const result = await createInsumo(formData);
            expect(result.message).toContain('Error al crear insumo');
        });

        it('updateInsumo handles errors', async () => {
            const { updateInsumo } = require('./master-tables');
            (prisma.insumo.update as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const formData = new FormData();
            const result = await updateInsumo(formData);
            expect(result.message).toContain('Error al actualizar insumo');
        });

        it('deleteInsumo handles errors', async () => {
            const { deleteInsumo } = require('./master-tables');
            (prisma.insumo.delete as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const result = await deleteInsumo('1');
            expect(result.message).toContain('Error al eliminar insumo');
        });

        // Feriados Error
        it('getFeriados handles errors', async () => {
            const { getFeriados } = require('./master-tables');
            (prisma.feriado.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const result = await getFeriados();
            expect(result.success).toBe(false);
        });

        it('createFeriado handles duplicate error', async () => {
            const { createFeriado } = require('./master-tables');
            const error = new Error('P2002');
            (error as any).code = 'P2002';
            (prisma.feriado.create as jest.Mock).mockRejectedValue(error);
            const formData = new FormData();
            // date needs to be valid
            formData.append('fecha', '2025-01-01');
            const result = await createFeriado(formData);
            expect(result.message).toContain('Ya existe un feriado');
        });

        it('createFeriado handles generic error', async () => {
            const { createFeriado } = require('./master-tables');
            (prisma.feriado.create as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const formData = new FormData();
            formData.append('fecha', '2025-01-01');
            const result = await createFeriado(formData);
            expect(result.message).toContain('Error al crear feriado');
        });

        it('updateFeriado handles errors', async () => {
            const { updateFeriado } = require('./master-tables');
            (prisma.feriado.update as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const formData = new FormData();
            formData.append('fecha', '2025-01-01');
            const result = await updateFeriado(formData);
            expect(result.message).toContain('Error al actualizar feriado');
        });

        it('deleteFeriado handles errors', async () => {
            const { deleteFeriado } = require('./master-tables');
            (prisma.feriado.delete as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const result = await deleteFeriado('1');
            expect(result.message).toContain('Error al eliminar feriado');
        });
    });
});
