#!/usr/bin/env ts-node

import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir } from 'fs/promises';
import path from 'path';
import 'dotenv/config'; // Load .env file

const execAsync = promisify(exec);

interface BackupResult {
    success: boolean;
    filename?: string;
    error?: string;
}

async function createBackup(): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    try {
        await mkdir(backupDir, { recursive: true });
        console.log('🔄 Creando backup de base de datos...');

        let command = `pg_dump "${process.env.DATABASE_URL}" -f "${filepath}"`;

        // Check if pg_dump exists, if not try docker
        try {
            await execAsync('which pg_dump');
        } catch (e) {
            console.log('⚠️  pg_dump no encontrado en el sistema. Intentando vía Docker...');
            // Extract DB Info from URL or Env
            // Assuming container name 'broncopulmonar_db' based on docker ps
            const containerName = 'broncopulmonar_db';
            const dbUser = 'admin'; // Extract from URL if possible, hardcoded for stability in this env
            const dbName = 'broncopulmonar';
            command = `docker exec -t ${containerName} pg_dump -U ${dbUser} ${dbName} > "${filepath}"`;
        }

        const { stderr } = await execAsync(command);

        if (stderr && !stderr.includes('WARNING') && !stderr.includes('Notice')) {
            // Docker often emits warnings/info to stderr, so be careful failing
            console.warn('Backup Output:', stderr);
        }

        // Comprimir
        await execAsync(`gzip -f "${filepath}"`);
        console.log(`✅ Backup creado: ${filename}.gz`);

        return { success: true, filename: `${filename}.gz` };
    } catch (error) {
        console.error('❌ Error creando backup:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown'
        };
    }
}

// Ejecutar
createBackup().then(result => {
    process.exit(result.success ? 0 : 1);
});
