
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.join(process.cwd(), '.env.production.local');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

const prisma = new PrismaClient({
    datasources: { db: { url: process.env.POSTGRES_URL || process.env.DATABASE_URL } }
});

async function main() {
    try {
        await prisma.$connect();

        const countNew = await prisma.notification.count();
        console.log(`- New 'Notification' table count: ${countNew}`);
        if (countNew > 0) {
            const sample = await prisma.notification.findFirst({ include: { patient: true } });
            console.log('Sample Notification:', JSON.stringify(sample, null, 2));
        }

        const countOld = await prisma.notificacionMedica.count();
        console.log(`- Old 'NotificacionMedica' table count: ${countOld}`);
        if (countOld > 0) {
            const sample = await prisma.notificacionMedica.findFirst();
            console.log('Sample NotificacionMedica:', JSON.stringify(sample, null, 2));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
