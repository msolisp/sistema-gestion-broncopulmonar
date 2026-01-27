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
    console.log('🚀 Deploying Rol and PermisoRol tables...');
    try {
        await prisma.$connect();

        // 1. Create Rol Table
        console.log('  -> Creating Rol table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "rol" (
                "id" TEXT NOT NULL,
                "nombre" TEXT NOT NULL,
                "descripcion" TEXT,
                "activo" BOOLEAN NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            
                CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
            );
        `);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Rol_nombre_key" ON "rol"("nombre");`);

        // 2. Create PermisoRol Table
        console.log('  -> Creating PermisoRol table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "permiso_rol" (
                "id" TEXT NOT NULL,
                "rolId" TEXT NOT NULL,
                "recurso" TEXT NOT NULL,
                "accion" TEXT NOT NULL,
                "activo" BOOLEAN NOT NULL DEFAULT true,
                "rol" TEXT, -- Removing this if using FK, but schema might implies relation
                
                CONSTRAINT "PermisoRol_pkey" PRIMARY KEY ("id")
            );
        `);
        // Add FK for PermisoRol
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "permiso_rol" 
            DROP CONSTRAINT IF EXISTS "permiso_rol_rolId_fkey";
        `);
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "permiso_rol" 
            ADD CONSTRAINT "permiso_rol_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "PermisoRol_rolId_recurso_accion_key" ON "permiso_rol"("rolId", "recurso", "accion");`);

        // 3. Alter UsuarioSistema to use rolId instead of rol (Enum)
        console.log('  -> Altering usuario_sistema to use rolId FK...');

        // Check if `rolId` column exists
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "usuario_sistema" ADD COLUMN "rolId" TEXT;`);
        } catch (e) {
            console.log('     (rolId column might already exist)');
        }

        // Add FK
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "usuario_sistema" 
            DROP CONSTRAINT IF EXISTS "usuario_sistema_rolId_fkey";
        `);
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "usuario_sistema" 
            ADD CONSTRAINT "usuario_sistema_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        `);

        // Drop the old Enum column 'rol' if it exists
        // Be careful if data exists. Since we just reset, it's presumably empty or we don't care about 'rol' enum data for now.
        // seed-staff.ts fills 'rolId'.
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "usuario_sistema" DROP COLUMN "rol";`);
        } catch (e) {
            console.log('     (rol column might not exist or already dropped)');
        }

        // Create index
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "usuario_sistema_rolId_idx" ON "usuario_sistema"("rolId");`);

        console.log('✅ Schema fixed successfully.');

    } catch (e: any) {
        console.error('❌ Fix failed:', e.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
