import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función para calcular dígito verificador del RUT
function calcularDV(rut: number): string {
    let suma = 0;
    let multiplicador = 2;

    const rutStr = rut.toString();
    for (let i = rutStr.length - 1; i >= 0; i--) {
        suma += parseInt(rutStr[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = suma % 11;
    const dv = 11 - resto;

    if (dv === 11) return '0';
    if (dv === 10) return 'K';
    return dv.toString();
}

// Generar RUT válido
function generarRUTValido(base: number): string {
    const dv = calcularDV(base);
    return `${base}-${dv}`;
}

async function main() {
    console.log('🔧 Actualizando RUTs de pacientes de prueba...\n');

    // Obtener todos los patients
    const patients = await prisma.patient.findMany({
        orderBy: { createdAt: 'asc' }
    });

    console.log(`Encontrados ${patients.length} pacientes\n`);

    let updated = 0;

    for (const patient of patients) {
        // Generar un RUT válido basado en un número secuencial
        // Usar rango 20.000.000 - 20.999.999 para datos de prueba
        const baseRUT = 20000000 + updated;
        const newRUT = generarRUTValido(baseRUT);

        // Actualizar el patient
        await prisma.patient.update({
            where: { id: patient.id },
            data: { rut: newRUT }
        });

        console.log(`✓ Paciente ${patient.name || patient.email}: ${patient.rut} → ${newRUT}`);
        updated++;
    }

    console.log(`\n✅ ${updated} pacientes actualizados con RUTs válidos`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Error:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
