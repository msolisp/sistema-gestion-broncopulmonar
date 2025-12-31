import { authenticate, registerPatient, bookAppointment, logout, updatePatientProfile, adminCreatePatient, adminUpdatePatient, deletePatient } from './actions'
import { signIn, signOut } from '@/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { AuthError } from 'next-auth'

// Mocks
jest.mock('@/auth', () => ({
    signIn: jest.fn(),
    signOut: jest.fn(),
    auth: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
    user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    patient: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
    },
    appointment: {
        create: jest.fn(),
    },
    $transaction: jest.fn((arg) => {
        if (Array.isArray(arg)) return Promise.all(arg)
        return arg(prisma)
    }),
}))

jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
}))

jest.mock('next/cache', () => ({
    __esModule: true,
    revalidatePath: jest.fn(),
}))

describe('Server Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('authenticate', () => {
        it('calls signIn with correct credentials', async () => {
            const formData = new FormData()
            formData.append('email', 'test@test.com')
            formData.append('password', 'password123')

            await authenticate(undefined, formData)

            expect(signIn).toHaveBeenCalledWith('credentials', {
                email: 'test@test.com',
                password: 'password123',
                redirectTo: '/reservar',
            })
        })

        it('handles specific AuthError', async () => {
            const error = new AuthError('Invalid credentials.')
            error.type = 'CredentialsSignin'
                ; (signIn as jest.Mock).mockRejectedValueOnce(error)

            const formData = new FormData()
            formData.append('email', 'test@test.com')
            formData.append('password', 'password123')

            const result = await authenticate(undefined, formData)

            expect(result).toBe('Credenciales inválidas.')
        })

        it('handles generic AuthError', async () => {
            const error = new AuthError('Something else')
            error.type = 'CallbackRouteError'
                ; (signIn as jest.Mock).mockRejectedValueOnce(error)

            const formData = new FormData()
            formData.append('email', 'test@test.com')
            formData.append('password', 'password123')

            const result = await authenticate(undefined, formData)

            expect(result).toBe('Algo salió mal.')
        })

        it('throws unrelated errors', async () => {
            const error = new Error('Random error')
                ; (signIn as jest.Mock).mockRejectedValueOnce(error)

            const formData = new FormData()
            formData.append('email', 'test@test.com')
            formData.append('password', 'password123')

            await expect(authenticate(undefined, formData)).rejects.toThrow('Random error')
        })

        it('redirects to dashboard for ADMIN', async () => {
            const formData = new FormData()
            formData.append('email', 'admin@test.com')
            formData.append('password', 'password123')

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'ADMIN' })

            await authenticate(undefined, formData)

            expect(signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
                redirectTo: '/dashboard'
            }))
        })

        it('redirects to portal for others', async () => {
            const formData = new FormData()
            formData.append('email', 'patient@test.com')
            formData.append('password', 'password123')

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'PATIENT' })

            await authenticate(undefined, formData)

            expect(signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
                redirectTo: '/portal'
            }))
        })

        it('rethrows NEXT_REDIRECT', async () => {
            const error = new Error('NEXT_REDIRECT')
                ; (signIn as jest.Mock).mockRejectedValueOnce(error)

            const formData = new FormData()
            formData.append('email', 'test@test.com')
            formData.append('password', 'password123')

            await expect(authenticate(undefined, formData)).rejects.toThrow('NEXT_REDIRECT')
        })
    })

})

describe('logout', () => {
    it('calls signOut', async () => {
        const { logout } = require('./actions')
        await logout()
        expect(signOut).toHaveBeenCalledWith({ redirectTo: '/login' })
    })
})

describe('registerPatient', () => {
    const formData = new FormData()
    formData.append('email', 'new@test.com')
    formData.append('password', 'password123')
    formData.append('name', 'New User')
    formData.append('rut', '12345678-9')
    formData.append('commune', 'SANTIAGO')

    it('returns error if fields missing', async () => {
        const emptyData = new FormData()
        const result = await registerPatient(null, emptyData)
        expect(result.message).toContain('Datos inválidos')
    })

    it('returns error if password too short', async () => {
        const weakData = new FormData()
        weakData.append('email', 'test@test.com')
        weakData.append('password', '123')
        weakData.append('name', 'Name')
        weakData.append('rut', '12345678-9')
        weakData.append('commune', 'C')

        const result = await registerPatient(null, weakData)
        expect(result.message).toContain('Datos inválidos')
    })

    it('returns error if user exists', async () => {
        ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1' })
        const result = await registerPatient(null, formData)
        expect(result).toEqual({ message: 'Email already exists' })
    })

    it('creates user and patient on success', async () => {
        ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
            ; (bcrypt.hash as jest.Mock).mockResolvedValue('hashed')
            ; (prisma.user.create as jest.Mock).mockResolvedValue({ id: 'user1' })
            ; (prisma.$transaction as jest.Mock).mockImplementationOnce(async (callback) => {
                await callback(prisma)
            })

        const result = await registerPatient(null, formData)

        expect(prisma.user.create).toHaveBeenCalled()
        expect(prisma.patient.create).toHaveBeenCalled()
        expect(result).toEqual({ message: 'Success' })
    })

    it('handles database errors', async () => {
        ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
            ; (prisma.$transaction as jest.Mock).mockRejectedValueOnce(new Error('DB Error'))

        const result = await registerPatient(null, formData)
        expect(result).toEqual({ message: 'Database Error: Failed to Create User' })
    })
})

