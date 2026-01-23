import { PrismaClient, Sexo, RolUsuario, TipoAcceso } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Master Data
const REGIONS = [
    {
        name: "Arica y Parinacota",
        communes: ["Arica", "Camarones", "Putre", "General Lagos"]
    },
    {
        name: "Tarapacá",
        communes: ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"]
    },
    {
        name: "Antofagasta",
        communes: ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"]
    },
    {
        name: "Atacama",
        communes: ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Alto del Carmen", "Freirina", "Huasco"]
    },
    {
        name: "Coquimbo",
        communes: ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paiguano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"]
    },
    {
        name: "Valparaíso",
        communes: ["Valparaíso", "Casablanca", "Concón", "Juan Fernández", "Puchuncaví", "Quintero", "Viña del Mar", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada", "San Esteban", "La Ligua", "Cabildo", "Papudo", "Petorca", "Zapallar", "Quillota", "Calera", "Hijuelas", "La Cruz", "Nogales", "San Antonio", "Algarrobo", "Cartagena", "El Quisco", "El Tabo", "Santo Domingo", "San Felipe", "Catemu", "Llaillay", "Panquehue", "Putaendo", "Santa María", "Quilpué", "Limache", "Olmué", "Villa Alemana"]
    },
    {
        name: "Metropolitana de Santiago",
        communes: ["Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Joaquín", "San Miguel", "San Ramón", "Santiago", "Vitacura", "Puente Alto", "Pirque", "San José de Maipo", "Colina", "Lampa", "Tiltil", "San Bernardo", "Buin", "Calera de Tango", "Paine", "Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro", "Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"]
    },
    {
        name: "Libertador General Bernardo O'Higgins",
        communes: ["Rancagua", "Codegua", "Coinco", "Coltauco", "Doñihue", "Graneros", "Las Cabras", "Machalí", "Malloa", "Mostazal", "Olivar", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo", "Requínoa", "San Vicente", "Pichilemu", "La Estrella", "Litueche", "Marchihue", "Navidad", "Paredones", "San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo", "Placilla", "Pumanque", "Santa Cruz"]
    },
    {
        name: "Maule",
        communes: ["Talca", "Constitución", "Curepto", "Empedrado", "Maule", "Pelarco", "Pencahue", "Río Claro", "San Clemente", "San Rafael", "Cauquenes", "Chanco", "Pelluhue", "Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia", "Teno", "Vichuquén", "Linares", "Colbún", "Longaví", "Parral", "Retiro", "San Javier", "Villa Alegre", "Yerbas Buenas"]
    },
    {
        name: "Ñuble",
        communes: ["Chillán", "Bulnes", "Chillán Viejo", "El Carmen", "Pemuco", "Pinto", "Quillón", "San Ignacio", "Yungay", "Quirihue", "Cobquecura", "Coelemu", "Ninhue", "Portezuelo", "Ránquil", "Trehuaco", "San Carlos", "Coihueco", "Ñiquén", "San Fabián", "San Nicolás"]
    },
    {
        name: "Biobío",
        communes: ["Concepción", "Coronel", "Chiguayante", "Florida", "Hualqui", "Lota", "Penco", "San Pedro de la Paz", "Santa Juana", "Talcahuano", "Tomé", "Hualpén", "Lebu", "Arauco", "Cañete", "Contulmo", "Curaulahue", "Los Álamos", "Tirúa", "Los Ángeles", "Antuco", "Cabrero", "Laja", "Mulchén", "Nacimiento", "Negrete", "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Yumbel", "Alto Biobío"]
    },
    {
        name: "La Araucanía",
        communes: ["Temuco", "Carahue", "Cunco", "Curarrehue", "Freire", "Galvarino", "Gorbea", "Lautaro", "Loncoche", "Melipeuco", "Nueva Imperial", "Padre Las Casas", "Perquenco", "Pitrufquén", "Pucón", "Saavedra", "Teodoro Schmidt", "Toltén", "Vilcún", "Villarrica", "Cholchol", "Angol", "Collipulli", "Curacautín", "Ercilla", "Lonquimay", "Los Sauces", "Lumaco", "Purén", "Renaico", "Traiguén", "Victoria"]
    },
    {
        name: "Los Ríos",
        communes: ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"]
    },
    {
        name: "Los Lagos",
        communes: ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Los Muermos", "Llanquihue", "Maullín", "Puerto Varas", "Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellón", "Quemchi", "Quinchao", "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Chaitén", "Futaleufú", "Hualaihué", "Palena"]
    },
    {
        name: "Aysén del General Carlos Ibáñez del Campo",
        communes: ["Coyhaique", "Lago Verde", "Aysén", "Cisnes", "Guaitecas", "Cochrane", "O'Higgins", "Tortel", "Chile Chico", "Río Ibáñez"]
    },
    {
        name: "Magallanes y de la Antártica Chilena",
        communes: ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos", "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine"]
    }
];

const PREVISIONS = [
    { nombre: 'FONASA A', tipo: 'FONASA' },
    { nombre: 'FONASA B', tipo: 'FONASA' },
    { nombre: 'FONASA C', tipo: 'FONASA' },
    { nombre: 'FONASA D', tipo: 'FONASA' },
    { nombre: 'ISAPRE COLMENA', tipo: 'ISAPRE' },
    { nombre: 'ISAPRE CRUZ BLANCA', tipo: 'ISAPRE' },
    { nombre: 'ISAPRE CONSALUD', tipo: 'ISAPRE' },
    { nombre: 'ISAPRE BANMEDICA', tipo: 'ISAPRE' },
    { nombre: 'ISAPRE VIDA TRES', tipo: 'ISAPRE' },
    { nombre: 'ISAPRE NUEVA MASVIDA', tipo: 'ISAPRE' },
    { nombre: 'PARTICULAR', tipo: 'PARTICULAR' },
    { nombre: 'DIPRECA', tipo: 'DIPRECA' },
    { nombre: 'CAPREDENA', tipo: 'CAPREDENA' }
];

const DIAGNOSTICS = [
    { codigo: 'J00', descripcion: 'Rinitis aguda', categoria: 'Enfermedades del sistema respiratorio' },
    { codigo: 'J01', descripcion: 'Sinusitis aguda', categoria: 'Enfermedades del sistema respiratorio' },
    { codigo: 'J12', descripcion: 'Neumonía viral, no clasificada en otra parte', categoria: 'Enfermedades del sistema respiratorio' },
    { codigo: 'J18', descripcion: 'Neumonía, organismo no especificado', categoria: 'Enfermedades del sistema respiratorio' },
    { codigo: 'J20', descripcion: 'Bronquitis aguda', categoria: 'Enfermedades del sistema respiratorio' },
    { codigo: 'J44', descripcion: 'Otras enfermedades pulmonares obstructivas crónicas', categoria: 'Enfermedades del sistema respiratorio' },
    { codigo: 'J45', descripcion: 'Asma', categoria: 'Enfermedades del sistema respiratorio' }
];

async function main() {
    console.log('🌱 Starting Seed...');

    // 0. Clean Master tables if needed (optional, upsert handles duplicates)

    // 1. Seed Communes & Regions
    console.log('📍 Seeding Regions & Communes...');
    for (const region of REGIONS) {
        for (const communeName of region.communes) {
            await prisma.comuna.upsert({
                where: { nombre: communeName },
                update: { region: region.name },
                create: {
                    nombre: communeName,
                    region: region.name
                }
            });
        }
    }

    // 2. Seed Previsions
    console.log('🏥 Seeding Previsions...');
    for (const prev of PREVISIONS) {
        await prisma.prevision.upsert({
            where: { nombre: prev.nombre },
            update: {},
            create: prev
        });
    }

    // 3. Seed Diagnostics
    console.log('🩺 Seeding Diagnostics...');
    for (const diag of DIAGNOSTICS) {
        await prisma.diagnosticoCIE10.upsert({
            where: { codigo: diag.codigo },
            update: {},
            create: diag
        });
    }

    // 4. Create Admin (Legacy User Table & New UsuarioSistema Schema)
    console.log('👤 Seeding Users...');
    const password = await bcrypt.hash('Password123!', 10)
    const adminPassword = await bcrypt.hash('Admin123!', 10)

    const adminEmail = 'admin@hospital.cl'

    // Clean up potential legacy admin with same RUT but different email
    await prisma.user.deleteMany({
        where: {
            OR: [
                { email: 'admin@example.com' }, // Previous seed email
                { rut: '1-9' } // Conflict RUT
            ]
        }
    });

    // Clean up potential legacy admin with same RUT but different email
    await prisma.user.deleteMany({
        where: {
            OR: [
                { email: 'admin@example.com' }, // Previous seed email
                { rut: '1-9' } // Conflict RUT
            ]
        }
    });

    // Legacy Admin
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: { password: adminPassword, active: true, role: 'ADMIN' },
        create: {
            email: adminEmail,
            name: 'Administrador Sistema',
            rut: '1-9',
            password: adminPassword,
            role: 'ADMIN',
            active: true
        },
    });

    // New Persona/UsuarioSistema Admin
    const adminPersona = await prisma.persona.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            rut: '1-9',
            nombre: 'Administrador',
            apellidoPaterno: 'Sistema',
            apellidoMaterno: 'Hospital',
            email: adminEmail,
            creadoPor: 'SEED'
        }
    });

    await prisma.credencial.upsert({
        where: { personaId: adminPersona.id },
        update: { passwordHash: adminPassword },
        create: {
            personaId: adminPersona.id,
            passwordHash: adminPassword,
            tipoAcceso: TipoAcceso.STAFF,
            mfaHabilitado: false
        }
    });

    await prisma.usuarioSistema.upsert({
        where: { personaId: adminPersona.id },
        update: {},
        create: {
            personaId: adminPersona.id,
            rol: RolUsuario.ADMIN,
            registroProfesional: 'ADMIN-001',
            creadoPor: 'SEED'
        }
    });

    // 5. Generate Patients (New Schema: Persona + FichaClinica + Credencial)
    console.log('👥 Generando 50 pacientes (Nuevo Esquema)...');

    // Helper to calculate DV
    const calculateDV = (rut: number): string => {
        let sum = 0;
        let mul = 2;
        let r = rut;
        while (r > 0) {
            sum += (r % 10) * mul;
            r = Math.floor(r / 10);
            mul = mul === 7 ? 2 : mul + 1;
        }
        const res = 11 - (sum % 11);
        if (res === 11) return '0';
        if (res === 10) return 'K';
        return res.toString();
    };

    // Clean up previous SEED data to avoid duplicates/invalid data
    const seedPersonas = await prisma.persona.findMany({
        where: { creadoPor: 'SEED' },
        select: { id: true }
    });
    const seedIds = seedPersonas.map(p => p.id);

    if (seedIds.length > 0) {
        console.log(`🗑️ Cleaning up ${seedIds.length} seeded personas and dependencies...`);
        // Delete dependents in correct order
        await prisma.cita.deleteMany({ where: { fichaClinica: { personaId: { in: seedIds } } } });
        await prisma.examenMedico.deleteMany({ where: { fichaClinica: { personaId: { in: seedIds } } } });
        await prisma.fichaClinica.deleteMany({ where: { personaId: { in: seedIds } } });
        await prisma.usuarioSistema.deleteMany({ where: { personaId: { in: seedIds } } });
        await prisma.credencial.deleteMany({ where: { personaId: { in: seedIds } } });
        await prisma.persona.deleteMany({ where: { id: { in: seedIds } } });
    }

    const firstNames = ['Juan', 'Maria', 'Pedro', 'Ana', 'Luis', 'Carmen', 'Jose', 'Francisca', 'Diego', 'Camila'];
    const lastNames = ['Gonzalez', 'Munoz', 'Rojas', 'Diaz', 'Perez', 'Soto', 'Contreras', 'Silva'];

    const centers = ['Centro Médico Providencia', 'Hospital Regional', 'Clínica Las Condes', 'CESFAM Maipú'];
    const doctors = ['Dr. Silva', 'Dra. Rojas', 'Dr. Gonzalez', 'Dra. Perez'];

    for (let i = 0; i < 50; i++) {
        const email = `paciente${i + 1}@Hospital.cl`;
        const rutBase = 10000000 + i;
        const dv = calculateDV(rutBase);
        const rut = `${rutBase}-${dv}`;

        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

        // Generate Random Age Group for BI
        // 20% Pediatric (<18), 50% Adult (18-65), 30% Senior (>65)
        const rand = Math.random();
        let birthYear;
        const currentYear = new Date().getFullYear();

        if (rand < 0.2) birthYear = currentYear - Math.floor(Math.random() * 18); // 0-17
        else if (rand < 0.7) birthYear = currentYear - (18 + Math.floor(Math.random() * 47)); // 18-64
        else birthYear = currentYear - (65 + Math.floor(Math.random() * 25)); // 65-90

        const birthDate = new Date(birthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

        // Persona
        const persona = await prisma.persona.upsert({
            where: { rut },
            update: {},
            create: {
                rut,
                nombre: firstName,
                apellidoPaterno: lastName,
                apellidoMaterno: lastNames[Math.floor(Math.random() * lastNames.length)],
                email,
                direccion: 'Calle Falsa 123',
                comuna: i % 3 === 0 ? 'Maipú' : (i % 3 === 1 ? 'Providencia' : 'Santiago'),
                region: 'Metropolitana de Santiago',
                sexo: i % 2 === 0 ? Sexo.M : Sexo.F,
                fechaNacimiento: birthDate,
                creadoPor: 'SEED'
            }
        });

        // Ficha Clinica
        const ficha = await prisma.fichaClinica.upsert({
            where: { personaId: persona.id },
            update: {},
            create: {
                personaId: persona.id,
                numeroFicha: `F-${1000 + i}`,
                prevision: Math.random() > 0.5 ? 'FONASA A' : 'ISAPRE',
                creadoPor: 'SEED',
                creadoEn: new Date(2025, Math.floor(Math.random() * 12), 1), // Backdate for BI
                fechaDiagnostico: new Date(2025, Math.floor(Math.random() * 12), 1)
            }
        });

        // Exam Generation for BI: 0 to 5 exams per patient
        const numExams = Math.floor(Math.random() * 6);
        for (let j = 0; j < numExams; j++) {
            // Distribute exams across 2024 and 2025
            const examYear = Math.random() > 0.3 ? 2025 : 2024;
            const examMonth = Math.floor(Math.random() * 12);
            const examDate = new Date(examYear, examMonth, Math.floor(Math.random() * 28) + 1);

            await prisma.examenMedico.create({
                data: {
                    fichaClinicaId: ficha.id,
                    nombreCentro: centers[Math.floor(Math.random() * centers.length)],
                    nombreDoctor: doctors[Math.floor(Math.random() * doctors.length)],
                    fechaExamen: examDate,
                    archivoUrl: 'https://example.com/fake.pdf',
                    revisado: Math.random() > 0.2, // 80% reviewed
                    origen: Math.random() > 0.5 ? 'PORTAL_PACIENTES' : 'INTERNO'
                }
            });
        }

        // Credencial
        await prisma.credencial.upsert({
            where: { personaId: persona.id },
            update: { passwordHash: password },
            create: {
                personaId: persona.id,
                passwordHash: password,
                tipoAcceso: TipoAcceso.PACIENTE
            }
        });
    }

    // 6. Seed Permissions for Legacy Role model (if still used by app)
    console.log('🔒 Seeding Legacy Permissions...');
    const permissions = [
        { role: 'ADMIN', action: 'view_dashboard' },
        { role: 'KINESIOLOGIST', action: 'view_dashboard' },
        { role: 'RECEPTIONIST', action: 'view_dashboard' },
    ];

    for (const p of permissions) {
        await prisma.rolePermission.upsert({
            where: { role_action: { role: p.role, action: p.action } },
            update: { enabled: true },
            create: { ...p, enabled: true }
        });
    }

    console.log('✅ Seeding completed.');
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
