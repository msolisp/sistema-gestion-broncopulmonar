import { adminCreateSystemUser, adminUpdateSystemUser } from './actions.staff';
import prisma from '@/lib/prisma';
import { createStaffUser, updateStaffUser } from '@/lib/fhir-adapters';
process.env.E2E_TESTING = 'true';

jest.mock('@/lib/enhanced-logger', () => ({
    logAction: jest.fn()
}));

jest.mock('@/lib/validators', () => ({
    validarRutChileno: jest.fn(() => true),
    obtenerCuerpoRut: jest.fn(),
    obtenerDigitoVerificador: jest.fn(),
}));

// Define mock object inside the factory to avoid hoisting issues
jest.mock('@/lib/prisma', () => {
    const mockPrisma: any = {
        usuarioSistema: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
        },
        persona: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
        },
        permisoRol: {
            findMany: jest.fn(),
            upsert: jest.fn(),
        },
        rol: {
            findFirst: jest.fn(),
        },
        permisoUsuario: {
            create: jest.fn(),
            deleteMany: jest.fn(),
            findMany: jest.fn(),
            upsert: jest.fn(),
        },
    };
    mockPrisma.$transaction = jest.fn((callback) => callback(mockPrisma));
    return {
        __esModule: true,
        default: mockPrisma
    };
});

jest.mock('@/lib/fhir-adapters', () => ({
    createStaffUser: jest.fn(),
    updateStaffUser: jest.fn(),
}));

jest.mock('next-auth', () => ({
    auth: jest.fn(() => Promise.resolve({ user: { email: 'admin@test.com', role: 'ADMIN' } })),
}));

