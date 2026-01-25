
import {
    uploadPatientExam,
    getPatientExams,
    deletePatientExam,
    updatePatientExam
} from './patient-actions';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { put } from '@vercel/blob';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    persona: {
        findUnique: jest.fn(),
    },
    examenMedico: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
    },
    notificacionMedica: {
        create: jest.fn(),
    }
}));

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}));

jest.mock('@vercel/blob', () => ({
    put: jest.fn(),
}));

describe('Patient Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('uploadPatientExam', () => {
        it('returns error if unauthenticated', async () => {
            (auth as jest.Mock).mockResolvedValue(null);
            const formData = new FormData();
            const result = await uploadPatientExam(null, formData);
            expect(result.message).toContain('No autorizado');
        });

        it('returns error if file missing or invalid type', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'patient@test.com' } });
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', fichaClinica: { id: 'f1' } });

            const formData = new FormData();
            formData.append('centerName', 'Center');
            formData.append('doctorName', 'Doc');
            formData.append('examDate', '2023-01-01');
            // No file

            const result = await uploadPatientExam(null, formData);
            expect(result.message).toContain('PDF');
        });

        // Add a test with a valid mocked PDF if possible, but creating a valid PDF mockBuffer is verbose.
        // We will rely on testing validation logic mostly here.
    });

    describe('getPatientExams', () => {
        it('gets exams for logged in user', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'patient@test.com' } });
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', fichaClinica: { id: 'f1' } });
            (prisma.examenMedico.findMany as jest.Mock).mockResolvedValue([{ id: 'ex1', nombreCentro: 'Test' }]);

            const result = await getPatientExams();
            expect(result).toHaveLength(1);
            expect(result[0].centerName).toBe('Test');
        });
    });

    describe('deletePatientExam', () => {
        it('prevents deletion if not owner', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'patient@test.com', id: 'u1' } });
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({ id: 'p1' });
            (prisma.examenMedico.findUnique as jest.Mock).mockResolvedValue({
                id: 'ex1',
                subidoPor: 'other-user',
                origen: 'PORTAL_PACIENTE'
            });

            const result = await deletePatientExam('ex1');
            expect(result.message).toContain('Solo puede eliminar exámenes que usted haya subido');
        });

        it('allows deletion if owner', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'patient@test.com', id: 'u1' } });
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({ id: 'p1' });
            (prisma.examenMedico.findUnique as jest.Mock).mockResolvedValue({
                id: 'ex1',
                subidoPor: 'u1',
                origen: 'PORTAL_PACIENTE'
            });

            const result = await deletePatientExam('ex1');
            expect(result.success).toBe(true);
            expect(prisma.examenMedico.delete).toHaveBeenCalledWith({ where: { id: 'ex1' } });
        });
    });

    describe('updatePatientExam', () => {
        it('updates metadata if owner', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'patient@test.com', id: 'u1' } });
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({ id: 'p1' });
            (prisma.examenMedico.findUnique as jest.Mock).mockResolvedValue({
                id: 'ex1',
                subidoPor: 'u1',
                origen: 'PORTAL_PACIENTE'
            });

            const formData = new FormData();
            formData.append('centerName', 'New Center');
            formData.append('doctorName', 'New Doc');
            formData.append('examDate', '2023-01-01');

            const result = await updatePatientExam('ex1', formData);
            expect(result.success).toBe(true);
            expect(prisma.examenMedico.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ nombreCentro: 'New Center' })
            }));
        });
    });
});
