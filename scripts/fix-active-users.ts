
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Checking for inactive patients...');

    const result = await prisma.user.updateMany({
        where: {
            role: 'PATIENT',
            active: false
        },
        data: {
            active: true
        }
    });

    console.log(`✅ Activated ${result.count} patient accounts.`);

    // Verify specifically for paciente1
    const p1 = await prisma.user.findUnique({ where: { email: 'paciente1@test.com' } });
    console.log(`🔎 Paciente1 Active Status: ${p1?.active}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
