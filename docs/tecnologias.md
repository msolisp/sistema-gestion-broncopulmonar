# Tecnologías Utilizadas - Sistema de Gestión Broncopulmonar

> **Versión**: 1.0  
> **Fecha**: 20 de Enero, 2026  
> **Proyecto**: Sistema de Gestión de Rehabilitación Broncopulmonar

---

## 1. Resumen Ejecutivo

El Sistema de Gestión Broncopulmonar está construido con tecnologías modernas, escalables y de código abierto, utilizando un stack **TypeScript full-stack** para garantizar type-safety, productividad y mantenibilidad a largo plazo.

### Stack Principal

```
Frontend:  Next.js 16 + React 19 + TypeScript + Tailwind CSS
Backend:   Next.js API Routes + Server Actions
Database:  PostgreSQL + Prisma ORM
Auth:      NextAuth.js v5
Storage:   Vercel Blob Storage
Deploy:    Vercel Platform
```

---

## 2. Frontend

### 2.1 Framework Principal

#### **Next.js 16.1.1**
- **Tipo**: React Framework con SSR/SSG
- **Versión**: 16.1.1
- **Características utilizadas**:
  - ✅ App Router (nueva arquitectura desde Next.js 13+)
  - ✅ React Server Components
  - ✅ Server Actions para mutaciones
  - ✅ Streaming y Suspense
  - ✅ Optimización automática de imágenes
  - ✅ Optimización de fuentes
  - ✅ Middleware para autenticación
  - ✅ Route Handlers (API Routes)

**Por qué Next.js**:
- Renderizado del lado del servidor para mejor SEO
- Performance optimizado con code-splitting automático
- Arquitectura serverless lista para escalar
- Excelente experiencia de desarrollo

#### **React 19.2.3**
- **Tipo**: Librería UI
- **Versión**: 19.2.3 (última versión estable)
- **Características utilizadas**:
  - ✅ Server Components
  - ✅ Client Components con `'use client'`
  - ✅ Hooks (useState, useEffect, useCallback, etc.)
  - ✅ Context API para estado global
  - ✅ Suspense para lazy loading
  - ✅ Error Boundaries

**Por qué React 19**:
- Server Components mejoran dramáticamente el performance
- Ecosistema maduro con amplia comunidad
- Componentes reutilizables y composables

### 2.2 Lenguaje

#### **TypeScript 5**
- **Tipo**: Superset de JavaScript con tipos estáticos
- **Versión**: 5.x (última)
- **Configuración**: Strict mode habilitado

**Beneficios**:
- 🔒 Type-safety en todo el código
- 🚀 Mejor autocompletado en IDE
- 🐛 Detección de errores en tiempo de desarrollo
- 📚 Documentación implícita mediante tipos
- ♻️ Refactoring más seguro

**Configuración TypeScript** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 2.3 Estilos

#### **Tailwind CSS 4**
- **Tipo**: Utility-first CSS framework
- **Versión**: 4.x (última generación)
- **Plugin**: @tailwindcss/postcss

**Ventajas**:
- 🎨 Desarrollo rápido de UI
- 📦 Purge automático de CSS no utilizado
- 🔧 Customización total vía configuración
- 📱 Responsive design simplificado
- ⚡ Performance optimizado

**Ejemplo de uso**:
```tsx
<button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
  Guardar Paciente
</button>
```

#### **PostCSS**
- Procesador de CSS para transformaciones
- Integrado con Tailwind CSS

### 2.4 Bibliotecas UI

#### **shadcn/ui**
- **Tipo**: Colección de componentes React reutilizables
- **Base**: Radix UI + Tailwind CSS
- **Componentes utilizados**:
  - Button, Input, Select, Textarea
  - Card, Dialog, Sheet
  - Table, Tabs
  - Toast (notificaciones)
  - Dropdown Menu

**Por qué shadcn/ui**:
- 📂 Componentes copiados al proyecto (no dependencia)
- 🎨 Completamente customizables
- ♿ Accesibles (ARIA compliant)
- 🎭 Headless components de Radix UI

#### **Radix UI**
- **Tipo**: Primitivas UI sin estilos
- **Paquete**: `@radix-ui/react-slot`
- **Uso**: Base para componentes interactivos accesibles

