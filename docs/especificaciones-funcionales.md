# Especificaciones Funcionales - Sistema de Gestión Broncopulmonar

> **Versión**: 1.0  
> **Fecha**: 20 de Enero, 2026  
> **Proyecto**: Sistema de Gestión de Rehabilitación Broncopulmonar

---

## 1. Introducción

### 1.1 Propósito del Documento
Este documento describe las especificaciones funcionales del Sistema de Gestión Broncopulmonar, detallando las capacidades y funcionalidades disponibles para cada tipo de usuario en la plataforma.

### 1.2 Alcance del Sistema
El sistema permite la gestión integral de pacientes en programas de rehabilitación broncopulmonar, incluyendo:
- Portal de pacientes para autogestión
- Portal interno para profesionales de la salud
- Sistema de administración y control
- Reportes de Business Intelligence
- Gestión de exámenes y evaluaciones funcionales

### 1.3 Usuarios del Sistema
El sistema soporta cuatro tipos de usuarios principales:
1. **Pacientes** - Usuarios externos del programa de rehabilitación
2. **Kinesiólogos** - Profesionales de la salud que gestionan pacientes
3. **Recepcionistas** - Personal administrativo con acceso limitado
4. **Administradores** - Personal con acceso completo al sistema

---

## 2. Especificaciones por Rol

### 2.1 ROL: PACIENTE

#### 2.1.1 Autenticación y Acceso
- **Login**: Acceso al portal de pacientes mediante email y contraseña
- **Recuperación de contraseña**: Solicitud de restablecimiento via email
- **Cambio de contraseña**: Modificación de credenciales desde el perfil
- **Sesión automática**: Cierre de sesión por inactividad (seguridad)

#### 2.1.2 Gestión de Perfil
- **Visualización de datos personales**:
  - Nombre completo
  - RUT
  - Email
  - Teléfono
  - Dirección, comuna y región
  - Fecha de nacimiento
  - Género
  - Sistema de salud (FONASA/ISAPRE)
  - Cota o copago
  - Fecha de diagnóstico
- **Edición de perfil**: Actualización de datos personales de contacto

#### 2.1.3 Gestión de Citas
- **Agenda disponible**: Visualización de horarios disponibles
- **Reserva de citas**: Agendamiento de evaluaciones y sesiones
- **Consulta de citas**: Visualización de citas programadas
- **Estado de citas**: Seguimiento de citas (Pendiente, Confirmada, Cancelada)

#### 2.1.4 Gestión de Exámenes
- **Carga de exámenes**: Subida de documentos médicos (PDF, imágenes)
- **Historial de exámenes**: Visualización de todos los exámenes cargados
- **Información de exámenes**:
  - Centro médico
  - Médico tratante
  - Fecha del examen
  - Estado de revisión
- **Notificaciones**: Alertas cuando un examen es revisado

#### 2.1.5 Resultados y Evaluaciones
- **Pruebas de función pulmonar**: Visualización de resultados históricos
  - Espirometría (CVF, VEF1)
  - DLCO (Difusión)
  - Test de Marcha 6 Minutos (TM6M)
- **Gráficos de evolución**: Visualización de tendencias en el tiempo
- **Notas clínicas**: Observaciones del profesional tratante

#### 2.1.6 Recursos Educativos
- **Base de conocimiento**: Acceso a material educativo sobre:
  - Rehabilitación pulmonar
  - Ejercicios respiratorios
  - Cuidados y recomendaciones
  - Videos educativos
- **Búsqueda de contenido**: Filtrado por categoría y búsqueda por texto

#### 2.1.7 Notificaciones
- **Centro de notificaciones**: Visualización de alertas del sistema
- **Tipos de notificaciones**:
  - Exámenes revisados
  - Recordatorios de citas
  - Mensajes del equipo médico
- **Marcado de lectura**: Gestión de notificaciones leídas/no leídas

---

### 2.2 ROL: KINESIÓLOGO

#### 2.2.1 Autenticación y Acceso
- **Login al portal interno**: Acceso con credenciales profesionales
- **Cambio de contraseña obligatorio**: Al primer inicio de sesión
- **Control de sesión**: Cierre automático por inactividad

#### 2.2.2 Gestión de Pacientes
- **Crear pacientes**: Registro completo de nuevos pacientes
  - Datos personales
  - Información de contacto
  - Datos de salud (sistema, cota, diagnóstico)
  - Ubicación (región, comuna)
