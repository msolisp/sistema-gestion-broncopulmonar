import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Inline Role definition for seed script (using const object to avoid TS enum issues)
const Role = {
    ADMIN: 'ADMIN',
    KINESIOLOGIST: 'KINESIOLOGIST',
    RECEPTIONIST: 'RECEPTIONIST',
    PATIENT: 'PATIENT'
}

const prisma = new PrismaClient()

async function main() {
    const password = await bcrypt.hash('Password123!', 10)
    const adminPassword = await bcrypt.hash('Admin123!', 10)

    // 1. Create Admin
    const adminEmail = 'admin@example.com'
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password: adminPassword,
            active: true,
            mustChangePassword: false
        },
        create: {
            email: adminEmail,
            name: 'Admin User',
            rut: '1-9', // Admin RUT
            password: adminPassword,
            role: Role.ADMIN,
            active: true,
            mustChangePassword: false
        },
    })
    console.log({ admin })

    // 2. Data Arrays for Generation
    const firstNames = ['Juan', 'Maria', 'Pedro', 'Ana', 'Luis', 'Carmen', 'Jose', 'Francisca', 'Diego', 'Camila', 'Jorge', 'Valentina', 'Carlos', 'Javiera', 'Manuel', 'Constanza', 'Francisco', 'Carolina', 'Cristian', 'Daniela'];
    const lastNames = ['Gonzalez', 'Munoz', 'Rojas', 'Diaz', 'Perez', 'Soto', 'Contreras', 'Silva', 'Martinez', 'Sepulveda', 'Morales', 'Rodriguez', 'Lopez', 'Fuentes', 'Hernandez', 'Torres', 'Araya', 'Flores', 'Espinoza', 'Valenzuela'];
    const communes = ['SANTIAGO', 'PROVIDENCIA', 'LAS CONDES', 'MAIPU', 'LA FLORIDA', 'PUENTE ALTO', 'NUNOA', 'VITACURA', 'RECOLETA', 'SAN MIGUEL', 'ESTACION CENTRAL', 'LA CISTERNA', 'MACUL', 'PENALOLEN', 'QUILICURA'];
    const genders = ['Masculino', 'Femenino', 'Otro'];

    // 3. Generate 50 Patients
    console.log('Generating 50 patients...');

    for (let i = 0; i < 50; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const secondLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const name = `${firstName} ${lastName} ${secondLastName}`;

        // Ensure unique email and RUT
        const email = `paciente${i + 1}@test.com`;
        const rutBase = 10000000 + i;
        const rut = `${rutBase}-${i % 9}`; // Simplified check digit

        const commune = communes[Math.floor(Math.random() * communes.length)];
        const gender = genders[Math.floor(Math.random() * genders.length)];

        // Random birth date between 1950 and 2000
        const year = 1950 + Math.floor(Math.random() * 50);
        const month = Math.floor(Math.random() * 12);
        const day = 1 + Math.floor(Math.random() * 28);
        const birthDate = new Date(year, month, day);

        await prisma.patient.upsert({
            where: { email },
            update: { password },
            create: {
                email,
                name,
                rut,
                password,
                active: true,
                commune,
                birthDate,
                diagnosisDate: new Date(),
                gender,
                address: `Calle ${i + 1} # ${Math.floor(Math.random() * 1000)}, ${commune}`
            }
        });
    }

    // 4. Seed Permissions
    console.log('Seeding Permissions...');
    const actions = [
        'Ver Pacientes',
        'Editar Pacientes',
        'Eliminar Pacientes',
        'Ver Reportes BI',
        'Gestionar Usuarios',
        'Configuración Global',
        'Ver Agendamiento', // Prototype - Admin only
        'Ver Asistente',    // Admin + Kine
        'Ver HL7'           // Admin + Kine
    ];

    const defaultPermissions = [
        // KINE
        { role: Role.KINESIOLOGIST, action: 'Ver Pacientes', enabled: true },
        { role: Role.KINESIOLOGIST, action: 'Editar Pacientes', enabled: true },
        { role: Role.KINESIOLOGIST, action: 'Eliminar Pacientes', enabled: true },
        { role: Role.KINESIOLOGIST, action: 'Ver Reportes BI', enabled: true },
        { role: Role.KINESIOLOGIST, action: 'Ver Asistente', enabled: true },
        { role: Role.KINESIOLOGIST, action: 'Ver HL7', enabled: true },
        // RECEP
        { role: Role.RECEPTIONIST, action: 'Ver Pacientes', enabled: true },
        { role: Role.RECEPTIONIST, action: 'Editar Pacientes', enabled: true },
        // AGENDAMIENTO IS NOT ASSIGNED TO KINE OR RECEP BY DEFAULT (Admin sees all)
    ];

    for (const p of defaultPermissions) {
        await prisma.rolePermission.upsert({
            where: { role_action: { role: p.role, action: p.action } },
            update: {},
            create: p
        });
    }

    // Ensure all combinations exist (disabled by default if not above)
    for (const action of actions) {
        for (const role of [Role.KINESIOLOGIST, Role.RECEPTIONIST]) {
            await prisma.rolePermission.upsert({
                where: { role_action: { role, action } },
                update: {},
                create: { role, action, enabled: false }
            });
        }
    }

    console.log('Seeding completed: 50 patients created + Permissions set.');
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
