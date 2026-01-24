
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking UsuarioSistema records ---');
    try {
        const users = await prisma.usuarioSistema.findMany({
            include: { persona: true }
        });
        console.log(`Successfully fetched ${users.length} users.`);
        console.log('Sample user:', JSON.stringify(users[0], null, 2));
    } catch (e: any) {
        console.error('❌ Error fetching users:', e.message);
        console.error('Stack:', e.stack);
    } finally {
        await prisma.$disconnect();
    }
}

main();
