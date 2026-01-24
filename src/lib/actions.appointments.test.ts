
import { bookAppointment } from './actions.appointments'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

// Mock dependencies
jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

jest.mock('@/lib/prisma', () => {
    const mockClient: any = {
        fichaClinica: {
            findUnique: jest.fn(),
        },
        cita: {
            create: jest.fn(),
        },
    }
    return {
        __esModule: true,
        default: mockClient,
        prisma: mockClient
    }
})

describe('Appointment Actions', () => {
    const formData = new FormData()
    formData.append('date', '2027-01-01T10:00:00.000Z')
    formData.append('notes', 'Notes')

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('bookAppointment', () => {
        it('returns unauthorized if no session', async () => {
            (auth as jest.Mock).mockResolvedValue(null)
            const result = await bookAppointment(null, formData)
            expect(result).toEqual({ message: 'Unauthorized, please log in.' })
        })

        it('returns error if date missing', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'test@test.com' } })
            const emptyData = new FormData()
            const result = await bookAppointment(null, emptyData)
            expect(result.message).toContain('Datos inválidos')
        })

        it('returns error if profile not found', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'test@test.com', id: 'p1' } })
                ; (prisma.fichaClinica.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await bookAppointment(null, formData)
            expect(result.message).toContain('Ficha clínica no encontrada')
        })

        it('successfully books appointment', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'test@test.com', id: 'p1' } })
                ; (prisma.fichaClinica.findUnique as jest.Mock).mockResolvedValue({ id: 'fc1' })
                ; (prisma.cita.create as jest.Mock).mockResolvedValue({ id: 'c1' })

            const result = await bookAppointment(null, formData)
            expect(result).toEqual({ message: 'Success' })
        })

        it('handles database error', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'test@test.com', id: 'p1' } })
                ; (prisma.fichaClinica.findUnique as jest.Mock).mockResolvedValue({ id: 'fc1' })
                ; (prisma.cita.create as jest.Mock).mockRejectedValueOnce(new Error('DB Error'))

            const result = await bookAppointment(null, formData)
            expect(result).toEqual({ message: 'Error al agendar cita' })
        })
    })
})
