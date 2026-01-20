# Estrategia de Rollback y Recuperación

## Objetivo
Definir los procedimientos estándar para revertir cambios en producción en caso de incidentes críticos, fallas de despliegue o corrupción de datos.

---

## 1. Rollback de Aplicación (Vercel)

El sistema está alojado en Vercel, lo que permite reversiones casi instantáneas ("Instant Rollback") a versiones anteriores del código sin necesidad de reconstruir los assets.

### Procedimiento
1. **Identificar la Versión Estable**:
   - Ir al Dashboard de Vercel > Deployments.
   - Localizar el último deployment marcado como "Ready" que se sabe que funciona correctamente (generalmente el anterior al actual).

2. **Ejecutar Instant Rollback**:
   - Hacer clic en el botón (tres puntos) del deployment seleccionado.
   - Seleccionar **"Instant Rollback"**.
   - Confirmar la acción. Vercel actualizará el puntero `Production` a esta versión en segundos.

3. **Verificación**:
   - Acceder a la URL de producción.
   - Verificar que el error reportado ha desaparecido.
   - Revisar `/api/health` para confirmar estado "ok".

---

## 2. Rollback de Base de Datos (PostgreSQL)

La base de datos (Vercel Postgres) soporta recuperación en el tiempo (PITR - Point-in-Time Recovery) si se tiene un plan Enterprise/Pro compatible, o restauración desde backups manuales/automáticos.

### Opción A: Point-in-Time Recovery (PITR)
*Si está habilitado en la configuración de Vercel/Neon:*
1. Ir al panel de Storage en Vercel.
2. Seleccionar la opción de "Restore" o "Branching".
3. Elegir una fecha y hora exacta PREVIA al incidente.
4. Restaurar en una nueva rama ("fork") o sobrescribir si es crítico (CUIDADO: pérdida de datos posterior al punto de restauración).

### Opción B: Restauración desde Backup (Estandar)
Usando los scripts de `scripts/restore-db.ts` documentados en `backup-strategy.md`.

1. **Localizar Backup**:
   - Identificar el último backup válido en S3 o almacenamiento local (`backups/`).
   
2. **Ejecutar Restore**:
   ```bash
   # Restaurar base de datos completa
   npm run restore:db backups/backup-20260120.sql.gz
   ```

3. **Migraciones**:
   - Si el rollback de código requiere un esquema de BD anterior, la restauración del backup alineará el esquema con los datos de ese momento.

---

## 3. Rollback de "Featurs" (Feature Flags)

Para cambios menores o funcionalidades nuevas, se recomienda usar variables de entorno para desactivarlas sin redeploy.

1. **Identificar Variable**: Revisar `.env` o la configuración en Vercel.
2. **Desactivar**: Cambiar `ENABLE_NEW_FEATURE=false`.
3. **Redeploy**: Forzar un redeploy rápido (si es variable de build) o esperar reinicio (si es runtime).

---

## 4. Comunicación de Incidente

1. **Notificar**: Informar al equipo técnico y stakeholders vía Slack/Email.
2. **Status Page**: Actualizar página de estado (si existe) indicando "Investigando" o "Mantenimiento".
3. **Post-Mortem**: Una vez estabilizado, crear documento de análisis de causa raíz (RCA).

---

## checklist de Verificación Post-Rollback
- [ ] La aplicación carga correctamente (Status 200).
- [ ] Los usuarios pueden iniciar sesión.
- [ ] No hay errores críticos en los logs (Sentry/Vercel Logs).
- [ ] La integridad de datos parece correcta.
