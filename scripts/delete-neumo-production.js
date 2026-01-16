#!/usr/bin/env node

/**
 * Script para eliminar usuario neumo@example.com de PRODUCCIÓN
 * Este script usa DIRECT_URL para conectarse a la base de datos de producción
 * 
 * Uso: 
 * DIRECT_URL="tu-conexion-directa" node scripts/delete-neumo-production.js
 */

const { PrismaClient } = require('@prisma/client');

async function deleteUser() {
    // Usar DIRECT_URL para producción
    const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

    if (!dbUrl) {
        console.error('❌ Error: DIRECT_URL o DATABASE_URL no está configurado');
        console.log('\nUso:');
        console.log('DIRECT_URL="postgresql://..." node scripts/delete-neumo-production.js');
        process.exit(1);
    }

    console.log('🔗 Conectando a base de datos...');
    console.log(`   URL: ${dbUrl.substring(0, 30)}...`);

    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: dbUrl
            }
        }
    });

    try {
        const email = 'neumo@example.com';
        console.log(`\n🔍 Buscando usuario con email: ${email}...`);

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (!user) {
            console.log(`❌ Usuario "${email}" no encontrado en la base de datos`);

            // Listar todos los usuarios para debug
            console.log('\n📋 Listando todos los usuarios en la BD:');
            const allUsers = await prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            });

            allUsers.forEach(u => {
                console.log(`   - ${u.name} (${u.email}) - ${u.role}`);
            });

            return;
        }

        console.log('📋 Usuario encontrado:');
        console.log(`   - Nombre: ${user.name}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Rol: ${user.role}`);
        console.log(`   - Estado: ${user.active ? 'Activo' : 'Inactivo'}`);
        console.log(`   - ID: ${user.id}`);

        console.log('\n🗑️  Eliminando usuario de producción...');

        await prisma.user.delete({
            where: {
                id: user.id
            }
        });

        console.log('✅ Usuario eliminado exitosamente de PRODUCCIÓN');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.code) {
            console.error(`   Código de error Prisma: ${error.code}`);
        }
        throw error;
    } finally {
        await prisma.$disconnect();
        console.log('\n🔌 Desconectado de la base de datos');
    }
}

deleteUser();
