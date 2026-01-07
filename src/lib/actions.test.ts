import { authenticate, registerPatient, bookAppointment, logout, updatePatientProfile, adminCreatePatient, adminUpdatePatient, deletePatient, uploadMedicalExam, adminCreateSystemUser, adminUpdateSystemUser, adminDeleteSystemUser, toggleRolePermission, changePassword, seedPermissions } from './actions'

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

jest.mock('@/lib/prisma', () => {
    const mockClient: any = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            upsert: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findFirst: jest.fn(),
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
        systemLog: {
            create: jest.fn(),
        },
        rolePermission: {
            upsert: jest.fn(),
        },
        $transaction: jest.fn()
    }

    mockClient.$transaction.mockImplementation((arg: any) => {
        if (Array.isArray(arg)) return Promise.all(arg)
        return arg(mockClient)
    })

    return mockClient
})

jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
}))

jest.mock('next/cache', () => ({
    __esModule: true,
    revalidatePath: jest.fn(),
}))

jest.mock('file-type', () => ({
    fileTypeFromBuffer: jest.fn().mockResolvedValue({ mime: 'application/pdf' }),
}), { virtual: true })

jest.mock('@vercel/blob', () => ({
    put: jest.fn(),
}))
jest.mock('./logger', () => ({
    logAction: jest.fn(),
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
                // Default to patient portal logic
                ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({ active: true, email: 'test@test.com' })

            await authenticate(undefined, formData)

            expect(signIn).toHaveBeenCalledWith('credentials', {
                email: 'test@test.com',
                password: 'password123',
                redirectTo: '/portal',
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
                // Default to patient portal logic
                ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({ active: true, email: 'test@test.com' })

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
                // Default to patient portal logic
                ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({ active: true, email: 'test@test.com' })

            const formData = new FormData()
            formData.append('email', 'test@test.com')
            formData.append('password', 'password123')

            const result = await authenticate(undefined, formData)

            expect(result).toBe('Algo salió mal.')
        })

        it('throws unrelated errors', async () => {
            const error = new Error('Random error')
                ; (signIn as jest.Mock).mockRejectedValueOnce(error)
                // Default to patient portal logic
                ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({ active: true, email: 'test@test.com' })

            const formData = new FormData()
            formData.append('email', 'test@test.com')
            formData.append('password', 'password123')

            await expect(authenticate(undefined, formData)).rejects.toThrow('Random error')
        })

        it('redirects to dashboard for ADMIN', async () => {
            const formData = new FormData()
            formData.append('email', 'admin@test.com')
            formData.append('password', 'password123')
            formData.append('portal_type', 'internal')

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'ADMIN', active: true, email: 'admin@test.com' })

            await authenticate(undefined, formData)

            expect(signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
                redirectTo: '/dashboard'
            }))
        })

        it('redirects to dashboard for KINESIOLOGIST', async () => {
            const formData = new FormData()
            formData.append('email', 'kine@test.com')
            formData.append('password', 'password123')
            formData.append('portal_type', 'internal')

                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'KINESIOLOGIST', active: true, email: 'kine@test.com' })

            await authenticate(undefined, formData)

            expect(signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
                redirectTo: '/dashboard'
            }))
        })

        it('redirects to portal for others', async () => {
            const formData = new FormData()
            formData.append('email', 'patient@test.com')
            formData.append('password', 'password123')
                // No portal_type -> Patient logic
                ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({ active: true, email: 'patient@test.com' })

            await authenticate(undefined, formData)

            expect(signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
                redirectTo: '/portal'
            }))
        })

        it('rethrows NEXT_REDIRECT', async () => {
            const error = new Error('NEXT_REDIRECT')
                ; (signIn as jest.Mock).mockRejectedValueOnce(error)
                // Default to patient portal logic
                ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({ active: true, email: 'test@test.com' })

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
        ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({ id: '1' })
        const result = await registerPatient(null, formData)
        expect(result).toEqual({ message: 'Email already exists' })
    })

    it('creates patient on success', async () => {
        ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue(null)
            ; (prisma.patient.create as jest.Mock).mockResolvedValue({ id: '1' })
        const result = await registerPatient(null, formData)
        expect(result).toEqual({ message: 'Success' })
    })

    it('handles database error', async () => {
        (prisma.patient.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.patient.create as jest.Mock).mockRejectedValue(new Error('DB Error'))
        const result = await registerPatient(null, formData)
        expect(result).toEqual({ message: 'Database Error: Failed to Create Patient' })
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
            ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue(null)

        const result = await bookAppointment(null, formData)
        expect(result.message).toContain('Patient profile not found')
    })

    it('successfully books appointment', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'test@test.com' } })
            ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({
                id: 'p1'
            })

        const result = await bookAppointment(null, formData)
        expect(result).toEqual({ message: 'Success' })
    })

    it('handles database error', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'test@test.com' } })
            ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({
                id: 'p1'
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
        // Here we rely on prisma.patient.update failing if record doesn't exist
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'test@test.com' } })
            ; (prisma.patient.update as jest.Mock).mockRejectedValueOnce(new Error('Record to update not found.'))

        const result = await updatePatientProfile(null, formData)
        expect(result.message).toContain('Failed to update profile')
    })

    it('updates successfully', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'test@test.com' } })
            ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({
                id: 'p1'
            })
            ; (prisma.patient.update as jest.Mock).mockResolvedValue({})

        const result = await updatePatientProfile(null, formData)
        expect(result).toEqual({ message: 'Success' })
    })

    it('handles database errors', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'test@test.com' } })
            ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({
                id: 'p1'
            })
            ; (prisma.patient.update as jest.Mock).mockRejectedValueOnce(new Error('DB Error'))

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
            ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue(null)
            ; (prisma.patient.create as jest.Mock).mockResolvedValue({ id: 'p1' })
            ; (bcrypt.hash as jest.Mock).mockResolvedValue('hashed')

        const result = await adminCreatePatient(null, formData)
        expect(result).toEqual({ message: 'Success' })
    })

    it('adminCreatePatient handles transaction error', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
            ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue(null)
            ; (prisma.patient.create as jest.Mock).mockRejectedValueOnce(new Error('Error al crear paciente'))

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
    patientData.append('active', 'on')

    it('adminUpdatePatient succeeds', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
            ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({ id: 'p1' })
            ; (prisma.patient.update as jest.Mock).mockResolvedValue({})

        const result = await adminUpdatePatient(null, patientData)
        expect(result).toEqual({ message: 'Success' })
    })

    it('adminUpdatePatient handles db error', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
            ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({ id: 'p1' })
            ; (prisma.patient.update as jest.Mock).mockRejectedValueOnce(new Error('DB Error'))

        const result = await adminUpdatePatient(null, patientData)
        expect(result.message).toContain('Error al actualizar')
    })

    it('adminUpdatePatient returns error if patient not found', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
            ; (prisma.patient.update as jest.Mock).mockRejectedValueOnce(new Error('Record to update not found.'))

        const result = await adminUpdatePatient(null, patientData)
        // Adjust expectation to match catch block of adminUpdatePatient
        expect(result.message).toContain('Error al actualizar')
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
            ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({ id: 'p1' })
            ; (prisma.patient.delete as jest.Mock).mockResolvedValue({})

        const delData = new FormData()
        delData.append('id', 'p1')
        const result = await deletePatient(null, delData)
        expect(result).toEqual({ message: 'Success' })
    })

    it('deletePatient handles db error', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
            ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({ id: 'p1' })
            ; (prisma.patient.delete as jest.Mock).mockRejectedValueOnce(new Error('Delete failed'))

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

    beforeAll(() => {
        // Polyfill arrayBuffer for File/Blob in jsdom if missing
        if (!File.prototype.arrayBuffer) {
            File.prototype.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(10))
        }
    })

    beforeEach(() => {
        jest.clearAllMocks()
        const { fileTypeFromBuffer } = require('file-type')
            ; (fileTypeFromBuffer as jest.Mock).mockResolvedValue({ mime: 'application/pdf' })
    })

    it('returns unauthorized if not logged in', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue(null)
        const result = await uploadMedicalExam(formData)
        expect(result).toEqual({ message: 'Unauthorized' })
    })

    it('handles processing error', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
        const formData = new FormData()
        formData.append('patientId', '123')
        formData.append('centerName', 'Center')
        formData.append('doctorName', 'Doc')
        formData.append('examDate', '2024-01-01')

        const fakeFile = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' })
        formData.append('file', fakeFile)

        // Force an error during processing (e.g. at arrayBuffer or fileTypeFromBuffer)
        const { fileTypeFromBuffer } = require('file-type');
        (fileTypeFromBuffer as jest.Mock).mockRejectedValueOnce(new Error('Processing Error'))

        const result = await uploadMedicalExam(formData)
        expect(result.message).toContain('Error al procesar')
    })

    it('returns error if missing fields', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
        const emptyData = new FormData()
        const result = await uploadMedicalExam(emptyData)
        expect(result.message).toContain('Faltan campos obligatorios')
    })

    it('returns error if magic bytes do not match PDF', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
        const formData = new FormData()
        formData.append('patientId', '123')
        formData.append('centerName', 'Center')
        formData.append('doctorName', 'Doc')
        formData.append('examDate', '2024-01-01')

        const fakeFile = new File(['not a pdf'], 'test.pdf', { type: 'application/pdf' })
        formData.append('file', fakeFile)

        const { fileTypeFromBuffer } = require('file-type');
        (fileTypeFromBuffer as jest.Mock).mockResolvedValueOnce({ mime: 'image/png' })

        const result = await uploadMedicalExam(formData)
        expect(result).toEqual({ message: 'El archivo no es un PDF válido (Firma digital incorrecta).' })
    })

    it('returns error if RBAC fails (patient trying to upload to another)', async () => {
        const { auth } = require('@/auth')
        auth.mockResolvedValue({ user: { email: 'patient@test.com', role: 'PATIENT' } })
            ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({
                id: 'p2', // Different from formData 'p1'
                email: 'patient@test.com'
            })
        const result = await uploadMedicalExam(formData)
        expect(result.message).toContain('No autorizado')
    })

    it('allows patient to upload to own profile', async () => {
        const { auth } = require('@/auth')
        const { put } = require('@vercel/blob')
        auth.mockResolvedValue({ user: { email: 'patient@test.com', role: 'PATIENT' } })

        // Mock process.env to ensure we hit the Vercel Blob path or Mock path consistently
        // Let's force "production" behavior mostly to test the 'put' call, OR just test the 'mock' path if that's what we want.
        // Actually, the code checks: if (dev/test AND !token) -> mock. Else -> put.
        // To test 'put', we can set BLOB_READ_WRITE_TOKEN.
        process.env.BLOB_READ_WRITE_TOKEN = 'fake-token'

            ; (prisma.patient.findUnique as jest.Mock).mockResolvedValue({
                id: 'p1', // Same ID
                email: 'patient@test.com'
            })
            ; (prisma.medicalExam.create as jest.Mock).mockResolvedValue({})
            ; (put as jest.Mock).mockResolvedValue({ url: 'https://blob.vercel-storage.com/test.pdf' })

        const result = await uploadMedicalExam(formData)
        expect(result).toEqual({ success: true })
        expect(put).toHaveBeenCalled()

        delete process.env.BLOB_READ_WRITE_TOKEN
    })

    it('allows admin/kine to upload', async () => {
        const { auth } = require('@/auth')
        const { put } = require('@vercel/blob')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })

        process.env.BLOB_READ_WRITE_TOKEN = 'fake-token'

            ; (prisma.medicalExam.create as jest.Mock).mockResolvedValue({})
            ; (put as jest.Mock).mockResolvedValue({ url: 'https://blob.vercel-storage.com/test.pdf' })

        const result = await uploadMedicalExam(formData)
        expect(result).toEqual({ success: true })
        expect(put).toHaveBeenCalled()

        delete process.env.BLOB_READ_WRITE_TOKEN
    })

    // ... (other tests)

    it('handles processing error', async () => {
        const { auth } = require('@/auth')
        const { put } = require('@vercel/blob')
        auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })

        process.env.BLOB_READ_WRITE_TOKEN = 'fake-token'
        put.mockRejectedValue(new Error('Upload Failed'))

        const result = await uploadMedicalExam(formData)
        expect(result.message).toContain('Error al procesar el archivo')

        delete process.env.BLOB_READ_WRITE_TOKEN
    })
})