- **Ver pacientes**: Lista completa de pacientes registrados
  - Búsqueda y filtrado
  - Paginación de resultados
  - Ordenamiento por columnas
- **Editar pacientes**: Actualización de información de pacientes
  - Modificación de datos personales
  - Actualización de información médica
  - Cambio de estado (activo/inactivo)
- **Eliminar pacientes**: Eliminación lógica o física de registros
- **Exportar datos**: Generación de reportes Excel con datos de pacientes

#### 2.2.3 Gestión de Citas
- **Agendar citas**: Creación de citas para pacientes
- **Modificar citas**: Cambio de fecha, hora o estado
- **Cancelar citas**: Anulación de citas con registro de motivo
- **Visualizar agenda**: Vista de calendario con todas las citas

#### 2.2.4 Gestión de Exámenes
- **Cargar exámenes**: Subida de exámenes médicos en nombre del paciente
- **Revisar exámenes**: Marcado de exámenes como revisados
- **Acceso completo**: Visualización de todos los exámenes de todos los pacientes
- **Almacenamiento**: Los archivos se guardan en Vercel Blob Storage

#### 2.2.5 Evaluaciones Funcionales
- **Registro de pruebas**: Ingreso de resultados de evaluaciones
  - Espirometría (CVF, VEF1 con valores y porcentajes)
  - DLCO (porcentaje de difusión)
  - Test de Marcha 6 Minutos (distancia, SpO2, frecuencia cardíaca)
- **Historial del paciente**: Visualización de todas las evaluaciones
- **Análisis de evolución**: Gráficos de tendencias y comparativas
- **Notas clínicas**: Registro de observaciones por evaluación

#### 2.2.6 Reportes BI (Business Intelligence)
- **Dashboard de estadísticas**:
  - Total de pacientes activos
  - Citas por estado
  - Distribución por comuna
  - Sistema de salud
- **Gráficos analíticos**:
  - Gráfico de función pulmonar agregada
  - Distribución geográfica de pacientes
  - Tendencias temporales
- **Mapa interactivo**: Visualización geográfica de pacientes por región
- **Exportación de datos**: Generación de reportes personalizados

#### 2.2.7 Base de Conocimiento
- **Acceso a contenidos**: Visualización de material educativo
- **Uso para referencia**: Consulta de protocolos y guías clínicas

---

### 2.3 ROL: RECEPCIONISTA

#### 2.3.1 Autenticación y Acceso
- **Login al portal interno**: Acceso con credenciales administrativas
- **Cambio de contraseña obligatorio**: Al primer inicio de sesión
- **Control de sesión**: Cierre automático por inactividad

#### 2.3.2 Gestión de Pacientes (Limitada)
- **Crear pacientes**: Registro de nuevos pacientes
  - Datos personales completos
  - Información de contacto
  - Sistema de salud y cota
- **Ver pacientes**: Consulta de lista de pacientes
  - Búsqueda básica
  - Visualización de datos
- **Editar pacientes**: Actualización de información básica
  - Datos de contacto
  - Información administrativa
  - **SIN acceso a datos clínicos sensibles**

> [!IMPORTANT]
> El rol de Recepcionista tiene restricciones específicas:
> - **NO puede eliminar pacientes**
> - **NO tiene acceso a reportes BI**
> - **NO puede gestionar evaluaciones funcionales**
> - **NO puede gestionar usuarios del sistema**

#### 2.3.3 Gestión de Citas (Si está habilitado)
- **Agendar citas**: Registro de citas para pacientes
- **Modificar citas**: Cambio de horarios
- **Consultar agenda**: Visualización de calendario

#### 2.3.4 Sistema de Permisos
El recepcionista opera bajo un **sistema de permisos configurables** por el administrador:
- `Crear Pacientes`: Habilitado por defecto
- `Ver Pacientes`: Habilitado por defecto
- `Editar Pacientes`: Habilitado por defecto
- `Eliminar Pacientes`: **Deshabilitado** por defecto
- `Ver Reportes BI`: **Deshabilitado** por defecto

---

### 2.4 ROL: ADMINISTRADOR

#### 2.4.1 Autenticación y Acceso
- **Login con privilegios**: Acceso completo al sistema
- **Seguridad mejorada**: Protección de cuenta de administrador
- **Auditoría de acciones**: Todas las acciones quedan registradas

#### 2.4.2 Gestión de Usuarios del Sistema
- **Crear usuarios internos**:
  - Kinesiólogos
  - Recepcionistas
  - **NO puede crear nuevos administradores** (seguridad)
