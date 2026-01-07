
import prisma from '@/lib/prisma';

async function main() {
    const admin = await prisma.user.findUnique({
        where: { email: 'admin@example.com' }
    });
    console.log('Admin User:', admin);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
