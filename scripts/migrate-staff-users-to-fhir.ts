/**
 * Script to migrate legacy staff users to FHIR schema
 * 
 * Prerequisites:
 * 1. RUTs assigned to all users (run assign-ruts-to-legacy-users.sql first)
 * 2. Schema migration applied
 * 
 * Usage:
 *   npx tsx scripts/migrate-staff-users-to-fhir.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client';
import { createStaffUser } from '@/lib/fhir-adapters';

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');

async function migrateStaffUsers() {
    console.log(`\n🔄 Migrating staff users ${isDryRun ? '(DRY RUN)' : ''}...\n`);

    const users = await prisma.user.findMany({
        where: {
            rut: { not: null }
        }
    });

    let migrated = 0;
    let errors: string[] = [];

    for (const user of users) {
        try {
            // Check if already migrated
            const existingPersona = await prisma.persona.findUnique({
                where: { rut: user.rut! }
            });

            if (existingPersona) {
                console.log(`  ⏭️  Skipping ${user.email} - already migrated`);
                continue;
            }

            if (!isDryRun) {
                // Parse name
                const nameParts = (user.name || user.email).trim().split(' ');
                const apellidoPaterno = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
                const apellidoMaterno = nameParts.length > 2 ? nameParts[nameParts.length - 2] : undefined;
                const nombre = nameParts.slice(0, Math.max(1, nameParts.length - (apellidoMaterno ? 2 : 1))).join(' ');

                // Map role to enum
                const rolMap: Record<string, any> = {
                    'KINESIOLOGIST': 'KINESIOLOGO',
                    'ADMIN': 'ADMIN',
                    'RECEPTIONIST': 'RECEPCIONISTA',
                };
                const rolEnum = rolMap[user.role] || 'RECEPCIONISTA';

                await createStaffUser({
                    rut: user.rut!,
                    nombre: nombre || user.email,
                    apellidoPaterno: apellidoPaterno || 'SIN_APELLIDO',
                    apellidoMaterno,
                    email: user.email,
                    password: user.password, // Already hashed
                    rol: rolEnum,
                    direccion: user.address || undefined,
                    comuna: user.commune || undefined,
                    region: user.region || undefined,
                    creadoPor: 'STAFF_MIGRATION_SCRIPT'
                });

                migrated++;
            }

            console.log(`  ✅ Migrated staff user: ${user.email} (${user.role})`);
        } catch (error) {
            const errorMsg = `Error migrating ${user.email}: ${error}`;
            console.error(`  ❌ ${errorMsg}`);
            errors.push(errorMsg);
        }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Staff Migration Summary');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total users: ${users.length}`);
    console.log(`Migrated: ${migrated}`);
    console.log(`Errors: ${errors.length}`);

    if (errors.length > 0) {
        console.log('\n❌ Errors:');
        errors.forEach(e => console.log(`  - ${e}`));
    }

    await prisma.$disconnect();
}

migrateStaffUsers().catch(console.error);