describe('System User Actions', () => {
    const formData = new FormData()
    formData.append('name', 'Kine User')
    formData.append('email', 'kine@test.com')
    formData.append('password', 'password123')
    formData.append('role', 'KINESIOLOGIST')
    formData.append('active', 'on')

    describe('adminCreateSystemUser', () => {
        it('returns unauthorized if not admin', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'user@test.com', role: 'PATIENT' } })
            const result = await adminCreateSystemUser(null, formData)
            expect(result.message).toContain('Unauthorized')
        })

        it('returns error if validation fails', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
            const invalidData = new FormData()
            const result = await adminCreateSystemUser(null, invalidData)
            expect(result.message).toContain('Datos inválidos')
        })

        it('returns error if email exists', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u2' })

            const result = await adminCreateSystemUser(null, formData)
            expect(result).toEqual({ message: 'El email ya existe' })
        })

        it('creates user successfully', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN', id: 'admin1' } })
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
                ; (bcrypt.hash as jest.Mock).mockResolvedValue('hashed')
                ; (prisma.user.create as jest.Mock).mockResolvedValue({ id: 'new_user' })

            const result = await adminCreateSystemUser(null, formData)
            expect(result).toEqual({ message: 'Success' })
            expect(prisma.user.create).toHaveBeenCalled()
        })

        it('handles db error', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
                ; (prisma.user.create as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const result = await adminCreateSystemUser(null, formData)
            expect(result).toEqual({ message: 'Error al crear usuario' })
        })
    })

    describe('adminUpdateSystemUser', () => {
        const updateData = new FormData()
        updateData.append('id', 'u1')
        updateData.append('name', 'Updated Name')
        updateData.append('email', 'updated@test.com')
        updateData.append('role', 'RECEPTIONIST')
        updateData.append('active', 'on')

        it('returns unauthorized if not admin', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'user@test.com', role: 'PATIENT' } })
            const result = await adminUpdateSystemUser(null, updateData)
            expect(result.message).toContain('Unauthorized')
        })

        it('returns error if email taken by another', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
                ; (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 'u2' })

            const result = await adminUpdateSystemUser(null, updateData)
            expect(result.message).toContain('El email ya está en uso')
        })

        it('prevents editing main admin', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
                ; (prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', role: 'ADMIN' })

            const result = await adminUpdateSystemUser(null, updateData)
            expect(result.message).toContain('No se puede editar al Administrador')
        })

        it('updates user successfully', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN', id: 'admin1' } })
                ; (prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', role: 'KINESIOLOGIST' })
                ; (prisma.user.update as jest.Mock).mockResolvedValue({})

            const result = await adminUpdateSystemUser(null, updateData)
            expect(result).toEqual({ message: 'Success' })
        })

        it('handles db error', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
                ; (prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', role: 'KINESIOLOGIST' })
                ; (prisma.user.update as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const result = await adminUpdateSystemUser(null, updateData)
            expect(result).toEqual({ message: 'Error al actualizar usuario' })
        })

        it('returns error if validation fails', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
            const invalidData = new FormData()
            const result = await adminUpdateSystemUser(null, invalidData)
            expect(result.message).toContain('Datos inválidos')
        })
    })

    describe('adminDeleteSystemUser', () => {
        it('returns unauthorized if not admin', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'user@test.com', role: 'PATIENT' } })
            const result = await adminDeleteSystemUser('u1')
            expect(result.message).toContain('Unauthorized')
        })

        it('returns error if user not found', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
            const result = await adminDeleteSystemUser('u1')
            expect(result.message).toContain('Usuario no encontrado')
        })

        it('prevents deleting admin', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', role: 'ADMIN' })
            const result = await adminDeleteSystemUser('u1')
            expect(result.message).toContain('No se puede eliminar a un Administrador')
        })

        it('deletes user successfully', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN', id: 'admin1' } })
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', role: 'receptionist', email: 'del@test.com' })
                ; (prisma.user.delete as jest.Mock).mockResolvedValue({})

            const result = await adminDeleteSystemUser('u1')
            expect(result).toEqual({ message: 'Success' })
        })

        it('handles db error', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
                ; (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', role: 'receptionist' })
                ; (prisma.user.delete as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const result = await adminDeleteSystemUser('u1')
            expect(result).toEqual({ message: 'Error al eliminar usuario' })
        })
    })
})

