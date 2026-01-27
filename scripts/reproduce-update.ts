
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { updateStaffUser } from './src/lib/fhir-adapters'; // Direct import might fail if not compiled, better to use inline logic or tsx

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
    console.log('🧪 Reproducing User Update...');

    try {
        await prisma.$connect();

        // 1. Find User
        const user = await prisma.usuarioSistema.findFirst({
            where: { persona: { email: 'kine@neumovital.cl' } },
            include: { persona: true }
        });

        if (!user) {
            console.error('❌ User not found');
            return;
        }

        console.log(`Found user: ${user.persona.email} (ID: ${user.id})`);

        // 2. Simulate Update Logic from actions.staff.ts
        // Original logic:
        /*
         const nameParts = vName.trim().split(/\s+/);
         const firstName = nameParts[0];
         const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        */
        const newName = "User Kine Edited";
        const nameParts = newName.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        console.log(`Updating Name to: ${firstName} ${lastName}`);

        // Call update logic (inlined to avoid import issues with tsx)
        const result = await prisma.$transaction(async (tx) => {
            // 1. Find UsuarioSistema to get personaId
            const staff = await tx.usuarioSistema.findUnique({
                where: { id: user.id },
                include: { persona: true }
            });

            if (!staff) throw new Error('Staff user not found');
            const personaId = staff.personaId;

            console.log('Updating Persona...');
            await tx.persona.update({
                where: { id: personaId },
                data: {
                    nombre: firstName,
                    apellidoPaterno: lastName,
                    apellidoMaterno: null, // This was the explicit null in actions.staff.ts
                    // modificadoPor: 'SCRIPT'
                }
            });
            console.log('Reference update done.');
            return { success: true };
        });

        console.log('✅ Update Successful:', result);

    } catch (e: any) {
        console.error('❌ Update Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
