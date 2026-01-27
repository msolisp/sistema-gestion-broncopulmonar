'use server'

import prisma from '@/lib/prisma';
import { AdminCreateSystemUserSchema, AdminUpdateSystemUserSchema } from './schemas';
import { createStaffUser, updateStaffUser } from '@/lib/fhir-adapters';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { validarRutChileno } from '@/lib/validators';

import { logAction } from '@/lib/logger';

export async function adminCreateSystemUser(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { message: 'Unauthorized' };
    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN') {
        return { message: 'Unauthorized: Access denied' };
    }

    const rawData = Object.fromEntries(formData);
    const { name, email, password, role, active, rutBody, rutDv, region, commune, address } = Object.fromEntries(formData);

    // Combine RUT if separated
    let fullRut = '';
    if (rutBody && rutDv) {
        const cleanBody = (rutBody as string).replace(/\D/g, '');
        const formattedBody = cleanBody.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        fullRut = `${formattedBody}-${(rutDv as string).toUpperCase()}`;
    } else if (rawData.rut) {
        fullRut = rawData.rut as string;
    }

    const dataToValidate = {
        ...rawData,
        rut: fullRut,
        active: active === 'on'
    };

    const validation = AdminCreateSystemUserSchema.safeParse(dataToValidate);

    if (!validation.success) {
        return { message: 'Datos inválidos: ' + validation.error.issues.map(e => e.message).join(', ') };
    }

    const { name: vName, email: vEmail, password: vPassword, role: vRole, rut: vRut, region: vRegion, commune: vCommune, address: vAddress } = validation.data;

    // Validate RUT format
    if (!validarRutChileno(vRut)) {
        return { message: 'RUT inválido' };
    }

    // Check for existing user (RUT or Email)
    const existing = await prisma.persona.findFirst({
        where: {
            OR: [
                { rut: vRut },
                { email: vEmail }
            ]
        }
    });

    if (existing) {
        if (existing.rut === vRut) return { message: 'El RUT ya está en uso' };
        if (existing.email === vEmail) return { message: 'El correo electrónico ya está en uso' };
    }

    try {
        const newPersona = await createStaffUser({
            rut: vRut,
            nombre: vName,
            apellidoPaterno: 'SIN_APELLIDO',
            email: vEmail,
            password: vPassword,
            rol: vRole as any,
            creadoPor: session.user.email || 'ADMIN',
            direccion: vAddress,
            comuna: vCommune,
            region: vRegion
        });

        // Seed Permissions based on Role
        const newUserSystem = await prisma.usuarioSistema.findFirst({
            where: { personaId: newPersona.id }
        });

        if (newUserSystem) {
            const rolePermissions = await prisma.permisoRol.findMany({
                where: { rolId: vRole as string, activo: true }
            });

            for (const perm of rolePermissions) {
                await prisma.permisoUsuario.create({
                    data: {
                        usuarioId: newUserSystem.id,
                        recurso: perm.recurso,
                        accion: perm.accion,
                        activo: true,
                        otorgadoPor: session.user.email || 'ADMIN'
                    }
                });
            }
        }

        revalidatePath('/admin/users');
        await logAction('USER_CREATED', `Created user ${vEmail} with role ${vRole}`, null, session.user.email);
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Error al crear usuario' };
    }
}


