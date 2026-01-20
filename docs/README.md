# Documentación del Sistema de Gestión Broncopulmonar

> **Sistema de Gestión de Rehabilitación Broncopulmonar**  
> **Versión**: 1.0  
> **Fecha de Actualización**: 20 de Enero, 2026

---

## 📚 Índice de Documentación

Este directorio contiene la documentación completa del Sistema de Gestión Broncopulmonar. A continuación se presenta un índice de todos los documentos disponibles:

### 1. [Especificaciones Funcionales](./especificaciones-funcionales.md)
**Descripción**: Documento detallado de las especificaciones funcionales del sistema, organizadas por rol de usuario.

**Contenido**:
- ✅ Capacidades del rol **Paciente**
- ✅ Capacidades del rol **Kinesiólogo**
- ✅ Capacidades del rol **Recepcionista**
- ✅ Capacidades del rol **Administrador**
- ✅ Funcionalidades transversales (seguridad, notificaciones, exportación)
- ✅ Flujos de trabajo principales
- ✅ Reglas de negocio
- ✅ Validaciones y restricciones
- ✅ APIs internas
- ✅ Casos de uso especiales
- ✅ Requisitos no funcionales

**Audiencia**: Product Managers, Stakeholders, QA Testers, Desarrolladores

---

### 2. [Documentación de Arquitectura](./arquitectura.md)
**Descripción**: Documentación técnica de la arquitectura del sistema con diagramas UML/Mermaid.

**Contenido**:
- 🏗️ Arquitectura general del sistema (vista de alto nivel)
- 🏗️ Arquitectura en capas
- 📊 Modelo de datos (Diagrama Entidad-Relación)
- 🧩 Arquitectura de componentes
- 🔄 Flujos de interacción (Diagramas de secuencia):
  - Autenticación
  - Gestión de pacientes
  - Subida de exámenes
  - Reportes BI
- 🎨 Patrones de diseño implementados:
  - Server-Side Rendering (SSR)
  - Server Actions
  - Repository Pattern (Prisma)
  - Middleware Pattern
  - Singleton Pattern
- 🔐 Capas de seguridad
- 📈 Estrategias de escalabilidad
- 🚀 Deployment y DevOps
- 📊 Monitoreo y observabilidad
- 🧪 Estrategia de testing
- 📋 Diagrama de casos de uso

**Audiencia**: Arquitectos de Software, Desarrolladores Senior, DevOps Engineers

---

### 3. [Tecnologías Utilizadas](./tecnologias.md)
**Descripción**: Detalle completo del stack tecnológico utilizado en el proyecto.

**Contenido**:
- 🎨 **Frontend**:
  - Next.js 16.1.1, React 19.2.3, TypeScript 5
  - Tailwind CSS 4, shadcn/ui
  - Recharts, Leaflet Maps, Lucide Icons
- ⚙️ **Backend**:
  - Next.js API Routes, Server Actions
  - NextAuth.js v5, Zod validation
  - bcryptjs, rate-limiter-flexible
- 💾 **Base de Datos**:
  - PostgreSQL, Prisma ORM 5.22
  - Migraciones versionadas
- 📦 **Storage**: Vercel Blob, Sharp
- 🧪 **Testing**: Jest, Testing Library, Playwright
- 📊 **Monitoreo**: Sentry, Winston Logger
- 🚀 **Deployment**: Vercel Platform
- 📋 Comparación de alternativas
- 🗺️ Roadmap tecnológico
- 🔗 Recursos y referencias

**Audiencia**: Desarrolladores, DevOps, Arquitectos de Software

---

### 4. Documentación Operacional

#### [Monitoreo (monitoring.md)](./monitoring.md)
Estrategias y herramientas de monitoreo del sistema.

#### [Observabilidad (observability-setup.md)](./observability-setup.md)
Configuración de observabilidad con Sentry y logs.

#### [Estrategia de Backup (backup-strategy.md)](./backup-strategy.md)
Procedimientos de respaldo y recuperación de datos.

#### [Procedimiento de Rollback (rollback-procedure.md)](./rollback-procedure.md)
Pasos para revertir deployments en caso de problemas.

