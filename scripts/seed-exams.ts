
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Find Juan Perez (RUT 11.111.111-1)
    // In new schema, we find the Persona first
    const persona = await prisma.persona.findUnique({
        where: { rut: '10000000-8' },
        include: { fichaClinica: true }
    });

    if (!persona) {
        console.error('Persona (Patient) not found');
        return;
    }

    if (!persona.fichaClinica) {
        console.error('Persona found but has no FichaClinica');
        return;
    }

    const fichaId = persona.fichaClinica.id;

    // Clear existing exams for this patient to ensure clean state
    await prisma.examenMedico.deleteMany({
        where: { fichaClinicaId: fichaId }
    });
    console.log(`Cleared existing exams for patient ${persona.rut}`);

    // Generate 20 dummy exams
    const centers = ['Clínica Santa María', 'Hospital Clínico UC', 'IntegraMédica Tobalaba', 'Clínica Alemana', 'RedSalud Providencia'];
    const doctors = ['Dr. Alejandro Silva', 'Dra. Valentina Muñoz', 'Dr. Roberto Diaz', 'Dra. Carmen Gloria', 'Dr. Felipe Soto'];
    const files = ['radiografia.pdf', 'examen_sangre.pdf', 'ecografia.pdf', 'resonancia.pdf'];

    const pdfUrls = [
        'https://pdfobject.com/pdf/sample.pdf'
    ];

    for (let i = 0; i < 20; i++) {
        const randomDate = new Date(2023, 0, 1 + Math.floor(Math.random() * 365));

        await prisma.examenMedico.create({
            data: {
                fichaClinicaId: fichaId,
                nombreCentro: centers[Math.floor(Math.random() * centers.length)],
                nombreDoctor: doctors[Math.floor(Math.random() * doctors.length)],
                fechaExamen: randomDate,
                archivoUrl: pdfUrls[Math.floor(Math.random() * pdfUrls.length)],
                archivoNombre: files[Math.floor(Math.random() * files.length)],
                origen: 'seed-script',
                revisado: Math.random() > 0.7 // Randomly mark some as reviewed
            }
        });
    }

    console.log(`Added 20 more exams for patient ${persona.rut}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
