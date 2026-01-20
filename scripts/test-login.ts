// Test login with bcrypt password verification
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});

async function testLogin() {
    try {
        console.log('🔐 Testing Login Process...\n');

        // Test credentials
        const testCases = [
            { email: 'admin@example.com', password: 'admin123', role: 'ADMIN' },
            { email: 'kine@test.com', password: 'kine123', role: 'KINESIOLOGIST' },
            { email: 'recep@test.com', password: 'recep123', role: 'RECEPTIONIST' },
            { email: 'paciente1@test.com', password: 'paciente123', role: 'PATIENT' },
        ];

        for (const testCase of testCases) {
            console.log(`\n📝 Testing: ${testCase.email} (${testCase.role})`);

            if (testCase.role === 'PATIENT') {
                const patient = await prisma.patient.findUnique({
                    where: { email: testCase.email }
                });

                if (!patient) {
                    console.log(`  ❌ Patient not found`);
                    continue;
                }

                console.log(`  ✅ Patient found in database`);
                console.log(`  🔑 Hash: ${patient.password.substring(0, 30)}...`);

                const passwordsMatch = await bcrypt.compare(testCase.password, patient.password);
                console.log(`  ${passwordsMatch ? '✅' : '❌'} Password match: ${passwordsMatch}`);

            } else {
                const user = await prisma.user.findUnique({
                    where: { email: testCase.email }
                });

                if (!user) {
                    console.log(`  ❌ User not found`);
                    continue;
                }

                console.log(`  ✅ User found in database`);
                console.log(`  🔑 Hash: ${user.password.substring(0, 30)}...`);
                console.log(`  Active: ${user.active}`);
                console.log(`  Must change password: ${user.mustChangePassword}`);

                const passwordsMatch = await bcrypt.compare(testCase.password, user.password);
                console.log(`  ${passwordsMatch ? '✅' : '❌'} Password match: ${passwordsMatch}`);
            }
        }

        console.log('\n\n🔧 Environment Check:');
        console.log(`  AUTH_SECRET set: ${!!process.env.AUTH_SECRET}`);
        console.log(`  AUTH_SECRET length: ${process.env.AUTH_SECRET?.length || 0}`);
        console.log(`  AUTH_SECRET value: ${process.env.AUTH_SECRET?.substring(0, 20)}...`);
        console.log(`  AUTH_URL: ${process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'NOT SET'}`);
        console.log(`  DATABASE_URL set: ${!!process.env.DATABASE_URL}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testLogin();
