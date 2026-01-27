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
    console.log('🚀 Fixing Roles for Broncopulmonar...');
    try {
        await prisma.$connect();

        // 1. Roles to Delete (Anatomy specific)
        const rolesToDelete = ['PATHOLOGIST', 'TECHNICIAN', 'SECRETARY'];

        // 2. Roles to Create (Bronco specific)
        const rolesToCreate = [
            { id: 'kinesiologo-role', nombre: 'KINESIOLOGO', descripcion: 'Kinesiólogo' },
            { id: 'recepcionista-role', nombre: 'RECEPCIONISTA', descripcion: 'Recepcionista' }
        ];

        // Delete old roles
        console.log('  -> Removing Anatomy roles...');
        const deleteResult = await prisma.rol.deleteMany({
            where: {
                nombre: { in: rolesToDelete }
            }
        });
        console.log(`     - Deleted ${deleteResult.count} roles.`);

        // Create new roles
        console.log('  -> 创建 Broncopulmonar roles...');
        for (const role of rolesToCreate) {
            const existing = await prisma.rol.findUnique({ where: { nombre: role.nombre } });
            if (!existing) {
                await prisma.rol.create({ data: role });
                console.log(`     + Created role: ${role.nombre}`);
            } else {
                console.log(`     . Role ${role.nombre} already exists.`);
            }
        }

    } catch (e: any) {
        console.error('❌ Error fixing roles:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
