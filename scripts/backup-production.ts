import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir } from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

const execAsync = promisify(exec);

// Load production env vars
const envPath = path.join(process.cwd(), '.env.production.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.warn('⚠️  .env.production.local not found. Trying .env...');
    dotenv.config();
}

async function backupProduction() {
    console.log('🚀 Iniciando respaldo de Producción (Vercel Postgres)...');

    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ Error: No se encontró POSTGRES_URL o DATABASE_URL en las variables de entorno.');
        process.exit(1);
    }

    // Hide password in logs
    const safeUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
    console.log(`📡 Conectando a: ${safeUrl}`);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    const filename = `prod-backup-${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    try {
        await mkdir(backupDir, { recursive: true });

        // Check pg_dump
        try {
            await execAsync('pg_dump --version');
        } catch (e) {
            console.error('\n❌ Error: pg_dump no está instalado o no está en el PATH.');
            console.error('👉 Para instalarlo en Mac con Homebrew:');
            console.error('   brew install libpq');
            console.error('   echo \'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"\' >> ~/.zshrc');
            console.error('   source ~/.zshrc');
            process.exit(1);
        }

        console.log('⏳ Descargando base de datos (esto puede tomar unos momentos)...');

        // Use the connection string directly with pg_dump
        // Vercel/Neon requires SSL, usually handled by the connection string params
        await execAsync(`pg_dump "${dbUrl}" -f "${filepath}"`);

        console.log('📦 Comprimiendo...');
        await execAsync(`gzip -f "${filepath}"`);

        console.log(`\n✅ Respaldo exitoso: backups/${filename}.gz`);

    } catch (error: any) {
        console.error('\n❌ Falló el respaldo:', error.message);
        process.exit(1);
    }
}

backupProduction();
