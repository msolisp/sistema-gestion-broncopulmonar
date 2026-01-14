# Estrategia de Backups - Sistema Broncopulmonar

## Objetivo
Garantizar la disponibilidad y recuperabilidad de datos críticos del sistema mediante backups automatizados y probados.

---

## Datos a Respaldar

### Prioridad Crítica 🔴
1. **Base de Datos PostgreSQL**
   - Todos los datos de pacientes
   - Usuarios del sistema
   - Appointments, exámenes médicos
   - Tests pulmonares
   - Logs de auditoría

2. **Archivos Médicos**
   - PDFs de exámenes subidos
   - Almacenados en Vercel Blob Storage

### Prioridad Alta 🟡
1. **Configuración del Sistema**
   - Variables de entorno (encriptadas)
   - Configuración de permisos RBAC

---

## Frecuencia de Backups

| Tipo | Frecuencia | Retención | Ubicación |
|------|-----------|-----------|-----------|
| **DB Completo** | Diario (2:00 AM) | 30 días | Vercel Postgres Backups |
| **DB Semanal** | Sábados 3:00 AM | 12 semanas | S3 / Storage externo |
| **DB Mensual** | 1er día del mes | 12 meses | S3 / Storage externo |
| **Archivos** | Diario | 90 días | Vercel Blob (replicación) |
| **Pre-Deploy** | Antes de cada deploy | 7 días | Local + Cloud |

---

## Configuración de Backups

### 1. Backups Automáticos de Vercel Postgres

Vercel Postgres Pro incluye backups automáticos:

```bash
# Ver backups disponibles (requiere Vercel CLI)
vercel postgres backup ls

# Crear backup manual
vercel postgres backup create

# Restaurar desde backup
vercel postgres backup restore <BACKUP_ID>
```

**Configuración recomendada**:
- Plan: Vercel Postgres Pro
- Backup automático: Habilitado (diario)
- Retención: 30 días (incluido en plan)
- Point-in-time recovery: Últimas 7 días

### 2. Backups Manuales con pg_dump

Script para backup manual: `scripts/backup-db.sh`

```bash
#!/bin/bash

# Configuración
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# Crear directorio si no existe
mkdir -p ${BACKUP_DIR}

# Ejecutar backup
echo "Iniciando backup de base de datos..."
pg_dump $DATABASE_URL > ${BACKUP_FILE}

if [ $? -eq 0 ]; then
    echo "✅ Backup exitoso: ${BACKUP_FILE}"
    
    # Comprimir backup
    gzip ${BACKUP_FILE}
    echo "✅ Backup comprimido: ${BACKUP_FILE}.gz"
    
    # Eliminar backups antiguos (> 7 días)
    find ${BACKUP_DIR} -name "backup_*.sql.gz" -mtime +7 -delete
    echo "✅ Backups antiguos eliminados"
else
    echo "❌ Error en backup"
    exit 1
fi
```

### 3. Script de Backup TypeScript

Archivo: `scripts/backup-db.ts`

```typescript
#!/usr/bin/env ts-node

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface BackupResult {
    success: boolean;
    filename?: string;
    error?: string;
    size?: number;
}

async function createBackup(): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    try {
        // Crear directorio de backups
        await mkdir(backupDir, { recursive: true });

        console.log('🔄 Creando backup de base de datos...');

        // Ejecutar pg_dump
        const { stdout, stderr } = await execAsync(
            `pg_dump "${process.env.DATABASE_URL}" -f "${filepath}"`
        );

        if (stderr && !stderr.includes('WARNING')) {
            throw new Error(stderr);
        }

        // Obtener tamaño del archivo
        const stats = await require('fs').promises.stat(filepath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log(`✅ Backup exitoso: ${filename}`);
        console.log(`📊 Tamaño: ${sizeMB} MB`);

        // Comprimir backup
        await execAsync(`gzip -f "${filepath}"`);
        console.log(`✅ Backup comprimido: ${filename}.gz`);

        return {
            success: true,
            filename: `${filename}.gz`,
            size: stats.size
        };
    } catch (error) {
        console.error('❌ Error creando backup:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Función para eliminar backups antiguos
async function cleanOldBackups(daysToKeep: number = 7): Promise<void> {
    const backupDir = path.join(process.cwd(), 'backups');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
        const { stdout } = await execAsync(
            `find "${backupDir}" -name "backup-*.sql.gz" -mtime +${daysToKeep} -delete`
        );
        console.log(`🧹 Backups antiguos eliminados (> ${daysToKeep} días)`);
    } catch (error) {
        console.error('⚠️  Error limpiando backups antiguos:', error);
    }
}

// Ejecutar backup
(async () => {
    console.log('=== Backup de Base de Datos ===\n');
    
    const result = await createBackup();
    
    if (result.success) {
        await cleanOldBackups(7);
        console.log('\n✅ Proceso de backup completado');
        process.exit(0);
    } else {
        console.log('\n❌ Proceso de backup falló');
        process.exit(1);
    }
})();
```

### 4. Automatización con GitHub Actions

Archivo: `.github/workflows/backup.yml`

```yaml
name: Automated Database Backup

on:
  schedule:
    # Ejecutar diariamente a las 2:00 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Permite ejecución manual

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Create backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          npm run backup:db
      
      - name: Upload backup to S3
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Sync backups to S3
        run: |
          aws s3 sync ./backups s3://broncopulmonar-backups/db/ --exclude "*" --include "backup-*.sql.gz"
      
      - name: Notify on failure
        if: failure()
        uses: dawidd6/action-send-mail@v3
        with:
          server_address: smtp.gmail.com
          server_port: 587
          username: ${{ secrets.EMAIL_USERNAME }}
          password: ${{ secrets.EMAIL_PASSWORD }}
          subject: ❌ Backup Failed - Broncopulmonar System
          body: Automated backup failed. Check GitHub Actions logs.
          to: admin@hospital.cl
```

