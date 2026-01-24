
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const count = await prisma.medicalKnowledge.count();
    console.log(`Total records in MedicalKnowledge: ${count}`);
}
main().finally(() => prisma.$disconnect());