jest.mock('@/auth', () => ({
    auth: jest.fn(() => Promise.resolve({ user: { email: 'admin@test.com', role: 'ADMIN' } })),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

// Mocks already defined above

describe('Staff Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('seeds permissions on create', async () => {
        (createStaffUser as jest.Mock).mockResolvedValue({ id: 'persona-123' });
        (prisma.usuarioSistema.findFirst as jest.Mock).mockResolvedValue({ id: 'user-sys-123' });
        (prisma.permisoRol.findMany as jest.Mock).mockResolvedValue([
            { recurso: 'Test', accion: 'Ver' }
        ]);

        const formData = new FormData();
        formData.append('name', 'Test User');
        formData.append('email', 'test@test.com');
        formData.append('password', 'Pass123!');
        formData.append('role', 'ROLE-ID');
        formData.append('rutBody', '12345678');
        formData.append('rutDv', '9');

        await adminCreateSystemUser(null, formData);

        expect(createStaffUser).toHaveBeenCalled();
        expect(prisma.permisoUsuario.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                usuarioId: 'user-sys-123',
                recurso: 'Test'
            })
        }));
    });

    it('updates permissions on role change', async () => {
        const formData = new FormData();
        formData.append('id', 'user-sys-123');
        formData.append('name', 'Test User');
        formData.append('email', 'test@test.com');
        formData.append('role', 'NEW-ROLE-ID');
        formData.append('rutBody', '12345678');
        formData.append('rutDv', '5');
        formData.append('active', 'on');

        // Old role was DIFFERENT
        (prisma.usuarioSistema.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-sys-123',
            rolId: 'OLD-ROLE-ID',
            activo: true,
            persona: { nombre: 'Old', apellidoPaterno: 'Name', email: 'test@test.com' },
            rol_rel: { nombre: 'OLD-ROLE-NAME' }
        });
        (updateStaffUser as jest.Mock).mockResolvedValue({ success: true });

        // Mock new permissions
        (prisma.permisoRol.findMany as jest.Mock).mockResolvedValue([
            { recurso: 'NewResource', accion: 'Ver' }
        ]);

        await adminUpdateSystemUser(null, formData);

        expect(prisma.permisoUsuario.deleteMany).toHaveBeenCalledWith({ where: { usuarioId: 'user-sys-123' } });
        expect(prisma.permisoUsuario.create).toHaveBeenCalled();
    });

    it('does NOT update permissions if role is same', async () => {
        const formData = new FormData();
        formData.append('id', 'user-sys-123');
        formData.append('name', 'Test User');
        formData.append('email', 'test@test.com');
        formData.append('role', 'SAME-ROLE-ID'); // Same role
        formData.append('rutBody', '12345678');
        formData.append('rutDv', '9');

        (prisma.usuarioSistema.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-sys-123',
            rolId: 'SAME-ROLE-ID',
            activo: true,
            persona: { nombre: 'Old', apellidoPaterno: 'Name', email: 'test@test.com' },
            rol_rel: { nombre: 'SAME-ROLE-NAME' }
        });
        (updateStaffUser as jest.Mock).mockResolvedValue({ success: true });

        await adminUpdateSystemUser(null, formData);

        expect(prisma.permisoUsuario.deleteMany).not.toHaveBeenCalled();
    });

    it('deletes user successfully', async () => {
        const { adminDeleteSystemUser } = require('./actions.staff');

        // Mock finding user
        (prisma.usuarioSistema.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-to-delete',
            personaId: 'person-123'
        });

        // Mock finding person (target)
        (prisma.persona.findUnique as jest.Mock).mockResolvedValue({
            id: 'person-123',
            email: 'other@test.com'
        });

        // Mock update (soft delete)
        (prisma.usuarioSistema.update as jest.Mock).mockResolvedValue({});

        const result = await adminDeleteSystemUser('user-to-delete');

        expect(result.message).toBe('Success');
        expect(prisma.usuarioSistema.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'user-to-delete' },
            data: expect.objectContaining({
                activo: false
            })
        }));
    });

    it('prevents self-deletion', async () => {
        const { adminDeleteSystemUser } = require('./actions.staff');

        // Mock finding user
        (prisma.usuarioSistema.findUnique as jest.Mock).mockResolvedValue({
            id: 'my-user-id',
            personaId: 'my-person-id'
        });

        // Mock finding person (target is same as admin)
        (prisma.persona.findUnique as jest.Mock).mockResolvedValue({
            id: 'my-person-id',
            email: 'admin@test.com' // Matches mock auth email
        });

        const result = await adminDeleteSystemUser('my-user-id');

        expect(result.message).toContain('No puedes eliminar tu propia cuenta');
        expect(prisma.usuarioSistema.update).not.toHaveBeenCalled();
    });

    describe('Permission Management', () => {
        it('updates role permissions for all users in role', async () => {
            const { updateRolePermissions } = require('./actions.staff');

            // Mock finding users with role
            (prisma.usuarioSistema.findMany as jest.Mock).mockResolvedValue([
                { id: 'user-1' },
                { id: 'user-2' }
            ]);

            const changes = [
                { role: 'KINESIOLOGO', action: 'Ver Agendamiento', enabled: true },
                { role: 'KINESIOLOGO', action: 'Ver Pacientes', enabled: false }
            ];

            const result = await updateRolePermissions(changes);

            expect(result.message).toBe('Success');

            // Should find users for the role
            expect(prisma.usuarioSistema.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    rol_rel: expect.objectContaining({ nombre: 'KINESIOLOGO' })
                })
            }));

            // Should upsert permissions for each user and each change
            // 2 users * 2 changes = 4 upserts
            expect(prisma.permisoUsuario.upsert).toHaveBeenCalledTimes(4);
        });

        it('seeds default permissions', async () => {
            const { seedPermissions } = require('./actions.staff');

            // Mock finding users for one of the defaults (e.g. KINESIOLOGO)
            (prisma.usuarioSistema.findMany as jest.Mock).mockResolvedValue([
                { id: 'kine-user-1' }
            ]);

            const result = await seedPermissions();

            expect(result.message).toBe('Success');
            // Should have called upsert multiple times for the defaults
            expect(prisma.permisoUsuario.upsert).toHaveBeenCalled();
        });

        it('gets my permissions', async () => {
            const { getMyPermissions } = require('./actions.staff');

            // Mock finding user by email
            (prisma.usuarioSistema.findFirst as jest.Mock).mockResolvedValue({ id: 'my-user-id' });

            // Mock finding permissions
            (prisma.permisoUsuario.findMany as jest.Mock).mockResolvedValue([
                { recurso: 'Agendamiento', accion: 'Ver' }
            ]);

            const result = await getMyPermissions();

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ recurso: 'Agendamiento', accion: 'Ver' });
        });

        it('returns empty permissions if not logged in', async () => {
            const { getMyPermissions } = require('./actions.staff');
            const { auth } = require('@/auth');

            // Override auth mock for this test
            auth.mockResolvedValueOnce(null);

            const result = await getMyPermissions();
            expect(result).toHaveLength(0);
        });
    });

    describe('Validation Errors', () => {
        it('create fails with invalid RUT', async () => {
            const { adminCreateSystemUser } = require('./actions.staff');
            const { validarRutChileno } = require('@/lib/validators');

            (validarRutChileno as jest.Mock).mockReturnValue(false);

            const formData = new FormData();
            formData.append('name', 'Bad Rut User');
            formData.append('email', 'badrut@test.com');
            formData.append('password', 'Pass123!');
            formData.append('role', 'ROLE-ID');
            formData.append('rutBody', '123'); // Invalid
            formData.append('rutDv', 'K');
            formData.append('active', 'on');

            const result = await adminCreateSystemUser(null, formData);
            expect(result.message).toContain('inválido');
        });
    });

    it('logs diff on user update', async () => {
        const { logAction } = jest.requireMock('@/lib/enhanced-logger');
        const { validarRutChileno } = require('@/lib/validators');
        validarRutChileno.mockReturnValue(true);

        const formData = new FormData();
        formData.append('id', 'user-sys-123');
        formData.append('name', 'New Name');
        formData.append('email', 'new@test.com');
        formData.append('role', 'NEW-ROLE');
        formData.append('rutBody', '12345678');
        formData.append('rutDv', '5');
        formData.append('active', 'on');

        const mockUser = {
            id: 'user-sys-123',
            rolId: 'OLD-ROLE',
            activo: true,
            persona: {
                nombre: 'Old',
                apellidoPaterno: 'Name',
                apellidoMaterno: '',
                email: 'old@test.com',
                rut: '12345678-5'
            },
            rol_rel: { nombre: 'OLD-ROLE-NAME' }
        };

        (prisma.usuarioSistema.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (updateStaffUser as jest.Mock).mockResolvedValue({ success: true });
        (prisma.permisoRol.findMany as jest.Mock).mockResolvedValue([]);

        const { adminUpdateSystemUser } = require('./actions.staff');
        const result = await adminUpdateSystemUser(null, formData);
        expect(result.message).toBe('Success');

        expect(logAction).toHaveBeenCalledWith(
            'USER_UPDATED',
            expect.stringContaining('"Nombre"'),
            null,
            'admin@test.com'
        );
        expect(logAction).toHaveBeenCalledWith(
            'USER_UPDATED',
            expect.stringContaining('"old":"Old Name"'),
            null,
            'admin@test.com'
        );
        expect(logAction).toHaveBeenCalledWith(
            'USER_UPDATED',
            expect.stringContaining('"new":"New Name"'),
            null,
            'admin@test.com'
        );
    });
});
