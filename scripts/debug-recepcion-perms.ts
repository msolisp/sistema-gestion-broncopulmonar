
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUserStatus() {
    const email = 'recepcion1@test.com';
    const user = await prisma.usuarioSistema.findFirst({
        where: { persona: { email } },
        include: {
            rol_rel: true,
            persona: true,
            permisos: {
                where: { activo: true }
            }
        }
    });

    if (!user) {
        console.log(`User ${email} not found.`);
        return;
    }

    console.log('--- USER DATA ---');
    console.log(`Name: ${user.persona.nombre} ${user.persona.apellidoPaterno}`);
    console.log(`Role assigned in UsuarioSistema: ${user.rol_rel.nombre}`);

    console.log('\n--- EXPLICIT USER PERMISSIONS (PermisoUsuario) ---');
    if (user.permisos.length === 0) {
        console.log('No explicit permissions found.');
    } else {
        console.table(user.permisos.map(p => ({
            recurso: p.recurso,
            accion: p.accion,
            activo: p.activo
        })));
    }

    console.log('\n--- ROLE PERMISSIONS DEFINED IN PermisoRol FOR THIS ROLE ---');
    const rolePerms = await prisma.permisoRol.findMany({
        where: { rolId: user.rolId, activo: true }
    });
    console.table(rolePerms.map(p => ({
        recurso: p.recurso,
        accion: p.accion,
        activo: p.activo
    })));
}

checkUserStatus()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
