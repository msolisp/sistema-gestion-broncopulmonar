const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Ensuring system configurations exist...');

    const configs = [
        {
            key: 'MAX_FILE_SIZE_MB',
            value: '1',
            description: 'Límite de tamaño para subida de archivos en MB'
        },
        {
            key: 'TURNSTILE_ENABLED',
            value: 'true',
            description: 'Habilita o deshabilita la validación de Cloudflare Turnstile en el login'
        }
    ];

    for (const config of configs) {
        await prisma.configuracion.upsert({
            where: { key: config.key },
            update: {}, // Don't overwrite if exists
            create: config
        });
        console.log(`- ${config.key} confirmed`);
    }

    console.log('Done.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
