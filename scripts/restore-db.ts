#!/usr/bin/env ts-node

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import 'dotenv/config';

const execAsync = promisify(exec);

async function restoreDatabase(backupFile: string) {
    if (!backupFile) {
        console.error('❌ Error: Debes especificar el archivo de backup a restaurar.');
        console.error('Uso: npm run restore:db <archivo.sql.gz>');
        process.exit(1);
    }

    const backupPath = path.resolve(backupFile);

    // Check if file exists
    try {
        await fs.access(backupPath);
    } catch {
        console.error(`❌ Error: El archivo ${backupPath} no existe.`);
        process.exit(1);
    }

    console.log(`🔄 Iniciando restauración desde: ${path.basename(backupPath)}`);

    // Determine if it's compressed
    const isGzipped = backupPath.endsWith('.gz');
    let sqlFile = backupPath;

    try {
        if (isGzipped) {
            console.log('📦 Descomprimiendo archivo temporarlmente...');
            sqlFile = backupPath.replace('.gz', '');

            // Decompress
            await pipeline(
                createReadStream(backupPath),
                createGunzip(),
                createWriteStream(sqlFile)
            );
        }

        console.log('📥 Restaurando base de datos (psql)...');

        // Construct command
        // Note: This requires DATABASE_URL to be set in environment
        // Check if psql exists
        let useDocker = false;
        try {
            await execAsync('which psql');
        } catch {
            console.log('⚠️  psql no encontrado. Usando Docker...');
            useDocker = true;
        }

        if (useDocker) {
            const containerName = 'broncopulmonar_db';
            const dbUser = 'admin';
            const dbName = 'broncopulmonar';
            // cat file | docker exec -i ...
            await execAsync(`cat "${sqlFile}" | docker exec -i ${containerName} psql -U ${dbUser} ${dbName}`);
        } else {
            const { stdout, stderr } = await execAsync(
                `psql "${process.env.DATABASE_URL}" < "${sqlFile}"`
            );
        }

        console.log('✅ Restauración completada.');

    } catch (error) {
        console.error('❌ Error durante la restauración:', error);
        process.exit(1);
    } finally {
        // Cleanup temp file if we decompressed it
        if (isGzipped && sqlFile !== backupPath) {
            try {
                await fs.unlink(sqlFile);
                console.log('🧹 Archivos temporales limpiados.');
            } catch (cleanupError) {
                console.warn('⚠️ No se pudo eliminar el archivo temporal:', cleanupError);
            }
        }
    }
}

// Get file from args
const args = process.argv.slice(2);
const file = args[0];

restoreDatabase(file);
