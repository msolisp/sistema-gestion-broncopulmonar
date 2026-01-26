
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanFlags() {
    const result = await prisma.credencial.updateMany({
        data: {
            debeCambiarPassword: false
        }
    });
    console.log(`Updated ${result.count} credentials.`);
}

cleanFlags()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