---

## Pruebas de Restauración

### Frecuencia de Pruebas
- **Mensual**: Restaurar último backup diario en ambiente de staging
- **Trimestral**: Restaurar backup mensual completo
- **Anual**: Disaster recovery drill completo

### Procedimiento de Prueba de Restauración

1. **Preparar ambiente de prueba**
   ```bash
   # Crear database temporal
   createdb broncopulmonar_test_restore
   ```

2. **Restaurar backup**
   ```bash
   # Descomprimir
   gunzip -c backups/backup-XXXXXXXX.sql.gz > restore_test.sql
   
   # Restaurar
   psql broncopulmonar_test_restore < restore_test.sql
   ```

3. **Verificar integridad**
   ```sql
   -- Contar registros
   SELECT 'patients' as table, COUNT(*) FROM "Patient"
   UNION ALL
   SELECT 'appointments', COUNT(*) FROM "Appointment"
   UNION ALL
   SELECT 'exams', COUNT(*) FROM "MedicalExam";
   
   -- Verificar timestamps
   SELECT MAX(created_at) as last_patient FROM "Patient";
   ```

4. **Documentar resultado**
   - Tiempo de restauración
   - Integridad de datos verificada (✅/❌)
   - Problemas encontrados
   - Acciones correctivas

---

## Backup de Archivos (Vercel Blob)

### Estrategia
Vercel Blob incluye:
- Replicación automática en múltiples regiones
- Durabilidad 99.999999999% (11 nines)
- Sin necesidad de backup manual adicional

### Backup Adicional (Opcional)
Para regulaciones específicas o compliance:

```typescript
// Script para copiar blobs a S3
import { list } from '@vercel/blob';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();

async function backupBlobsToS3() {
    const { blobs } = await list();
    
    for (const blob of blobs) {
        // Descargar de Vercel Blob
        const response = await fetch(blob.url);
        const buffer = await response.arrayBuffer();
        
        // Subir a S3
        await s3.upload({
            Bucket: 'broncopulmonar-file-backups',
            Key: blob.pathname,
            Body: Buffer.from(buffer),
            Metadata: {
                originalUrl: blob.url,
                uploadedAt: blob.uploadedAt.toISOString()
            }
        }).promise();
        
        console.log(`✅ Backed up: ${blob.pathname}`);
    }
}
```

---

## Monitoreo de Backups

### Métricas a Monitorear
- ✅ Último backup exitoso (timestamp)
- ⚠️ Fallos de backup (alertar inmediatamente)
- 📊 Tamaño de backups (trending)
- ⏱️ Tiempo de ejecución de backup
- 💾 Uso de espacio de almacenamiento

### Alertas
Configurar alertas si:
- No hay backup exitoso en últimas 25 horas
- Backup falla 2 veces consecutivas
- Tamaño de backup crece > 50% en 1 semana (potencial data leak)
- Espacio de almacenamiento > 80%

---

## Checklist de Implementación

### Setup Inicial
- [ ] Configurar Vercel Postgres backups automáticos
- [ ] Crear scripts de backup manual
- [ ] Configurar GitHub Actions para backups automatizados
- [ ] Setup S3 bucket para backups externos
- [ ] Configurar alertas de backup

### Operación Continua
- [ ] Verificar backup diario cada mañana
- [ ] Probar restauración mensual
- [ ] Revisar espacio de almacenamiento semanal
- [ ] Actualizar documentación cuando cambie proceso

---

## Recovery Scenarios

### Escenario 1: Eliminación Accidental de Datos
**RTO**: 30 minutos  
**RPO**: 24 horas

1. Identificar alcance de datos eliminados
2. Encontrar backup previo a la eliminación
3. Restaurar en ambiente temporal
4. Extraer datos específicos
5. Insertar datos recuperados en producción

### Escenario 2: Corrupción de Base de Datos
**RTO**: 2 horas  
**RPO**: 24 horas

1. Detener acceso a base de datos
2. Restaurar último backup completo
3. Verificar integridad
4. Reanudar servicio
5. Investigar causa de corrupción

### Escenario 3: Disaster Recovery Completo
**RTO**: 4 horas  
**RPO**: 24 horas

1. Provisionar nueva infraestructura
2. Restaurar backup más reciente
3. Configurar DNS y routing
4. Verificar todos los servicios
5. Comunicar a usuarios

---

## Compliance y Regulaciones

### Retención de Datos Médicos (Chile)
- **Mínimo**: 15 años para registros médicos
- **Recomendado**: Permanente para datos críticos

### Encriptación
- Backups deben estar encriptados en reposo
- Usar AES-256 para archivos de backup
- Claves de encriptación almacenadas en secrets manager

---

## Contactos de Emergencia

### Equipo Responsable
- **Backup Administrator**: [Nombre] - [Email]
- **Database Administrator**: [Nombre] - [Email]
- **DevOps On-Call**: [Teléfono]

### Proveedores
- **Vercel Support**: support@vercel.com
- **AWS Support** (si usa S3): [URL]

---

## Versión del Documento
- **Versión**: 1.0
- **Última Actualización**: 2026-01-13
- **Próxima Revisión**: Trimestral
