
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Seeding dynamic roles...');

    const defaultRoles = [
        { nombre: 'ADMIN', descripcion: 'Administrador del sistema con acceso total.' },
        { nombre: 'KINESIOLOGO', descripcion: 'Personal médico especializado en kinesiología.' },
        { nombre: 'MEDICO', descripcion: 'Médicos especialistas.' },
        { nombre: 'ENFERMERA', descripcion: 'Personal de enfermería.' },
        { nombre: 'TECNICO_PARVULARIO', descripcion: 'Técnico parvulario.' },
        { nombre: 'RECEPCIONISTA', descripcion: 'Personal administrativo de recepción.' },
        { nombre: 'PACIENTE', descripcion: 'Usuarios finales (pacientes).' },
        { nombre: 'ASISTENTE_IA', descripcion: 'Asistente Virtual con capacidades de IA' },
    ];

    const rolesMap: { [key: string]: string } = {};

    for (const r of defaultRoles) {
        const created = await prisma.rol.upsert({
            where: { nombre: r.nombre },
            update: { descripcion: r.descripcion },
            create: r
        });
        rolesMap[r.nombre] = created.id;
        console.log(`✅ Role ${r.nombre} created/updated.`);
    }

    // Assign users back to roles
    // Since we dropped the column, we have to guess or use emails.
    // In this specific system, let's look for common indicators.
    const users = await prisma.usuarioSistema.findMany({ include: { persona: true } });
    console.log(`Updating ${users.length} users...`);

    for (const u of users) {
        let roleName = 'RECEPCIONISTA'; // Default fallback
        const email = u.persona.email?.toLowerCase() || '';
        const nombre = u.persona.nombre?.toLowerCase() || '';

        if (email.includes('admin')) roleName = 'ADMIN';
        else if (email.includes('kine')) roleName = 'KINESIOLOGO';
        else if (email.includes('medico') || email.includes('doctor')) roleName = 'MEDICO';
        else if (email.includes('enfermera')) roleName = 'ENFERMERA';
        else if (email.includes('test.com') && nombre.includes('recepcion')) roleName = 'RECEPCIONISTA';

        // Patients are those who were migrated from Credencial
        // We can check if they have a FichaClinica
        const ficha = await prisma.fichaClinica.findUnique({ where: { personaId: u.personaId } });
        if (ficha) {
            roleName = 'PACIENTE';
        }

        await prisma.usuarioSistema.update({
            where: { id: u.id },
            data: { rolId: rolesMap[roleName] }
        });
    }

    console.log('🏁 Roles seeded and users assigned.');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
