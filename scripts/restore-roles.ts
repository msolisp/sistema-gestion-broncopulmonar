import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load production env vars
const envPath = path.join(process.cwd(), '.env.production.local');
if (fs.existsSync(envPath)) {
    console.log('Loading .env.production.local');
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.POSTGRES_URL || process.env.DATABASE_URL
        }
    }
});

async function main() {
    console.log('🚀 Restoring Rol and PermisoRol tables...');
    try {
        await prisma.$connect();

        // 0. Drop existing faulty tables
        console.log('  -> Dropping potentially faulty tables...');
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "permiso_rol";`);
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "rol" CASCADE;`);

        // 1. Create Rol Table
        console.log('  -> Creating Rol table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE "rol" (
                "id" TEXT NOT NULL,
                "nombre" TEXT NOT NULL,
                "descripcion" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "activo" BOOLEAN NOT NULL DEFAULT true,
                CONSTRAINT "rol_pkey" PRIMARY KEY ("id")
            );
        `);
        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX "rol_nombre_key" ON "rol"("nombre");
        `);

        // 2. Create PermisoRol Table (Relation)
        console.log('  -> Creating PermisoRol table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE "permiso_rol" (
                "id" TEXT NOT NULL,
                "rolId" TEXT NOT NULL,
                "recurso" TEXT NOT NULL,
                "accion" TEXT NOT NULL,
                "activo" BOOLEAN NOT NULL DEFAULT true,
                CONSTRAINT "permiso_rol_pkey" PRIMARY KEY ("id")
            );
        `);
        // Foreign key
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "permiso_rol" ADD CONSTRAINT "permiso_rol_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);
        // Unique index
        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX "permiso_rol_rolId_recurso_accion_key" ON "permiso_rol"("rolId", "recurso", "accion");
        `);
        console.log('     ✅ PermisoRol table created.');

        // 3. Seed Roles
        console.log('  -> Seeding Roles...');
        const roles = [
            { id: 'admin-role', nombre: 'ADMIN', descripcion: 'Administrador del sistema' },
            { id: 'pathologist-role', nombre: 'PATHOLOGIST', descripcion: 'Patólogo' },
            { id: 'technician-role', nombre: 'TECHNICIAN', descripcion: 'Técnico' },
            { id: 'secretary-role', nombre: 'SECRETARY', descripcion: 'Secretaria' },
            { id: 'patient-role', nombre: 'PACIENTE', descripcion: 'Paciente' }
        ];

        for (const role of roles) {
            const existing = await prisma.rol.findUnique({ where: { nombre: role.nombre } });
            if (!existing) {
                await prisma.rol.create({ data: role });
                console.log(`     + Created role: ${role.nombre}`);
            } else {
                console.log(`     . Role ${role.nombre} already exists.`);
            }
        }

    } catch (e: any) {
        console.error('❌ Failed to restore tables:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
