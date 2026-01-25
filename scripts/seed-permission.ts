
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding "Subir Examenes" permission...');

    // 1. Ensure the module/resource "Portal_Pacientes" exists (conceptually)
    // The previous screenshot showed "Permisos del Paciente", which maps to 'Portal_Pacientes' resource in existing data usually.

    try {
        const permission = await prisma.permiso.upsert({
            where: {
                accion_recurso: {
                    accion: 'Subir Examenes',
                    recurso: 'Portal_Pacientes'
                }
            },
            update: {
                descripcion: 'Permite al paciente subir sus propios exámenes médicos'
            },
            create: {
                accion: 'Subir Examenes',
                recurso: 'Portal_Pacientes',
                descripcion: 'Permite al paciente subir sus propios exámenes médicos'
            }
        });

        console.log('Permission seeded:', permission);

        // Optionally, assign it to PACIENTE role automatically?
        // User asked to enable it in Administration, but maybe we can help.
        // Let's just create it so it appears in the UI.

    } catch (e) {
        console.error('Error seeding permission:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
