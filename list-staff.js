
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Listing all Staff users in DB...');
    try {
        const staff = await prisma.usuarioSistema.findMany({
            include: {
                persona: true
            }
        });

        console.log(`Found ${staff.length} staff users:`);
        staff.forEach(s => {
            console.log(`- ${s.persona.nombre} ${s.persona.apellidoPaterno} (${s.persona.email}) [Rol: ${s.rol}, Active: ${s.activo}]`);
        });

    } catch (e) {
        console.error('Error querying DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
