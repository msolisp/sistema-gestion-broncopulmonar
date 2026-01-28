import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const schemaModels = [
        { model: 'persona', fields: ['fhirId', 'fhirResourceType'] },
        { model: 'usuario_sistema', fields: ['fhirId', 'fhirResourceType', 'rolId'] },
        { model: 'cita', fields: ['fhirId', 'fhirResourceType'] },
        { model: 'examen_medico', fields: ['fhirId', 'fhirResourceType'] },
        { model: 'prueba_funcion_pulmonar', fields: ['fhirId', 'fhirResourceType'] },
    ];

    for (const item of schemaModels) {
        const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${item.model}'
    `);
        const dbCols = (columns as any[]).map(c => c.column_name);

        console.log(`Checking ${item.model}...`);
        for (const field of item.fields) {
            if (!dbCols.includes(field)) {
                console.error(`  ❌ Missing column: ${field}`);
            } else {
                console.log(`  ✅ Column exists: ${field}`);
            }
        }
    }
    await prisma.$disconnect();
}

main();
