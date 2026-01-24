import { addPulmonaryRecord, getPulmonaryHistory } from './pulmonary'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

// Mocks
jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
    pruebaFuncionPulmonar: {
        create: jest.fn(),
        findMany: jest.fn(),
    },
    persona: {
        findUnique: jest.fn(),
    },
    fichaClinica: {
        findUnique: jest.fn(),
    },
    usuarioSistema: {
        findFirst: jest.fn(),
    },
    logAccesoSistema: {
        create: jest.fn(),
    }
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
                // Mock Ficha resolution
                ; (prisma.fichaClinica.findUnique as jest.Mock).mockResolvedValue({ id: 'fc1' })
                ; (prisma.pruebaFuncionPulmonar.create as jest.Mock).mockResolvedValue({ id: 'pf1' })

            const result = await addPulmonaryRecord(formData)

            expect(prisma.pruebaFuncionPulmonar.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    fichaClinicaId: 'fc1',
                    walkDistance: 400,
                    spo2Rest: 98,
                    spo2Final: 95,
                    cvfValue: 3.5,
                    cvfPercent: 80,
                    vef1Value: 2.8,
                    vef1Percent: 75,
                    dlcoPercent: 60,
                    notas: 'Test Notes'
                })
            })
            expect(result).toEqual({ message: 'Registro guardado exitosamente' })
        })

        it('blocks unauthorized roles (PATIENT)', async () => {
            (auth as jest.Mock).mockResolvedValue({
                user: { email: 'patient@test.com', role: 'PACIENTE' }
            })
            const result = await addPulmonaryRecord(formData)
            expect(result.message).toContain('No autorizado')
        })

        it('allows KINESIOLOGIST role', async () => {
            (auth as jest.Mock).mockResolvedValue({
                user: { email: 'kin@test.com', role: 'KINESIOLOGO' }
            })
                ; (prisma.fichaClinica.findUnique as jest.Mock).mockResolvedValue({ id: 'fc1' })
                ; (prisma.pruebaFuncionPulmonar.create as jest.Mock).mockResolvedValue({ id: 'pf2' })

            const result = await addPulmonaryRecord(formData)
            expect(result.message).toBe('Registro guardado exitosamente')
        })

        it('creates record with null optional values', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'test@test.com', id: 'u1', role: 'ADMIN' } })
                ; (prisma.fichaClinica.findUnique as jest.Mock).mockResolvedValue({ id: 'fc1' })
                ; (prisma.pruebaFuncionPulmonar.create as jest.Mock).mockResolvedValue({ id: 'pf2' })

            const emptyFormData = new FormData()
            emptyFormData.append('patientId', 'p1')
            emptyFormData.append('date', '2025-01-01')
            // No optional fields added

            await addPulmonaryRecord(emptyFormData)

            expect(prisma.pruebaFuncionPulmonar.create).toHaveBeenCalledWith({
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
                ; (prisma.fichaClinica.findUnique as jest.Mock).mockResolvedValue({ id: 'fc1' })
                ; (prisma.pruebaFuncionPulmonar.create as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const result = await addPulmonaryRecord(formData)
            expect(result).toEqual({ message: 'Error al guardar el registro: DB Error' })
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
            const mockHistory = [{ id: '1', fecha: new Date() }]
                ; (prisma.fichaClinica.findUnique as jest.Mock).mockResolvedValue({ id: 'fc1' })
                ; (prisma.pruebaFuncionPulmonar.findMany as jest.Mock).mockResolvedValue(mockHistory)

            const result = await getPulmonaryHistory('p1')
            // Tests expectation: mapped date property
            expect(result).toMatchObject([{ id: '1', date: mockHistory[0].fecha }])
        })

        it('blocks IDOR for PATIENT accessing another profile', async () => {
            (auth as jest.Mock).mockResolvedValue({
                user: { id: 'user1', email: 'user1@test.com', role: 'PACIENTE' }
            })
                // Patient user1 tries to access profile of patientId 'p2'
                // Mock finding persona for the logged in user
                ; (prisma.persona.findUnique as jest.Mock).mockResolvedValue({ id: 'user1', email: 'user1@test.com' })

            const result = await getPulmonaryHistory('p2')
            expect(result).toEqual([])
        })

        it('allows PATIENT accessing their own profile', async () => {
            (auth as jest.Mock).mockResolvedValue({
                user: { id: 'user1', email: 'user1@test.com', role: 'PACIENTE' }
            })

                // Mock finding persona for the logged in user (matches requested p1)
                ; (prisma.persona.findUnique as jest.Mock).mockResolvedValue({ id: 'user1', email: 'user1@test.com' })
                ; (prisma.fichaClinica.findUnique as jest.Mock).mockResolvedValue({ id: 'fc1' })

            const mockHistory = [{ id: '1', fecha: new Date() }]
                ; (prisma.pruebaFuncionPulmonar.findMany as jest.Mock).mockResolvedValue(mockHistory)

            const result = await getPulmonaryHistory('user1')
            expect(result).toMatchObject([{ id: '1', date: mockHistory[0].fecha }])
        })

        it('returns empty array on db error', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'test@test.com' } })
                ; (prisma.fichaClinica.findUnique as jest.Mock).mockResolvedValue({ id: 'fc1' })
                ; (prisma.pruebaFuncionPulmonar.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const result = await getPulmonaryHistory('p1')
            expect(result).toEqual([])
        })
    })
})
