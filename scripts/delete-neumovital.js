#!/usr/bin/env node

/**
 * Script para encontrar y eliminar usuario "neumovital" de producción
 * Busca por nombre en lugar de email
 * Uso: node scripts/delete-neumovital.js
 */

const { PrismaClient } = require('@prisma/client');

async function deleteUser() {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });

    try {
        console.log('🔍 Buscando usuario "neumovital" por nombre...');

        // Buscar usuario por nombre que contenga "neumovital"
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: 'neumovital', mode: 'insensitive' } },
                    { email: { contains: 'neumo', mode: 'insensitive' } }
                ]
            }
        });

        if (users.length === 0) {
            console.log('❌ No se encontró ningún usuario con "neumovital"');
            console.log('\n📋 Listando todos los usuarios ADMIN:');

            const admins = await prisma.user.findMany({
                where: { role: 'ADMIN' }
            });

            admins.forEach(admin => {
                console.log(`   - ${admin.name} (${admin.email}) - ID: ${admin.id}`);
            });

            return;
        }

        console.log(`\n📋 Se encontró(aron) ${users.length} usuario(s):\n`);
        users.forEach((user, index) => {
            console.log(`${index + 1}. Nombre: ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Rol: ${user.role}`);
            console.log(`   ID: ${user.id}`);
            console.log('');
        });

        // Eliminar todos los usuarios encontrados
        console.log('🗑️  Eliminando usuario(s)...\n');

        for (const user of users) {
            await prisma.user.delete({
                where: { id: user.id }
            });
            console.log(`✅ Usuario "${user.name}" (${user.email}) eliminado`);
        }

        console.log('\n✅ Proceso completado exitosamente');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

deleteUser();