describe('Permissions & Password', () => {
    const { toggleRolePermission, seedPermissions, changePassword, adminCreateSystemUser, adminUpdateSystemUser, adminDeleteSystemUser } = require('./actions')

    describe('toggleRolePermission', () => {
        it('returns success', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN', id: 'admin1' } })
                ; (prisma.rolePermission.upsert as jest.Mock).mockResolvedValue({})

            const result = await toggleRolePermission('KINESIOLOGIST', 'view_patients', true)
            expect(result).toEqual({ message: 'Success' })
        })

        it('returns unauthorized', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue(null)
            const result = await toggleRolePermission('role', 'action', true)
            expect(result.message).toBe('Unauthorized')
        })

        it('handles db error', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
                ; (prisma.rolePermission.upsert as jest.Mock).mockRejectedValue(new Error('DB Error'))
            const result = await toggleRolePermission('role', 'action', true)
            expect(result.message).toBe('Error updating permission')
        })
    })

    describe('seedPermissions', () => {
        it('seeds permissions successfully', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
                ; (prisma.rolePermission.upsert as jest.Mock).mockResolvedValue({})

            const result = await seedPermissions()
            expect(result).toEqual({ message: 'Success' })
        })

        it('returns unauthorized', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'user@test.com', role: 'PATIENT' } })
            const result = await seedPermissions()
            expect(result.message).toContain('Unauthorized')
        })

        it('handles db error', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
                ; (prisma.rolePermission.upsert as jest.Mock).mockRejectedValue(new Error('DB Error'))
            const result = await seedPermissions()
            expect(result.message).toContain('Error seeding')
        })
    })

    describe('changePassword', () => {
        const formData = new FormData()
        formData.append('newPassword', 'newpass123')

        it('returns unauthorized if not logged in', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue(null)
            const result = await changePassword(formData)
            expect(result.message).toBe('Unauthorized')
        })

        it('returns error if password too short', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'user@test.com' } })
            const shortData = new FormData()
            shortData.append('newPassword', '123')
            const result = await changePassword(shortData)
            expect(result.message).toContain('al menos 6 caracteres')
        })

        it('updates password successfully', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'user@test.com' } })
                ; (bcrypt.hash as jest.Mock).mockResolvedValue('hashed')
                ; (prisma.user.update as jest.Mock).mockResolvedValue({})

            const result = await changePassword(formData)
            expect(result).toEqual({ message: 'Success' })
        })

        it('handles db error', async () => {
            const { auth } = require('@/auth')
            auth.mockResolvedValue({ user: { email: 'user@test.com' } })
                ; (prisma.user.update as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const result = await changePassword(formData)
            expect(result.message).toContain('Error al cambiar')
        })
    })
})

