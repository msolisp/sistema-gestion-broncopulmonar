
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@example.com';
    const password = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email },
        update: {
            password,
            role: 'ADMIN',
            active: true,
            mustChangePassword: false
        },
        create: {
            email,
            name: 'Admin User',
            password,
            role: 'ADMIN',
            active: true,
            mustChangePassword: false
        },
    });

    console.log('Admin user ensured:', admin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
