/**
 * Quick script to assign RUTs to legacy users without RUT
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignRuts() {
    console.log('🔄 Assigning RUTs to legacy users...\n');

    try {
        // Admin
        const admin = await prisma.user.update({
            where: { email: 'admin@example.com' },
            data: { rut: '11111111-1' }
        });
        console.log(`✅ Admin: ${admin.email} → ${admin.rut}`);

        // Kine
        const kine = await prisma.user.update({
            where: { email: 'kine@test.com' },
            data: { rut: '22222222-2' }
        });
        console.log(`✅ Kine: ${kine.email} → ${kine.rut}`);

        // Receptionist
        const recep = await prisma.user.update({
            where: { email: 'recepcion@example.com' },
            data: { rut: '33333333-3' }
        });
        console.log(`✅ Reception: ${recep.email} → ${recep.rut}`);

        // E2E Kine
        const kineE2E = await prisma.user.update({
            where: { email: 'kine_e2e@test.com' },
            data: { rut: '44444444-4' }
        });
        console.log(`✅ Kine E2E: ${kineE2E.email} → ${kineE2E.rut}`);

        console.log('\n✅ All RUTs assigned successfully!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

assignRuts();
