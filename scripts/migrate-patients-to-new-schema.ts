import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Migración completa Patient → Persona + Credencial + FichaClinica
 * Implementación inline del FHIR adapter para evitar problemas de imports
 */

async function createPatientRecord(data: {
    rut: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
    email: string;
    password: string;
    direccion?: string;
    comuna: string;
    region?: string;
    fechaNacimiento?: Date;
    sexo?: 'M' | 'F' | 'OTRO' | 'NO_ESPECIFICADO';
    fechaDiagnostico?: Date;
    creadoPor: string;
}) {
    const passwordHash = await bcrypt.hash(data.password, 10);

    return prisma.$transaction(async (tx) => {
        // 1. Crear Persona
        const persona = await tx.persona.create({
            data: {
                rut: data.rut,
                nombre: data.nombre,
                apellidoPaterno: data.apellidoPaterno,
                apellidoMaterno: data.apellidoMaterno,
                email: data.email,
                direccion: data.direccion,
                comuna: data.comuna,
                region: data.region,
                fechaNacimiento: data.fechaNacimiento,
                sexo: data.sexo,
                activo: true,
                creadoPor: data.creadoPor
            }
        });

        // 2. Crear Credencial
        await tx.credencial.create({
            data: {
                personaId: persona.id,
                passwordHash,
                tipoAcceso: 'PACIENTE'
            }
        });

        // 3. Crear FichaClinica
        await tx.fichaClinica.create({
            data: {
                personaId: persona.id,
                numeroFicha: persona.id,
                fechaDiagnostico: data.fechaDiagnostico,
                creadoPor: data.creadoPor
            }
        });

        return persona;
    });
}

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║       MIGRACIÓN: Patient → Persona + Credencial + Ficha      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const legacyPatients = await prisma.patient.findMany({
        orderBy: { createdAt: 'asc' }
    });

    console.log(`📊 Pacientes encontrados: ${legacyPatients.length}\n`);

    const stats = { migrated: 0, skipped: 0, errors: 0 };

    for (const patient of legacyPatients) {
        try {
            // Verificar si ya existe
            const existing = await prisma.persona.findUnique({
                where: { rut: patient.rut || '' }
            });

            if (existing) {
                console.log(`⏭️  ${patient.name} - Ya existe`);
                stats.skipped++;
                continue;
            }

            // Parsear nombre
            const parts = (patient.name || 'Sin Nombre').trim().split(' ');
            const nombre = parts.length >= 3 ? parts.slice(0, -2).join(' ') : parts[0];
            const apellidoPaterno = parts.length >= 2 ? parts[parts.length - 1] : 'DESCONOCIDO';
            const apellidoMaterno = parts.length >= 3 ? parts[parts.length - 2] : undefined;

            // Mapear género
            let sexo: 'M' | 'F' | 'OTRO' | 'NO_ESPECIFICADO' = 'NO_ESPECIFICADO';
            if (patient.gender === 'Masculino') sexo = 'M';
            else if (patient.gender === 'Femenino') sexo = 'F';
            else if (patient.gender) sexo = 'OTRO';

            // Crear paciente completo
            await createPatientRecord({
                rut: patient.rut || `TEMP-${Date.now()}`,
                nombre,
                apellidoPaterno,
                apellidoMaterno,
                email: patient.email,
                password: 'TempPassword123!', // Se hasheará
                direccion: patient.address || undefined,
                comuna: patient.commune,
                region: patient.region || undefined,
                fechaNacimiento: patient.birthDate || undefined,
                sexo,
                fechaDiagnostico: patient.diagnosisDate || undefined,
                creadoPor: 'MIGRATION'
            });

            console.log(`✅ ${patient.name} (${patient.rut})`);
            stats.migrated++;

        } catch (error: any) {
            console.error(`❌ ${patient.name}: ${error.message}`);
            stats.errors++;
        }
    }

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                        RESUMEN                               ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  ✅ Migrados: ${stats.migrated.toString().padStart(3)}                                          ║`);
    console.log(`║  ⏭️  Saltados: ${stats.skipped.toString().padStart(3)}                                          ║`);
    console.log(`║  ❌ Errores:  ${stats.errors.toString().padStart(3)}                                          ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

main()
    .then(async () => {
        await prisma.$disconnect();
        process.exit(0);
    })
    .catch(async (e) => {
        console.error('\n💥 ERROR:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
