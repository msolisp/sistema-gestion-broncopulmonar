
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkConflict() {
    const email = 'kine@test.com';
    const persona = await prisma.persona.findUnique({
        where: { email },
        include: {
            usuarioSistema: true
        }
    });

    if (!persona) {
        console.log(`No persona found with email ${email}`);
        return;
    }

    console.log('--- PERSONA FOUND ---');
    console.log(`ID: ${persona.id}`);
    console.log(`RUT: ${persona.rut}`);
    console.log(`Name: ${persona.nombre}`);
    console.log(`Email: ${persona.email}`);

    if (persona.usuarioSistema) {
        console.log('\n--- USUARIO SISTEMA ---');
        console.log(`ID: ${persona.usuarioSistema.id}`);
        console.log(`Activo: ${persona.usuarioSistema.activo}`);
        console.log(`Eliminado En: ${persona.usuarioSistema.eliminadoEn}`);
        console.log(`Eliminado Por: ${persona.usuarioSistema.eliminadoPor}`);
    } else {
        console.log('\nNo UsuarioSistema found for this persona.');
    }
}

checkConflict()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
