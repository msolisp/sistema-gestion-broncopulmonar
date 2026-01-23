# E2E Test Updates Required for FHIR Migration

## Overview
The database schema has been migrated to FHIR-aligned models. E2E tests need updates to reflect the new schema structure.

## Models Changed

| Old Model | New Model(s) | Key Changes |
|-----------|--------------|-------------|
| Patient | Persona + FichaClinica + Credencial | Split into 3 tables |
| User | Persona + UsuarioSistema + Credencial | Split into 3 tables |
| Appointment | Cita | Renamed, uses fichaClinicaId |
| MedicalExam | ExamenMedico | Renamed, uses fichaClinicaId |
| Notification | NotificacionMedica | Renamed, uses fichaClinicaId |
| PulmonaryFunctionTest | PruebaFuncionPulmonar | Renamed, uses fichaClinicaId |

## Required Test Updates

### 1. Patient Creation Tests

**Before**:
```typescript
await prisma.patient.create({
  data: {
    email: 'test@example.com',
    password: hashedPassword,
    name: 'Test Patient',
    rut: '12345678-9',
    commune: 'Santiago'
  }
});
```

**After**:
```typescript
import { createPatient } from '@/lib/fhir-adapters';

await createPatient({
  rut: '12345678-9',
  nombre: 'Test',
  apellidoPaterno: 'Patient',
  email: 'test@example.com',
  password: 'testpassword',
  comuna: 'Santiago',
  creadoPor: 'E2E_TEST'
});
```

### 2. Patient Queries

**Before**:
```typescript
const patient = await prisma.patient.findUnique({
  where: { email: 'test@example.com' }
});
```

**After**:
```typescript
const persona = await prisma.persona.findUnique({
  where: { email: 'test@example.com' },
  include: {
    fichaClinica: true,
    credencial: true
  }
});
```

### 3. Appointment Tests

**Before**:
```typescript
await prisma.appointment.create({
  data: {
    patientId: patient.id,
    date: new Date(),
    status: 'PENDING'
  }
});
```

**After**:
```typescript
await prisma.cita.create({
  data: {
    fichaClinicaId: fichaClinica.id,
    fecha: new Date(),
    estado: 'PENDIENTE'
  }
});
```

### 4. Medical Exam Tests

**Before**:
```typescript
await prisma.medicalExam.create({
  data: {
    patientId: patient.id,
    centerName: 'Centro Test',
    doctorName: 'Dr. Test',
    examDate: new Date(),
    fileUrl: 'https://example.com/file.pdf',
    fileName: 'test.pdf'
  }
});
```

**After**:
```typescript
await prisma.examenMedico.create({
  data: {
    fichaClinicaId: fichaClinica.id,
    nombreCentro: 'Centro Test',
    nombreDoctor: 'Dr. Test',
    fechaExamen: new Date(),
    archivoUrl: 'https://example.com/file.pdf',
    archivoNombre: 'test.pdf'
  }
});
```

### 5. System User Creation

**Before**:
```typescript
await prisma.user.create({
  data: {
    email: 'staff@test.com',
    password: hashedPassword,
    name: 'Staff User',
    role: 'KINESIOLOGIST',
    rut: '98765432-1'
  }
});
```

**After**:
```typescript
import { createStaffUser } from '@/lib/fhir-adapters';

await createStaffUser({
  rut: '98765432-1',
  nombre: 'Staff',
  apellidoPaterno: 'User',
  email: 'staff@test.com',
  password: 'testpassword',
  rol: 'KINESIOLOGO',
  creadoPor: 'E2E_TEST'
});
```

## Field Name Mappings

### Patient/Persona
| Old Field | New Field | Location |
|-----------|-----------|----------|
| name | nombre + apellidoPaterno + apellidoMaterno | Persona |
| password | passwordHash | Credencial |
| gender | sexo (enum) | Persona |
| healthSystem | prevision | FichaClinica |
| diagnosisDate | fechaDiagnostico | FichaClinica |
| birthDate | fechaNacimiento | Persona |
| phone | telefono | Persona |
| address | direccion | Persona |
| active | activo | Persona + FichaClinica |

