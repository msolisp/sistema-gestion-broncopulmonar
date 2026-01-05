
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Checking for inconsistent patient data...");

    // Find patients without profile
    const usersWithoutProfile = await prisma.user.findMany({
        where: {
            role: 'PATIENT',
            patientProfile: {
                is: null
            }
        }
    });

    console.log(`Found ${usersWithoutProfile.length} users with role 'PATIENT' but NO profile.`);

    for (const user of usersWithoutProfile) {
        console.log(`🛠️ Fixing user: ${user.name} (${user.email})...`);

        // Generate placeholder data
        const timestamp = Date.now();
        // Simple algorithm to generate valid looking RUTs/Phone for testing
        const pseudoRandom = Math.floor(Math.random() * 10000);

        try {
            await prisma.patient.create({
                data: {
                    userId: user.id,
                    rut: `TMP-${timestamp}-${pseudoRandom}`, // Temporary RUT to avoid collisions
                    commune: 'SANTIAGO',
                    address: 'Dirección Generada por Script',
                    healthSystem: 'FONASA',
                    birthDate: new Date('1990-01-01'),
                    diagnosisDate: new Date(),
                    phone: '+56900000000'
                }
            });
            console.log(`✅ Profile created for ${user.email}`);
        } catch (error) {
            console.error(`❌ Failed to fix ${user.email}:`, error);
        }
    }

    console.log("✨ Data repair completed.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
