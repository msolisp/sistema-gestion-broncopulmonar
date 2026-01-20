
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const uniqueRutNum = Math.floor(Math.random() * 10000000) + 20000000;
    const uniqueRut = `${uniqueRutNum}-${Math.floor(Math.random() * 9)}`;
    const uniqueEmail = `audit_test_${Date.now()}@example.com`;

    console.log(`Attempting to create patient with RUT: ${uniqueRut}, Email: ${uniqueEmail}`);

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    try {
        const patient = await prisma.patient.create({
            data: {
                email: uniqueEmail,
                password: hashedPassword,
                name: 'Audit Test Patient',
                rut: uniqueRut,
                commune: 'PROVIDENCIA',
                region: 'Metropolitana',
                address: 'Audit Lane 1',
                gender: 'Masculino',
                // healthSystem, birthDate optional/undefined
                active: true,
                birthDate: new Date('1990-01-01')
            }
        });
        console.log('Success! Created patient:', patient.id);
    } catch (e) {
        console.error('Error creating patient:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
