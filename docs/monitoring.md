# Guía de Monitoreo y Observabilidad

## Visión General
Este documento describe las herramientas y procedimientos para monitorear la salud, el rendimiento y los errores del Sistema de Gestión Broncopulmonar.

---

## 1. Health Checks (Disponibilidad)

### Endpoint de Salud
El sistema expone un endpoint público (pero ligero) para verificar el estado del servicio:
- **URL**: `/api/health`
- **Respuesta Exitosa**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-01-20T12:00:00.000Z",
    "uptime": 123.45
  }
  ```
- **Uso**: Load balancers y monitores externos (UptimeRobot, Pingdom) deben consultar esta URL cada 1-5 minutos.

### Script de Verificación
Se incluye un script de utilidad para verificaciones rápidas (CI/CD o manuales):
```bash
# Dar permisos de ejecución
chmod +x scripts/health-check.sh

# Ejecutar test (por defecto contra localhost:3000)
./scripts/health-check.sh
```

---

## 2. Monitoreo de Errores (Sentry)

Sentry está integrado para capturar excepciones en tiempo real tanto en el cliente (navegador) como en el servidor (Next.js/Node).

### Configuración
- **Archivos**: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`.
- **DSN**: Configurado vía variable de entorno `SENTRY_DSN`.

### Qué se monitorea
- Errores no capturados (500 Server Errors).
- Excepciones de JavaScript en el cliente.
- Performance de transacciones (tiempos de carga, latencia de base de datos).

---

## 3. Logs del Sistema (Auditoría)

Para acciones de negocio (no errores técnicos), el sistema utiliza una tabla interna `SystemLog`.

- **Consulta**: Visible en el Dashboard de Admin bajo la pestaña "Auditoría".
- **Eventos Críticos**:
  - Inicios de sesión (`LOGIN_SUCCESS`, `LOGIN_FAILURE`).
  - Creación/Eliminación de pacientes (`CREATE_PATIENT`, `DELETE_PATIENT`).
  - Cambios de permisos (`UPDATE_PERMISSION`).

---

## 4. Alertas Recomendadas

Configurar en plataforma de despliegue (Vercel) o externa:

1. **Uptime Alert**: Si `/api/health` no responde 200 por > 2 minutos.
2. **Error Spike**: Si Sentry reporta > 50 errores en 5 minutos.
3. **Database Concurrency**: Si se detectan múltiples errores de timeout de conexión (Prisma).
