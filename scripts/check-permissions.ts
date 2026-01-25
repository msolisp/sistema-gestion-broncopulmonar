
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- PERMISO ROL ---');
    const roles = await prisma.rol.findMany({
        include: { permisos: true }
    });

    roles.forEach(r => {
        console.log(`ROLE: ${r.nombre}`);
        r.permisos.filter(p => p.activo).forEach(p => {
            console.log(`  - ${p.recurso}: ${p.accion}`);
        });
        if (r.permisos.length === 0) console.log('  (No permissions)');
        console.log('');
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
