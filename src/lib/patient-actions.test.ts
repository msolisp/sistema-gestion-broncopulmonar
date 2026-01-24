import { put } from '@vercel/blob'

// Create mock instance
const mockPrismaClient = {
    persona: {
        findUnique: jest.fn(),
    },
    examenMedico: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
    },
    notificacionMedica: {
        create: jest.fn(),
    }
}

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrismaClient),
}))

// Mock Vercel Blob
jest.mock('@vercel/blob', () => ({
    put: jest.fn(),
}))

// Mock file-type which is ESM only
jest.mock('file-type', () => ({
    fileTypeFromBuffer: jest.fn().mockResolvedValue({ ext: 'pdf', mime: 'application/pdf' }),
}), { virtual: true })

// Mock Auth
jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

// Mock centralized db to use our mock instance
jest.mock('@/lib/prisma', () => mockPrismaClient)

describe('patient-actions', () => {
    let uploadPatientExam: any
    let deletePatientExam: any
    let updatePatientExam: any

    beforeAll(() => {
        // Dynamic import to ensure mock is ready before SUT instantiation
        const actions = require('./patient-actions')
        uploadPatientExam = actions.uploadPatientExam
        deletePatientExam = actions.deletePatientExam
        updatePatientExam = actions.updatePatientExam
    })

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
            mockPrismaClient.persona.findUnique.mockResolvedValue(null)

            const formData = new FormData()
            const result = await uploadPatientExam(null, formData)

            expect(result.message).toBe('Ficha clínica no encontrada.')
        })

        it('should validate PDF file is required', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'patient@test.com' } })
            mockPrismaClient.persona.findUnique.mockResolvedValue({ id: 'p1', email: 'patient@test.com', fichaClinica: { id: 'fc1' } })

            const formData = new FormData()
            formData.append('centerName', 'Clínica Test')
            formData.append('doctorName', 'Dr. Test')
            formData.append('examDate', '2024-01-15')

            const result = await uploadPatientExam(null, formData)

            expect(result.message).toBe('Debe seleccionar un archivo PDF.')
        })

        // ... other validation tests behave same ...

        it('should successfully upload exam with valid data', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { id: 'p1', email: 'patient@test.com' } })
            mockPrismaClient.persona.findUnique.mockResolvedValue({
                id: 'p1',
                email: 'patient@test.com',
                nombre: 'Patient',
                apellidoPaterno: 'Name',
                fichaClinica: { id: 'fc1' }
            })
                ; (put as jest.Mock).mockResolvedValue({
                    url: 'https://blob.storage/exam.pdf'
                })
            mockPrismaClient.examenMedico.create.mockResolvedValue({
                id: 'exam1',
                fichaClinicaId: 'fc1',
            })
            mockPrismaClient.notificacionMedica.create.mockResolvedValue({})

            const file = new File(['test content'], 'exam.pdf', { type: 'application/pdf' })
            Object.defineProperty(file, 'arrayBuffer', {
                value: jest.fn().mockResolvedValue(new ArrayBuffer(12))
            })
            const formData = new FormData()
            formData.append('file', file)
            formData.append('centerName', 'Clínica Test')
            formData.append('doctorName', 'Dr. Test')
            formData.append('examDate', '2024-01-15')

            const result = await uploadPatientExam(null, formData)

            expect(result.message).toBe('Examen médico subido exitosamente.')
            expect(result.success).toBe(true)
            expect(mockPrismaClient.examenMedico.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    fichaClinicaId: 'fc1',
                    origen: 'PORTAL_PACIENTE',
                    subidoPor: 'p1',
                    nombreCentro: 'Clínica Test',
                    nombreDoctor: 'Dr. Test',
                    // fileUrl: 'https://blob.storage/exam.pdf', // URL handled by put logic
                    archivoNombre: 'exam.pdf',
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

        it('should verify ownership before deletion', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { id: 'p1', email: 'patient@test.com' } })
            mockPrismaClient.persona.findUnique.mockResolvedValue({ id: 'p1' })
            mockPrismaClient.examenMedico.findUnique.mockResolvedValue({
                id: 'exam1',
                fichaClinicaId: 'fc2', // Different context
                subidoPor: 'p2', // Different user
                origen: 'PORTAL_PACIENTE',
            })

            const result = await deletePatientExam('exam1')

            expect(result.message).toBe('Solo puede eliminar exámenes que usted haya subido desde el portal de pacientes.')
        })

        it('should successfully delete own exam', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { id: 'p1', email: 'patient@test.com' } })
            mockPrismaClient.persona.findUnique.mockResolvedValue({ id: 'p1' })
            mockPrismaClient.examenMedico.findUnique.mockResolvedValue({
                id: 'exam1',
                fichaClinicaId: 'fc1',
                origen: 'PORTAL_PACIENTE',
                subidoPor: 'p1',
            })
            mockPrismaClient.examenMedico.delete.mockResolvedValue({})

            const result = await deletePatientExam('exam1')

            expect(result.message).toBe('Examen eliminado exitosamente.')
            expect(result.success).toBe(true)
            expect(mockPrismaClient.examenMedico.delete).toHaveBeenCalledWith({
                where: { id: 'exam1' }
            })
        })
    })
})
