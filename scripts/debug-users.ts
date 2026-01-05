
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching users...");
    const users = await prisma.user.findMany({
        include: {
            patientProfile: true
        }
    });

    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        console.log(`User: ${user.name} (${user.email}) - Role: ${user.role}`);
        if (user.patientProfile) {
            console.log(`  ✅ Linked to Patient Profile: ID ${user.patientProfile.id}, Name: ${user.patientProfile.rut}`);
        } else {
            console.log(`  ❌ NO Patient Profile Linked`);
        }
        console.log('---');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
