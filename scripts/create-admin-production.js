#!/usr/bin/env node

/**
 * Script to create or update Admin user in production
 * Usage: DELETE ANY PREVIOUS ENV VARS FIRST if locally testing, or just set DATABASE_URL
 * node scripts/create-admin-production.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    // Ensure we are using the environment variable for URL if provided
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });

    try {
        console.log('🔍 Checking for Admin user in configured database...');

        const adminEmail = 'admin@example.com';
        const adminPass = 'admin123';

        const user = await prisma.user.findUnique({
            where: {
                email: adminEmail
            }
        });

        const hashedPassword = await bcrypt.hash(adminPass, 10);

        if (user) {
            console.log('📋 Admin user found. Updating password...');
            await prisma.user.update({
                where: { email: adminEmail },
                data: {
                    password: hashedPassword,
                    role: 'ADMIN',
                    active: true
                }
            });
            console.log('✅ Admin password updated to: admin123');
        } else {
            console.log('➕ Admin user not found. Creating new...');
            await prisma.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    name: 'Admin Production',
                    role: 'ADMIN',
                    active: true
                }
            });
            console.log('✅ Admin user created successfully.');
        }

    } catch (error) {
        console.error('❌ Error managing admin user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
