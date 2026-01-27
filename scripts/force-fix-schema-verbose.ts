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
    console.log('🚀 Verbosely repairing schema...');
    try {
        await prisma.$connect();
        console.log('✅ Connected to DB provider:', process.env.POSTGRES_URL ? 'Neon (via POSTGRES_URL)' : 'Default');

        // Helper
        const addColumn = async (table: string, col: string, type: string) => {
            console.log(`  -> Altering ${table}: Adding ${col} ${type}...`);
            try {
                await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${col}" ${type};`);
                console.log(`     ✅ Success: ${table}.${col} added.`);
            } catch (e: any) {
                console.log(`     ❌ Failed to add ${table}.${col}: ${e.message}`);
            }
        };

        const addIndex = async (name: string, query: string) => {
            console.log(`  -> Creating index ${name}...`);
            try {
                await prisma.$executeRawUnsafe(query);
                console.log(`     ✅ Success: Index ${name} created.`);
            } catch (e: any) {
                console.log(`     ❌ Failed to create index ${name}: ${e.message}`);
            }
        };

        // Persona
        await addColumn('persona', 'fhirId', 'TEXT');
        await addColumn('persona', 'fhirResourceType', "TEXT DEFAULT 'Patient'");
        await addIndex('persona_fhirId_key', `CREATE UNIQUE INDEX "persona_fhirId_key" ON "persona"("fhirId");`);

        // UsuarioSistema
        await addColumn('usuario_sistema', 'fhirId', 'TEXT');
        await addColumn('usuario_sistema', 'fhirResourceType', "TEXT DEFAULT 'PractitionerRole'");
        await addIndex('usuario_sistema_fhirId_key', `CREATE UNIQUE INDEX "usuario_sistema_fhirId_key" ON "usuario_sistema"("fhirId");`);

        // Fix Rol relation
        await addColumn('usuario_sistema', 'rolId', 'TEXT');
        await addIndex('usuario_sistema_rolId_idx', `CREATE INDEX "usuario_sistema_rolId_idx" ON "usuario_sistema"("rolId");`);
        // Add FK
        console.log('  -> Adding FK usuario_sistema.rolId -> rol.id...');
        try {
            await prisma.$executeRawUnsafe(`
                DO $$ BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuario_sistema_rolId_fkey') THEN
                        ALTER TABLE "usuario_sistema" ADD CONSTRAINT "usuario_sistema_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
                    END IF;
                END $$;
             `);
            console.log('     ✅ Success: FK added.');
        } catch (e: any) {
            console.log(`     ❌ Failed to add FK: ${e.message}`);
        }

        // FichaClinica
        await addColumn('ficha_clinica', 'fhirId', 'TEXT');
        await addColumn('ficha_clinica', 'fhirResourceType', "TEXT DEFAULT 'Encounter'");
        await addIndex('ficha_clinica_fhirId_key', `CREATE UNIQUE INDEX "ficha_clinica_fhirId_key" ON "ficha_clinica"("fhirId");`);

        // Cita
        await addColumn('cita', 'fhirId', 'TEXT');
        await addColumn('cita', 'fhirResourceType', "TEXT DEFAULT 'Appointment'");
        await addIndex('cita_fhirId_key', `CREATE UNIQUE INDEX "cita_fhirId_key" ON "cita"("fhirId");`);

        // ExamenMedico
        await addColumn('examen_medico', 'fhirId', 'TEXT');
        await addColumn('examen_medico', 'fhirResourceType', "TEXT DEFAULT 'DiagnosticReport'");
        await addIndex('examen_medico_fhirId_key', `CREATE UNIQUE INDEX "examen_medico_fhirId_key" ON "examen_medico"("fhirId");`);


    } catch (e: any) {
        console.error('❌ Connection or Global Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
