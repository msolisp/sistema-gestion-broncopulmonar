
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- ROLES ---');
    const roles = await prisma.rol.findMany();
    console.table(roles.map(r => ({ id: r.id, nombre: r.nombre, activo: r.activo })));

    console.log('\n--- ADMIN USER ---');
    const adminPersona = await prisma.persona.findUnique({
        where: { email: 'admin@hospital.cl' },
        include: {
            usuarioSistema: {
                include: { rol_rel: true }
            }
        }
    });

    if (adminPersona) {
        console.log('Admin User Found:');
        console.log('Name:', adminPersona.nombre);
        console.log('Email:', adminPersona.email);
        if (adminPersona.usuarioSistema) {
            console.log('Role Name (DB):', adminPersona.usuarioSistema.rol_rel.nombre);
            console.log('Role ID:', adminPersona.usuarioSistema.rol_rel.id);
        } else {
            console.log('UsuarioSistema: NULL');
        }
    } else {
        console.log('User admin@hospital.cl NOT FOUND');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