#### **class-variance-authority (CVA)**
- **Versión**: 0.7.1
- **Uso**: Gestión de variantes de componentes
- **Ejemplo**:
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-white",
        outline: "border border-input bg-background"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8"
      }
    }
  }
);
```

#### **clsx + tailwind-merge**
- **clsx**: Utilidad para construcción condicional de classNames
- **tailwind-merge**: Fusión inteligente de clases Tailwind

### 2.5 Gráficos y Visualización

#### **Recharts 3.6.0**
- **Tipo**: Librería de gráficos para React
- **Uso**: Gráficos de función pulmonar, evolución de pacientes
- **Tipos de gráficos**:
  - LineChart (evolución temporal)
  - BarChart (comparativas)
  - PieChart (distribuciones)

**Ejemplo**:
```tsx
<LineChart data={pulmonaryData}>
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="cvf" stroke="#8884d8" />
  <Line type="monotone" dataKey="vef1" stroke="#82ca9d" />
</LineChart>
```

#### **Leaflet 1.9.4 + React Leaflet 5.0.0**
- **Tipo**: Librería de mapas interactivos
- **Uso**: Mapa de distribución geográfica de pacientes
- **Características**:
  - Mapas interactivos
  - Marcadores personalizados
  - Clusters de pacientes por región
  - Overlays y capas

**Integración**:
```tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

<MapContainer center={[-33.4489, -70.6693]} zoom={10}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  {patients.map(p => (
    <Marker position={[p.lat, p.lng]}>
      <Popup>{p.name}</Popup>
    </Marker>
  ))}
</MapContainer>
```

### 2.6 Iconos

#### **Lucide React 0.562.0**
- **Tipo**: Librería de iconos SVG para React
- **Cantidad**: 1000+ iconos
- **Ventajas**:
  - Tree-shakeable (solo importa los que usas)
  - Consistencia visual
  - Optimizados para performance

**Ejemplo**:
```tsx
import { User, FileText, Activity, Settings } from 'lucide-react';

