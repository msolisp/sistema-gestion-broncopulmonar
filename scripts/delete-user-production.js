#!/usr/bin/env node

/**
 * Script para eliminar el usuario "neumovital" de producción
 * Uso: node scripts/delete-user-production.js
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
        console.log('🔍 Buscando usuario "neumovital"...');

        const user = await prisma.user.findUnique({
            where: {
                email: 'neumo@example.com'
            }
        });

        if (!user) {
            console.log('❌ Usuario "neumovital" no encontrado');
            return;
        }

        console.log('📋 Usuario encontrado:');
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Nombre: ${user.name}`);
        console.log(`   - Rol: ${user.role}`);
        console.log(`   - ID: ${user.id}`);

        console.log('\n🗑️  Eliminando usuario...');

        await prisma.user.delete({
            where: {
                id: user.id
            }
        });

        console.log('✅ Usuario "neumovital" eliminado exitosamente de producción');

    } catch (error) {
        console.error('❌ Error al eliminar usuario:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

deleteUser();
