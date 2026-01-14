# Guía de Setup - Observabilidad Crítica

## Setup Completo de Items Críticos

Esta guía te ayudará a completar la configuración de observabilidad para producción.

---

## 1. Configuración de Sentry (Error Tracking)

### Paso 1: Crear Cuenta en Sentry

1. Ir a https://sentry.io/signup/
2. Crear cuenta (plan gratuito incluye 5,000 eventos/mes)
3. Crear nuevo proyecto:
   - Platform: **Next.js**
   - Nombre: `broncopulmonar-system`

### Paso 2: Obtener DSN

Después de crear el proyecto, Sentry te mostrará un DSN:
```
https://[KEY]@[ORG].ingest.sentry.io/[PROJECT_ID]
```

### Paso 3: Configurar Variables de Entorno

#### Local (`.env.local`):
```bash
SENTRY_DSN=https://tu_key@tu_org.ingest.sentry.io/tu_project_id
SENTRY_ORG=tu-organizacion
SENTRY_PROJECT=broncopulmonar-system
```

#### Vercel (Production):
1. Ir a Vercel Dashboard → tu proyecto
2. Settings → Environment Variables
3. Agregar:
   - `SENTRY_DSN` = tu DSN
   - `SENTRY_ORG` = tu organización
   - `SENTRY_PROJECT` = broncopulmonar-system

### Paso 4: Inicializar Sentry en Next.js

Ejecutar wizard de Sentry:
```bash
npx @sentry/wizard@latest -i nextjs
```

Esto creará automáticamente:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- Actualización de `next.config.js`

### Paso 5: Verificar Instalación

1. Hacer un deploy o correr localmente
2. Generar un error de prueba:
   ```typescript
   // En cualquier página
   throw new Error("Test error for Sentry");
   ```
3. Verificar que aparece en Sentry Dashboard

---

## 2. Configuración de Backups

### Opción A: Backups en Vercel Postgres (Recomendado)

**Si usas Vercel Postgres Pro:**

1. Ya tienes backups automáticos habilitados por defecto
2. Retención: 30 días
3. Ver backups:
   ```bash
   vercel postgres backup ls
   ```

4. Crear backup manual:
   ```bash
   vercel postgres backup create
   ```

5. Restaurar:
   ```bash
   vercel postgres backup restore <backup-id>
   ```

### Opción B: Backups Manuales con pg_dump

#### Prerequisitos:
```bash
# Mac (instalar PostgreSQL client tools)
brew install postgresql

# Verificar instalación
which pg_dump
# Debería mostrar: /opt/homebrew/bin/pg_dump o similar
```

#### Configurar DATABASE_URL:
```bash
# En .env.local
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

#### Ejecutar Backup:
```bash
# Usar script automatizado
npx ts-node scripts/backup-db.ts

# O manual
pg_dump $DATABASE_URL > backups/manual-backup.sql
gzip backups/manual-backup.sql
```

### Opción C: Backups Automáticos con GitHub Actions

Ya tienes la configuración en `docs/backup-strategy.md`. Para activarla:

1. Crear `.github/workflows/backup.yml` con el contenido proporcionado
2. Configurar secrets en GitHub:
   - `DATABASE_URL`
   - `AWS_ACCESS_KEY_ID` (si usas S3)
   - `AWS_SECRET_ACCESS_KEY`
3. Se ejecutará automáticamente cada día a las 2 AM

---

## 3. Configuración de Monitoring (UptimeRobot)

### Paso 1: Crear Cuenta

1. Ir a https://uptimerobot.com/
2. Crear cuenta gratuita (50 monitores incluidos)

### Paso 2: Crear Monitor para Health Check

1. Dashboard → Add New Monitor
2. Configuración:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Broncopulmonar Health Check
   - **URL**: `https://tu-dominio.vercel.app/api/health`
   - **Monitoring Interval**: 5 minutes
   - **Monitor Timeout**: 30 seconds

3. Alert Contacts:
   - Agregar tu email
   - Opcional: agregar SMS/Slack/Telegram

### Paso 3: Crear Monitor para Readiness

1. Add New Monitor
2. Configuración:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Broncopulmonar Readiness
   - **URL**: `https://tu-dominio.vercel.app/api/ready`
   - **Monitoring Interval**: 5 minutes

### Paso 4: Configurar Alertas

1. My Settings → Alert Contacts
2. Configurar:
   - Email notification: Si
   - Resend after: 3 minutes
   - Send down notifications after: 2 checks (10 minutos)

---

## 4. Integración del Logger en Código

### Ya Completado ✅
- Logger ya integrado en `actions.ts` para autenticación

### Próximas Integraciones Recomendadas

