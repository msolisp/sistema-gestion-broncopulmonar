
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
    console.log('Seeding verification user...');
    const email = 'verify@hospital.cl';
    const password = 'Password123!';
    const rut = '22222222-2';

    // Cleanup
    try {
        await prisma.credencial.deleteMany({ where: { persona: { email } } });
        await prisma.usuarioSistema.deleteMany({ where: { persona: { email } } });
        await prisma.persona.delete({ where: { email } });
    } catch (e) { }

    // Create Persona
    const persona = await prisma.persona.create({
        data: {
            rut,
            nombre: 'Verify',
            apellidoPaterno: 'User',
            apellidoMaterno: 'Test',
            email,
            telefono: '+56912345678',
            direccion: 'Test Street 123',
            comuna: 'Santiago',
            region: 'Metropolitana',
            creadoPor: 'SEED'
        }
    });

    // Create Credencial (Patient)
    await prisma.credencial.create({
        data: {
            personaId: persona.id,
            passwordHash: await bcrypt.hash(password, 10),
            tipoAcceso: 'PACIENTE',
            mfaHabilitado: false
        }
    });

    // Create Ficha Clinica
    await prisma.fichaClinica.create({
        data: {
            personaId: persona.id,
            numeroFicha: 'VERIFY-001',
            creadoPor: 'SEED'
        }
    });

    console.log(`Created user: ${email} / ${password} (RUT: ${rut})`);
}

seed()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
