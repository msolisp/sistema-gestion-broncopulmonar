
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'broken@test.com';
    const password = await bcrypt.hash('BrokenUser', 10);

    // Create user WITHOUT patient profile
    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: 'Broken User (No Deps)',
            password,
            role: 'PATIENT'
        }
    });

    console.log(`Created broken user: ${user.email}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