#### En `updatePatientProfile`:
```typescript
// Agregar después del try
loggers.patient.updated(session.user.id, Object.keys(validation.data));

// En catch
loggers.error.database('updatePatientProfile', e as Error);
```

#### En `adminCreatePatient`:
```typescript
// Después de create exitoso
loggers.patient.created(patient.id, patient.email);
```

#### En `uploadMedicalExam`:
```typescript
//  Después de upload exitoso
loggers.exam.uploaded(examId, patientId, file.size);

// En error
loggers.exam.uploadFailed(patientId, (e as Error).message);
```

---

## 5. Checklist de Verificación Post-Setup

### Sentry ✓
- [ ] DSN configurado en variables de entorno
- [ ] Wizard ejecutado (`npx @sentry/wizard`)
- [ ] Error de prueba visible en dashboard
- [ ] Source maps funcionando
- [ ] Alertas configuradas para errores críticos

### Backups ✓
- [ ] Backup automático de Vercel Postgres habilitado
- [ ] O pg_dump instalado y funcionando
- [ ] Primer backup creado exitosamente
- [ ] Backup restaurado en ambiente de prueba
- [ ] Retención configurada (30 días mínimo)

### Monitoring ✓
- [ ] UptimeRobot configurado
- [ ] Monitor health check activo
- [ ] Monitor readiness activo
- [ ] Email alerts configuradas
- [ ] Status page creada (opcional)

### Logger ✓
- [x] Logger estructurado creado
- [x] Integrado en authenticate
- [ ] Integrado en todas las acciones críticas
- [ ] Logs visibles en consola/archivos
- [ ] Niveles de log configurados correctamente

---

## 6. Testing de la Configuración

### Test 1: Health Checks
```bash
# Local
curl http://localhost:3000/api/health
curl http://localhost:3000/api/ready

# Production (después de deploy)
curl https://tu-dominio.vercel.app/api/health
curl https://tu-dominio.vercel.app/api/ready
```

**Resultado esperado**: JSON con `status: "healthy"` y `ready: true`

### Test 2: Sentry
```typescript
// Agregar temporalmente en una página
throw new Error("Sentry test error");
```

**Resultado esperado**: Error visible en Sentry dashboard en < 1 minuto

### Test 3: Logger
```typescript
// En server action
import { loggers } from '@/lib/structured-logger';
loggers.system.healthCheck('healthy', { database: true });
```

**Resultado esperado**: Log estructurado en consola

### Test 4: Backup
```bash
npx ts-node scripts/backup-db.ts
```

**Resultado esperado**: Archivo `backups/backup-*.sql.gz` creado

---

## 7. Próximos Pasos (Después del Setup)

1. **Primera Semana**:
   - Monitorear logs diariamente
   - Verificar que health checks están passing
   - Revisar errores en Sentry
   - Confirmar que backups se crean automáticamente

2. **Primer Mes**:
   - Probar restauración de backup
   - Ajustar niveles de log si es necesario
   - Optimizar alertas de Sentry (reducir ruido)
   - Documentar incidentes y resoluciones

3. **Trimestral**:
   - Revisar estrategia de retención de backups
   - Actualizar procedimientos de rollback
   - Drill de disaster recovery
   - Revisar y optimizar configuración de observabilidad

---

## 8. Recursos y Referencias

### Documentación Interna
- [Plan Completo MVP → Enterprise](../implementation_plan.md)
- [Procedimiento de Rollback](./rollback-procedure.md)
- [Estrategia de Backups](./backup-strategy.md)

### Documentación Externa
- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Vercel Postgres Backups](https://vercel.com/docs/storage/vercel-postgres/backups)
- [UptimeRobot Documentation](https://uptimerobot.com/api/)
- [Winston Logger](https://github.com/winstonjs/winston)

---

## 9. Troubleshooting

### Problema: "pg_dump command not found"
**Solución**: Instalar PostgreSQL client
```bash
brew install postgresql
```

### Problema: "DATABASE_URL is undefined"
**Solución**: Configurar variable de entorno
```bash
# .env.local
DATABASE_URL="tu_connection_string"
```

### Problema: Sentry no captura errores
**Solución verificaciones**:
1. SENTRY_DSN está configurado
2. Environmen es "production" o "development"
3. Error no está en try-catch sin re-throw
4. Source maps están subidos

### Problema: Health check retorna 503
**Solución**: Verificar:
1. Base de datos está accesible
2. Credenciales son correctas
3. Network connectivity OK

---

## Contacto de Soporte

Para problemas con la configuración:
- **Email**: [Tu email de soporte]
- **Documentación**: Ver `/docs` folder
- **Issues**: GitHub issues del proyecto

---

## Versión del Documento
- **Versión**: 1.0
- **Última Actualización**: 2026-01-13
- **Autor**: Sistema de Gestión Broncopulmonar
