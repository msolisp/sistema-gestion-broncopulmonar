# Plan de Rollback - Sistema Broncopulmonar

## Objetivo
Este documento describe el procedimiento paso a paso para realizar un rollback seguro del Sistema de Gestión Broncopulmonar en caso de problemas críticos en producción.

## Criterios para Rollback

Ejecutar rollback inmediatamente si:
- ✅ Tasa de errores > 5% durante más de 5 minutos
- ✅ Imposibilidad de login para > 50% de usuarios
- ✅ Pérdida de datos detectada
- ✅ Vulnerabilidad de seguridad crítica descubierta
- ✅ Caída total del sistema por > 2 minutos

## Tiempo Objetivo de Rollback

**RTO (Recovery Time Objective)**: 5 minutos máximo

---

## Procedimiento de Rollback

### Paso 1: Detener Nuevo Tráfico (30 segundos)

1. **Acceder a Vercel Dashboard**
   ```
   URL: https://vercel.com/dashboard
   Proyecto: broncopulmonar-system
   ```

2. **Pausar deploys automáticos** (si están activos)
   - Settings → Git → Disable automatic deployments

### Paso 2: Identificar Versión Estable (30 segundos)

1. **Ir a Deployments** en Vercel
2. **Identificar último deployment estable** (marcado como "Production")
3. **Anotar deployment ID** (ejemplo: `dpl_ABC123xyz`)

### Paso 3: Rollback de Aplicación (1 minuto)

#### Opción A: Rollback via UI (Recomendado)

1. En Vercel Dashboard → Deployments
2. Encontrar el deployment estable anterior
3. Click en el deployment
4. Click en "..." (three dots) → "Promote to Production"
5. Confirmar rollback

#### Opción B: Rollback via CLI

```bash
# Instalar Vercel CLI si no está instalado
npm i -g vercel

# Login
vercel login

# Listar deployments
vercel ls

# Promover deployment anterior a producción
vercel promote <DEPLOYMENT_URL> --scope=<TEAM_NAME>

# Ejemplo:
# vercel promote dpl_ABC123xyz --scope=hospital-broncopulmonar
```

### Paso 4: Verificar Rollback de Aplicación (30 segundos)

1. Abrir https://[tu-dominio].vercel.app
2. Verificar que muestra la versión anterior
3. Realizar smoke test:
   - Abrir `/login`
   - Intentar login con credenciales de prueba
   - Verificar dashboard carga correctamente

### Paso 5: Rollback de Base de Datos (SI APLICA) (2-3 minutos)

> ⚠️ **SOLO ejecutar si el problema fue causado por una migración de DB**

#### 5.1 Identificar Migración Problemática

```bash
# Ver últimas migraciones aplicadas
npx prisma migrate status
```

#### 5.2 Rollback de Migración

```bash
# Conectarse a la base de datos
# Para Vercel Postgres:
psql <DATABASE_URL>

# Ver migraciones aplicadas
SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 5;

# Ejecutar SQL de rollback manual
# (Debe estar documentado en la migración)

# Marcar migración como rolled back
UPDATE "_prisma_migrations" 
SET rolled_back_at = NOW() 
WHERE migration_name = '<MIGRATION_NAME>';
```

#### 5.3 Restaurar desde Backup (Último Recurso)

```bash
# Descargar backup más reciente
# (Ubicación depende de estrategia de backup configurada)

# Restaurar backup
pg_restore -d <DATABASE_URL> latest_backup.sql

# Verificar restauración
psql <DATABASE_URL> -c "SELECT COUNT(*) FROM \"Patient\";"
```

### Paso 6: Verificación Post-Rollback (1 minuto)

#### Checklist de Verificación

- [ ] Aplicación responde en producción
- [ ] Login funciona para usuarios de prueba
- [ ] Dashboard interno carga
- [ ] Portal de pacientes accesible
- [ ] No hay errores 500 en logs
- [ ] Base de datos responde (check `/api/health`)

#### Comandos de Verificación

```bash
# Health check
curl https://[tu-dominio].vercel.app/api/health

# Debería retornar:
# { "status": "healthy", "checks": { "database": true } }

# Readiness check
curl https://[tu-dominio].vercel.app/api/ready

# Debería retornar:
# { "ready": true }
```

### Paso 7: Comunicación (Inmediato)