### Appointment/Cita
| Old Field | New Field |
|-----------|-----------|
| patientId | fichaClinicaId |
| date | fecha |
| status | estado |
| notes | notas |

### MedicalExam/ExamenMedico
| Old Field | New Field |
|-----------|-----------|
| patientId | fichaClinicaId |
| centerName | nombreCentro |
| doctorName | nombreDoctor |
| examDate | fechaExamen |
| fileUrl | archivoUrl |
| fileName | archivoNombre |
| source | origen |
| uploadedByUserId | subidoPor |
| reviewed | revisado |

## Example: Full Test Update

### Before
```typescript
test('patient can upload exam', async ({ page }) => {
  // Create patient
  const patient = await prisma.patient.create({
    data: {
      email: 'test@example.com',
      password: await bcrypt.hash('password', 10),
      name: 'Test Patient',
      rut: '12345678-9',
      commune: 'Santiago'
    }
  });

  // Login
  await page.goto('/portal/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Upload exam
  await page.goto('/portal/upload');
  // ... rest of test

  // Verify exam created
  const exam = await prisma.medicalExam.findFirst({
    where: { patientId: patient.id }
  });
  expect(exam).toBeTruthy();
});
```

### After
```typescript
test('patient can upload exam', async ({ page }) => {
  // Create patient using FHIR adapter
  await createPatient({
    rut: '12345678-9',
    nombre: 'Test',
    apellidoPaterno: 'Patient',
    email: 'test@example.com',
    password: 'password',
    comuna: 'Santiago',
    creadoPor: 'E2E_TEST'
  });

  // Login (auth handles persona lookup)
  await page.goto('/portal/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Upload exam
  await page.goto('/portal/upload');
  // ... rest of test

  // Verify exam created
  const persona = await prisma.persona.findUnique({
    where: { email: 'test@example.com' },
    include: { fichaClinica: true }
  });
  
  const exam = await prisma.examenMedico.findFirst({
    where: { fichaClinicaId: persona!.fichaClinica!.id }
  });
  expect(exam).toBeTruthy();
});
```

## Cleanup After Tests

### Before
```typescript
afterEach(async () => {
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
});
```

### After
```typescript
afterEach(async () => {
  // Clean up in correct order (foreign keys)
  await prisma.examenMedico.deleteMany();
  await prisma.cita.deleteMany();
  await prisma.notificacionMedica.deleteMany();
  await prisma.pruebaFuncionPulmonar.deleteMany();
  await prisma.fichaClinica.deleteMany();
  await prisma.usuarioSistema.deleteMany();
  await prisma.credencial.deleteMany();
  await prisma.persona.deleteMany();
  
  // Optional: clean legacy tables if still using them
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
});
```

## Testing Strategy

1. **Start with smoke tests**: Update basic login/logout tests first
2. **Update data creation**: Use FHIR adapters for test data
3. **Update queries**: Query Persona/FichaClinica instead of Patient
4. **Update assertions**: Check new field names
5. **Run tests incrementally**: Fix one test file at a time

## Common Errors

### "Table/column does not exist"
- Solution: Regenerate Prisma client (`npx prisma generate`)
- Verify migration applied (`npx prisma migrate status`)

### "Foreign key constraint failed"
- Solution: Create Persona before FichaClinica
- Use `createPatient` adapter which handles this

### "Cannot find property"
- Solution: Check field name mappings above
- Update to Spanish field names (nombre vs name)

## Files Requiring Updates

Based on your E2E test directory, these files likely need updates:

- `e2e/kine-patient-edit.spec.ts` - Patient editing tests
- `e2e/audit-logs.spec.ts` - Audit log tests  
- `e2e/patient-search.spec.ts` - Patient search tests
- Any other tests creating/querying Patient or User models

## Helper: Quick Search & Replace

Run these searches in your E2E test files:

```bash
# Find Patient model references
grep -r "prisma.patient" e2e/

# Find User model references  
grep -r "prisma.user" e2e/

# Find old field names
grep -r "patientId" e2e/
grep -r "\.name" e2e/
```

Then update based on the mappings above.