describe('bookAppointment', () => {
    const formData = new FormData()
    formData.append('date', '2025-01-01T10:00:00.000Z')
    formData.append('notes', 'Notes')

    it('returns unauthorized if no session', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue(null)

        const result = await bookAppointment(null, formData)
        expect(result).toEqual({ message: 'Unauthorized, please log in.' })
    })

    it('returns error if date missing', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'test@test.com' } })
        const emptyData = new FormData()
        const result = await bookAppointment(null, emptyData)
        expect(result.message).toContain('Datos inválidos')
    })

    it('returns error if profile not found', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'test@test.com' } })
            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

        const result = await bookAppointment(null, formData)
        expect(result.message).toContain('Patient profile not found')
    })

    it('successfully books appointment', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'test@test.com' } })
            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: '1',
                patientProfile: { id: 'p1' }
            })

        const result = await bookAppointment(null, formData)
        expect(result).toEqual({ message: 'Success' })
    })
})

describe('updatePatientProfile', () => {
    const formData = new FormData()
    formData.append('name', 'Updated Name')
    formData.append('phone', '123456789')
    formData.append('address', 'New Address')
    formData.append('commune', 'New Commune')
    formData.append('gender', 'Male')
    formData.append('healthSystem', 'FONASA')
    formData.append('birthDate', '1990-01-01')

    it('returns unauthorized', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue(null)
        const result = await updatePatientProfile(null, formData)
        expect(result).toEqual({ message: 'Unauthorized' })
    })

    it('updates successfully', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'test@test.com' } })
            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: '1',
                patientProfile: { id: 'p1' }
            })
            ; (prisma.user.update as jest.Mock).mockResolvedValue({})
            ; (prisma.patient.update as jest.Mock).mockResolvedValue({})

        const result = await updatePatientProfile(null, formData)
        expect(result).toEqual({ message: 'Success' })
    })

    it('handles database errors', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'test@test.com' } })
            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: '1',
                patientProfile: { id: 'p1' }
            })
            ; (prisma.$transaction as jest.Mock).mockRejectedValueOnce(new Error('DB Error'))

        const result = await updatePatientProfile(null, formData)
        expect(result).toEqual({ message: 'Failed to update profile' })
    })
})

describe('Admin Actions', () => {
    const formData = new FormData()
    formData.append('name', 'Admin Created')
    formData.append('email', 'admin@created.com')
    formData.append('rut', '12345678-9')
    formData.append('commune', 'SANTIAGO')
    formData.append('address', 'Test Address')
    formData.append('gender', 'Masculino')
    formData.append('healthSystem', 'FONASA')
    formData.append('birthDate', '1990-01-01')
    formData.append('password', 'password123')

    it('adminCreatePatient checks admin role', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'user@test.com', role: 'PATIENT' } })
        const result = await adminCreatePatient(null, formData)
        expect(result.message).toContain('Unauthorized')
    })

    it('adminCreatePatient succeeds if admin', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
            ; (bcrypt.hash as jest.Mock).mockResolvedValue('hashed')
            ; (prisma.user.create as jest.Mock).mockResolvedValue({ id: 'u1' })
            ; (prisma.patient.create as jest.Mock).mockResolvedValue({})
            ; (prisma.$transaction as jest.Mock).mockImplementationOnce(async (callback) => {
                await callback(prisma)
            })

        const result = await adminCreatePatient(null, formData)
        expect(result).toEqual({ message: 'Success' })
    })

    it('adminCreatePatient handles transaction error', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
            ; (prisma.$transaction as jest.Mock).mockRejectedValueOnce(new Error('DB Error'))

        const result = await adminCreatePatient(null, formData)
        expect(result).toEqual({ message: 'Error al crear paciente' })
    })

    const patientData = new FormData()
    patientData.append('id', 'p1')
    patientData.append('name', 'Updated')
    patientData.append('rut', '11111111-1')
    patientData.append('commune', 'Arica')

    it('adminUpdatePatient succeeds', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
            ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', userId: 'u1' })
            ; (prisma.user.update as jest.Mock).mockResolvedValue({})
            ; (prisma.patient.update as jest.Mock).mockResolvedValue({})

        const result = await adminUpdatePatient(null, patientData)
        expect(result).toEqual({ message: 'Success' })
    })

    it('adminUpdatePatient handles db error', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
            ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', userId: 'u1' })
            ; (prisma.$transaction as jest.Mock).mockRejectedValueOnce(new Error('DB Error'))

        const result = await adminUpdatePatient(null, patientData)
        expect(result.message).toContain('Error al actualizar')
    })

    it('adminUpdatePatient returns error if patient not found', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
            ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue(null)

        const result = await adminUpdatePatient(null, patientData)
        expect(result).toEqual({ message: 'Paciente no encontrado' })
    })

    it('deletePatient succeeds', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
            ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', userId: 'u1' })
            ; (prisma.user.delete as jest.Mock).mockResolvedValue({})

        const delData = new FormData()
        delData.append('id', 'p1')
        const result = await deletePatient(null, delData)
        expect(result).toEqual({ message: 'Success' })
    })

    it('deletePatient handles db error', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
            ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', userId: 'u1' })
            ; (prisma.user.delete as jest.Mock).mockRejectedValueOnce(new Error('Delete failed'))

        const delData = new FormData()
        delData.append('id', 'p1')
        const result = await deletePatient(null, delData)
        expect(result).toEqual({ message: 'Error al eliminar paciente' })
    })
})
