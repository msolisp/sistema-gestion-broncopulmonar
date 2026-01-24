'use server'

import prisma from '@/lib/prisma';
import { AdminCreateSystemUserSchema, AdminUpdateSystemUserSchema } from './schemas';
import { createStaffUser, updateStaffUser } from '@/lib/fhir-adapters';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { validarRutChileno } from '@/lib/validators';

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

    try {
        await createStaffUser({
            rut: vRut,
            nombre: vName, // Basic name split will happen inside adapter if needed, simply passing string for now or adapter handles it
            apellidoPaterno: 'SIN_APELLIDO', // TODO: Improve name parsing in adapter or here
            email: vEmail,
            password: vPassword,
            rol: vRole as any,
            creadoPor: session.user.email || 'ADMIN',
            direccion: vAddress,
            comuna: vCommune,
            region: vRegion
        });

        revalidatePath('/admin/users');
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

    // Fetch existing user to get Persona ID
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

    try {
        // Name handling: split into nombre and apellidoPaterno
        // We explicitly set apellidoMaterno to null to prevent "name growth" bug
        // where old maternal last names persisted and appended recursively.
        const nameParts = vName.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'SIN_APELLIDO';

        const result = await updateStaffUser(vId, {
            email: vEmail,
            nombre: firstName,
            apellidoPaterno: lastName,
            apellidoMaterno: null, // Critical fix for name growth
            rol: vRole as any,
            active: vActive,
            rut: vRut || undefined,
            region: vRegion || null,
            comuna: vCommune || null,
            direccion: vAddress || null,
            password: vPassword || undefined,
            modificadoPor: session.user.email || 'ADMIN'
        });

        revalidatePath('/admin/users');
        revalidatePath('/dashboard');
        return { message: 'Success' };
    } catch (e) {
        console.error('[adminUpdateSystemUser] Error:', e);
        return { message: 'Error al actualizar usuario' };
    }
}

export async function adminDeleteSystemUser(id: string) {
    const session = await auth();
    if (!session?.user?.email) return { message: 'Unauthorized' };
    if ((session.user as any).role !== 'ADMIN') return { message: 'Unauthorized' };

    try {
        const targetUser = await prisma.usuarioSistema.findUnique({
            where: { id },
            include: { rol_rel: true }
        });
        if (!targetUser) return { message: 'Usuario no encontrado' };
        if (targetUser.rol_rel.nombre === 'ADMIN') return { message: 'No se puede eliminar a un Administrador' };

        // Soft delete system user
        await prisma.usuarioSistema.update({
            where: { id },
            data: {
                activo: false,
                eliminadoEn: new Date(),
                eliminadoPor: session.user.email
            }
        });

        // Also deactivate base persona? 
        // We should check if they are also a patient.
        // For now, just deactivate system access.

        revalidatePath('/admin/users');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Error al eliminar usuario' };
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
            'Configuración Global': 'Configuración Global',
            'Ver Usuarios': 'Seguridad (RBAC)'
        };

        for (const change of changes) {
            const recurso = actionToRecurso[change.action] || 'General';
            const accion = 'Ver';

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
        { role: 'MEDICO', actions: ['Ver Agendamiento', 'Ver Pacientes', 'Ver Reportes BI'] }
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
