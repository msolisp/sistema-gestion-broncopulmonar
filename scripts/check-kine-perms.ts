
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkKinePerms() {
    console.log('--- ROLE PERMISSIONS (KINESIOLOGO) ---');
    const rolePerms = await prisma.permisoRol.findMany({
        where: {
            rol: { nombre: 'KINESIOLOGO' }
        },
        include: { rol: true }
    });
    console.table(rolePerms.map(p => ({
        recurso: p.recurso,
        accion: p.accion,
        activo: p.activo
    })));

    console.log('\n--- USER PERMISSIONS (kine1@test.com) ---');
    const userPerms = await prisma.permisoUsuario.findMany({
        where: {
            usuario: {
                persona: { email: 'kine1@test.com' }
            }
        }
    });
    console.table(userPerms.map(p => ({
        recurso: p.recurso,
        accion: p.accion,
        activo: p.activo
    })));
}

checkKinePerms()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
