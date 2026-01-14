
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking recent system logs...');

    const logs = await prisma.systemLog.findMany({
        where: {
            action: 'LOGIN_SUCCESS'
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 20
    });

    console.log(`Found ${logs.length} recent logins:`);
    console.log('--------------------------------------------------');
    logs.forEach(log => {
        console.log(`[${log.createdAt.toISOString()}] ${log.userEmail || 'Unknown'} - ${log.details}`);
    });
    console.log('--------------------------------------------------');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
