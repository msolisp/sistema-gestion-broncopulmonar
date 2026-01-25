
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Migrating existing patients to have RBAC support...');

    // Ensure 'PACIENTE' role exists
    const pacienteRole = await prisma.rol.upsert({
        where: { nombre: 'PACIENTE' },
        update: {},
        create: {
            nombre: 'PACIENTE',
            descripcion: 'Rol para pacientes del sistema',
            activo: true
        }
    });

    console.log(`ℹ️  Using Role: ${pacienteRole.nombre} (${pacienteRole.id})`);

    // Find all patients (Credencial.tipoAcceso === 'PACIENTE')
    const patients = await prisma.credencial.findMany({
        where: { tipoAcceso: 'PACIENTE' },
        include: { persona: true }
    });

    console.log(`Found ${patients.length} patients.`);

    let created = 0;
    let skipped = 0;

    for (const p of patients) {
        // Check if they already have a UsuarioSistema
        const existing = await prisma.usuarioSistema.findUnique({
            where: { personaId: p.personaId }
        });

        if (!existing) {
            await prisma.usuarioSistema.create({
                data: {
                    personaId: p.personaId,
                    rolId: pacienteRole.id,
                    creadoPor: 'SYSTEM_MIGRATION',
                    activo: true
                }
            });
            created++;
        } else {
            // Ensure they have the correct role if they already had a system record
            if (existing.rolId !== pacienteRole.id) {
                await prisma.usuarioSistema.update({
                    where: { id: existing.id },
                    data: { rolId: pacienteRole.id }
                });
            }
            skipped++;
        }
    }

    console.log(`✅ Migration complete. Created ${created} records, updated/skipped ${skipped}.`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
