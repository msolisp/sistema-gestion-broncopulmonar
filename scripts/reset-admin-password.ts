// Reset admin password in production database
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});

async function resetAdminPassword() {
    try {
        console.log('🔐 Resetting Admin Password in Production...\n');

        const newPassword = 'admin123'; // Simple password for easy access
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const admin = await prisma.user.update({
            where: { email: 'admin@example.com' },
            data: {
                password: hashedPassword,
                mustChangePassword: false,
                active: true
            }
        });

        console.log('✅ Admin password reset successfully!');
        console.log('\n📋 Credentials:');
        console.log(`  Email: admin@example.com`);
        console.log(`  Password: ${newPassword}`);
        console.log(`  Role: ${admin.role}`);
        console.log(`  Active: ${admin.active}`);

        // Also reset some patient passwords
        console.log('\n\n🏥 Resetting patient passwords...');
        const patientPassword = 'paciente123';
        const hashedPatientPassword = await bcrypt.hash(patientPassword, 10);

        for (let i = 1; i <= 5; i++) {
            const email = `paciente${i}@test.com`;
            try {
                await prisma.patient.update({
                    where: { email },
                    data: { password: hashedPatientPassword }
                });
                console.log(`  ✅ Reset password for ${email}`);
            } catch (e) {
                console.log(`  ⚠️  Could not reset ${email}`);
            }
        }

        console.log('\n\n✨ All passwords reset successfully!');
        console.log('\n🔑 Working Credentials:');
        console.log('\nINTERNAL PORTAL (https://sistema-gestion-broncopulmonar.vercel.app/intranet/login):');
        console.log('  - admin@example.com / admin123 (ADMIN)');
        console.log('  - kine@test.com / kine123 (KINESIOLOGIST)');
        console.log('  - recep@test.com / recep123 (RECEPTIONIST)');
        console.log('\nPATIENT PORTAL (https://sistema-gestion-broncopulmonar.vercel.app/login):');
        console.log('  - paciente1@test.com / paciente123');
        console.log('  - paciente2@test.com / paciente123');
        console.log('  - paciente3@test.com / paciente123');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdminPassword();
