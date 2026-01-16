'use client'

import { useState } from 'react'
import { MedicalExam } from '@prisma/client'
import { deletePatientExam } from '@/lib/patient-actions'

interface PatientExamsListProps {
    exams: MedicalExam[]
    onDelete?: () => void
}

export default function PatientExamsList({ exams, onDelete }: PatientExamsListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

    const handleDelete = async (examId: string) => {
        setDeletingId(examId)
        try {
            const result = await deletePatientExam(examId)
            if (result.success) {
                onDelete?.()
                setShowDeleteConfirm(null)
            } else {
                alert(result.message)
            }
        } catch (error) {
            alert('Error al eliminar el examen')
        } finally {
            setDeletingId(null)
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
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                    Mis Exámenes ({exams.length})
                </h3>
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
                                    {formatDate(exam.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <a
                                        href={exam.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:text-indigo-900"
                                    >
                                        Ver
                                    </a>
                                    {exam.source === 'portal pacientes' && exam.uploadedByUserId && (
                                        <>
                                            <span className="text-gray-300">|</span>
                                            <button
                                                onClick={() => setShowDeleteConfirm(exam.id)}
                                                className="text-red-600 hover:text-red-900"
                                                disabled={deletingId === exam.id}
                                            >
                                                {deletingId === exam.id ? 'Eliminando...' : 'Eliminar'}
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            ¿Eliminar examen?
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Esta acción no se puede deshacer. El examen será eliminado permanentemente.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(showDeleteConfirm)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                disabled={deletingId !== null}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