- **Ver usuarios**: Lista completa de usuarios del sistema
  - Filtrado por rol
  - Estado activo/inactivo
  - Información de creación y última actualización
- **Editar usuarios**:
  - Modificación de datos personales
  - **Cambio de rol** (excepto degradar administradores)
  - Activar/desactivar cuentas
  - **Forzar cambio de contraseña** en el próximo inicio
- **Eliminar usuarios**:
  - Puede eliminar cualquier usuario excepto administradores
  - Los administradores solo pueden auto-eliminarse
- **Auditoría de usuarios**: Registro completo de cambios en usuarios

#### 2.4.3 Gestión de Pacientes (Acceso Completo)
- **Todas las capacidades del Kinesiólogo**
- **Sin restricciones de permisos**
- **Auditoría completa**: Registro de todas las operaciones

#### 2.4.4 Control de Permisos por Rol
- **Configuración de permisos**: Gestión granular de capacidades
  - Definir qué puede hacer cada rol
  - Habilitar/deshabilitar acciones específicas
  - Configuración por rol (Kinesiólogo, Recepcionista)
- **Acciones configurables**:
  - Crear Pacientes
  - Ver Pacientes
  - Editar Pacientes
  - Eliminar Pacientes
  - Ver Reportes BI
- **Inicialización de permisos**: Sistema de permisos predefinidos al crear el sistema
- **Actualización dinámica**: Los cambios aplican inmediatamente

#### 2.4.5 Panel de Auditoría
- **Log del sistema**: Registro completo de actividades
  - Inicios de sesión
  - Creación/modificación/eliminación de usuarios
  - Cambios en permisos
  - Acceso a funciones críticas
- **Información de auditoría**:
  - Usuario que realizó la acción
  - Email del usuario
  - Tipo de acción
  - Detalles específicos
  - Dirección IP de origen
  - Fecha y hora exacta
- **Filtrado y búsqueda**: Análisis de logs históricos
- **Exportación de auditoría**: Generación de reportes de seguridad

#### 2.4.6 Gestión de Contenido Educativo
- **Base de conocimiento médico**:
  - Crear artículos educativos
  - Editar contenido existente
  - Categorización de contenidos
  - Agregar imágenes ilustrativas
  - Eliminar contenido obsoleto
- **Gestión de categorías**: Organización del material educativo

#### 2.4.7 Reportes BI Avanzados
- **Acceso completo a Business Intelligence**
- **Estadísticas del sistema**:
  - Pacientes totales y activos
  - Distribución geográfica
  - Uso del sistema por rol
  - Actividad de usuarios
- **Análisis de datos**: Métricas personalizadas
- **Exportación avanzada**: Reportes ejecutivos

#### 2.4.8 Configuración del Sistema
- **Parámetros generales**: Configuración de opciones del sistema
- **Seguridad**: Políticas de contraseñas y sesiones
- **Mantenimiento**: Respaldo y restauración de datos

> [!CAUTION]
> El rol de Administrador tiene acceso completo al sistema. Por seguridad:
> - Solo debe haber un número limitado de administradores
> - No se pueden crear nuevos administradores desde la interfaz
> - Los administradores solo pueden ser editados por sí mismos
> - Todas las acciones de administrador quedan auditadas

---

## 3. Funcionalidades Transversales

### 3.1 Seguridad y Autenticación
- **NextAuth.js**: Sistema de autenticación robusto
- **Bcrypt**: Encriptación de contraseñas
- **Sesiones**: Manejo de sesiones con JWT
- **Cierre por inactividad**: Protección automática
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **CAPTCHA**: Cloudflare Turnstile en formularios críticos

### 3.2 Recuperación de Contraseña
- **Solicitud de reset**: Formulario de recuperación
- **Tokens temporales**: Enlaces de un solo uso con expiración
- **Email de confirmación**: Envío de instrucciones
- **Cambio seguro**: Validación de token y nueva contraseña

### 3.3 Gestión de Archivos
- **Vercel Blob Storage**: Almacenamiento en la nube
- **Tipos soportados**: PDF, imágenes (JPG, PNG)
- **Validación de archivos**: Verificación de tipo y tamaño
- **URLs firmadas**: Acceso seguro a archivos

### 3.4 Notificaciones
- **Sistema de alertas**: Notificaciones en tiempo real
- **Tipos de eventos**:
  - Examen cargado
  - Examen revisado
  - Recordatorios de citas
