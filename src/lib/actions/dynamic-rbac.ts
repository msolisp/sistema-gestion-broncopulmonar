
'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function getRoles() {
    return prisma.rol.findMany({
        where: { activo: true },
        include: {
            permisos: true
        },
        orderBy: { nombre: 'asc' }
    });
}

export async function createRole(data: { nombre: string, descripcion?: string }) {
    const session = await auth();
    if (!session?.user?.email || (session.user as any).role !== 'ADMIN') return { message: 'Unauthorized' };

    try {
        const role = await prisma.rol.create({
            data: {
                nombre: data.nombre.toUpperCase(),
                descripcion: data.descripcion,
                activo: true
            }
        });
        revalidatePath('/dashboard');
        return { message: 'Success', role };
    } catch (e: any) {
        console.error(e);
        if (e.code === 'P2002') return { message: 'El nombre del rol ya existe' };
        return { message: 'Error al crear rol' };
    }
}

export async function updateRole(id: string, data: { nombre: string, descripcion?: string, activo?: boolean }) {
    const session = await auth();
    if (!session?.user?.email || (session.user as any).role !== 'ADMIN') return { message: 'Unauthorized' };

    try {
        const role = await prisma.rol.update({
            where: { id },
            data: {
                nombre: data.nombre.toUpperCase(),
                descripcion: data.descripcion,
                activo: data.activo
            }
        });
        revalidatePath('/dashboard');
        return { message: 'Success', role };
    } catch (e) {
        console.error(e);
        return { message: 'Error al actualizar rol' };
    }
}

export async function deleteRole(id: string) {
    const session = await auth();
    if (!session?.user?.email || (session.user as any).role !== 'ADMIN') return { message: 'Unauthorized' };

    try {
        // Check if role is in use
        const userCount = await prisma.usuarioSistema.count({ where: { rolId: id } });
        if (userCount > 0) return { message: 'No se puede eliminar un rol que tiene usuarios asignados' };

        // Soft delete
        await prisma.rol.update({
            where: { id },
            data: { activo: false }
        });
        revalidatePath('/dashboard');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Error al eliminar rol' };
    }
}

export async function updateRolePermissionsBatch(changes: Array<{ roleId: string, recurso: string, accion: string, activo: boolean }>) {
    const session = await auth();
    if (!session?.user?.email || (session.user as any).role !== 'ADMIN') return { message: 'Unauthorized' };

    try {
        if (changes.length === 0) return { message: 'No changes provided' };

        // Get role to check name
        const roleId = changes[0].roleId;
        const role = await prisma.rol.findUnique({ where: { id: roleId } });

        if (!role) return { message: 'Role not found' };

        const isPatientRole = role.nombre === 'PACIENTE';

        for (const change of changes) {
            // Validate inputs
            if (!change.recurso || !change.accion) {
                console.warn('Skipping invalid permission change:', change);
                continue;
            }

            await prisma.permisoRol.upsert({
                where: {
                    rolId_recurso_accion: {
                        rolId: change.roleId,
                        recurso: change.recurso,
                        accion: change.accion
                    }
                },
                update: { activo: change.activo },
                create: {
                    rolId: change.roleId,
                    recurso: change.recurso,
                    accion: change.accion,
                    activo: change.activo
                }
            });

            // Skip propagation for Patient role (they are not in UsuarioSistema)
            if (isPatientRole) continue;

            // Propagate to all users of this role
            const users = await prisma.usuarioSistema.findMany({ where: { rolId: change.roleId } });
            for (const user of users) {
                await prisma.permisoUsuario.upsert({
                    where: {
                        usuarioId_recurso_accion: {
                            usuarioId: user.id,
                            recurso: change.recurso,
                            accion: change.accion
                        }
                    },
                    update: { activo: change.activo, otorgadoPor: session.user.email || 'SYSTEM' },
                    create: {
                        usuarioId: user.id,
                        recurso: change.recurso,
                        accion: change.accion,
                        activo: change.activo,
                        otorgadoPor: session.user.email || 'SYSTEM'
                    }
                });
            }
        }
        revalidatePath('/dashboard');
        return { message: 'Success' };
    } catch (e) {
        console.error('[updateRolePermissionsBatch] Error:', e);
        return { message: 'Error al actualizar permisos de rol' };
    }
}