<User className="h-5 w-5" />
<FileText className="h-4 w-4 text-gray-600" />
```

### 2.7 Otras Bibliotecas Frontend

#### **date-fns 4.1.0**
- **Uso**: Manipulación y formateo de fechas
- **Ventajas**: Modular, lightweight, i18n

#### **react-markdown 10.1.0**
- **Uso**: Renderizado de contenido educativo en Markdown
- **Características**: Soporta componentes custom

#### **react-turnstile 1.1.4**
- **Uso**: Cloudflare Turnstile CAPTCHA
- **Aplicación**: Protección en login y formularios sensibles

---

## 3. Backend

### 3.1 Runtime y Framework

#### **Node.js 20**
- **Versión**: 20.19.27 (LTS)
- **Runtime**: JavaScript/TypeScript server-side
- **Características**:
  - Performance optimizado
  - Soporte nativo para ES Modules
  - Compatibilidad con paquetes modernos

#### **Next.js API Routes**
- **Tipo**: API REST integrada en Next.js
- **Ubicación**: `src/app/api/*`
- **Características**:
  - Serverless functions automáticas
  - Integración con middleware
  - Type-safe con TypeScript

**Ejemplo**:
```typescript
// app/api/patients/route.ts
export async function GET(request: Request) {
  const session = await auth();
  if (!session) return new Response('Unauthorized', { status: 401 });
  
  const patients = await prisma.patient.findMany();
  return Response.json(patients);
}
```

#### **Server Actions**
- **Tipo**: Mutaciones server-side en Next.js
- **Marcador**: `'use server'`
- **Ventajas**:
  - No necesita API route explícita
  - Type-safe end-to-end
  - Integración directa con formularios

### 3.2 Autenticación

#### **NextAuth.js v5 (beta.30)**
- **Tipo**: Solución de autenticación para Next.js
- **Versión**: 5.0.0-beta.30
- **Provider**: Credentials (email + password)
- **Session**: JWT en cookie httpOnly

**Configuración** (`lib/auth.ts`):
```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        
        if (!user) return null;
        
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        
        if (!isValid) return null;
        
        return { id: user.id, email: user.email, role: user.role };
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: '/login',
  }
});
```

**Características**:
- 🔐 JWT sessions
- 🔄 Refresh token rotation
- 🚪 Custom sign-in pages
- 🔗 Callbacks para personalización
- 📱 Multi-provider ready

#### **bcryptjs 3.0.3**
- **Uso**: Hashing de contraseñas
- **Algoritmo**: bcrypt con salt
- **Rounds**: Configurable (default 10)

**Ejemplo**:
```typescript
import bcrypt from 'bcryptjs';

// Hash password
const hashed = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### 3.3 Validación

#### **Zod 4.2.1**
- **Tipo**: Schema validation con TypeScript
- **Uso**: Validación de entrada en server actions y API

**Ejemplo**:
```typescript
import { z } from 'zod';

const patientSchema = z.object({
  email: z.string().email('Email inválido'),
  rut: z.string().regex(/^\d{7,8}-[\dkK]$/, 'RUT inválido'),
  name: z.string().min(1, 'Nombre requerido'),
  phone: z.string().optional(),
  commune: z.string().min(1, 'Comuna requerida'),
  healthSystem: z.enum(['FONASA', 'ISAPRE']).optional(),
});

// Uso
const validated = patientSchema.parse(formData);
```

**Ventajas**:
- 🎯 Inferencia de tipos automática
- ✅ Mensajes de error personalizados
- 🔄 Composición de schemas
- 🌐 Soporta transformaciones

### 3.4 Seguridad

#### **rate-limiter-flexible 9.0.1**
- **Uso**: Protección contra fuerza bruta
- **Estrategias**:
  - Rate limiting por IP
  - Límites por usuario
  - Backoff exponencial

**Ejemplo**:
```typescript
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 5, // Número de intentos
  duration: 60, // Por segundo
});

await rateLimiter.consume(ipAddress);
```

---

## 4. Base de Datos

### 4.1 Sistema de Base de Datos

#### **PostgreSQL**
- **Versión**: Compatible con PostgreSQL 13+
- **Provider**: Neon / Vercel Postgres
- **Características utilizadas**:
  - ✅ Transacciones ACID
  - ✅ Índices para performance
  - ✅ Foreign Keys para integridad
  - ✅ Constraints de unicidad
  - ✅ Tipos de datos avanzados

**Conexión**:
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
DIRECT_URL="postgresql://user:password@host:5432/database"
```

### 4.2 ORM

#### **Prisma 5.22.0**
- **Tipo**: Next-generation ORM
- **Versión**: 5.22.0
- **Componentes**:
  - **Prisma Client**: Cliente generado type-safe
  - **Prisma Migrate**: Sistema de migraciones
  - **Prisma Studio**: GUI para explorar datos

**Schema** (`prisma/schema.prisma`):
```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      String   @default("KINESIOLOGIST")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Ventajas**:
- 🔒 Type-safety completo
- 🚀 Auto-completion en IDE
- 📊 Introspección de schema
- 🔄 Migraciones versionadas
- 🎯 Queries optimizadas

**Uso**:
```typescript
import { prisma } from '@/lib/prisma';

// Query type-safe
const patients = await prisma.patient.findMany({
  where: { active: true },
  include: {
    appointments: true,
    pulmonaryTests: {
      orderBy: { date: 'desc' },
      take: 5
    }
  }
});
```

### 4.3 Migraciones

#### **Prisma Migrate**
- Migraciones automáticas basadas en schema
- Versionado en `prisma/migrations/`
- Aplicadas automáticamente en deploy

**Comandos**:
```bash
# Crear migración en desarrollo
npx prisma migrate dev --name add_region_field

# Aplicar en producción
npx prisma migrate deploy

# Generar cliente
npx prisma generate
```

### 4.4 Seeding

#### **Seed Script** (`prisma/seed.ts`)
- **Lenguaje**: TypeScript con ts-node
- **Uso**: Datos iniciales de desarrollo
- **Ejecución**: `npm run seed`

**Ejemplo**:
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Crear admin por defecto
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      name: 'Administrador',
      role: 'ADMIN',
    }
  });
}

main();
```

---

## 5. Storage y Archivos

### 5.1 Almacenamiento de Archivos

#### **Vercel Blob Storage**
- **Tipo**: Object storage serverless
- **Paquete**: `@vercel/blob` 2.0.0
- **Uso**: Almacenamiento de exámenes médicos (PDFs, imágenes)

**Características**:
- ☁️ Escalable automáticamente
- 🔐 URLs firmadas con expiración
- 📦 CDN global integrado
- ⚡ Upload/download rápido

**Ejemplo**:
```typescript
import { put } from '@vercel/blob';

const blob = await put('exams/patient-123.pdf', file, {
  access: 'public',
  addRandomSuffix: true,
});

console.log(blob.url); // https://...vercel-storage.com/...
```

#### **Sharp 0.34.5**
- **Tipo**: Procesamiento de imágenes
- **Uso**: Optimización de imágenes subidas
- **Características**:
  - Resize de imágenes
  - Compresión
  - Conversión de formatos

### 5.2 Validación de Archivos

#### **file-type 21.3.0**
- **Uso**: Detección de tipo MIME real
- **Seguridad**: Previene upload de archivos maliciosos

**Ejemplo**:
```typescript
import { fileTypeFromBuffer } from 'file-type';

const type = await fileTypeFromBuffer(buffer);
if (!['application/pdf', 'image/jpeg'].includes(type.mime)) {
  throw new Error('Tipo de archivo no permitido');
}
```

---

## 6. Utilidades y Herramientas

### 6.1 Exportación de Datos

#### **XLSX 0.18.5**
- **Uso**: Generación de reportes Excel
- **Funcionalidad**: Exportar datos de pacientes, evaluaciones

**Ejemplo**:
```typescript
import * as XLSX from 'xlsx';

const ws = XLSX.utils.json_to_sheet(patients);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Pacientes');
const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
```

#### **jsPDF 4.0.0**
- **Uso**: Generación de PDFs (potencial)
- **Estado**: Incluido pero no implementado aún

### 6.2 Logging

#### **Winston 3.19.0**
- **Tipo**: Logger estructurado para Node.js
- **Niveles**: error, warn, info, debug
- **Transports**: Console, File

**Configuración**:
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'server.log' }),
  ],
});
```

### 6.3 IA y Machine Learning

#### **OpenAI 6.15.0**
- **Estado**: Incluido en dependencies
- **Uso potencial**: Chatbot médico, análisis de texto
- **No implementado**: Preparado para features futuras

#### **Ollama 0.6.3**
- **Tipo**: Cliente para modelos de IA locales
- **Estado**: Incluido, no implementado
- **Uso potencial**: IA on-premise para privacidad

### 6.4 Variables de Entorno

#### **dotenv 17.2.3**
- **Uso**: Carga de variables de entorno desde `.env`
- **Archivos**:
  - `.env.local` (desarrollo)
  - `.env.production.local` (producción)

---

## 7. Testing

### 7.1 Testing Unitario

#### **Jest 30.2.0**
- **Tipo**: Framework de testing
- **Versión**: 30.2.0
- **Configuración**: `jest.config.ts`

**Características**:
- 🧪 Test runner rápido
- 📸 Snapshot testing
- 🔍 Coverage reports
- 🎭 Mocking avanzado

#### **Testing Library**
- **@testing-library/react** 16.3.1
- **@testing-library/jest-dom** 6.9.1
- **@testing-library/dom** 10.4.1

**Filosofía**: Testing basado en comportamiento del usuario

**Ejemplo**:
```typescript
import { render, screen } from '@testing-library/react';
import { PatientsTable } from './PatientsTable';

test('renders patient list', () => {
  render(<PatientsTable patients={mockPatients} />);
  expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
});
```

#### **jest-environment-jsdom 30.2.0**
- **Uso**: Simula DOM para testing de componentes React

#### **cross-fetch 4.1.0**
- **Uso**: Polyfill de fetch para tests

### 7.2 Testing E2E

#### **Playwright 1.57.0**
- **Tipo**: Framework de testing end-to-end
- **Navegadores**: Chromium, Firefox, WebKit
- **Características**:
  - 🎭 Testing multi-browser
  - 📸 Screenshots automáticos
  - 🎥 Video recording
  - 🐛 Debugging visual

**Configuración** (`playwright.config.ts`):
```typescript
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

**Ejemplo de test**:
```typescript
test('login as admin', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/intranet');
});
```

### 7.3 Utilidades de Testing

#### **ts-node 10.9.2**
- **Uso**: Ejecutar TypeScript directamente en tests y scripts

---

## 8. Monitoreo y Observabilidad

### 8.1 Error Tracking

#### **Sentry 10.33.0**
- **Paquete**: @sentry/nextjs
- **Uso**: Rastreo de errores en cliente y servidor
- **Características**:
  - 🐛 Error tracking automático
  - 📊 Performance monitoring
  - 🔍 Source maps support
  - 📈 Release tracking

**Configuración**:
```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

**Integración automática**:
- Error boundaries en React
- Captura de excepciones no manejadas
- Tracking de performance
- Logs de servidor

---

## 9. DevOps y Deployment

### 9.1 Plataforma de Deployment

#### **Vercel Platform**
- **Tipo**: Plataforma serverless para Next.js
- **Características**:
  - ⚡ Deployment instantáneo desde Git
  - 🌍 CDN global (Edge Network)
  - 🔄 Preview deployments automáticos
  - 📊 Analytics integrado
  - 🔐 HTTPS automático

**Flujo**:
1. Push a GitHub
2. Vercel detecta cambios
3. Build automático
4. Deploy a edge network
5. URL generada

### 9.2 CI/CD

#### **GitHub Actions** (potencial)
- Integración con Vercel automática
- Tests automáticos en PRs
- Linting pre-commit

### 9.3 Contenerización (Desarrollo)

#### **Docker**
- **Archivo**: `docker-compose.yml`
- **Uso**: PostgreSQL local para desarrollo

**Ejemplo**:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: broncopulmonar
    ports:
      - "5432:5432"
```

---

## 10. Linting y Formateo

### 10.1 Linter

#### **ESLint 9**
- **Configuración**: `eslint.config.mjs`
- **Preset**: `eslint-config-next`
- **Reglas**: Strict mode para TypeScript

**Características**:
- 🔍 Detección de errores comunes
- 📏 Estándares de código consistentes
- 🔧 Auto-fix para problemas simples

### 10.2 Configuración Next.js

#### **eslint-config-next 16.1.1**
- Reglas específicas para Next.js
- Validación de React hooks
- Optimizaciones de Next.js

**Comandos**:
```bash
npm run lint        # Ejecutar linter
```

---

## 11. Scripts y Automatización

### 11.1 Scripts de Utilidad

El proyecto incluye múltiples scripts en la carpeta `scripts/`:

| Script | Descripción |
|--------|-------------|
| `backup-db.ts` | Backup de base de datos |
| `restore-db.ts` | Restauración desde backup |
| `seed-exams.ts` | Seed de exámenes de prueba |
| `resolve-failed-migrations.js` | Resolver migraciones fallidas |

### 11.2 Comandos NPM

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "node scripts/resolve-failed-migrations.js && npx prisma generate && npx prisma migrate deploy && next build",
    "start": "next start",
    "lint": "eslint",
    "test": "jest",
    "test:watch": "jest --watch",
    "backup:db": "ts-node scripts/backup-db.ts",
    "restore:db": "ts-node scripts/restore-db.ts"
  }
}
```

---

## 12. Dependencias del Proyecto

### 12.1 Dependencias de Producción

```json
{
  "@prisma/client": "^5.22.0",
  "@radix-ui/react-slot": "^1.2.4",
  "@sentry/nextjs": "^10.33.0",
  "@vercel/blob": "^2.0.0",
  "bcryptjs": "^3.0.3",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "date-fns": "^4.1.0",
  "jspdf": "^4.0.0",
  "leaflet": "^1.9.4",
  "lucide-react": "^0.562.0",
  "next": "16.1.1",
  "next-auth": "^5.0.0-beta.30",
  "ollama": "^0.6.3",
  "openai": "^6.15.0",
  "prisma": "^5.22.0",
  "rate-limiter-flexible": "^9.0.1",
  "react": "19.2.3",
  "react-dom": "19.2.3",
  "react-leaflet": "^5.0.0",
  "react-markdown": "^10.1.0",
  "react-turnstile": "^1.1.4",
  "recharts": "^3.6.0",
  "sharp": "^0.34.5",
  "tailwind-merge": "^3.4.0",
  "winston": "^3.19.0",
  "xlsx": "^0.18.5",
  "zod": "^4.2.1"
}
```

### 12.2 Dependencias de Desarrollo

```json
{
  "@playwright/test": "^1.57.0",
  "@tailwindcss/postcss": "^4",
  "@testing-library/dom": "^10.4.1",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/react": "^16.3.1",
  "@types/bcryptjs": "^2.4.6",
  "@types/jest": "^30.0.0",
  "@types/leaflet": "^1.9.21",
  "@types/node": "^20.19.27",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "cross-fetch": "^4.1.0",
  "eslint": "^9",
  "eslint-config-next": "16.1.1",
  "jest": "^30.2.0",
  "jest-environment-jsdom": "^30.2.0",
  "tailwindcss": "^4",
  "ts-node": "^10.9.2",
  "typescript": "^5"
}
```

---

## 13. Diagrama de Stack Tecnológico

```mermaid
graph TB
    subgraph "Cliente"
        React[React 19.2.3]
        Next[Next.js 16.1.1]
        TS[TypeScript 5]
        TW[Tailwind CSS 4]
    end
    
    subgraph "UI Components"
        Shadcn[shadcn/ui]
        Radix[Radix UI]
        Lucide[Lucide Icons]
        Recharts[Recharts]
        Leaflet[Leaflet Maps]
    end
    
    subgraph "Backend"
        API[API Routes]
        SA[Server Actions]
        Auth[NextAuth.js 5]
        Zod[Zod Validation]
    end
    
    subgraph "Data Layer"
        Prisma[Prisma ORM 5.22]
        PG[(PostgreSQL)]
    end
    
    subgraph "Storage"
        Blob[Vercel Blob]
        Sharp[Sharp Image Processing]
    end
    
    subgraph "Monitoring"
        Sentry[Sentry]
        Winston[Winston Logger]
    end
    
    subgraph "Testing"
        Jest[Jest + Testing Library]
        Playwright[Playwright E2E]
    end
    
    subgraph "Deploy"
        Vercel[Vercel Platform]
        Edge[Edge Network]
    end
    
    React --> Next
    Next --> TS
    Next --> TW
    Next --> Shadcn
    Shadcn --> Radix
    Next --> Lucide
    Next --> Recharts
    Next --> Leaflet
    
    Next --> API
    Next --> SA
    API --> Auth
    SA --> Auth
    SA --> Zod
    
    SA --> Prisma
    Prisma --> PG
    
    SA --> Blob
    Blob --> Sharp
    
    Next --> Sentry
    API --> Winston
    
    Next --> Jest
    Next --> Playwright
    
    Next --> Vercel
    Vercel --> Edge
```

---

## 14. Comparación de Alternativas

### 14.1 ¿Por qué estas tecnologías?

| Tecnología | Alternativas Consideradas | Razón de Elección |
|-----------|---------------------------|-------------------|
| **Next.js** | Remix, Astro, SvelteKit | Ecosistema maduro, Vercel integration, App Router |
| **PostgreSQL** | MySQL, MongoDB | ACID, relaciones complejas, Prisma support |
| **Prisma** | TypeORM, Drizzle | Type-safety, DX, migraciones automáticas |
| **Tailwind** | Bootstrap, Material-UI | Customización, performance, DX |
| **NextAuth** | Auth0, Clerk, Lucia | Open-source, flexible, integración Next.js |
| **Vercel Blob** | AWS S3, Cloudinary | Integración perfecta, setup simple |
| **Recharts** | Chart.js, D3.js | React-first, fácil uso, responsive |
| **Sentry** | LogRocket, Datadog | Gratuito tier, excelente DX |

---

## 15. Roadmap Tecnológico

### 15.1 Mejoras Futuras

**Corto Plazo** (próximos 3 meses):
- [ ] Implementar Redis para caching
- [ ] Agregar WebSockets para notificaciones real-time
- [ ] Mejorar performance con ISR (Incremental Static Regeneration)

**Mediano Plazo** (6 meses):
- [ ] Integración con OpenAI para chatbot médico
- [ ] PWA (Progressive Web App) para offline support
- [ ] GraphQL API para queries más flexibles

**Largo Plazo** (1 año):
- [ ] Microservicios para módulos específicos
- [ ] Kubernetes deployment para más control
- [ ] Machine Learning para predicciones de salud

---

## 16. Conclusiones

### 16.1 Fortalezas del Stack

✅ **Type-Safety**: TypeScript + Prisma garantizan code quality  
✅ **Performance**: SSR + Edge Network + Optimizaciones automáticas  
✅ **DX (Developer Experience)**: Hot reload, auto-completion, debugging  
✅ **Escalabilidad**: Serverless architecture lista para crecer  
✅ **Seguridad**: Múltiples capas de protección  
✅ **Mantenibilidad**: Código limpio, tests, documentación  

### 16.2 Ecosistema Moderno

El stack utilizado representa el **estado del arte en desarrollo web 2026**:
- React 19 con Server Components
- Next.js 16 App Router
- TypeScript strict mode
- Serverless deployment
- Edge computing

### 16.3 Preparado para el Futuro

El sistema está construido con tecnologías que:
- Tienen comunidades activas y vibrantes
- Reciben actualizaciones frecuentes
- Son adoptadas por empresas líderes
- Tienen roadmaps claros de evolución

---

## 17. Recursos y Referencias

### Documentación Oficial
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://authjs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Herramientas de Desarrollo
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Prisma Studio](https://www.prisma.io/studio)
- [Sentry Dashboard](https://sentry.io)

---

**Documento de Tecnologías Utilizadas v1.0**  
*Sistema de Gestión Broncopulmonar*  
*Actualizado: 20 de Enero, 2026*
