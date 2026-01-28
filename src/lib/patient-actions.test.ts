
import {
    uploadPatientExam,
    getPatientExams,
    deletePatientExam,
    updatePatientExam
} from './patient-actions';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
process.env.E2E_TESTING = 'true';
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
    notification: {
        create: jest.fn(),
    }
}));

jest.mock('file-type', () => ({
    fileTypeFromBuffer: jest.fn().mockResolvedValue({ mime: 'application/pdf' })
}), { virtual: true });

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}));

jest.mock('@vercel/blob', () => ({
    put: jest.fn().mockResolvedValue({ url: 'https://test.com/file.pdf' }),
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

        // Create a test with a valid mocked PDF if possible, but creating a valid PDF mockBuffer is verbose.
        // We will rely on testing validation logic mostly here.
        it('creates an exam and a notification successfully', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'patient@test.com', id: 'u1' } });
            (prisma.persona.findUnique as jest.Mock).mockResolvedValue({
                id: 'p1',
                nombre: 'Juan',
                apellidoPaterno: 'Perez',
                fichaClinica: { id: 'f1' }
            });

            const formData = new FormData();
            const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
            Object.defineProperty(mockFile, 'arrayBuffer', {
                value: jest.fn().mockResolvedValue(new ArrayBuffer(8))
            });
            formData.append('file', mockFile);
            formData.append('centerName', 'Center');
            formData.append('doctorName', 'Doc');
            formData.append('examDate', '2023-01-01');

            (prisma.examenMedico.create as jest.Mock).mockResolvedValue({ id: 'ex1' });

            // We need to avoid the actual file-type import during the test if it causes issues, 
            // but the function is already mocked/captured?
            // Actually, the implementation uses dynamic import.

            const result = await uploadPatientExam(null, formData);
            if (!result.success) {
                throw new Error(`Upload Exam Failed: ${JSON.stringify(result, null, 2)}`);
            }

            expect(result.success).toBe(true);
            expect(prisma.examenMedico.create).toHaveBeenCalled();
            expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    type: 'EXAM_UPLOADED',
                    patientId: 'p1'
                })
            }));
        });
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
