import { addPulmonaryRecord, getPulmonaryHistory } from './pulmonary'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

// Mocks
jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
    pulmonaryFunctionTest: {
        create: jest.fn(),
        findMany: jest.fn(),
    },
    patient: {
        findUnique: jest.fn(),
    },
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

describe('Pulmonary Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('addPulmonaryRecord', () => {
        const formData = new FormData()
        formData.append('patientId', 'p1')
        formData.append('date', '2025-01-01')
        formData.append('notes', 'Test Notes')
        formData.append('walkDistance', '400')
        formData.append('spo2Rest', '98')
        formData.append('spo2Final', '95')
        formData.append('cvfValue', '3.5')
        formData.append('cvfPercent', '80')
        formData.append('vef1Value', '2.8')
        formData.append('vef1Percent', '75')
        formData.append('dlcoPercent', '60')

        it('returns unauthorized if no session', async () => {
            (auth as jest.Mock).mockResolvedValue(null)
            const result = await addPulmonaryRecord(formData)
            expect(result).toEqual({ message: 'No autenticado' })
        })

        it('successfully creates a record', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'test@test.com', id: 'u1', role: 'ADMIN' } })
                ; (prisma.pulmonaryFunctionTest.create as jest.Mock).mockResolvedValue({ id: 'pf1' })

            const result = await addPulmonaryRecord(formData)

            expect(prisma.pulmonaryFunctionTest.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    patientId: 'p1',
                    walkDistance: 400,
                    spo2Rest: 98,
                    spo2Final: 95,
                    cvfValue: 3.5,
                    cvfPercent: 80,
                    vef1Value: 2.8,
                    vef1Percent: 75,
                    dlcoPercent: 60,
                    notes: 'Test Notes'
                })
            })
            expect(result).toEqual({ message: 'Registro guardado exitosamente' })
        })

        it('blocks unauthorized roles (PATIENT)', async () => {
            (auth as jest.Mock).mockResolvedValue({
                user: { email: 'patient@test.com', role: 'PATIENT' }
            })
            const result = await addPulmonaryRecord(formData)
            expect(result.message).toContain('No autorizado')
        })

        it('allows KINESIOLOGIST role', async () => {
            (auth as jest.Mock).mockResolvedValue({
                user: { email: 'kin@test.com', role: 'KINESIOLOGIST' }
            })
                ; (prisma.pulmonaryFunctionTest.create as jest.Mock).mockResolvedValue({ id: 'pf2' })

            const result = await addPulmonaryRecord(formData)
            expect(result.message).toBe('Registro guardado exitosamente')
        })

        it('creates record with null optional values', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'test@test.com', id: 'u1', role: 'ADMIN' } })
                ; (prisma.pulmonaryFunctionTest.create as jest.Mock).mockResolvedValue({ id: 'pf2' })

            const emptyFormData = new FormData()
            emptyFormData.append('patientId', 'p1')
            emptyFormData.append('date', '2025-01-01')
            // No optional fields added

            await addPulmonaryRecord(emptyFormData)

            expect(prisma.pulmonaryFunctionTest.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    walkDistance: null,
                    spo2Rest: null,
                    spo2Final: null,
                    cvfValue: null,
                    cvfPercent: null,
                    vef1Value: null,
                    vef1Percent: null,
                    dlcoPercent: null
                })
            })
        })

        it('handles database errors gracefully', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'test@test.com', id: 'u1', role: 'ADMIN' } })
                ; (prisma.pulmonaryFunctionTest.create as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const result = await addPulmonaryRecord(formData)
            expect(result).toEqual({ message: 'Error al guardar el registro' })
        })
    })

    describe('getPulmonaryHistory', () => {
        it('returns empty array if not authenticated', async () => {
            (auth as jest.Mock).mockResolvedValue(null)
            const result = await getPulmonaryHistory('p1')
            expect(result).toEqual([])
        })

        it('returns records if authenticated', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'test@test.com', id: 'u1', role: 'ADMIN' } })
            const mockHistory = [{ id: '1', date: new Date() }]
                ; (prisma.pulmonaryFunctionTest.findMany as jest.Mock).mockResolvedValue(mockHistory)

            const result = await getPulmonaryHistory('p1')
            expect(result).toEqual(mockHistory)
        })

        it('blocks IDOR for PATIENT accessing another profile', async () => {
            (auth as jest.Mock).mockResolvedValue({
                user: { id: 'user1', role: 'PATIENT' }
            })
                // Patient user1 tries to access profile of patientId 'p2' (owned by user2)
                ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({ userId: 'user2' })

            const result = await getPulmonaryHistory('p2')
            expect(result).toEqual([])
            // expect(console.error).not.toHaveBeenCalled() 
        })

        it('allows PATIENT accessing their own profile', async () => {
            (auth as jest.Mock).mockResolvedValue({
                user: { id: 'user1', role: 'PATIENT' }
            })
                // Patient user1 accesses profile 'p1' (owned by user1)
                ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({ userId: 'user1' })

            const mockHistory = [{ id: '1', date: new Date() }]
                ; (prisma.pulmonaryFunctionTest.findMany as jest.Mock).mockResolvedValue(mockHistory)

            const result = await getPulmonaryHistory('p1')
            expect(result).toEqual(mockHistory)
        })

        it('returns empty array on db error', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'test@test.com' } })
                ; (prisma.pulmonaryFunctionTest.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const result = await getPulmonaryHistory('p1')
            expect(result).toEqual([])
        })
    })
})
