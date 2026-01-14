#!/usr/bin/env ts-node

import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir } from 'fs/promises';
import path from 'path';

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

        const { stderr } = await execAsync(
            `pg_dump "${process.env.DATABASE_URL}" -f "${filepath}"`
        );

        if (stderr && !stderr.includes('WARNING')) {
            throw new Error(stderr);
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
