
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Ensuring PACIENTE role has "Subir Examenes" permission...');

    const role = await prisma.rol.findUnique({ where: { nombre: 'PACIENTE' } });
    if (!role) {
        // Try 'PACIENTE' or 'Paciente'
        const role2 = await prisma.rol.findFirst({ where: { nombre: { equals: 'PACIENTE', mode: 'insensitive' } } });
        if (!role2) {
            console.error('Role PACIENTE not found');
            return;
        }
        console.log(`Found role: ${role2.nombre}`);
    }
    const targetRole = role || await prisma.rol.findFirst({ where: { nombre: { equals: 'PACIENTE', mode: 'insensitive' } } });
    if (!targetRole) return;

    // Direct insertion into PermisoRol (Schema has no Permiso model)
    await prisma.permisoRol.upsert({
        where: {
            rolId_recurso_accion: {
                rolId: targetRole.id,
                recurso: 'Portal_Pacientes',
                accion: 'Subir Examenes'
            }
        },
        update: {
            activo: true
        },
        create: {
            rolId: targetRole.id,
            recurso: 'Portal_Pacientes',
            accion: 'Subir Examenes',
            activo: true
        }
    });

    console.log('Permission assigned successfully to PermisoRol.');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
