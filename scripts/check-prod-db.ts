// Script to check production database state
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});

async function checkProductionDB() {
    try {
        console.log('🔍 Checking Production Database...\n');

        // Test connection
        await prisma.$connect();
        console.log('✅ Database connection successful\n');

        // Check Users
        const userCount = await prisma.user.count();
        console.log(`📊 Total users in database: ${userCount}`);

        if (userCount > 0) {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    role: true,
                    active: true,
                    mustChangePassword: true,
                    createdAt: true
                }
            });

            console.log('\n👥 Users:');
            users.forEach(user => {
                console.log(`  - ${user.email} (${user.role}) - Active: ${user.active} - MustChange: ${user.mustChangePassword}`);
            });
        } else {
            console.log('⚠️  NO USERS FOUND IN DATABASE!');
        }

        // Check Patients
        console.log('\n');
        const patientCount = await prisma.patient.count();
        console.log(`📊 Total patients in database: ${patientCount}`);

        if (patientCount > 0) {
            const patients = await prisma.patient.findMany({
                select: {
                    id: true,
                    email: true,
                    active: true,
                    createdAt: true
                },
                take: 5
            });

            console.log('\n🏥 Patients (first 5):');
            patients.forEach(patient => {
                console.log(`  - ${patient.email} - Active: ${patient.active}`);
            });
        }

        // Check sample user password hash
        if (userCount > 0) {
            const firstUser = await prisma.user.findFirst({
                where: { role: 'ADMIN' }
            });

            if (firstUser) {
                console.log('\n🔐 Sample admin user password hash:');
                console.log(`  Email: ${firstUser.email}`);
                console.log(`  Hash: ${firstUser.password.substring(0, 20)}...`);
                console.log(`  Hash length: ${firstUser.password.length}`);

                // Verify it's a bcrypt hash
                const isBcrypt = firstUser.password.startsWith('$2a$') ||
                    firstUser.password.startsWith('$2b$') ||
                    firstUser.password.startsWith('$2y$');
                console.log(`  Is valid bcrypt hash: ${isBcrypt}`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkProductionDB();
