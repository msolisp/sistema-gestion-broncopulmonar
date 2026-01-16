import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getPatientExams } from '@/lib/patient-actions'
import PatientExamsUpload from '@/components/PatientExamsUpload'
import PatientExamsList from '@/components/PatientExamsList'

async function ExamsContent() {
    const session = await auth()

    if (!session?.user?.email) {
        redirect('/login')
    }

    // const exams = await getPatientExams()
    const exams: any[] = [] // Temporary fix to allow page load while debugging DB

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Mis Exámenes Médicos
                    </h1>
                    <p className="text-gray-600">
                        Suba sus exámenes realizados en otros centros para que el equipo médico los revise antes de su cita
                    </p>
                </div>

                <PatientExamsUpload />
                <PatientExamsList exams={exams} />
            </div>
        </div>
    )
}

export default function PatientExamsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        }>
            <ExamsContent />
        </Suspense>
    )
}
