import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const tables = ['prueba_funcion_pulmonar', 'persona', 'examen_medico', 'cita', 'ficha_clinica', 'usuario_sistema'];

        for (const table of tables) {
            const columns = await prisma.$queryRawUnsafe(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
      `);
            console.log(`Columns in ${table}:`, (columns as any[]).map(c => c.column_name));
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
