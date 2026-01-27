
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
    console.log('Seeding ADMIN user for internal portal verification...');
    const email = 'admin@hospital.cl';
    const password = 'Admin123!';
    const rut = '11111111-1';

    // Cleanup
    try {
        const adminPersona = await prisma.persona.findUnique({ where: { email } });
        if (adminPersona) {
            await prisma.credencial.deleteMany({ where: { personaId: adminPersona.id } });
            await prisma.usuarioSistema.deleteMany({ where: { personaId: adminPersona.id } });
            await prisma.persona.delete({ where: { email } });
        }
    } catch (e) {
        console.warn('Cleanup warning:', e);
    }

    // Get Admin Role
    let adminRole = await prisma.rol.findUnique({ where: { nombre: 'ADMIN' } });
    if (!adminRole) {
        console.log('Creating ADMIN role...');
        adminRole = await prisma.rol.create({
            data: {
                nombre: 'ADMIN',
                descripcion: 'Administrador del Sistema',
                activo: true
            }
        });
    }

    // Create Persona
    const persona = await prisma.persona.create({
        data: {
            rut,
            nombre: 'Admin',
            apellidoPaterno: 'System',
            apellidoMaterno: 'User',
            email,
            telefono: '+56900000000',
            direccion: 'Hospital Avenue 1',
            comuna: 'Providencia',
            region: 'Metropolitana',
            creadoPor: 'SEED_STAFF'
        }
    });

    // Create Credencial (Staff)
    await prisma.credencial.create({
        data: {
            personaId: persona.id,
            passwordHash: await bcrypt.hash(password, 10),
            tipoAcceso: 'STAFF', // Important for internal access
            mfaHabilitado: false
        }
    });

    // Create UsuarioSistema
    await prisma.usuarioSistema.create({
        data: {
            personaId: persona.id,
            rolId: adminRole.id,
            registroProfesional: 'ADM-001',
            creadoPor: 'SEED_STAFF',
            especialidad: 'Gestión'
        }
    });

    console.log(`Created ADMIN user: ${email} / ${password} (RUT: ${rut})`);
}

seed()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
