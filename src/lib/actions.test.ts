import { authenticate, registerPatient, bookAppointment, logout, updatePatientProfile, adminCreatePatient, adminUpdatePatient, deletePatient, uploadMedicalExam } from './actions'

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
    medicalExam: {
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


jest.mock('@vercel/blob', () => ({
    put: jest.fn(),
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
            expect(signIn).toHaveBeenCalledWith('credentials', {
                email: 'test@test.com',
                password: 'password123',
                redirectTo: '/reservar',
            })
        })

        it('returns error if validation fails', async () => {
            const formData = new FormData()
            formData.append('email', 'invalid-email')
            formData.append('password', '')
            const result = await authenticate(undefined, formData)
            expect(result).toBe('Datos inválidos')
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

        it('redirects to dashboard for KINESIOLOGIST', async () => {
            const formData = new FormData()
            formData.append('email', 'kine@test.com')
            formData.append('password', 'password123')

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'KINESIOLOGIST' })

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

    it('handles database error', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'test@test.com' } })
            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: '1',
                patientProfile: { id: 'p1' }
            })
            ; (prisma.appointment.create as jest.Mock).mockRejectedValueOnce(new Error('DB Error'))

        const result = await bookAppointment(null, formData)
        expect(result).toEqual({ message: 'Error booking appointment' })
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

    it('returns error if validation fails', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'test@test.com' } })
        const invalidData = new FormData()
        // Missing required 'name'
        const result = await updatePatientProfile(null, invalidData)
        expect(result.message).toContain('Datos inválidos')
    })

    it('returns error if profile not found', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'test@test.com' } })
            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: '1',
                patientProfile: null // No profile
            })

        const result = await updatePatientProfile(null, formData)
        expect(result.message).toContain('Profile not found')
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

    it('adminCreatePatient returns error if validation fails', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
        const invalidData = new FormData()
        const result = await adminCreatePatient(null, invalidData)
        expect(result.message).toContain('Datos inválidos')
    })

    it('adminCreatePatient returns error if password missing', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })

        const noPassData = new FormData()
        noPassData.append('name', 'Admin Created')
        noPassData.append('email', 'admin@created.com')
        noPassData.append('rut', '12345678-9')
        noPassData.append('commune', 'SANTIAGO')
        const result = await adminCreatePatient(null, noPassData)
        expect(result.message).toContain('La contraseña es obligatoria')
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

    it('adminUpdatePatient returns error if validation fails', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
        const invalidData = new FormData()
        // Missing required fields
        const result = await adminUpdatePatient(null, invalidData)
        expect(result.message).toContain('Datos inválidos')
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

    it('deletePatient returns error if validation fails', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
        const invalidData = new FormData()
        // Missing id
        const result = await deletePatient(null, invalidData)
        expect(result.message).toContain('Datos inválidos')
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

describe('uploadMedicalExam', () => {
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'arrayBuffer', {
        value: jest.fn().mockResolvedValue(new ArrayBuffer(10))
    })
    const formData = new FormData()
    formData.append('patientId', 'p1')
    formData.append('centerName', 'Center')
    formData.append('doctorName', 'Doctor')
    formData.append('examDate', '2025-01-01')
    formData.append('file', file)

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('returns unauthorized if not logged in', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue(null)
        const result = await uploadMedicalExam(formData)
        expect(result).toEqual({ message: 'Unauthorized' })
    })

    it('returns error if missing fields', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
        const emptyData = new FormData()
        const result = await uploadMedicalExam(emptyData)
        expect(result.message).toContain('Faltan campos obligatorios')
    })

    it('returns error if RBAC fails (patient trying to upload to another)', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'patient@test.com', role: 'PATIENT' } })
            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                patientProfile: { id: 'p2' } // Different ID
            })
        const result = await uploadMedicalExam(formData)
        expect(result.message).toContain('No autorizado')
    })

    it('allows patient to upload to own profile', async () => {
        const { auth } = require('@/auth')
        const { put } = require('@vercel/blob')
        auth.mockResolvedValue({ user: { email: 'patient@test.com', role: 'PATIENT' } })
            ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                patientProfile: { id: 'p1' } // Same ID
            })
            ; (prisma.medicalExam.create as jest.Mock).mockResolvedValue({})
            ; (put as jest.Mock).mockResolvedValue({ url: 'https://blob.vercel-storage.com/test.pdf' })

        const result = await uploadMedicalExam(formData)
        expect(result).toEqual({ success: true })
        expect(put).toHaveBeenCalled()
    })

    it('allows admin/kine to upload', async () => {
        const { auth } = require('@/auth')
        const { put } = require('@vercel/blob')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
            ; (prisma.medicalExam.create as jest.Mock).mockResolvedValue({})
            ; (put as jest.Mock).mockResolvedValue({ url: 'https://blob.vercel-storage.com/test.pdf' })

        const result = await uploadMedicalExam(formData)
        expect(result).toEqual({ success: true })
        expect(put).toHaveBeenCalled()
    })

    it('returns error if file empty', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
        const emptyFile = new File([], 'test.pdf', { type: 'application/pdf' })
        const data = new FormData()
        data.append('patientId', 'p1')
        data.append('centerName', 'Center')
        data.append('doctorName', 'Doctor')
        data.append('examDate', '2025-01-01')
        data.append('file', emptyFile)

        const result = await uploadMedicalExam(data)
        expect(result.message).toContain('El archivo está vacío')
    })

    it('returns error if not PDF', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
        const txtFile = new File(['content'], 'test.txt', { type: 'text/plain' })
        const data = new FormData()
        data.append('patientId', 'p1')
        data.append('centerName', 'Center')
        data.append('doctorName', 'Doctor')
        data.append('examDate', '2025-01-01')
        data.append('file', txtFile)

        const result = await uploadMedicalExam(data)
        expect(result.message).toContain('Solo se permiten archivos PDF')
    })

    it('handles processing error', async () => {
        const { auth } = require('@/auth')
        const { put } = require('@vercel/blob')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
        put.mockRejectedValue(new Error('Upload Failed'))

        const result = await uploadMedicalExam(formData)
        expect(result.message).toContain('Error al subir el archivo: Upload Failed')
    })
})
