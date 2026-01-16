'use client'

import { useState } from 'react'
import { FileText, CheckCircle, ExternalLink } from 'lucide-react'
import { reviewMedicalExam } from '@/lib/actions'
import { useRouter } from 'next/navigation'

interface PendingExam {
    id: string
    fileName: string | null
    fileUrl: string
    examDate: string
    patient: {
        id: string
        name: string
        rut: string
    }
}

interface PendingExamsWidgetProps {
    exams: PendingExam[]
}

export default function PendingExamsWidget({ exams }: PendingExamsWidgetProps) {
    const router = useRouter()
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

    const handleReview = async (examId: string) => {
        setLoadingMap(prev => ({ ...prev, [examId]: true }))
        try {
            await reviewMedicalExam(examId)
            router.refresh()
        } catch (error) {
            console.error('Error reviewing exam:', error)
            alert('Error al marcar como revisado')
        } finally {
            setLoadingMap(prev => ({ ...prev, [examId]: false }))
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-zinc-100 bg-orange-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-zinc-800">Exámenes Pendientes</h3>
                        <p className="text-xs text-zinc-500">Subidos por pacientes</p>
                    </div>
                </div>
                {exams.length > 0 && (
                    <span className="px-2.5 py-0.5 bg-orange-200 text-orange-800 rounded-full text-xs font-bold">
                        {exams.length}
                    </span>
                )}
            </div>

            <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-50">
                {exams.length === 0 ? (
                    <div className="p-8 text-center text-zinc-400">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-zinc-200" />
                        <p className="text-sm">Todo al día</p>
                        <p className="text-xs">No hay exámenes pendientes de revisión</p>
                    </div>
                ) : (
                    exams.map((exam) => (
                        <div key={exam.id} className="p-4 hover:bg-zinc-50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-medium text-zinc-900 text-sm">{exam.patient.name}</h4>
                                    <p className="text-xs text-zinc-500">RUT: {exam.patient.rut}</p>
                                </div>
                                <span className="text-xs text-zinc-400">
                                    {new Date(exam.examDate).toLocaleDateString('es-CL')}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="w-3 h-3 text-zinc-400" />
                                <span className="text-xs text-zinc-600 truncate max-w-[200px]">
                                    {exam.fileName || 'Documento sin nombre'}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <a
                                    href={exam.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Ver PDF
                                </a>
                                <button
                                    onClick={() => handleReview(exam.id)}
                                    disabled={loadingMap[exam.id]}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors disabled:opacity-50"
                                >
                                    {loadingMap[exam.id] ? (
                                        <span className="animate-pulse">Procesando...</span>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-3 h-3" />
                                            Marcar Revisado
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
