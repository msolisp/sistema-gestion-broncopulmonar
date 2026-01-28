import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.$queryRaw`SELECT id, "personaId", "rolId" FROM "usuario_sistema"`;
        console.log('Users in DB:', users);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