export async function adminUpdateSystemUser(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { message: 'Unauthorized' };
    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN') {
        return { message: 'Unauthorized: Access denied' };
    }

    const rawData = Object.fromEntries(formData);
    const { id, name, email, role, active, rutBody, rutDv, region, commune, address } = Object.fromEntries(formData);

    // Combine RUT if separated
    let fullRut = '';
    if (rutBody && rutDv) {
        const cleanBody = (rutBody as string).replace(/\D/g, '');
        const formattedBody = cleanBody.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        fullRut = `${formattedBody}-${(rutDv as string).toUpperCase()}`;
    } else if (rawData.rut) {
        fullRut = rawData.rut as string;
    }

    const dataToValidate = {
        ...rawData,
        rut: fullRut,
        active: active === 'on'
    };

    const validation = AdminUpdateSystemUserSchema.safeParse(dataToValidate);

    if (!validation.success) {
        return { message: 'Datos inválidos: ' + validation.error.issues.map(e => e.message).join(', ') };
    }

    const { id: vId, name: vName, email: vEmail, role: vRole, active: vActive, rut: vRut, region: vRegion, commune: vCommune, address: vAddress, password: vPassword } = validation.data;

    try {
        const existingUser = await prisma.usuarioSistema.findUnique({
            where: { id: vId },
            include: { persona: true }
        });

        if (!existingUser) {
            return { message: 'Usuario no encontrado' };
        }

        const personaId = existingUser.personaId;

        // Check Email Uniqueness
        const emailExists = await prisma.persona.findFirst({
            where: {
                email: vEmail,
                id: { not: personaId }
            }
        });
        if (emailExists) {
            return { message: 'El email ya está en uso' };
        }

        // Check RUT Uniqueness if properly provided
        if (vRut && validarRutChileno(vRut)) {
            const rutExists = await prisma.persona.findFirst({
                where: {
                    rut: vRut,
                    id: { not: personaId }
                }
            });
            if (rutExists) {
                return { message: 'RUT ya está en uso' };
            }
        }

        // Name handling: split into nombre and apellidoPaterno
        // We explicitly set apellidoMaterno to null to prevent "name growth" bug
        // where old maternal last names persisted and appended recursively.
        const nameParts = vName.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        // Check if role is changing
        const curUser = await prisma.usuarioSistema.findUnique({
            where: { id: vId },
            include: { persona: true, rol_rel: true }
        });
        const oldRoleId = curUser?.rolId;
        const newRoleId = vRole;

        // Calculate Diff
        const changes: Record<string, { old: any, new: any }> = {};
        if (curUser) {
            const oldName = `${curUser.persona.nombre} ${curUser.persona.apellidoPaterno} ${curUser.persona.apellidoMaterno || ''}`.trim();
            if (oldName !== vName.trim()) changes['Nombre'] = { old: oldName, new: vName.trim() };
            if (curUser.persona.email !== vEmail) changes['Email'] = { old: curUser.persona.email, new: vEmail };
            if (curUser.rolId !== vRole) changes['Rol'] = { old: curUser.rol_rel.nombre, new: vRole }; // Note: vRole is ID, ideal would be name lookup but ID is okay or we can fetch name
            if (curUser.activo !== vActive) changes['Estado'] = { old: curUser.activo ? 'Activo' : 'Inactivo', new: vActive ? 'Activo' : 'Inactivo' };
        }

        const result = await updateStaffUser(vId, {
            email: vEmail,
            nombre: firstName,
            apellidoPaterno: lastName,
            apellidoMaterno: null,
            rol: vRole as any,
            active: vActive,
            rut: vRut || undefined,
            region: vRegion || null,
            comuna: vCommune || null,
            direccion: vAddress || null,
            password: vPassword || undefined,
            modificadoPor: session.user.email || 'ADMIN'
        });

        // If role changed, reset permissions to match new role
        if (oldRoleId && newRoleId && oldRoleId !== newRoleId) {
            // Delete old permissions
            await prisma.permisoUsuario.deleteMany({
                where: { usuarioId: vId }
            });

            // Seed new permissions
            const rolePermissions = await prisma.permisoRol.findMany({
                where: {
                    rolId: newRoleId as string,
                    activo: true
                }
            });

            for (const perm of rolePermissions) {
                await prisma.permisoUsuario.create({
                    data: {
                        usuarioId: vId,
                        recurso: perm.recurso,
                        accion: perm.accion,
                        activo: true,
                        otorgadoPor: session.user.email || 'ADMIN'
                    }
                });
            }
        }

        revalidatePath('/admin/users');
        revalidatePath('/dashboard');

        await logAction(
            'USER_UPDATED',
            JSON.stringify(changes), // Pass diff as details
            null,
            session.user.email
        );
        return { message: 'Success' };
    } catch (e: any) {
        console.error('[adminUpdateSystemUser] Error:', e);
        return { message: e.message || 'Error al actualizar usuario' };
    }
}

export async function adminDeleteSystemUser(id: string) {
    const session = await auth();
    if (!session?.user?.email) return { message: 'Unauthorized' };
    if ((session.user as any).role !== 'ADMIN') return { message: 'Unauthorized' };

    try {
        console.log(`[DELETE_USER] Attempting to delete user ${id} by ${session.user.email}`);

        const targetUser = await prisma.usuarioSistema.findUnique({
            where: { id },
            include: { rol_rel: true }
        });
        if (!targetUser) {
            console.log('[DELETE_USER] User not found');
            return { message: 'Usuario no encontrado' };
        }

        // Prevent self-deletion
        const targetPerson = await prisma.persona.findUnique({ where: { id: targetUser.personaId } });
        console.log(`[DELETE_USER] Target person email: ${targetPerson?.email}, Current user email: ${session.user.email}`);

        if (targetPerson?.email && session.user.email && targetPerson.email.toLowerCase() === session.user.email.toLowerCase()) {
            console.log('[DELETE_USER] Self-deletion attempt blocked');
            return { message: 'No puedes eliminar tu propia cuenta' };
        }

        // Soft delete system user
        await prisma.usuarioSistema.update({
            where: { id },
            data: {
                activo: false,
                eliminadoEn: new Date(),
                eliminadoPor: session.user.email
            }
        });

        console.log('[DELETE_USER] Success');
        revalidatePath('/admin/users');
        revalidatePath('/dashboard');
        await logAction('USER_DELETED', `Deleted user ID: ${id}`, null, session.user.email);
        return { message: 'Success' };
    } catch (e: any) {
        console.error('[DELETE_USER] Error:', e);
        return { message: 'Error al eliminar usuario: ' + e.message };
    }
}