#### [Estrategia de Rollback (rollback-strategy.md)](./rollback-strategy.md)
Estrategia general de rollback y mitigación de riesgos.

---

## 🎯 Guía Rápida por Audiencia

### Para Stakeholders y Product Managers
**Comienza aquí**: [Especificaciones Funcionales](./especificaciones-funcionales.md)
- Entender qué hace el sistema
- Conocer capacidades por rol
- Comprender flujos de trabajo
- Revisar requisitos no funcionales

### Para Desarrolladores Nuevos en el Proyecto
**Comienza aquí**: [Tecnologías Utilizadas](./tecnologias.md) → [Arquitectura](./arquitectura.md)
1. Familiarízate con el stack tecnológico
2. Estudia la arquitectura general
3. Revisa los patrones de diseño
4. Consulta las especificaciones funcionales según sea necesario

### Para Arquitectos de Sistemas
**Comienza aquí**: [Arquitectura](./arquitectura.md)
- Revisar decisiones arquitectónicas
- Analizar patrones de diseño
- Evaluar estrategias de escalabilidad
- Considerar trade-offs

### Para QA Testers
**Comienza aquí**: [Especificaciones Funcionales](./especificaciones-funcionales.md) (Secciones 4, 5, 6)
- Flujos de trabajo principales
- Reglas de negocio
- Validaciones y restricciones
- Casos de uso especiales

### Para DevOps Engineers
**Comienza aquí**: [Arquitectura](./arquitectura.md) (Sección 9) + Docs Operacionales
- Deployment y CI/CD
- Monitoreo y observabilidad
- Estrategias de backup y rollback

---

## 📖 Otros Recursos

### Manual de Usuario
- **Archivo**: `Manual de Usuario - Sistema Gestión Broncopulmonar.pdf`
- **Ubicación**: Raíz del proyecto
- **Descripción**: Guía paso a paso para usuarios finales (pacientes y profesionales)

### README
- **Archivo**: `README.md`
- **Ubicación**: Raíz del proyecto
- **Descripción**: Introducción al proyecto y guía de inicio rápido

### Base de Conocimiento
- **Ubicación**: `knowledge-base/`
- **Descripción**: Material educativo sobre rehabilitación pulmonar

---

## 🔄 Versionado de Documentación

| Versión | Fecha | Cambios Principales |
|---------|-------|---------------------|
| **1.0** | 2026-01-20 | Documentación inicial completa |

---

## 📝 Cómo Contribuir a la Documentación

Si necesitas actualizar esta documentación:

1. **Edita los archivos Markdown** en la carpeta `docs/`
2. **Mantén el formato consistente** (usa los títulos y estructuras existentes)
3. **Actualiza los diagramas Mermaid** si cambia la arquitectura
4. **Incrementa la versión** en el encabezado del documento
5. **Documenta los cambios** en la tabla de versionado

### Convenciones de Formato

- **Títulos**: Usa # para título principal, ## para secciones, ### para subsecciones
- **Código**: Usa \`\`\`typescript para bloques de código
- **Diagramas**: Usa \`\`\`mermaid para diagramas
- **Alertas**: Usa formato Markdown estilo GitHub (`> [!NOTE]`, `> [!WARNING]`, etc.)
- **Enlaces**: Usa enlaces relativos para documentos internos
- **Emojis**: Usa emojis para mejorar lecturabilidad (con moderación)

---

## 🔗 Enlaces Útiles

- **Repositorio**: GitHub (si aplicable)
- **Deployment**: [Vercel Dashboard](https://vercel.com/dashboard)
- **Monitoreo**: [Sentry](https://sentry.io)
- **Base de Datos**: Neon/Vercel Postgres Dashboard

---

## 📞 Contacto y Soporte

Para preguntas sobre la documentación o el sistema:
- **Equipo de Desarrollo**: [Contacto del equipo]
- **Administrador del Sistema**: [Contacto del admin]

---

**Última actualización**: 20 de Enero, 2026  
**Mantenido por**: Equipo de Desarrollo Sistema Broncopulmonar
