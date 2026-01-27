'use client'

import { Eye, Pencil, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'

import { useState } from 'react'
// import { MedicalExam } from '@prisma/client' // FHIR uses ExamenMedico
import { deletePatientExam, updatePatientExam } from '@/lib/patient-actions'
import { useRouter } from 'next/navigation'

// Define local interface if Prisma type is not exported or uses different name
interface MedicalExam {
    id: string
    patientId?: string
    centerName: string
    doctorName: string
    examDate: Date | string
    fileUrl: string
    fileName?: string | null
    createdAt: Date | string
    source?: string
    uploadedByUserId?: string | null
    reviewed: boolean
}

interface PatientExamsListProps {
    exams: any[] // Relax type for compatibility with mapped objects
    onDelete?: () => void
    allowAdminActions?: boolean
}

export default function PatientExamsList({ exams, onDelete, allowAdminActions }: PatientExamsListProps) {
    const router = useRouter()
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
    const [editingExam, setEditingExam] = useState<MedicalExam | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string | null }>({ type: null, message: null });

    const handleDelete = async (examId: string) => {
        setDeletingId(examId)
        setStatus({ type: null, message: null })
        try {
            const result = await deletePatientExam(examId)
            if (result.success) {
                setStatus({ type: 'success', message: 'Examen eliminado correctamente' })
                onDelete?.()
                setShowDeleteConfirm(null)
                router.refresh()
                setTimeout(() => setStatus({ type: null, message: null }), 3000)
            } else {
                setStatus({ type: 'error', message: result.message })
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Error al eliminar el examen' })
        } finally {
            setDeletingId(null)
        }
    }

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!editingExam) return

        setIsSaving(true)
        setStatus({ type: null, message: null })
        const formData = new FormData(e.currentTarget)

        try {
            const result = await updatePatientExam(editingExam.id, formData)
            if (result.success) {
                setStatus({ type: 'success', message: 'Examen actualizado correctamente' })
                setEditingExam(null)
                router.refresh()
                setTimeout(() => setStatus({ type: null, message: null }), 3000)
            } else {
                setStatus({ type: 'error', message: result.message })
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Error al actualizar el examen' })
        } finally {
            setIsSaving(false)
        }
    }

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    if (exams.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay exámenes subidos
                </h3>
                <p className="text-gray-500">
                    Use el formulario arriba para subir sus exámenes médicos
                </p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                    Mis Exámenes ({exams.length})
                </h3>
                {status.message && (
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium animate-in fade-in slide-in-from-right-2 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {status.message}
                    </div>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Archivo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Centro Médico
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Médico
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha Examen
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Subido
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {exams.map((exam) => (
                            <tr key={exam.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-sm font-medium text-gray-900">
                                            {exam.fileName || 'Examen.pdf'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {exam.centerName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {exam.doctorName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(exam.examDate)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex flex-col gap-1">
                                        <span>{formatDate(exam.createdAt)}</span>
                                        <span className={`px-2 py-0.5 text-[10px] rounded-full border w-fit ${exam.source === 'PORTAL_PACIENTE' || exam.source === 'portal pacientes' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                            {exam.source === 'PORTAL_PACIENTE' || exam.source === 'portal pacientes' ? 'Paciente' : 'Interno'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                    <a
                                        href={exam.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-indigo-600 hover:text-indigo-900 transition-colors"
                                        title="Ver PDF"
                                    >
                                        <Eye className="h-5 w-5" />
                                    </a>
                                    {(allowAdminActions || exam.source === 'PORTAL_PACIENTE' || exam.source === 'portal pacientes') && (
                                        <>
                                            <button
                                                onClick={() => setEditingExam(exam)}
                                                className="inline-flex items-center text-blue-600 hover:text-blue-900 transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(exam.id)}
                                                className="inline-flex items-center text-red-600 hover:text-red-900 transition-colors"
                                                disabled={deletingId === exam.id}
                                                title="Eliminar PDF"
                                            >
                                                {deletingId === exam.id ? (
                                                    <span className="text-xs">...</span>
                                                ) : (
                                                    <Trash2 className="h-5 w-5" />
                                                )}
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md rounded-xl bg-white shadow-lg animate-in zoom-in-95 duration-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            ¿Eliminar examen?
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Esta acción eliminará permanentemente el archivo PDF y sus datos asociados. ¿Está seguro de continuar?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(showDeleteConfirm)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                                disabled={deletingId !== null}
                            >
                                {deletingId ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingExam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md rounded-xl bg-white shadow-lg animate-in zoom-in-95 duration-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Editar Examen
                        </h3>
                        <form onSubmit={handleUpdate}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="centerName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Centro Médico *
                                    </label>
                                    <input
                                        type="text"
                                        id="centerName"
                                        name="centerName"
                                        required
                                        defaultValue={editingExam.centerName}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder="Ej: Clínica Santa María"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="doctorName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Médico *
                                    </label>
                                    <input
                                        type="text"
                                        id="doctorName"
                                        name="doctorName"
                                        required
                                        defaultValue={editingExam.doctorName}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder="Ej: Dr. Pérez"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="examDate" className="block text-sm font-medium text-gray-700 mb-1">
                                        Fecha del Examen *
                                    </label>
                                    <input
                                        type="date"
                                        id="examDate"
                                        name="examDate"
                                        required
                                        defaultValue={new Date(editingExam.examDate).toISOString().split('T')[0]}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingExam(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Guardando...
                                        </>
                                    ) : (
                                        'Guardar Cambios'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

