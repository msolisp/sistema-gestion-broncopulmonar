
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
    console.log('🧪 Reproducing User Creation...');

    const TEST_USER = {
        name: 'Kine User',
        email: 'kine@neumovital.cl',
        rut: '19.623.014-9',
        roleId: 'kinesiologo-role',
        password: 'Password123!',
        region: 'Metropolitana de Santiago',
        comuna: 'PROVIDENCIA'
    };

    try {
        await prisma.$connect();

        // Check if role exists
        const role = await prisma.rol.findUnique({ where: { id: TEST_USER.roleId } });
        if (!role) {
            console.error('❌ Role not found:', TEST_USER.roleId);
            // Try to find by name
            const roleByName = await prisma.rol.findUnique({ where: { nombre: 'KINESIOLOGO' } });
            if (roleByName) console.log('Found role by name:', roleByName.id);
            else console.log('Role KINESIOLOGO not found by name either.');
            return;
        }

        console.log('Found role:', role.nombre);

        // Simulate createStaffUser logic (simplified)
        console.log('Attempting transaction...');
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Persona
            const persona = await tx.persona.create({
                data: {
                    nombre: TEST_USER.name,
                    apellidoPaterno: 'TEST',
                    rut: TEST_USER.rut,
                    email: TEST_USER.email,
                    creadoPor: 'SCRIPT',
                    region: TEST_USER.region,
                    comuna: TEST_USER.comuna
                }
            });
            console.log('Created Persona:', persona.id);

            // 2. Create Credential
            await tx.credencial.create({
                data: {
                    personaId: persona.id,
                    passwordHash: 'hashed_password', // Dummy
                    tipoAcceso: 'STAFF',
                }
            });
            console.log('Created Credential');

            // 3. Create UsuarioSistema
            const usuario = await tx.usuarioSistema.create({
                data: {
                    personaId: persona.id,
                    rolId: role.id,
                    creadoPor: 'SCRIPT',
                    registroProfesional: null, // explicit null
                }
            });
            console.log('Created UsuarioSistema:', usuario.id);
            return usuario;
        });

        console.log('✅ Success! User created:', result.id);

    } catch (e: any) {
        console.error('❌ Creation failed:', e.message);
        if (e.code) console.error('Error Code:', e.code);
        if (e.meta) console.error('Meta:', e.meta);
    } finally {
        await prisma.$disconnect();
    }
}

main();