1. **Notificar a stakeholders**:
   ```
   Subject: [CRITICAL] Rollback ejecutado - Sistema Broncopulmonar
   
   Se ha ejecutado un rollback del sistema por [RAZÓN].
   
   Estado actual: ESTABLE en versión anterior
   Tiempo de downtime: X minutos
   Próximos pasos: [PLAN DE ACCIÓN]
   
   Equipo Técnico
   ```

2. **Actualizar status page** (si existe)

3. **Documentar incidente**:
   - Hora de detección
   - Razón del rollback
   - Pasos ejecutados
   - Tiempo total de rollback
   - Lecciones aprendidas

---

## Post-Rollback: Investigación

### 1. Recopilar Información

- **Logs de aplicación** (Vercel logs)
  ```bash
  vercel logs <DEPLOYMENT_ID>
  ```

- **Logs de base de datos** (si disponibles)

- **Errors en Sentry** (si configurado)

- **Reportes de usuarios** afectados

### 2. Análisis de Causa Raíz

Crear documento de análisis con:
- Timeline del incidente
- Causa raíz identificada
- Por qué los tests no detectaron el problema
- Medidas preventivas para evitar recurrencia

### 3. Plan de Corrección

- Corregir el problema en branch separado
- Agregar tests que reproduzcan el bug
- Ejecutar suite completa de tests
- Code review por 2+ personas
- Deploy a staging primero
- Smoke test exhaustivo en staging
- Deploy gradual a producción (si posible)

---

## Scripts de Automatización

### Script de Backup Pre-Deploy

Crear archivo: `scripts/backup-db.ts`

```typescript
#!/usr/bin/env ts-node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function backupDatabase() {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFile = `backups/backup-${timestamp}.sql`;
    
    try {
        console.log('Creating database backup...');
        await execAsync(`pg_dump ${process.env.DATABASE_URL} > ${backupFile}`);
        console.log(`✅ Backup created: ${backupFile}`);
    } catch (error) {
        console.error('❌ Backup failed:', error);
        process.exit(1);
    }
}

backupDatabase();
```

### Script de Verificación Post-Rollback

Crear archivo: `scripts/verify-system.ts`

```typescript
#!/usr/bin/env ts-node

async function verifySystem(baseUrl: string) {
    const checks = [
        { name: 'Health Check', url: `${baseUrl}/api/health` },
        { name: 'Ready Check', url: `${baseUrl}/api/ready` },
        { name: 'Login Page', url: `${baseUrl}/login` }
    ];

    console.log('Running system verification...\n');

    for (const check of checks) {
        try {
            const response = await fetch(check.url);
            const status = response.ok ? '✅' : '❌';
            console.log(`${status} ${check.name}: ${response.status}`);
        } catch (error) {
            console.log(`❌ ${check.name}: FAILED`);
        }
    }
}

const baseUrl = process.argv[2] || 'http://localhost:3000';
verifySystem(baseUrl);
```

---

## Contactos de Emergencia

### Equipo Técnico
- **Desarrollador Principal**: [Nombre] - [Email] - [Teléfono]
- **DevOps**: [Nombre] - [Email] - [Teléfono]
- **On-Call**: [Número de guardia]

### Proveedores
- **Vercel Support**: support@vercel.com
- **Vercel Status**: https://www.vercel-status.com/

---

## Checklist de Prevención

Para reducir necesidad de rollbacks:

- [ ] **Pre-Deploy**:
  - [ ] Todos los tests pasan (unit + E2E)
  - [ ] Code review completado por 2+ personas
  - [ ] Backup de DB creado
  - [ ] Migrations verificadas en staging
  - [ ] Performance testing en staging

- [ ] **Durante Deploy**:
  - [ ] Deploy fuera de horario pico
  - [ ] Monitoreo activo durante 15 minutos post-deploy
  - [ ] Equipo disponible para rollback inmediato

- [ ] **Post-Deploy**:
  - [ ] Smoke tests en producción
  - [ ] Verificar logs por 30 minutos
  - [ ] Confirmar con stakeholders que todo funciona

---

## Versión del Documento

- **Versión**: 1.0
- **Última Actualización**: 2026-01-13
- **Próxima Revisión**: Trimestral o después de cada rollback

---

## Notas Importantes

> ⚠️ **NEVER PANIC**: Este documento existe para que ejecutes rollbacks con calma y precisión

> 📝 **DOCUMENT EVERYTHING**: Cada rollback es una oportunidad de aprendizaje

> 🔒 **SECURITY FIRST**: Si el problema es de seguridad, rollback primero, investiga después

> 📞 **COMMUNICATE**: Mantén informados a todos los stakeholders durante todo el proceso
