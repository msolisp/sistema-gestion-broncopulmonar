
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'paciente1@test.com';
    const password = 'Paciente';

    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error('❌ User not found in database!');
        return;
    }

    console.log('✅ User found.');
    console.log('Role:', user.role);
    console.log('Active Status:', user.active);
    console.log('Stored Hash:', user.password);

    const isValid = await bcrypt.compare(password, user.password);

    if (isValid) {
        console.log('✅ Password "Paciente" is VALID.');
    } else {
        console.error('❌ Password "Paciente" is INVALID.');

        // Attempt to fix it
        console.log('🔄 Attempting to fix password...');
        const newHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { email },
            data: { password: newHash }
        });
        console.log('✅ Password updated to "Paciente" (new hash).');
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
