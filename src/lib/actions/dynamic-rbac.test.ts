
import { getRoles, createRole, updateRole, deleteRole, updateRolePermissionsBatch } from './dynamic-rbac';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    rol: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
    },
    usuarioSistema: {
        count: jest.fn(),
        findMany: jest.fn(),
    },
    permisoRol: {
        upsert: jest.fn(),
    },
    permisoUsuario: {
        upsert: jest.fn(),
    },
}));

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

describe('Dynamic RBAC Actions', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getRoles', () => {
        it('returns roles', async () => {
            (prisma.rol.findMany as jest.Mock).mockResolvedValue([{ id: '1', nombre: 'ADMIN' }]);
            const roles = await getRoles();
            expect(roles).toHaveLength(1);
        });
    });

    describe('createRole', () => {
        it('returns unauthorized if not admin', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { role: 'MEDICO' } });
            const result = await createRole({ nombre: 'NEW' });
            expect(result.message).toBe('Unauthorized');
        });

        it('creates role successfully', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } });
            (prisma.rol.create as jest.Mock).mockResolvedValue({ id: '1', nombre: 'NEW' });

            const result = await createRole({ nombre: 'new' });
            expect(result.message).toBe('Success');
            expect(prisma.rol.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ nombre: 'NEW' }) // Uppercase check
            }));
        });

        it('handles duplicate role', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } });
            (prisma.rol.create as jest.Mock).mockRejectedValue({ code: 'P2002' });
            const result = await createRole({ nombre: 'EXISTING' });
            expect(result.message).toContain('ya existe');
        });

        it('handles generic error', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } });
            (prisma.rol.create as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const result = await createRole({ nombre: 'ERROR' });
            expect(result.message).toContain('Error al crear');
        });
    });

    describe('updateRole', () => {
        it('updates role successfully', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } });
            (prisma.rol.update as jest.Mock).mockResolvedValue({ id: '1' });

            const result = await updateRole('1', { nombre: 'UPDATED' });
            expect(result.message).toBe('Success');
        });

        it('handles generic error', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } });
            (prisma.rol.update as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const result = await updateRole('1', { nombre: 'UPDATED' });
            expect(result.message).toBe('Error al actualizar rol');
        });
    });

    describe('deleteRole', () => {
        it('prevents deletion if users assigned', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } });
            (prisma.usuarioSistema.count as jest.Mock).mockResolvedValue(5);

            const result = await deleteRole('1');
            expect(result.message).toContain('tiene usuarios asignados');
        });

        it('soft deletes role if valid', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } });
            (prisma.usuarioSistema.count as jest.Mock).mockResolvedValue(0);
            (prisma.rol.update as jest.Mock).mockResolvedValue({});

            const result = await deleteRole('1');
            expect(result.message).toBe('Success');
            expect(prisma.rol.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: '1' },
                data: { activo: false }
            }));
        });

        it('handles generic error', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } });
            (prisma.usuarioSistema.count as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const result = await deleteRole('1');
            expect(result.message).toBe('Error al eliminar rol');
        });
    });

    describe('updateRolePermissionsBatch', () => {
        it('updates permissions and propagates to users', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } });
            (prisma.rol.findUnique as jest.Mock).mockResolvedValue({ id: 'r1', nombre: 'MEDICO' });
            (prisma.usuarioSistema.findMany as jest.Mock).mockResolvedValue([{ id: 'u1' }]);

            const changes = [{ roleId: 'r1', recurso: 'Pacientes', accion: 'Ver', activo: true }];
            const result = await updateRolePermissionsBatch(changes);

            expect(result.message).toBe('Success');
            // Check propagation
            expect(prisma.permisoUsuario.upsert).toHaveBeenCalledTimes(1);
        });

        it('skips propagation for PACIENTE role', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } });
            (prisma.rol.findUnique as jest.Mock).mockResolvedValue({ id: 'r1', nombre: 'PACIENTE' });

            const changes = [{ roleId: 'r1', recurso: 'Portal', accion: 'Ver', activo: true }];
            const result = await updateRolePermissionsBatch(changes);

            expect(result.message).toBe('Success');
            // PermisoRol updated
            expect(prisma.permisoRol.upsert).toHaveBeenCalled();
            // PermisoUsuario NOT updated (propagation skipped)
            expect(prisma.usuarioSistema.findMany).not.toHaveBeenCalled();
            expect(prisma.permisoUsuario.upsert).not.toHaveBeenCalled();
        });

        it('handles generic error', async () => {
            (auth as jest.Mock).mockResolvedValue({ user: { email: 'admin@test.com', role: 'ADMIN' } });
            (prisma.rol.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const result = await updateRolePermissionsBatch([{ roleId: 'r1', recurso: 'R', accion: 'A', activo: true }]);
            expect(result.message).toBe('Error al actualizar permisos de rol');
        });
    });
});
