import { auth } from '@/auth'
import { put } from '@vercel/blob'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

        // Find patient by email
        const patient = await prisma.patient.findUnique({
            where: { email: session.user.email },
        })

        if (!patient) {
            return { message: 'Paciente no encontrado.' }
        }

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

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
            return { message: 'El archivo no debe superar los 10MB.' }
        }

        // Upload to Vercel Blob
        const blob = await put(file.name, file, {
            access: 'public',
            addRandomSuffix: true,
        })

        // Parse exam date
        const examDate = new Date(examDateStr)

        // Save to database
        const exam = await prisma.medicalExam.create({
            data: {
                patientId: patient.id,
                source: 'portal pacientes',
                uploadedByUserId: patient.id,
                centerName: centerName.trim(),
                doctorName: doctorName.trim(),
                examDate: examDate,
                fileUrl: blob.url,
                fileName: file.name,
            },
        })

        // Create notification for internal portal (non-blocking)
        try {
            await prisma.notification.create({
                data: {
                    type: 'EXAM_UPLOADED',
                    title: 'Nuevo examen subido',
                    message: `${patient.name} subió un examen médico de ${centerName.trim()}`,
                    patientId: patient.id,
                    examId: exam.id,
                    read: false,
                },
            })
        } catch (notifError) {
            console.error('Failed to create notification:', notifError)
            // Continue execution - do not fail the upload just because notification failed
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

        const patient = await prisma.patient.findUnique({
            where: { email: session.user.email },
            include: {
                exams: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        })

        if (!patient) {
            throw new Error('Paciente no encontrado')
        }

        return patient.exams
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

        const patient = await prisma.patient.findUnique({
            where: { email: session.user.email },
        })

        if (!patient) {
            return { message: 'Paciente no encontrado.' }
        }

        // Find the exam
        const exam = await prisma.medicalExam.findUnique({
            where: { id: examId },
        })

        if (!exam) {
            return { message: 'Examen no encontrado.' }
        }

        // Verify ownership
        if (exam.patientId !== patient.id) {
            return { message: 'No tiene permiso para eliminar este examen.' }
        }

        // Only allow deletion of exams uploaded by patient from patient portal
        if (exam.source !== 'portal pacientes' || exam.uploadedByUserId !== patient.id) {
            return { message: 'Solo puede eliminar exámenes que usted haya subido desde el portal de pacientes.' }
        }

        // Delete the exam
        await prisma.medicalExam.delete({
            where: { id: examId },
        })

        // Note: Blob storage cleanup would go here in production
        // For now, we leave the file in blob storage

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

        const patient = await prisma.patient.findUnique({
            where: { email: session.user.email },
        })

        if (!patient) {
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
        const exam = await prisma.medicalExam.findUnique({
            where: { id: examId },
        })

        if (!exam) {
            return { message: 'Examen no encontrado.' }
        }

        // Verify ownership
        if (exam.patientId !== patient.id) {
            return { message: 'No tiene permiso para editar este examen.' }
        }

        if (exam.source !== 'portal pacientes' || exam.uploadedByUserId !== patient.id) {
            return { message: 'Solo puede editar exámenes que usted haya subido.' }
        }

        // Update exam
        await prisma.medicalExam.update({
            where: { id: examId },
            data: {
                centerName: centerName.trim(),
                doctorName: doctorName.trim(),
                examDate: new Date(examDateStr),
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