- **Centro de notificaciones**: Interfaz unificada
- **Badge de contador**: Indicador de notificaciones no leídas

### 3.5 Exportación de Datos
- **Formato Excel (XLSX)**: Exportación de datos de pacientes
- **Reportes personalizados**: Generación de informes
- **PDF**: Potencial para reportes en PDF (jsPDF incluido)

### 3.6 Búsqueda y Filtrado
- **Búsqueda por texto**: En listas de pacientes
- **Filtros múltiples**: Por región, comuna, sistema de salud
- **Ordenamiento**: Por múltiples columnas
- **Paginación**: Navegación eficiente de grandes volúmenes

### 3.7 Monitoreo y Observabilidad
- **Sentry**: Rastreo de errores y performance
- **Winston**: Sistema de logging estructurado
- **Server logs**: Registro detallado de eventos del servidor

---

## 4. Flujos de Trabajo Principales

### 4.1 Flujo de Registro e Ingreso de Paciente

1. **Recepcionista o Kinesiólogo** crea el paciente en el sistema
2. El sistema genera credenciales de acceso para el paciente
3. Paciente recibe email con instrucciones de acceso
4. Paciente inicia sesión en el portal de pacientes
5. Paciente completa su perfil con información adicional
6. Kinesiólogo agenda primera evaluación
7. Paciente confirma cita desde su portal

### 4.2 Flujo de Evaluación Funcional

1. **Kinesiólogo** realiza evaluación funcional al paciente
2. Registra resultados en el sistema:
   - Espirometría
   - DLCO
   - Test de Marcha 6 Minutos
3. Agrega notas clínicas
4. Sistema genera gráficos de evolución automáticamente
5. **Paciente** puede ver sus resultados en su portal
6. **Kinesiólogo** analiza tendencias para ajustar tratamiento

### 4.3 Flujo de Carga y Revisión de Exámenes

1. **Paciente** sube examen médico desde su portal
2. Sistema almacena archivo en Vercel Blob Storage
3. Sistema genera notificación para el Kinesiólogo
4. **Kinesiólogo** recibe alerta y revisa el examen
5. Marca examen como "Revisado"
6. Sistema notifica al paciente que su examen fue revisado
7. Kinesiólogo puede agregar comentarios o agendar cita

### 4.4 Flujo de Análisis BI

1. **Kinesiólogo o Administrador** accede al módulo de BI
2. Selecciona parámetros de análisis (fechas, regiones, etc.)
3. Sistema genera gráficos y estadísticas en tiempo real
4. Visualiza mapa de distribución geográfica
5. Analiza tendencias de función pulmonar
6. Exporta reporte en Excel para análisis adicional

### 4.5 Flujo de Gestión de Permisos

1. **Administrador** accede al panel de permisos
2. Selecciona rol a configurar (Kinesiólogo, Recepcionista)
3. Modifica permisos específicos (habilitar/deshabilitar)
4. Guarda configuración
5. Los cambios aplican inmediatamente para todos los usuarios del rol
6. Sistema registra cambio en auditoría

---

## 5. Reglas de Negocio

### 5.1 Reglas de Seguridad
- ✓ Las contraseñas deben ser encriptadas con bcrypt
- ✓ Las sesiones expiran después de período de inactividad
- ✓ No se pueden crear administradores desde la interfaz
- ✓ Los administradores solo pueden editarse a sí mismos
- ✓ Todas las acciones críticas quedan auditadas con IP

### 5.2 Reglas de Permisos
- ✓ ADMIN tiene acceso completo sin restricciones
- ✓ KINESIOLOGIST puede gestionar pacientes y acceder a BI
- ✓ RECEPTIONIST tiene permisos configurables limitados
- ✓ Los permisos se evalúan en tiempo real
- ✓ Los cambios de permisos aplican inmediatamente

### 5.3 Reglas de Datos
- ✓ El RUT debe ser único en el sistema
- ✓ El email debe ser único para usuarios y pacientes
- ✓ Los pacientes eliminados pueden ser eliminación lógica o física
- ✓ Los archivos subidos deben ser PDF o imágenes
- ✓ Las fechas de diagnóstico no pueden ser futuras

### 5.4 Reglas de Notificaciones
- ✓ Se genera notificación cuando un paciente sube un examen
- ✓ Se notifica al paciente cuando su examen es revisado
- ✓ Las notificaciones se marcan como leídas manualmente
- ✓ El contador de notificaciones muestra solo las no leídas

