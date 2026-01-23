'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/db'
import { logAction } from './logger'

export async function seedPermissions() {
    const actions = [
        // Módulo: Agendamiento
        'Ver Agendamiento',
        'Crear Citas',
        'Editar Citas',
        'Eliminar Citas',

        // Módulo: Pacientes
        'Ver Pacientes',
        'Crear Pacientes',
        'Editar Pacientes',
        'Eliminar Pacientes',

        // Módulo: Reportes BI
        'Ver Reportes BI',

        //Módulo: Asistente Clínico
        'Acceder Asistente Clínico',

        // Módulo: Estándar HL7
        'Acceder Estándar HL7',

        // Módulo: Exámenes
        'Ver Exámenes',
        'Subir Exámenes',

        // Módulo: Configuración (Admin)
        'Configuración Global',
        'Ver Usuarios',
        'Crear Usuarios',
        'Editar Usuarios',
        'Eliminar Usuarios',
    ];

    const defaultPermissions = [
        // ====================
        // KINESIOLOGIST
        // ====================

        // Agendamiento
        { role: 'KINESIOLOGIST', action: 'Ver Agendamiento', enabled: true },
        { role: 'KINESIOLOGIST', action: 'Crear Citas', enabled: true },
        { role: 'KINESIOLOGIST', action: 'Editar Citas', enabled: true },
        { role: 'KINESIOLOGIST', action: 'Eliminar Citas', enabled: true },

        // Pacientes
        { role: 'KINESIOLOGIST', action: 'Ver Pacientes', enabled: true },
        { role: 'KINESIOLOGIST', action: 'Crear Pacientes', enabled: true },
        { role: 'KINESIOLOGIST', action: 'Editar Pacientes', enabled: true },
        { role: 'KINESIOLOGIST', action: 'Eliminar Pacientes', enabled: true },

        // Reportes BI
        { role: 'KINESIOLOGIST', action: 'Ver Reportes BI', enabled: true },

        // Asistente Clínico
        { role: 'KINESIOLOGIST', action: 'Acceder Asistente Clínico', enabled: true },

        // Estándar HL7
        { role: 'KINESIOLOGIST', action: 'Acceder Estándar HL7', enabled: true },

        // Exámenes
        { role: 'KINESIOLOGIST', action: 'Ver Exámenes', enabled: true },
        { role: 'KINESIOLOGIST', action: 'Subir Exámenes', enabled: true },

        // Configuración - NO por defecto
        { role: 'KINESIOLOGIST', action: 'Configuración Global', enabled: false },
        { role: 'KINESIOLOGIST', action: 'Ver Usuarios', enabled: false },
        { role: 'KINESIOLOGIST', action: 'Crear Usuarios', enabled: false },
        { role: 'KINESIOLOGIST', action: 'Editar Usuarios', enabled: false },
        { role: 'KINESIOLOGIST', action: 'Eliminar Usuarios', enabled: false },

        // ====================
        // RECEPTIONIST
        // ====================

        // Agendamiento
        { role: 'RECEPTIONIST', action: 'Ver Agendamiento', enabled: true },
        { role: 'RECEPTIONIST', action: 'Crear Citas', enabled: true },
        { role: 'RECEPTIONIST', action: 'Editar Citas', enabled: true },
        { role: 'RECEPTIONIST', action: 'Eliminar Citas', enabled: false },

        // Pacientes
        { role: 'RECEPTIONIST', action: 'Ver Pacientes', enabled: true },
        { role: 'RECEPTIONIST', action: 'Crear Pacientes', enabled: true },
        { role: 'RECEPTIONIST', action: 'Editar Pacientes', enabled: true },
        { role: 'RECEPTIONIST', action: 'Eliminar Pacientes', enabled: false },

        // Reportes BI - NO
        { role: 'RECEPTIONIST', action: 'Ver Reportes BI', enabled: false },

        // Asistente Clínico - NO
        { role: 'RECEPTIONIST', action: 'Acceder Asistente Clínico', enabled: false },

        // Estándar HL7 - NO
        { role: 'RECEPTIONIST', action: 'Acceder Estándar HL7', enabled: false },

        // Exámenes
        { role: 'RECEPTIONIST', action: 'Ver Exámenes', enabled: true },
        { role: 'RECEPTIONIST', action: 'Subir Exámenes', enabled: false },

        // Configuración - NO
        { role: 'RECEPTIONIST', action: 'Configuración Global', enabled: false },
        { role: 'RECEPTIONIST', action: 'Ver Usuarios', enabled: false },
        { role: 'RECEPTIONIST', action: 'Crear Usuarios', enabled: false },
        { role: 'RECEPTIONIST', action: 'Editar Usuarios', enabled: false },
        { role: 'RECEPTIONIST', action: 'Eliminar Usuarios', enabled: false },
    ];

    try {
        for (const perm of defaultPermissions) {
            await prisma.rolePermission.upsert({
                where: {
                    role_action: {
                        role: perm.role,
                        action: perm.action
                    }
                },
                create: perm,
                update: { enabled: perm.enabled }
            });
        }

        await logAction('SEED_PERMISSIONS', `Permissions seeded/updated for ${defaultPermissions.length} entries`);
        revalidatePath('/dashboard');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Error seeding permissions' };
    }
}
