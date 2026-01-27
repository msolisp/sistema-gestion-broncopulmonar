
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

const FHIR_TABLES = [
    'Persona',
    'UsuarioSistema',
    'FichaClinica',
    'Cita',
    'ExamenMedico',
    'PruebaFuncionPulmonar'
];

async function main() {
    console.log('🔍 Verifying FHIR Schema Alignment in Production...\n');

    try {
        await prisma.$connect();

        let allGood = true;

        for (const tableName of FHIR_TABLES) {
            // Check table existence and columns via information_schema
            // Note: Prisma usually lowercases table names in mapping, but let's check exact mapping from schema
            // Schema maps: Persona -> persona, UsuarioSistema -> usuario_sistema, etc.

            // Map Model Name to DB Table Name based on schema.prisma
            let dbTableName = '';
            switch (tableName) {
                case 'Persona': dbTableName = 'persona'; break;
                case 'UsuarioSistema': dbTableName = 'usuario_sistema'; break;
                case 'FichaClinica': dbTableName = 'ficha_clinica'; break;
                case 'Cita': dbTableName = 'cita'; break;
                case 'ExamenMedico': dbTableName = 'examen_medico'; break;
                case 'PruebaFuncionPulmonar': dbTableName = 'prueba_funcion_pulmonar'; break;
                default: dbTableName = tableName;
            }

            console.log(`Checking [${tableName}] -> table: '${dbTableName}'...`);

            const columns: any[] = await prisma.$queryRawUnsafe(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '${dbTableName}' 
                AND table_schema = 'public';
            `);

            if (columns.length === 0) {
                console.error(`  ❌ Table '${dbTableName}' DOES NOT EXIST.`);
                allGood = false;
                continue;
            }

            // Check for fhirId
            const fhirId = columns.find(c => c.column_name === 'fhirId');
            if (fhirId) {
                console.log(`  ✅ fhirId found (${fhirId.data_type})`);
            } else {
                console.error(`  ❌ fhirId MISSING`);
                allGood = false;
            }

            // Check for fhirResourceType
            const fhirType = columns.find(c => c.column_name === 'fhirResourceType');
            if (fhirType) {
                console.log(`  ✅ fhirResourceType found (${fhirType.data_type})`);
            } else {
                console.error(`  ❌ fhirResourceType MISSING`);
                allGood = false;
            }
        }

        console.log('\n-----------------------------------');
        if (allGood) {
            console.log('✅ All checked tables are FHIR-aligned (schema-wise).');
        } else {
            console.error('❌ Some tables are missing FHIR columns.');
            process.exit(1);
        }

    } catch (e: any) {
        console.error('❌ Error verifying schema:', e.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
