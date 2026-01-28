# Auditoría Arquitectónica y Alineación FHIR

Este documento detalla el estado actual del sistema desde la perspectiva de arquitectura de software, patrones de diseño y cumplimiento con el estándar de interoperabilidad FHIR.

## 1. Análisis de Patrones de Diseño

El proyecto sigue una arquitectura moderna basada en Next.js (App Router) con una clara separación entre componentes de servidor y cliente.

### Patrones Observados
- **Action-Based Mutation (Command Pattern)**: El uso de Server Actions en `src/actions` centraliza la lógica de negocio y mutaciones, protegiendo el acceso a la base de datos.
- **Service/Adapter Layer (`src/lib/fhir-adapters.ts`)**: Existe una capa de transición muy robusta que orquestra la creación de identidades complejas (`Persona` + `Credencial` + `Ficha`) dentro de transacciones ACID. Esto previene estados inconsistentes en la base de datos.
- **Data Transfer Object (DTO) / Validation**: Implementación robusta de esquemas con Zod en `src/lib/schemas.ts`, lo que asegura la integridad de los datos antes de entrar al dominio.
- **Domain-Driven Data Model**: La separación de `Persona`, `Credencial`, `FichaClinica` y `UsuarioSistema` es excelente. Evita tablas monolíticas y permite que una misma persona sea paciente y funcionario sin duplicar datos demográficos.
- **Auditoría Inmutable con Diffs**: Se observa una implementación avanzada de auditoría en `pulmonary.ts` que no solo registra la acción, sino también el "diff" de los cambios realizados, lo cual es crítico para la trazabilidad clínica.

### Oportunidades de Mejora (Pattern Gaps)
- **Service Layer**: Actualmente, la lógica de negocio reside mayoritariamente en las Server Actions. A medida que el sistema crezca, se recomienda extraer la lógica a una capa de servicios independiente (`src/services`) para facilitar las pruebas unitarias.
- **Repository Pattern**: Para desacoplar el ORM (Prisma) de la lógica de negocio, se podría implementar una capa de repositorios, permitiendo mockear la base de datos más fácilmente en los tests.

---

## 2. Alineación con FHIR (Fast Healthcare Interoperability Resources)

El esquema actual ya contempla campos para interoperabilidad (`fhirId`, `fhirResourceType`), lo cual es un gran avance.

### Mapeo de Recursos
| Entidad Actual | Recurso FHIR | Estado de Alineación |
| :--- | :--- | :--- |
| `Persona` | `Patient` / `Practitioner` | **Alta**: Contiene datos demográficos base y `fhirId`. |
| `UsuarioSistema` | `PractitionerRole` | **Media**: Falta profundidad en especialidades codificadas. |
| `Cita` | `Appointment` | **Alta**: Estructura compatible. |
| `ExamenMedico` | `DiagnosticReport` | **Media**: Requiere vinculación con `Observation`. |
| `PruebaFuncionPulmonar` | `Observation` / `Bundle` | **Muy Alta**: Implementado en `fhir-adapters.ts` usando códigos LOINC (ej: `19868-9` para CVF). |

### GAPs de Interoperabilidad
1. **Sistemas de Identificación (Naming Systems)**: FHIR utiliza URIs para identificar sistemas (ej: RUT). Actualmente usamos strings planos. Se recomienda normalizar a `urn:oid:...`.
2. **Codificación SNOMED CT**: Se recomienda integrar SNOMED CT para diagnósticos y procedimientos para complementar los códigos CIE-10 y LOINC actuales.
3. **Máquina de Estados**: Refinar los estados de `Cita` y `ExamenMedico` para que coincidan con los `ValueSets` requeridos por FHIR (ej: `booked`, `arrived`, `fulfilled`).

---

## 3. Recomendaciones del Arquitecto

1. **Modularización de Lógica**: Mover validaciones complejas de RUT y lógica de negocio fuera de los componentes hacia la capa `lib` o servicios.
2. **Normalización FHIR**: Evolucionar `ExamenMedico` para soportar estados y códigos estandarizados si se planea conectar con sistemas externos como MINSAL o clínicas privadas.
3. **Escalabilidad de Archivos**: La implementación actual con `Blob` para exportaciones es un buen "workaround" para cliente, pero para reportes masivos se debería considerar procesamiento en background.
