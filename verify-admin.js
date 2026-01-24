
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking Admin user in DB...');
    try {
        const p = await prisma.persona.findUnique({
            where: { email: 'admin@hospital.cl' },
            include: {
                usuarioSistema: true,
                credencial: true
            }
        });

        if (!p) {
            console.log('Admin NOT FOUND');
        } else {
            console.log('Admin Persona FOUND:', p.id, p.nombre);
            console.log('Active:', p.activo);
            console.log('UsuarioSistema:', p.usuarioSistema ? { id: p.usuarioSistema.id, rol: p.usuarioSistema.rol, active: p.usuarioSistema.activo } : 'NULL');
            console.log('Credencial:', p.credencial ? { id: p.credencial.id, type: p.credencial.tipoAcceso } : 'NULL');
            if (p.credencial) {
                console.log('MFA Enabled:', p.credencial.mfaHabilitado);
                console.log('Must Change Password:', p.credencial.debeCambiarPassword);
                console.log('Bloqueado Hasta:', p.credencial.bloqueadoHasta);
            }
        }
    } catch (e) {
        console.error('Error querying DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
