/**
 * Migration Script: Patient/User → Persona + Credencial + FichaClinica + UsuarioSistema
 * 
 * IMPORTANT: This script migrates data from the legacy schema to the new FHIR-aligned schema.
 * 
 * Prerequisites:
 * 1. Full database backup completed
 * 2. Schema migration applied (20260122185112_fhir_aligned_schema_with_persona_credencial)
 * 3. Run this AFTER applying the migration
 * 
 * Usage:
 *   npx tsx scripts/migrate-to-fhir-schema.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationStats {
    personasCreated: number;
    credencialesCreated: number;
    fichasClinicasCreated: number;
    usuariosSistemaCreated: number;
    citasMigrated: number;
    examenesMigrated: number;
    pruebasMigrated: number;
    notificacionesMigrated: number;
    errors: string[];
}

const isDryRun = process.argv.includes('--dry-run');

// Interfaces for Legacy Data
interface LegacyAppointment {
    id: string;
    patientId: string;
    date: Date;
    status: string;
    notes: string;
}

interface LegacyExam {
    id: string;
    patientId: string;
    centerName: string;
    doctorName: string;
    examDate: Date;
    fileUrl: string;
    fileName: string;
    reviewed: boolean;
    source: string;
    uploadedByUserId: string;
}

interface LegacyNotification {
    id: string;
    patientId: string;
    type: string;
    title: string;
    message: string;
    examId: string;
    read: boolean;
}

interface LegacyPulmonaryTest {
    id: string;
    patientId: string;
    date: Date;
    cvfValue: number;
    cvfPercent: number;
    vef1Value: number;
    vef1Percent: number;
    dlcoPercent: number;
    walkDistance: number;
    spo2Rest: number;
    spo2Final: number;
    heartRateRest: number;
    heartRateFinal: number;
    notes: string;
}

interface LegacyPatient {
    id: string;
    rut: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    commune: string;
    region: string;
    birthDate: Date;
    gender: string;
    healthSystem: string;
    diagnosisDate: Date;
    cota: number;
    password?: string;
    active: boolean;
    appointments: LegacyAppointment[];
    exams: LegacyExam[];
    notifications: LegacyNotification[];
    pulmonaryTests: LegacyPulmonaryTest[];
}

interface LegacyUser {
    id: string;
    rut: string;
    name: string;
    email: string;
    password?: string;
    role: string;
    address: string;
    commune: string;
    region: string;
    active: boolean;
    mustChangePassword?: boolean;
}

async function getLegacyPatients(): Promise<LegacyPatient[]> {
    console.log('  ⬇️  Fetching legacy patients...');
    const patientsRaw = await prisma.$queryRaw<any[]>`SELECT * FROM "Patient"`;
    if (!patientsRaw.length) return [];

    console.log('  ⬇️  Fetching legacy relations...');
    const appointmentsRaw = await prisma.$queryRaw<LegacyAppointment[]>`SELECT * FROM "Appointment"`;
    const examsRaw = await prisma.$queryRaw<LegacyExam[]>`SELECT * FROM "MedicalExam"`;
    const notificationsRaw = await prisma.$queryRaw<LegacyNotification[]>`SELECT * FROM "Notification"`;
    const testsRaw = await prisma.$queryRaw<LegacyPulmonaryTest[]>`SELECT * FROM "PulmonaryTest"`;

    // Group relations by patientId
    const appointmentsMap = new Map<string, LegacyAppointment[]>();
    appointmentsRaw.forEach(a => {
        if (!appointmentsMap.has(a.patientId)) appointmentsMap.set(a.patientId, []);
        appointmentsMap.get(a.patientId)!.push(a);
    });

    const examsMap = new Map<string, LegacyExam[]>();
    examsRaw.forEach(e => {
        if (!examsMap.has(e.patientId)) examsMap.set(e.patientId, []);
        examsMap.get(e.patientId)!.push(e);
    });

    const notificationsMap = new Map<string, LegacyNotification[]>();
    notificationsRaw.forEach(n => {
        if (!notificationsMap.has(n.patientId)) notificationsMap.set(n.patientId, []);
        notificationsMap.get(n.patientId)!.push(n);
    });

    const testsMap = new Map<string, LegacyPulmonaryTest[]>();
    testsRaw.forEach(t => {
        if (!testsMap.has(t.patientId)) testsMap.set(t.patientId, []);
        testsMap.get(t.patientId)!.push(t);
    });

    return patientsRaw.map(p => ({
        ...p,
        appointments: appointmentsMap.get(p.id) || [],
        exams: examsMap.get(p.id) || [],
        notifications: notificationsMap.get(p.id) || [],
        pulmonaryTests: testsMap.get(p.id) || []
    }));
}

async function getLegacyUsers(): Promise<LegacyUser[]> {
    const usersRaw = await prisma.$queryRaw<LegacyUser[]>`SELECT * FROM "User"`;
    return usersRaw;
}

async function migrateData(): Promise<MigrationStats> {
    const stats: MigrationStats = {
        personasCreated: 0,
        credencialesCreated: 0,
        fichasClinicasCreated: 0,
        usuariosSistemaCreated: 0,
        citasMigrated: 0,
        examenesMigrated: 0,
        pruebasMigrated: 0,
        notificacionesMigrated: 0,
        errors: []
    };

    console.log(`\n🔄 Starting migration ${isDryRun ? '(DRY RUN)' : ''}...\n`);

    try {
        // ═══════════════════════════════════════════════════════
        // Step 1: Migrate Patients
        // ═══════════════════════════════════════════════════════
        console.log('📋 Step 1: Migrating Patients...');

        const patients = await getLegacyPatients();
        console.log(`  Found ${patients.length} legacy patients.`);

        for (const patient of patients) {
            try {
                // Extract name parts  
                const nameParts = patient.name.trim().split(' ');
                const apellidoPaterno = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
                const apellidoMaterno = nameParts.length > 2 ? nameParts[nameParts.length - 2] : undefined;
                const nombre = nameParts.slice(0, Math.max(1, nameParts.length - 2)).join(' ');

                if (!isDryRun) {
                    // 1. Create or find Persona
                    const persona = await prisma.persona.upsert({
                        where: { rut: patient.rut },
                        create: {
                            rut: patient.rut,
                            nombre: nombre || patient.name,
                            apellidoPaterno: apellidoPaterno || 'SIN_APELLIDO',
                            apellidoMaterno,
                            email: patient.email,
                            telefono: patient.phone,
                            direccion: patient.address,
                            comuna: patient.commune,
                            region: patient.region,
                            fechaNacimiento: patient.birthDate,
                            sexo: patient.gender === 'M' ? 'M' : patient.gender === 'F' ? 'F' : 'NO_ESPECIFICADO',
                            creadoPor: 'MIGRATION_SCRIPT',
                            activo: patient.active
                        },
                        update: {} // Don't update if exists
                    });

                    // 2. Create Credencial
                    if (patient.password) {
                        try {
                            await prisma.credencial.create({
                                data: {
                                    personaId: persona.id,
                                    passwordHash: patient.password,
                                    tipoAcceso: 'PACIENTE'
                                }
                            });
                            stats.credencialesCreated++;
                        } catch (e) {
                            // Ignore if already exists
                        }
                    }

                    // 3. Create FichaClinica
                    const fichaClinica = await prisma.fichaClinica.create({
                        data: {
                            personaId: persona.id,
                            numeroFicha: patient.id, // Use patient ID as ficha number for now
                            prevision: patient.healthSystem,
                            fechaDiagnostico: patient.diagnosisDate,
                            cota: patient.cota,
                            creadoPor: 'MIGRATION_SCRIPT'
                        }
                    });
                    stats.fichasClinicasCreated++;

                    // 4. Migrate Appointments → Citas
                    for (const appointment of patient.appointments) {
                        await prisma.cita.create({
                            data: {
                                fichaClinicaId: fichaClinica.id,
                                fecha: appointment.date,
                                estado: appointment.status,
                                notas: appointment.notes
                            }
                        });
                        stats.citasMigrated++;
                    }

                    // 5. Migrate MedicalExams → ExamenMedico
                    for (const exam of patient.exams) {
                        await prisma.examenMedico.create({
                            data: {
                                fichaClinicaId: fichaClinica.id,
                                nombreCentro: exam.centerName,
                                nombreDoctor: exam.doctorName,
                                fechaExamen: exam.examDate,
                                archivoUrl: exam.fileUrl,
                                archivoNombre: exam.fileName,
                                revisado: exam.reviewed,
                                origen: exam.source,
                                subidoPor: exam.uploadedByUserId
                            }
                        });
                        stats.examenesMigrated++;
                    }

                    // 6. Migrate Notifications → NotificacionMedica
                    for (const notification of patient.notifications) {
                        await prisma.notificacionMedica.create({
                            data: {
                                fichaClinicaId: fichaClinica.id,
                                tipo: notification.type,
                                titulo: notification.title,
                                mensaje: notification.message,
                                examenId: notification.examId,
                                leido: notification.read
                            }
                        });
                        stats.notificacionesMigrated++;
                    }

                    // 7. Migrate PulmonaryTests → PruebaFuncionPulmonar
                    for (const test of patient.pulmonaryTests) {
                        await prisma.pruebaFuncionPulmonar.create({
                            data: {
                                fichaClinicaId: fichaClinica.id,
                                fecha: test.date,
                                cvfValue: test.cvfValue,
                                cvfPercent: test.cvfPercent,
                                vef1Value: test.vef1Value,
                                vef1Percent: test.vef1Percent,
                                dlcoPercent: test.dlcoPercent,
                                walkDistance: test.walkDistance,
                                spo2Rest: test.spo2Rest,
                                spo2Final: test.spo2Final,
                                heartRateRest: test.heartRateRest,
                                heartRateFinal: test.heartRateFinal,
                                notas: test.notes
                            }
                        });
                        stats.pruebasMigrated++;
                    }

                    stats.personasCreated++;
                }

                console.log(`  ✅ Migrated patient: ${patient.rut} - ${patient.name}`);
            } catch (error) {
                const errorMsg = `Error migrating patient ${patient.rut}: ${error}`;
                console.error(`  ❌ ${errorMsg}`);
                stats.errors.push(errorMsg);
            }
        }

        // ═══════════════════════════════════════════════════════
        // Step 2: Migrate Users (Staff)
        // ═══════════════════════════════════════════════════════
        console.log('\n👥 Step 2: Migrating Users (Staff)...');

        const users = await getLegacyUsers();
        console.log(`  Found ${users.length} legacy users.`);

        for (const user of users) {
            try {
                if (!user.rut) {
                    console.log(`  ⚠️  Skipping user without RUT: ${user.email}`);
                    continue;
                }

                // Extract name parts
                const nameParts = (user.name || user.email).trim().split(' ');
                const apellidoPaterno = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
                const apellidoMaterno = nameParts.length > 2 ? nameParts[nameParts.length - 2] : undefined;
                const nombre = nameParts.slice(0, Math.max(1, nameParts.length - 2)).join(' ');

                if (!isDryRun) {
                    // 1. Create or find Persona
                    const persona = await prisma.persona.upsert({
                        where: { rut: user.rut },
                        create: {
                            rut: user.rut,
                            nombre: nombre || user.email,
                            apellidoPaterno: apellidoPaterno || 'SIN_APELLIDO',
                            apellidoMaterno,
                            email: user.email,
                            direccion: user.address,
                            comuna: user.commune,
                            region: user.region,
                            creadoPor: 'MIGRATION_SCRIPT',
                            activo: user.active
                        },
                        update: {} // Don't update if exists
                    });

                    // Check if Credencial already exists (might have been created for patient)
                    let existingCredencial = await prisma.credencial.findUnique({
                        where: { personaId: persona.id }
                    });

                    if (!existingCredencial && user.password) {
                        // 2. Create Credencial
                        await prisma.credencial.create({
                            data: {
                                personaId: persona.id,
                                passwordHash: user.password,
                                tipoAcceso: 'STAFF',
                                debeCambiarPassword: user.mustChangePassword
                            }
                        });
                        stats.credencialesCreated++;
                    }

                    // 3. Create UsuarioSistema
                    const rolMap: Record<string, any> = {
                        'KINESIOLOGIST': 'KINESIOLOGO',
                        'ADMIN': 'ADMIN',
                        'RECEPTIONIST': 'RECEPCIONISTA',
                        'MEDICO': 'MEDICO',
                        'ENFERMERA': 'ENFERMERA'
                    };

                    // Need to find Role ID
                    const rolNombre = rolMap[user.role] || 'RECEPCIONISTA';
                    let rol = await prisma.rol.findUnique({ where: { nombre: rolNombre } });

                    if (!rol) {
                        // fallback or create?
                        console.warn(`Rol ${rolNombre} not found for User ${user.email}. Using default.`);
                    }

                    if (rol) {
                        await prisma.usuarioSistema.create({
                            data: {
                                personaId: persona.id,
                                rolId: rol.id,
                                creadoPor: 'MIGRATION_SCRIPT'
                            }
                        });
                        stats.usuariosSistemaCreated++;
                    }
                }

                console.log(`  ✅ Migrated user: ${user.rut} - ${user.email}`);
            } catch (error) {
                const errorMsg = `Error migrating user ${user.email}: ${error}`;
                console.error(`  ❌ ${errorMsg}`);
                stats.errors.push(errorMsg);
            }
        }

    } catch (error) {
        console.error('\n❌ Fatal migration error:', error);
        throw error;
    }

    return stats;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  FHIR-Aligned Schema Migration');
    console.log('═══════════════════════════════════════════════════════');

    if (isDryRun) {
        console.log('\n⚠️  DRY RUN MODE - No changes will be made\n');
    } else {
        console.log('\n🚨 PRODUCTION MODE - Data will be modified!\n');
        console.log('Press Ctrl+C within 5 seconds to abort...');
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    const stats = await migrateData();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Migration Summary');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Personas created:          ${stats.personasCreated}`);
    console.log(`Credenciales created:      ${stats.credencialesCreated}`);
    console.log(`Fichas Clínicas created:   ${stats.fichasClinicasCreated}`);
    console.log(`Usuarios Sistema created:  ${stats.usuariosSistemaCreated}`);
    console.log(`Citas migrated:            ${stats.citasMigrated}`);
    console.log(`Examenes migrated:         ${stats.examenesMigrated}`);
    console.log(`Pruebas migrated:          ${stats.pruebasMigrated}`);
    console.log(`Notificaciones migrated:   ${stats.notificacionesMigrated}`);
    console.log(`Errors:                    ${stats.errors.length}`);

    if (stats.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        stats.errors.forEach(error => console.log(`  - ${error}`));
    }

    console.log('\n✅ Migration completed!\n');

    await prisma.$disconnect();
}

main()
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
