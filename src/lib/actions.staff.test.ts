
import { adminCreateSystemUser, adminUpdateSystemUser, adminDeleteSystemUser, seedPermissions } from './actions.staff'
import { createStaffUser, updateStaffUser } from '@/lib/fhir-adapters'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

// Mock dependencies
jest.mock('@/auth', () => ({
    auth: jest.fn(),
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

jest.mock('@/lib/prisma', () => {
    const mockClient: any = {
        usuarioSistema: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        persona: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
        },
        permisoUsuario: {
            upsert: jest.fn(),
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
    createStaffUser: jest.fn(),
    updateStaffUser: jest.fn(),
}))

jest.mock('@/lib/validators', () => ({
    validarRutChileno: () => true,
}))

describe('Staff Actions', () => {

    beforeEach(() => {
        jest.clearAllMocks()
            // Default successfully
            ; (createStaffUser as jest.Mock).mockResolvedValue({ id: 'u1' })
            ; (updateStaffUser as jest.Mock).mockResolvedValue({ id: 'u1' })
    })

    describe('adminCreateSystemUser', () => {
        const formData = new FormData()
        formData.append('name', 'Staff User')
        formData.append('email', 'staff@test.com')
        formData.append('password', 'Password123!')
        formData.append('role', 'KINESIOLOGO')
        formData.append('rut', '11.111.111-1')
        formData.append('active', 'on')
        formData.append('region', 'RM')
        formData.append('commune', 'Santiago')

        it('returns unauthorized if not admin', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'staff@test.com', role: 'KINESIOLOGO' } })
            const result = await adminCreateSystemUser(null, formData)
            expect(result.message).toContain('Unauthorized')
        })

        it('creates user successfully', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
            const result = await adminCreateSystemUser(null, formData)
            expect(result).toEqual({ message: 'Success' })
            expect(createStaffUser).toHaveBeenCalled()
        })

        it('returns error if validation fails', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
            const invalidData = new FormData() // Missing fields
            const result = await adminCreateSystemUser(null, invalidData)
            expect(result.message).toContain('Datos inválidos')
        })
    })

    describe('adminUpdateSystemUser', () => {
        const formData = new FormData()
        formData.append('id', 'u1')
        formData.append('name', 'Updated Name')
        formData.append('email', 'updated@test.com')
        formData.append('role', 'MEDICO')
        formData.append('active', 'on')
        // Using rutBody/rutDv explicitly to test that path if desired, or simplified
        formData.append('rut', '11.111.111-1')

        it('returns unauthorized if not admin', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'staff@test.com', role: 'KINESIOLOGO' } })
            const result = await adminUpdateSystemUser(null, formData)
            expect(result.message).toContain('Unauthorized')
        })

        it('updates user successfully', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })

                // Mock finding existing user
                ; (prisma.usuarioSistema.findUnique as jest.Mock).mockResolvedValue({
                    id: 'u1',
                    personaId: 'p1'
                })
                // Mock email uniqueness check
                ; (prisma.persona.findFirst as jest.Mock).mockResolvedValue(null)

            const result = await adminUpdateSystemUser(null, formData)
            expect(result).toEqual({ message: 'Success' })
            expect(updateStaffUser).toHaveBeenCalled()
        })

        it('returns error if email taken by another', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })

                ; (prisma.usuarioSistema.findUnique as jest.Mock).mockResolvedValue({
                    id: 'u1',
                    personaId: 'p1'
                })

                // Simulate email taken by p2
                ; (prisma.persona.findFirst as jest.Mock).mockResolvedValue({ id: 'p2' })

            const result = await adminUpdateSystemUser(null, formData)
            expect(result.message).toContain('email ya está en uso')
        })
    })

    describe('adminDeleteSystemUser', () => {
        it('returns error if user not found', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
                ; (prisma.usuarioSistema.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await adminDeleteSystemUser('u1')
            expect(result.message).toContain('Usuario no encontrado')
        })

        it('prevents deleting admin', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
                ; (prisma.usuarioSistema.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', rol: 'ADMIN' })

            const result = await adminDeleteSystemUser('u1')
            expect(result.message).toContain('No se puede eliminar a un Administrador')
        })

        it('deletes user successfully', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
                ; (prisma.usuarioSistema.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', rol: 'MEDICO' })

            const result = await adminDeleteSystemUser('u1')
            expect(result).toEqual({ message: 'Success' })
            expect(prisma.usuarioSistema.update).toHaveBeenCalled() // Soft delete
        })
    })

    describe('seedPermissions', () => {
        it('seeds permissions successfully', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } })
                ; (prisma.usuarioSistema.findMany as jest.Mock).mockResolvedValue([{ id: 'u1' }])

            const result = await seedPermissions()
            expect(result).toEqual({ message: 'Success' })
            expect(prisma.permisoUsuario.upsert).toHaveBeenCalled()
        })
    })

})
