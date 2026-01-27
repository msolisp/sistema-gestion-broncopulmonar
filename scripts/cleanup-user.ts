
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load production env vars
const envPath = path.join(process.cwd(), '.env.production.local');
if (fs.existsSync(envPath)) {
    console.log('Loading .env.production.local');
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.POSTGRES_URL || process.env.DATABASE_URL
        }
    }
});

async function main() {
    console.log('🧹 Cleaning up test user...');

    try {
        await prisma.$connect();
        const persona = await prisma.persona.findFirst({ where: { email: 'kine@neumovital.cl' } });

        if (persona) {
            await prisma.usuarioSistema.deleteMany({ where: { personaId: persona.id } });
            await prisma.credencial.deleteMany({ where: { personaId: persona.id } });
            await prisma.persona.delete({ where: { id: persona.id } });
            console.log('✅ User deleted successfully.');
        } else {
            console.log('User not found, nothing to delete.');
        }
    } catch (e: any) {
        console.error('❌ Error deleting:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