### 5.5 Reglas de Evaluaciones
- ✓ Los valores de CVF y VEF1 se registran en litros
- ✓ Los porcentajes son valores enteros
- ✓ SpO2 debe estar entre 0 y 100%
- ✓ La distancia del TM6M se registra en metros
- ✓ Se pueden agregar notas clínicas opcionales

---

## 6. Validaciones y Restricciones

### 6.1 Validaciones de Entrada
- **Email**: Formato válido de correo electrónico
- **RUT**: Formato chileno, único en el sistema
- **Teléfono**: Formato válido (opcional)
- **Contraseña**: Mínimo de caracteres, complejidad
- **Fechas**: Formato válido, restricciones lógicas
- **Archivos**: Tipo MIME válido, tamaño máximo

### 6.2 Restricciones de Usuario
- Los pacientes solo pueden ver sus propios datos
- Los kinesiólogos pueden ver todos los pacientes
- Los recepcionistas tienen vista limitada según permisos
- Los administradores tienen acceso sin restricciones

### 6.3 Restricciones de Operación
- No se puede eliminar un administrador (excepto auto-eliminación)
- No se puede cambiar el rol de un administrador
- No se puede crear un usuario sin email único
- No se puede agendar cita en fecha pasada

---

## 7. Integaciones y APIs

### 7.1 APIs Internas
El sistema expone las siguientes APIs REST:

#### 7.1.1 API de Autenticación
- `POST /api/auth/signin` - Inicio de sesión
- `POST /api/auth/signout` - Cierre de sesión
- `POST /api/auth/reset-password` - Solicitud de recuperación

#### 7.1.2 API de Usuarios (Requiere AUTH + ADMIN)
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `PUT /api/users/[id]` - Actualizar usuario
- `DELETE /api/users/[id]` - Eliminar usuario

#### 7.1.3 API de Pacientes (Requiere AUTH)
- `GET /api/patients` - Listar pacientes (con permisos)
- `POST /api/patients` - Crear paciente
- `PUT /api/patients/[id]` - Actualizar paciente
- `DELETE /api/patients/[id]` - Eliminar paciente

#### 7.1.4 API de Exámenes (Requiere AUTH)
- `GET /api/exams` - Listar exámenes
- `POST /api/exams/upload` - Subir examen
- `PUT /api/exams/[id]/review` - Marcar como revisado

#### 7.1.5 API de Evaluaciones (Requiere AUTH + KINE/ADMIN)
- `GET /api/pulmonary-tests` - Listar evaluaciones
- `POST /api/pulmonary-tests` - Crear evaluación
- `GET /api/pulmonary-tests/[id]` - Obtener detalles

#### 7.1.6 API de BI (Requiere AUTH + permiso)
- `GET /api/bi/stats` - Estadísticas generales
- `GET /api/bi/patients-by-commune` - Distribución geográfica

#### 7.1.7 API de Auditoría (Requiere ADMIN)
- `GET /api/audit-logs` - Obtener logs del sistema

### 7.2 APIs Externas (Potencial)
El sistema está preparado para integraciones futuras:
- **OpenAI**: Para análisis de texto y chatbot (ya incluido en dependencies)
- **Ollama**: Para IA local (ya incluido)
- **Servicios de Email**: Para notificaciones (a implementar)
- **SINCA**: Sistema Nacional de Contaminación Ambiental (incluido en scripts)

---

## 8. Casos de Uso Especiales

### 8.1 Auto-gestión de Pacientes
**Actor**: Paciente  
**Descripción**: El paciente puede gestionar su perfil, citas y exámenes de forma autónoma, reduciendo la carga administrativa del personal.

### 8.2 Reportes BI para Toma de Decisiones
**Actor**: Kinesiólogo, Administrador  
**Descripción**: Los profesionales pueden analizar datos agregados para identificar tendencias, evaluar efectividad del programa y optimizar recursos.

### 8.3 Auditoría de Seguridad
**Actor**: Administrador  
**Descripción**: El administrador puede rastrear todas las acciones críticas en el sistema, identificar accesos no autorizados y generar reportes de seguridad.

### 8.4 Gestión Flexible de Permisos
**Actor**: Administrador  
**Descripción**: El sistema permite adaptar los permisos de roles según las necesidades del centro de salud sin modificar código.

### 8.5 Evolución Clínica del Paciente
**Actor**: Kinesiólogo, Paciente  
**Descripción**: Tanto el profesional como el paciente pueden visualizar la evolución de la función pulmonar en gráficos interactivos, facilitando el seguimiento del tratamiento.

