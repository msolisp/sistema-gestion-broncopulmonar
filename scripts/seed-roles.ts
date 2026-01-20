
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const users = [
        {
            email: 'kine@test.com',
            password: 'kine123',
            name: 'Kinesiólogo Test',
            role: 'KINESIOLOGIST',
            active: true
        },
        {
            email: 'recep@test.com',
            password: 'recep123',
            name: 'Recepcionista Test',
            role: 'RECEPTIONIST',
            active: true
        }
    ];

    console.log('Seeding role users...');

    for (const u of users) {
        const hashedPassword = await bcrypt.hash(u.password, 10);

        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                password: hashedPassword,
                role: u.role,
                active: u.active
            },
            create: {
                email: u.email,
                password: hashedPassword,
                name: u.name,
                role: u.role,
                active: u.active,
                mustChangePassword: false // Simplify testing
            }
        });
        console.log(`Created/Updated: ${u.email} (${u.role})`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
