
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const emailToDelete = 'admin@test.com';

    console.log(`Checking for user: ${emailToDelete}...`);

    const user = await prisma.user.findUnique({
        where: { email: emailToDelete },
    });

    if (!user) {
        console.log(`User ${emailToDelete} not found.`);
        return;
    }

    console.log(`Found user ${user.email} (ID: ${user.id}). Deleting...`);

    await prisma.user.delete({
        where: { email: emailToDelete },
    });

    console.log(`User ${emailToDelete} deleted successfully.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
