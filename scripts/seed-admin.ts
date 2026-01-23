
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash('Admin123!', 10);

    // Create Admin
    const adminEmail = 'admin@example.com';
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password,
            role: 'ADMIN',
            active: true
        },
        create: {
            email: adminEmail,
            name: 'Admin E2E',
            password,
            role: 'ADMIN',
            active: true,
            mustChangePassword: false
        }
    });
    console.log('Admin created:', admin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
