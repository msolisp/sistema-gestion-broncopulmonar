import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Fixing Admin Access...');

    // 1. Ensure ADMIN role exists
    const adminRole = await prisma.rol.upsert({
        where: { nombre: 'ADMIN' },
        update: {},
        create: {
            nombre: 'ADMIN',
            descripcion: 'Administrador del Sistema',
            activo: true
        }
    });
    console.log(`✅ Role: ${adminRole.nombre} (${adminRole.id})`);

    const adminEmail = 'admin@example.com';
    const adminPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // 2. Ensure Persona exists
    const persona = await prisma.persona.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            rut: '11111111-1',
            nombre: 'Admin',
            apellidoPaterno: 'Sistema',
            email: adminEmail,
            creadoPor: 'FIX_SCRIPT'
        }
    });
    console.log(`✅ Persona: ${persona.email} (${persona.id})`);

    // 3. Ensure Credential exists
    await prisma.credencial.upsert({
        where: { personaId: persona.id },
        update: {
            passwordHash: hashedPassword,
            tipoAcceso: 'STAFF'
        },
        create: {
            personaId: persona.id,
            passwordHash: hashedPassword,
            tipoAcceso: 'STAFF',
            debeCambiarPassword: false
        }
    });
    console.log('✅ Credenciales actualizadas/creadas');

    // 4. Ensure UsuarioSistema exists with ADMIN role
    const usuarioSistema = await prisma.usuarioSistema.upsert({
        where: { personaId: persona.id },
        update: {
            rolId: adminRole.id,
            activo: true
        },
        create: {
            personaId: persona.id,
            rolId: adminRole.id,
            creadoPor: 'FIX_SCRIPT',
            activo: true
        }
    });
    console.log(`✅ UsuarioSistema: ${usuarioSistema.id} linked to Rol ${adminRole.nombre}`);

    console.log('\n🎉 Admin user fixed successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
