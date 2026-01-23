-- Script to assign RUTs to legacy users without RUT
-- Run this BEFORE migrating these users to the new FHIR schema

-- Priority: These users need RUTs to be migrated to Persona/UsuarioSistema

-- Admin user
UPDATE "User" 
SET rut = '11111111-1'
WHERE email = 'admin@example.com' AND rut IS NULL;

-- Kinesiologist user
UPDATE "User"
SET rut = '22222222-2'
WHERE email = 'kine@test.com' AND rut IS NULL;

-- Receptionist user
UPDATE "User"
SET rut = '33333333-3'
WHERE email = 'recepcion@example.com' AND rut IS NULL;

-- E2E test kinesiologist
UPDATE "User"
SET rut = '44444444-4'
WHERE email = 'kine_e2e@test.com' AND rut IS NULL;

-- Verify the updates
SELECT id, email, rut, name, role 
FROM "User" 
WHERE email IN ('admin@example.com', 'kine@test.com', 'recepcion@example.com', 'kine_e2e@test.com');
