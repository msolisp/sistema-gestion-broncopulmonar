import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.join(process.cwd(), '.env.production.local');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

const prisma = new PrismaClient({
    datasources: { db: { url: process.env.POSTGRES_URL || process.env.DATABASE_URL } }
});

async function main() {
    try {
        await prisma.$connect();

        console.log('--- UsuarioSistema Columns ---');
        const mkCols = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'usuario_sistema';
        `;
        console.table(mkCols);

        console.log('--- Rol Rows ---');
        try {
            const rows = await prisma.$queryRaw`SELECT * FROM "rol"`;
            console.table(rows);
        } catch (e) {
            console.log('Error querying rol:', e.message);
        }

        console.log('--- Tables Existence ---');
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `;
        console.table(tables);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
