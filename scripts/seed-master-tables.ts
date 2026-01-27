
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { REGIONS } from '../src/lib/chile-data';

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

// Basic Seed Data
const DIAGNOSTICOS_CIE10 = [
    { codigo: 'J40', descripcion: 'Bronquitis, no especificada como aguda o crónica', categoria: 'Enfermedades del sistema respiratorio' },
    { codigo: 'J41', descripcion: 'Bronquitis crónica simple y mucopurulenta', categoria: 'Enfermedades del sistema respiratorio' },
    { codigo: 'J42', descripcion: 'Bronquitis crónica no especificada', categoria: 'Enfermedades del sistema respiratorio' },
    { codigo: 'J43', descripcion: 'Enfisema', categoria: 'Enfermedades del sistema respiratorio' },
    { codigo: 'J44', descripcion: 'Otras enfermedades pulmonares obstructivas crónicas', categoria: 'Enfermedades del sistema respiratorio' },
    { codigo: 'J45', descripcion: 'Asma', categoria: 'Enfermedades del sistema respiratorio' },
    { codigo: 'J46', descripcion: 'Estado asmático', categoria: 'Enfermedades del sistema respiratorio' },
    { codigo: 'J47', descripcion: 'Bronquiectasia', categoria: 'Enfermedades del sistema respiratorio' },
];

const PREVISIONES = [
    { nombre: 'FONASA A', tipo: 'FONASA' },
    { nombre: 'FONASA B', tipo: 'FONASA' },
    { nombre: 'FONASA C', tipo: 'FONASA' },
    { nombre: 'FONASA D', tipo: 'FONASA' },
    { nombre: 'Banmédica', tipo: 'ISAPRE' },
    { nombre: 'Colmena', tipo: 'ISAPRE' },
    { nombre: 'Consalud', tipo: 'ISAPRE' },
    { nombre: 'Cruz Blanca', tipo: 'ISAPRE' },
    { nombre: 'Nueva Masvida', tipo: 'ISAPRE' },
    { nombre: 'Vida Tres', tipo: 'ISAPRE' },
    { nombre: 'PARTICULAR', tipo: 'PARTICULAR' },
];

const FERIADOS = [
    { nombre: 'Año Nuevo', fecha: new Date('2026-01-01'), tipo: 'NACIONAL' },
    { nombre: 'Viernes Santo', fecha: new Date('2026-04-03'), tipo: 'NACIONAL' },
    { nombre: 'Sábado Santo', fecha: new Date('2026-04-04'), tipo: 'NACIONAL' },
    { nombre: 'Día del Trabajo', fecha: new Date('2026-05-01'), tipo: 'NACIONAL' },
    { nombre: 'Día de las Glorias Navales', fecha: new Date('2026-05-21'), tipo: 'NACIONAL' },
    { nombre: 'Día de los Pueblos Indígenas', fecha: new Date('2026-06-21'), tipo: 'NACIONAL' },
    { nombre: 'San Pedro y San Pablo', fecha: new Date('2026-06-29'), tipo: 'NACIONAL' },
    { nombre: 'Día de la Virgen del Carmen', fecha: new Date('2026-07-16'), tipo: 'NACIONAL' },
    { nombre: 'Asunción de la Virgen', fecha: new Date('2026-08-15'), tipo: 'NACIONAL' },
    { nombre: 'Independencia Nacional', fecha: new Date('2026-09-18'), tipo: 'NACIONAL' },
    { nombre: 'Día de las Glorias del Ejército', fecha: new Date('2026-09-19'), tipo: 'NACIONAL' },
    { nombre: 'Encuentro de Dos Mundos', fecha: new Date('2026-10-12'), tipo: 'NACIONAL' },
    { nombre: 'Día de las Iglesias Evangélicas', fecha: new Date('2026-10-31'), tipo: 'NACIONAL' },
    { nombre: 'Día de Todos los Santos', fecha: new Date('2026-11-01'), tipo: 'NACIONAL' },
    { nombre: 'Inmaculada Concepción', fecha: new Date('2026-12-08'), tipo: 'NACIONAL' },
    { nombre: 'Navidad', fecha: new Date('2026-12-25'), tipo: 'NACIONAL' },
];

async function main() {
    console.log('🚀 Seeding Master Tables...');

    try {
        await prisma.$connect();

        // 1. Seed Comunas
        console.log('🌱 Seeding Comunas from Chile Data...');
        let comunaCount = 0;
        for (const region of REGIONS) {
            for (const comunaName of region.communes) {
                // Check if exists to avoid errors on duplicate runs
                const existing = await prisma.comuna.findFirst({
                    where: { nombre: comunaName }
                });

                if (!existing) {
                    await prisma.comuna.create({
                        data: {
                            nombre: comunaName,
                            region: region.name,
                            activo: true
                        }
                    });
                    comunaCount++;
                }
            }
        }
        console.log(`   ✅ Seeded ${comunaCount} new comunas.`);

        // 2. Seed Diagnosticos
        console.log('🌱 Seeding Diagnosticos CIE-10 (Bronco subset)...');
        for (const diag of DIAGNOSTICOS_CIE10) {
            await prisma.diagnosticoCIE10.upsert({
                where: { codigo: diag.codigo },
                update: {},
                create: { ...diag, activo: true }
            });
        }
        console.log('   ✅ Diagnosticos seeded.');

        // 3. Seed Previsiones
        console.log('🌱 Seeding Previsiones...');
        for (const prev of PREVISIONES) {
            const existing = await prisma.prevision.findFirst({ where: { nombre: prev.nombre } });
            if (!existing) {
                await prisma.prevision.create({ data: { ...prev, activo: true } });
            }
        }
        console.log('   ✅ Previsiones seeded.');

        // 4. Seed Feriados
        console.log('🌱 Seeding Feriados 2026...');
        for (const feriado of FERIADOS) {
            const existing = await prisma.feriado.findFirst({ where: { nombre: feriado.nombre, fecha: feriado.fecha } });
            if (!existing) {
                await prisma.feriado.create({ data: { ...feriado, activo: true } });
            }
        }
        console.log('   ✅ Feriados seeded.');

    } catch (e: any) {
        console.error('❌ Error seeding master tables:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
