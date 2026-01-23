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
    // Obtener todas las personas (nuevo esquema)
    const personas = await prisma.persona.findMany({
        orderBy: { creadoEn: 'asc' }
    });

    console.log(`Encontradas ${personas.length} personas\n`);

    let updated = 0;

    for (const persona of personas) {
        // Generar un RUT válido basado en un número secuencial
        // Usar rango 20.000.000 - 20.999.999 para datos de prueba
        const baseRUT = 20000000 + updated;
        const newRUT = generarRUTValido(baseRUT);

        // Actualizar la persona
        await prisma.persona.update({
            where: { id: persona.id },
            data: { rut: newRUT }
        });

        console.log(`✓ Persona ${persona.nombre} ${persona.apellidoPaterno}: ${persona.rut} → ${newRUT}`);
        updated++;
    }

    console.log(`\n✅ ${updated} personas actualizadas con RUTs válidos`);
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
