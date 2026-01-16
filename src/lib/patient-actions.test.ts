import { uploadPatientExam, getPatientExams, deletePatientExam } from './patient-actions'
import { put } from '@vercel/blob'

// Create mock instance
const mockPrismaClient = {
    patient: {
        findUnique: jest.fn(),
    },
    medicalExam: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
    },
}

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrismaClient),
}))

// Mock Vercel Blob
jest.mock('@vercel/blob', () => ({
    put: jest.fn(),
}))

// Mock Auth
jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

describe('patient-actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('uploadPatientExam', () => {
        it('should require authentication', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue(null)

            const formData = new FormData()
            const result = await uploadPatientExam(null, formData)

            expect(result.message).toBe('No autorizado. Debe iniciar sesión.')
            expect(result.success).toBeUndefined()
        })

        it('should require patient to exist', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'test@test.com' } })
            mockPrismaClient.patient.findUnique.mockResolvedValue(null)

            const formData = new FormData()
            const result = await uploadPatientExam(null, formData)

            expect(result.message).toBe('Paciente no encontrado.')
        })

        it('should validate PDF file is required', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'patient@test.com' } })
            mockPrismaClient.patient.findUnique.mockResolvedValue({ id: 'p1', email: 'patient@test.com' })

            const formData = new FormData()
            formData.append('centerName', 'Clínica Test')
            formData.append('doctorName', 'Dr. Test')
            formData.append('examDate', '2024-01-15')

            const result = await uploadPatientExam(null, formData)

            expect(result.message).toBe('Debe seleccionar un archivo PDF.')
        })

        it('should validate centerName is required', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'patient@test.com' } })
            mockPrismaClient.patient.findUnique.mockResolvedValue({ id: 'p1' })

            const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
            const formData = new FormData()
            formData.append('file', file)
            formData.append('doctorName', 'Dr. Test')
            formData.append('examDate', '2024-01-15')

            const result = await uploadPatientExam(null, formData)

            expect(result.message).toBe('El centro médico es requerido.')
        })

        it('should validate doctorName is required', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'patient@test.com' } })
            mockPrismaClient.patient.findUnique.mockResolvedValue({ id: 'p1' })

            const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
            const formData = new FormData()
            formData.append('file', file)
            formData.append('centerName', 'Clínica Test')
            formData.append('examDate', '2024-01-15')

            const result = await uploadPatientExam(null, formData)

            expect(result.message).toBe('El nombre del médico es requerido.')
        })

        it('should validate examDate is required', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'patient@test.com' } })
            mockPrismaClient.patient.findUnique.mockResolvedValue({ id: 'p1' })

            const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
            const formData = new FormData()
            formData.append('file', file)
            formData.append('centerName', 'Clínica Test')
            formData.append('doctorName', 'Dr. Test')

            const result = await uploadPatientExam(null, formData)

            expect(result.message).toBe('La fecha del examen es requerida.')
        })

        it('should only accept PDF files', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'patient@test.com' } })
            mockPrismaClient.patient.findUnique.mockResolvedValue({ id: 'p1' })

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
            const formData = new FormData()
            formData.append('file', file)
            formData.append('centerName', 'Clínica Test')
            formData.append('doctorName', 'Dr. Test')
            formData.append('examDate', '2024-01-15')

            const result = await uploadPatientExam(null, formData)

            expect(result.message).toBe('Solo se permiten archivos PDF.')
        })

        it('should reject files larger than 10MB', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'patient@test.com' } })
            mockPrismaClient.patient.findUnique.mockResolvedValue({ id: 'p1' })

            // Create a mock file larger than 10MB
            const largeContent = new ArrayBuffer(11 * 1024 * 1024) // 11MB
            const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' })

            const formData = new FormData()
            formData.append('file', file)
            formData.append('centerName', 'Clínica Test')
            formData.append('doctorName', 'Dr. Test')
            formData.append('examDate', '2024-01-15')

            const result = await uploadPatientExam(null, formData)

            expect(result.message).toBe('El archivo no debe superar los 10MB.')
        })

        it('should successfully upload exam with valid data', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'patient@test.com' } })
            mockPrismaClient.patient.findUnique.mockResolvedValue({
                id: 'p1',
                email: 'patient@test.com'
            })
                ; (put as jest.Mock).mockResolvedValue({
                    url: 'https://blob.storage/exam.pdf'
                })
            mockPrismaClient.medicalExam.create.mockResolvedValue({
                id: 'exam1',
                patientId: 'p1',
            })

            const file = new File(['test content'], 'exam.pdf', { type: 'application/pdf' })
            const formData = new FormData()
            formData.append('file', file)
            formData.append('centerName', 'Clínica Test')
            formData.append('doctorName', 'Dr. Test')
            formData.append('examDate', '2024-01-15')

            const result = await uploadPatientExam(null, formData)

            expect(result.message).toBe('Examen médico subido exitosamente.')
            expect(result.success).toBe(true)
            expect(mockPrismaClient.medicalExam.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    patientId: 'p1',
                    source: 'portal pacientes',
                    uploadedByUserId: 'p1',
                    centerName: 'Clínica Test',
                    doctorName: 'Dr. Test',
                    fileUrl: 'https://blob.storage/exam.pdf',
                    fileName: 'exam.pdf',
                })
            })
        })
    })

    describe('deletePatientExam', () => {
        it('should require authentication', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue(null)

            const result = await deletePatientExam('exam1')

            expect(result.message).toBe('No autorizado. Debe iniciar sesión.')
        })

        it('should require patient to exist', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'test@test.com' } })
            mockPrismaClient.patient.findUnique.mockResolvedValue(null)

            const result = await deletePatientExam('exam1')

            expect(result.message).toBe('Paciente no encontrado.')
        })

        it('should require exam to exist', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'patient@test.com' } })
            mockPrismaClient.patient.findUnique.mockResolvedValue({ id: 'p1' })
            mockPrismaClient.medicalExam.findUnique.mockResolvedValue(null)

            const result = await deletePatientExam('exam1')

            expect(result.message).toBe('Examen no encontrado.')
        })

        it('should verify ownership before deletion', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'patient@test.com' } })
            mockPrismaClient.patient.findUnique.mockResolvedValue({ id: 'p1' })
            mockPrismaClient.medicalExam.findUnique.mockResolvedValue({
                id: 'exam1',
                patientId: 'p2', // Different patient
                source: 'portal pacientes',
            })

            const result = await deletePatientExam('exam1')

            expect(result.message).toBe('No tiene permiso para eliminar este examen.')
        })

        it('should only allow deletion of patient-uploaded exams', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'patient@test.com' } })
            mockPrismaClient.patient.findUnique.mockResolvedValue({ id: 'p1' })
            mockPrismaClient.medicalExam.findUnique.mockResolvedValue({
                id: 'exam1',
                patientId: 'p1',
                source: 'portal interno', // Uploaded by admin
                uploadedByUserId: 'admin1',
            })

            const result = await deletePatientExam('exam1')

            expect(result.message).toBe('Solo puede eliminar exámenes que usted haya subido desde el portal de pacientes.')
        })

        it('should successfully delete own exam', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'patient@test.com' } })
            mockPrismaClient.patient.findUnique.mockResolvedValue({ id: 'p1' })
            mockPrismaClient.medicalExam.findUnique.mockResolvedValue({
                id: 'exam1',
                patientId: 'p1',
                source: 'portal pacientes',
                uploadedByUserId: 'p1',
            })
            mockPrismaClient.medicalExam.delete.mockResolvedValue({})

            const result = await deletePatientExam('exam1')

            expect(result.message).toBe('Examen eliminado exitosamente.')
            expect(result.success).toBe(true)
            expect(mockPrismaClient.medicalExam.delete).toHaveBeenCalledWith({
                where: { id: 'exam1' }
            })
        })
    })
})
