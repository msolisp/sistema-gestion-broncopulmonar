import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Find Juan Perez (RUT 11.111.111-1)
    const patient = await prisma.patient.findFirst({
        where: { rut: '11.111.111-1' }
    });

    if (!patient) {
        console.error('Patient not found');
        return;
    }

    // Clear existing exams for this patient to ensure clean state
    await prisma.medicalExam.deleteMany({
        where: { patientId: patient.id }
    });
    console.log(`Cleared existing exams for patient ${patient.rut}`);

    // Generate 20 dummy exams
    const centers = ['Clínica Santa María', 'Hospital Clínico UC', 'IntegraMédica Tobalaba', 'Clínica Alemana', 'RedSalud Providencia'];
    const doctors = ['Dr. Alejandro Silva', 'Dra. Valentina Muñoz', 'Dr. Roberto Diaz', 'Dra. Carmen Gloria', 'Dr. Felipe Soto'];
    const files = ['radiografia.pdf', 'examen_sangre.pdf', 'ecografia.pdf', 'resonancia.pdf'];

    const pdfUrls = [
        'https://pdfobject.com/pdf/sample.pdf'
    ];

    for (let i = 0; i < 20; i++) {
        const randomDate = new Date(2023, 0, 1 + Math.floor(Math.random() * 365));

        await prisma.medicalExam.create({
            data: {
                patientId: patient.id,
                centerName: centers[Math.floor(Math.random() * centers.length)],
                doctorName: doctors[Math.floor(Math.random() * doctors.length)],
                examDate: randomDate,
                fileUrl: pdfUrls[Math.floor(Math.random() * pdfUrls.length)],
                fileName: files[Math.floor(Math.random() * files.length)]
            }
        });
    }

    console.log(`Added 20 more exams for patient ${patient.rut}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
