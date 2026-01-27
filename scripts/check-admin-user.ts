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
    console.log('🚀 Checking admin user...');
    try {
        await prisma.$connect();
        const email = 'admin@hospital.cl';

        const personas = await prisma.persona.findMany({
            include: {
                credencial: true,
                usuarioSistema: {
                    include: { rol_rel: true }
                }
            }
        });

        console.log(`Found ${personas.length} personas.`);
        personas.forEach(p => {
            console.log(` - ${p.email} (ID: ${p.id}, Cred: ${!!p.credencial}, SysUser: ${!!p.usuarioSistema})`);
        });

        const persona = personas.find(p => p.email === email);

        if (!persona) {
            console.log('❌ Admin user NOT found');
        } else {
            console.log('✅ Admin user found:');
            console.log(`   ID: ${persona.id}`);
            console.log(`   Name: ${persona.nombre} ${persona.apellidoPaterno}`);
            console.log(`   Has Credential: ${!!persona.credencial}`);
            if (persona.credencial) {
                console.log(`   Password Hash Start: ${persona.credencial.passwordHash.substring(0, 10)}...`);
            }
            console.log(`   Has UsuarioSistema: ${!!persona.usuarioSistema}`);
            if (persona.usuarioSistema) {
                console.log(`   Role ID: ${persona.usuarioSistema.rolId}`);
                console.log(`   Role Name: ${persona.usuarioSistema.rol_rel?.nombre}`);
            } else {
                console.log('   ⚠️ Missing UsuarioSistema!');
            }
        }

    } catch (e: any) {
        console.error('❌ Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