export async function updateRolePermissions(changes: Array<{ role: string, action: string, enabled: boolean }>) {
    const session = await auth();
    if (!session?.user?.email || (session.user as any).role !== 'ADMIN') return { message: 'Unauthorized' };

    try {
        // We need to update ALL users of the given role.
        // This is heavy, but permissions are typically per-user in this schema.
        // Ideally we would have a RolePermission table, but here we propagate to users.

        const actionToRecurso: { [key: string]: string } = {
            'Ver Agendamiento': 'Agendamiento',
            'Ver Pacientes': 'Pacientes',
            'Ver Reportes BI': 'Reportes BI',
            'Ver Asistente': 'Asistente Clínico',
            'Ver HL7': 'Estándar HL7',
            'Ver Exámenes Cargados': 'Notificaciones',
            'Configuración Global': 'Configuración Global',
            'Ver Usuarios': 'Seguridad (RBAC)'
        };

        for (const change of changes) {
            const recurso = actionToRecurso[change.action] || 'General';
            const accion = 'Ver';

            // 1. Update the Role definition (so new users get this)
            const role = await prisma.rol.findFirst({
                where: { nombre: change.role.toUpperCase() }
            });

            if (role) {
                await prisma.permisoRol.upsert({
                    where: {
                        rolId_recurso_accion: {
                            rolId: role.id,
                            recurso: recurso,
                            accion: accion
                        }
                    },
                    update: { activo: change.enabled },
                    create: {
                        rolId: role.id,
                        recurso: recurso,
                        accion: accion,
                        activo: change.enabled
                    }
                });
            }

            // 2. Propagate to ALL active users of this role
            const users = await prisma.usuarioSistema.findMany({
                where: {
                    rol_rel: {
                        nombre: change.role.toUpperCase()
                    },
                    activo: true
                }
            });

            for (const user of users) {
                await prisma.permisoUsuario.upsert({
                    where: {
                        usuarioId_recurso_accion: {
                            usuarioId: user.id,
                            recurso: recurso,
                            accion: accion
                        }
                    },
                    update: {
                        activo: change.enabled,
                        otorgadoPor: session.user.email || 'ADMIN'
                    },
                    create: {
                        usuarioId: user.id,
                        recurso: recurso,
                        accion: accion,
                        activo: change.enabled,
                        otorgadoPor: session.user.email || 'ADMIN'
                    }
                });
            }
        }

        revalidatePath('/dashboard');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Error updating permissions' };
    }
}

export async function seedPermissions() {
    const session = await auth();
    if (!session?.user?.email || (session.user as any).role !== 'ADMIN') return { message: 'Unauthorized' };

    // Default permissions
    const defaults = [
        { role: 'KINESIOLOGO', actions: ['Ver Agendamiento', 'Ver Pacientes', 'Ver HL7'] },
        { role: 'RECEPCIONISTA', actions: ['Ver Agendamiento', 'Ver Pacientes'] },
        { role: 'MEDICO', actions: ['Ver Agendamiento', 'Ver Pacientes', 'Ver Reportes BI'] },
        { role: 'ASISTENTE_IA', actions: ['Ver Agendamiento', 'Ver Pacientes', 'Ver Reportes BI', 'Ver HL7', 'Ver Asistente'] }
    ];

    try {
        for (const def of defaults) {
            const users = await prisma.usuarioSistema.findMany({
                where: {
                    rol_rel: {
                        nombre: def.role
                    },
                    activo: true
                }
            });

            for (const user of users) {
                for (const action of def.actions) {
                    await prisma.permisoUsuario.upsert({
                        where: {
                            usuarioId_recurso_accion: {
                                usuarioId: user.id,
                                recurso: 'VIEW',
                                accion: action
                            }
                        },
                        update: { activo: true },
                        create: {
                            usuarioId: user.id,
                            recurso: 'VIEW',
                            accion: action,
                            activo: true,
                            otorgadoPor: 'SYSTEM'
                        }
                    });
                }
            }
        }
        revalidatePath('/dashboard');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Error seeding permissions' };
    }
}

/**
 * Fetch permissions for the currently logged-in user
 */
export async function getMyPermissions() {
    const session = await auth();
    if (!session?.user?.email) return [];

    // Find the UsuarioSistema record for this persona
    const user = await prisma.usuarioSistema.findFirst({
        where: {
            persona: { email: session.user.email },
            activo: true
        }
    });

    if (!user) return [];

    const permissions = await prisma.permisoUsuario.findMany({
        where: {
            usuarioId: user.id,
            activo: true
        },
        select: {
            recurso: true,
            accion: true
        }
    });

    return permissions;
}
