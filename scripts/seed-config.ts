
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const defaultSize = '1'; // 1 MB

    await prisma.configuracion.upsert({
        where: { key: 'MAX_FILE_SIZE_MB' },
        update: {},
        create: {
            key: 'MAX_FILE_SIZE_MB',
            value: defaultSize,
            description: 'Límite máximo de tamaño de archivo (MB) para subida de exámenes'
        }
    });

    console.log('Configuration seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
