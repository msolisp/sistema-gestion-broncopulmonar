
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixUser() {
    const email = 'recepcion1@test.com';

    // 1. Find the user and the correct role
    const user = await prisma.usuarioSistema.findFirst({
        where: { persona: { email } },
        include: { persona: true }
    });

    const role = await prisma.rol.findFirst({
        where: { nombre: 'RECEPCIONISTA' }
    });

    if (!user || !role) {
        console.log('User or Role not found.');
        return;
    }

    console.log(`Fixing user ${email}...`);

    // 2. Update role and clear "SIN_APELLIDO" from name
    const nameParts = user.persona.nombre.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ').replace('SIN_APELLIDO', '').trim() : '';

    await prisma.persona.update({
        where: { id: user.personaId },
        data: {
            nombre: firstName,
            apellidoPaterno: lastName || 'Recepcion', // Better fallback
            apellidoMaterno: null
        }
    });

    await prisma.usuarioSistema.update({
        where: { id: user.id },
        data: { rolId: role.id }
    });

    // 3. Delete explicit permissions (so it uses role permissions)
    await prisma.permisoUsuario.deleteMany({
        where: { usuarioId: user.id }
    });

    // 4. Seed new permissions from RECEPCIONISTA role
    const rolePermissions = await prisma.permisoRol.findMany({
        where: { rolId: role.id, activo: true }
    });

    for (const perm of rolePermissions) {
        await prisma.permisoUsuario.create({
            data: {
                usuarioId: user.id,
                recurso: perm.recurso,
                accion: perm.accion,
                activo: true,
                otorgadoPor: 'SYSTEM_FIX'
            }
        });
    }

    console.log('User fixed successfully.');
}

fixUser()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
