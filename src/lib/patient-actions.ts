'use server'

import { auth } from '@/auth'
import { put } from '@vercel/blob'
import prisma from '@/lib/prisma' // Use centralized db instance if available or import PrismaClient
// import { PrismaClient } from '@prisma/client'
// const prisma = new PrismaClient() 

/**
 * Upload a medical exam from patient portal
 * Validates file and saves to Vercel Blob Storage
 */
export async function uploadPatientExam(
    prevState: any,
    formData: FormData
): Promise<{ message: string; success?: boolean }> {
    try {
        const session = await auth()

        // Verify patient is authenticated
        if (!session?.user?.email) {
            return { message: 'No autorizado. Debe iniciar sesión.' }
        }

        // Find FichaClinica by persona
        const persona = await prisma.persona.findUnique({
            where: { email: session.user.email },
            include: { fichaClinica: true }
        });

        if (!persona || !persona.fichaClinica) {
            return { message: 'Ficha clínica no encontrada.' }
        }

        const fichaClinica = persona.fichaClinica;

        // Extract form data
        const file = formData.get('file') as File | null
        const centerName = formData.get('centerName') as string
        const doctorName = formData.get('doctorName') as string
        const examDateStr = formData.get('examDate') as string

        // Validate required fields
        if (!file) {
            return { message: 'Debe seleccionar un archivo PDF.' }
        }

        if (!centerName || centerName.trim().length === 0) {
            return { message: 'El centro médico es requerido.' }
        }

        if (!doctorName || doctorName.trim().length === 0) {
            return { message: 'El nombre del médico es requerido.' }
        }

        if (!examDateStr) {
            return { message: 'La fecha del examen es requerida.' }
        }

        // Validate file type
        if (file.type !== 'application/pdf') {
            return { message: 'Solo se permiten archivos PDF.' }
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            return { message: 'El archivo no debe superar los 5MB.' }
        }

        // 2. Check Magic Bytes (Secure check)
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const { fileTypeFromBuffer } = await import('file-type');
        const type = await fileTypeFromBuffer(buffer);

        if (!type || type.mime !== 'application/pdf') {
            return { message: 'El archivo no es un PDF válido (Firma digital incorrecta).' }
        }

        let fileUrl = '';
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const fileName = `${timestamp}-${safeName}`;

        // Bypass Vercel Blob in Development/Test if no token
        if ((process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && !process.env.BLOB_READ_WRITE_TOKEN) {
            console.warn('Using Mock Upload (No BLOB_READ_WRITE_TOKEN provided)');
            fileUrl = `http://localhost:3000/api/mock-storage/${fileName}`;
        } else {
            // Upload to Vercel Blob
            const blob = await put(fileName, file, {
                access: 'public',
                addRandomSuffix: true,
            });
            fileUrl = blob.url;
        }

        // Parse exam date
        const examDate = new Date(examDateStr)

        // Save to database using FHIR model
        const exam = await prisma.examenMedico.create({
            data: {
                fichaClinicaId: fichaClinica.id,
                origen: 'PORTAL_PACIENTE',
                subidoPor: session.user.id,
                nombreCentro: centerName.trim(),
                nombreDoctor: doctorName.trim(),
                fechaExamen: examDate,
                archivoUrl: fileUrl,
                archivoNombre: file.name,
            },
        })

        // Create notification for staff
        try {
            await prisma.notification.create({
                data: {
                    patientId: persona.id,
                    type: 'EXAM_UPLOADED',
                    title: 'Nuevo examen subido',
                    message: `${persona.nombre} ${persona.apellidoPaterno} subió un examen médico de ${centerName.trim()}`,
                    examId: exam.id,
                    read: false,
                },
            })
        } catch (notifError) {
            console.error('Failed to create notification:', notifError)
        }

        return {
            message: 'Examen médico subido exitosamente.',
            success: true
        }
    } catch (error: any) {
        console.error('Error uploading patient exam:', error)
        return { message: `Error: ${error.message || 'Error desconocido'}` }
    }
}

/**
 * Get all medical exams for the authenticated patient
 */
export async function getPatientExams() {
    try {
        const session = await auth()

        if (!session?.user?.email) {
            throw new Error('No autorizado')
        }

        const persona = await prisma.persona.findUnique({
            where: { email: session.user.email },
            include: {
                fichaClinica: true,
            },
        })

        if (!persona || !persona.fichaClinica) {
            throw new Error('Paciente no encontrado')
        }

        const exams = await prisma.examenMedico.findMany({
            where: { fichaClinicaId: persona.fichaClinica.id },
            orderBy: { creadoEn: 'desc' }
        });

        // Map to legacy format for frontend compatibility
        return exams.map((e: any) => ({
            id: e.id,
            patientId: persona.fichaClinica?.personaId, // Approximating
            centerName: e.nombreCentro,
            doctorName: e.nombreDoctor,
            examDate: e.fechaExamen,
            fileUrl: e.archivoUrl,
            fileName: e.archivoNombre,
            createdAt: e.creadoEn,
            source: e.origen,
            uploadedByUserId: e.subidoPor,
            reviewed: e.revisado
        }));
    } catch (error) {
        console.error('Error getting patient exams:', error)
        throw error
    }
}

/**
 * Delete a patient's own exam
 * Only the patient who uploaded it can delete
 */
export async function deletePatientExam(examId: string): Promise<{ message: string; success?: boolean }> {
    try {
        const session = await auth()

        if (!session?.user?.email) {
            return { message: 'No autorizado. Debe iniciar sesión.' }
        }

        const persona = await prisma.persona.findUnique({
            where: { email: session.user.email },
        })

        if (!persona) {
            return { message: 'Paciente no encontrado.' }
        }

        // Find the exam
        const exam = await prisma.examenMedico.findUnique({
            where: { id: examId },
        })

        if (!exam) {
            return { message: 'Examen no encontrado.' }
        }

        // Verify ownership or staff permissions
        const userRole = (session.user as any).role;
        const isStaff = ['ADMIN', 'KINESIOLOGO'].includes(userRole);

        if (!isStaff) {
            // If not staff, must be owner and from portal
            if (exam.origen !== 'PORTAL_PACIENTE' || (exam.subidoPor !== session.user.id && exam.subidoPor !== persona.id)) {
                return { message: 'Solo puede eliminar exámenes que usted haya subido desde el portal de pacientes.' }
            }
        }
        // If staff, they can currently delete internal ones or if they are admin
        else if (userRole !== 'ADMIN' && exam.origen !== 'PORTAL_INTERNO') {
            // Kinesiologists can only delete internal ones? Or maybe any but we stick to internal for now if strict.
            // Actually, usually staff should be able to manage clinical record.
        }

        // Delete the exam
        await prisma.examenMedico.delete({
            where: { id: examId },
        })

        return {
            message: 'Examen eliminado exitosamente.',
            success: true
        }
    } catch (error) {
        console.error('Error deleting patient exam:', error)
        return { message: 'Error al eliminar el examen. Intente nuevamente.' }
    }
}

/**
 * Update a patient's exam metadata
 */
export async function updatePatientExam(
    examId: string,
    formData: FormData
): Promise<{ message: string; success?: boolean }> {
    try {
        const session = await auth()

        if (!session?.user?.email) {
            return { message: 'No autorizado. Debe iniciar sesión.' }
        }

        const persona = await prisma.persona.findUnique({
            where: { email: session.user.email },
        })

        if (!persona) {
            return { message: 'Paciente no encontrado.' }
        }

        // Extract form data
        const centerName = formData.get('centerName') as string
        const doctorName = formData.get('doctorName') as string
        const examDateStr = formData.get('examDate') as string

        if (!centerName || centerName.trim().length === 0) {
            return { message: 'El centro médico es requerido.' }
        }

        if (!doctorName || doctorName.trim().length === 0) {
            return { message: 'El nombre del médico es requerido.' }
        }

        if (!examDateStr) {
            return { message: 'La fecha del examen es requerida.' }
        }

        // Find the exam
        const exam = await prisma.examenMedico.findUnique({
            where: { id: examId },
        })

        if (!exam) {
            return { message: 'Examen no encontrado.' }
        }

        // Verify ownership or staff permissions
        const userRole = (session.user as any).role;
        const isStaff = ['ADMIN', 'KINESIOLOGO'].includes(userRole);

        if (!isStaff) {
            if (exam.origen !== 'PORTAL_PACIENTE' || (exam.subidoPor !== session.user.id && exam.subidoPor !== persona.id)) {
                return { message: 'Solo puede editar exámenes que usted haya subido.' }
            }
        }

        // Update exam
        await prisma.examenMedico.update({
            where: { id: examId },
            data: {
                nombreCentro: centerName.trim(),
                nombreDoctor: doctorName.trim(),
                fechaExamen: new Date(examDateStr),
            },
        })

        return {
            message: 'Examen actualizado exitosamente.',
            success: true
        }
    } catch (error) {
        console.error('Error updating patient exam:', error)
        return { message: 'Error al actualizar el examen.' }
    }
}
