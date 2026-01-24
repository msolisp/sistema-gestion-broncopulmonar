
import { registerPatient, updatePatientProfile, adminCreatePatient, adminUpdatePatient, deletePatient } from './actions.patients'
import { checkPersonaExists, createPatient, updatePatient, getPersonaByEmail } from '@/lib/fhir-adapters'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { AuthError } from 'next-auth'

// Mock dependencies (Auth, Prisma, Adapters, Next)
jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

jest.mock('@/lib/prisma', () => {
    const mockClient: any = {
        persona: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
        },
        usuarioSistema: {
            findFirst: jest.fn(),
        },
        logAccesoSistema: {
            create: jest.fn(),
        },
        $transaction: jest.fn((arg: any) => {
            if (Array.isArray(arg)) return Promise.all(arg)
            return arg(mockClient)
        })
    }
    return {
        __esModule: true,
        default: mockClient,
        prisma: mockClient
    }
})

jest.mock('@/lib/fhir-adapters', () => ({
    createPatient: jest.fn(),
    updatePatient: jest.fn(),
    checkPersonaExists: jest.fn(),
    getPersonaByEmail: jest.fn(),
}))

// NOTE: adminCreatePatient uses dynamic import for headers
jest.mock('next/headers', () => ({
    headers: jest.fn().mockReturnValue({
        get: jest.fn().mockReturnValue('127.0.0.1')
    })
}))

describe('Patient Actions', () => {
    const formData = new FormData()
    formData.append('email', 'new@test.com')
    formData.append('password', 'Password123!')
    formData.append('name', 'New User')
    formData.append('rut', '12.345.678-5')
    formData.append('commune', 'SANTIAGO')

    beforeEach(() => {
        jest.clearAllMocks()
            // Default mocks
            ; (checkPersonaExists as jest.Mock).mockResolvedValue(null)
            ; (createPatient as jest.Mock).mockResolvedValue({ id: 'p1' })
            ; (updatePatient as jest.Mock).mockResolvedValue({ id: 'p1' })
            ; (prisma.persona.findUnique as jest.Mock).mockResolvedValue(null)
            ; (prisma.persona.findFirst as jest.Mock).mockResolvedValue(null)
    })

    describe('registerPatient', () => {
        it('returns error if fields missing', async () => {
            const emptyData = new FormData()
            const result = await registerPatient(null, emptyData)
            expect(result.message).toContain('Datos inválidos')
        })

        it('returns error if RUT exists', async () => {
            // checkPersonaExists returns object if found
            ; (checkPersonaExists as jest.Mock).mockResolvedValue({ rut: '12.345.678-5' })
            const result = await registerPatient(null, formData)
            // Expect to fail on RUT check
            expect(result.message).toContain('RUT ya está registrado')
        })

        it('creates patient on success', async () => {
            const result = await registerPatient(null, formData)
            expect(result).toEqual({ message: 'Success' })
            expect(createPatient).toHaveBeenCalled()
        })
    })

    describe('updatePatientProfile', () => {
        const updateData = new FormData()
        updateData.append('name', 'Updated Name')
        updateData.append('commune', 'New Commune')
        updateData.append('address', 'New Address')

        it('returns unauthorized if no session', async () => {
            (auth as jest.Mock).mockResolvedValue(null)
            const result = await updatePatientProfile(null, updateData)
            expect(result).toEqual({ message: 'Unauthorized' })
        })

        it('updates successfully', async () => {
            // Need user.id for update
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'test@test.com', id: 'p1' } })
            const result = await updatePatientProfile(null, updateData)
            expect(result).toEqual({ message: 'Success' })
            expect(updatePatient).toHaveBeenCalled()
        })
    })

    describe('Admin Actions (Patients)', () => {
        const adminData = new FormData()
        adminData.append('name', 'Admin Created')
        adminData.append('email', 'admin@created.com')
        adminData.append('rut', '12.345.678-5')
        adminData.append('commune', 'SANTIAGO')
        adminData.append('password', 'Password123!')
        adminData.append('region', 'RM')

        it('adminCreatePatient succeeds if admin', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN', id: 'admin1' } })

                // Should also mock internal user lookup for logic audit
                ; (prisma.usuarioSistema.findFirst as jest.Mock).mockResolvedValue({ id: 'staff1' })

            const result = await adminCreatePatient(null, adminData)
            expect(result).toEqual({ message: 'Success' })
            expect(createPatient).toHaveBeenCalled()
        })

        it('adminCreatePatient checks role', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'user@test.com', role: 'PACIENTE' } })
            const result = await adminCreatePatient(null, adminData)
            expect(result.message).toContain('Unauthorized')
        })
    })
})