---

## 9. Requisitos No Funcionales

### 9.1 Performance
- ⚡ Tiempo de respuesta < 2 segundos para operaciones normales
- ⚡ Carga de archivos hasta 10MB
- ⚡ Soporte para 100+ usuarios concurrentes

### 9.2 Seguridad
- 🔒 Autenticación con NextAuth.js
- 🔒 Encriptación de contraseñas con bcrypt
- 🔒 Protección CSRF
- 🔒 Rate limiting en endpoints críticos
- 🔒 Validación de entrada en cliente y servidor

### 9.3 Disponibilidad
- 📈 Uptime objetivo: 99.5%
- 📈 Despliegue en Vercel (alta disponibilidad)
- 📈 Base de datos PostgreSQL (Neon/Vercel)
- 📈 Storage redundante (Vercel Blob)

### 9.4 Escalabilidad
- 📊 Arquitectura serverless (Next.js)
- 📊 Base de datos escalable verticalmente
- 📊 CDN global para assets estáticos
- 📊 Optimización de imágenes automática

### 9.5 Usabilidad
- 🎨 Interfaz responsive (mobile, tablet, desktop)
- 🎨 Diseño intuitivo con Tailwind CSS
- 🎨 Componentes accesibles (ARIA)
- 🎨 Mensajes de error claros y accionables

### 9.6 Mantenibilidad
- 🛠 Código TypeScript (type-safe)
- 🛠 Tests unitarios y E2E
- 🛠 Documentación técnica
- 🛠 Sistema de logging estructurado

---

## 10. Resumen de Capacidades por Rol

| Funcionalidad | Paciente | Recepcionista | Kinesiólogo | Administrador |
|--------------|----------|---------------|-------------|---------------|
| Login al sistema | ✅ | ✅ | ✅ | ✅ |
| Cambiar contraseña | ✅ | ✅ | ✅ | ✅ |
| Ver mi perfil | ✅ | ✅ | ✅ | ✅ |
| Editar mi perfil | ✅ | ✅ | ✅ | ✅ |
| Agendar citas | ✅ | 🔧 | ✅ | ✅ |
| Subir exámenes | ✅ | ❌ | ✅ | ✅ |
| Ver mis exámenes | ✅ | ❌ | ❌ | ❌ |
| Ver todos los exámenes | ❌ | ❌ | ✅ | ✅ |
| Revisar exámenes | ❌ | ❌ | ✅ | ✅ |
| Ver mis evaluaciones | ✅ | ❌ | ❌ | ❌ |
| Registrar evaluaciones | ❌ | ❌ | ✅ | ✅ |
| Crear pacientes | ❌ | 🔧 | ✅ | ✅ |
| Ver pacientes | ❌ | 🔧 | ✅ | ✅ |
| Editar pacientes | ❌ | 🔧 | ✅ | ✅ |
| Eliminar pacientes | ❌ | ❌ | ✅ | ✅ |
| Ver reportes BI | ❌ | ❌ | ✅ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ❌ | ✅ |
| Configurar permisos | ❌ | ❌ | ❌ | ✅ |
| Ver auditoría | ❌ | ❌ | ❌ | ✅ |
| Base de conocimiento | ✅ | ✅ | ✅ | ✅ |
| Gestionar contenido | ❌ | ❌ | ❌ | ✅ |
| Notificaciones | ✅ | ✅ | ✅ | ✅ |

**Leyenda**:
- ✅ Permitido
- ❌ No permitido
- 🔧 Configurable por administrador

---

## 11. Conclusiones

El Sistema de Gestión Broncopulmonar es una plataforma completa que permite:

1. **Autonomía del paciente**: Los pacientes pueden gestionar sus citas, exámenes y ver su evolución
2. **Eficiencia operacional**: Los profesionales tienen herramientas para gestión rápida de pacientes
3. **Control administrativo**: Sistema flexible de permisos y auditoría completa
4. **Toma de decisiones basada en datos**: Reportes BI para análisis estratégico
5. **Seguridad robusta**: Autenticación, autorización y auditoría en todos los niveles

El sistema está diseñado para escalar y adaptarse a las necesidades cambiantes del centro de salud, manteniendo la seguridad y la usabilidad como prioridades.

---

**Documento de Especificaciones Funcionales v1.0**  
*Sistema de Gestión Broncopulmonar*  
*Actualizado: 20 de Enero, 2026*
