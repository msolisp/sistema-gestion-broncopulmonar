
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.medicalKnowledge.count();
        console.log(`Total Records: ${count}`);

        if (count > 0) {
            const records = await prisma.medicalKnowledge.findMany({ take: 5 });
            console.log('Sample Data (First 5):');
            console.log(JSON.stringify(records, null, 2));
        } else {
            console.log('Table is empty.');
        }
    } catch (error) {
        console.error('Error querying MedicalKnowledge:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
