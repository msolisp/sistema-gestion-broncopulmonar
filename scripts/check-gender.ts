import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGender() {
    const persona = await prisma.persona.findUnique({
        where: { rut: '13377955-8' }
    });

    if (persona) {
        console.log('\n=== Datos del Paciente ===');
        console.log(`Nombre: ${persona.nombre} ${persona.apellidoPaterno}`);
        console.log(`RUT: ${persona.rut}`);
        console.log(`Email: ${persona.email}`);
        console.log(`Sexo: ${persona.sexo}`);
        console.log(`=========================\n`);
    } else {
        console.log('Paciente no encontrado');
    }

    await prisma.$disconnect();
}

checkGender();
