'use client'

import { useState, useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { uploadPatientExam } from '@/lib/patient-actions'

interface State {
    message: string
    success?: boolean
}

const initialState: State = {
    message: '',
}

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? 'Subiendo...' : 'Guardar y Subir'}
        </button>
    )
}

export default function PatientExamsUpload({ onSuccess }: { onSuccess?: () => void }) {
    const router = useRouter()
    const [state, formAction] = useFormState(uploadPatientExam, initialState)
    const [fileName, setFileName] = useState<string>('')
    const [isDragging, setIsDragging] = useState(false)

    // Monitor state changes to handle success
    useEffect(() => {
        if (state.success) {
            setFileName('')
            const form = document.getElementById('exam-upload-form') as HTMLFormElement
            form?.reset()
            onSuccess?.()
            router.refresh()
        }
    }, [state.success, onSuccess, router])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFileSelection(file)
        }
    }

    const handleFileSelection = (file: File) => {
        if (file.type !== 'application/pdf') {
            alert('Solo se permiten archivos PDF')
            return
        }
        setFileName(file.name)

        // Update the file input manually if needed (browsers make this hard for security)
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
        if (fileInput) {
            fileInput.files = dataTransfer.files
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const file = e.dataTransfer.files?.[0]
        if (file) {
            handleFileSelection(file)
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <h2 className="text-2xl font-bold text-gray-900">Subir Examen Médico</h2>
            </div>

            <form id="exam-upload-form" action={formAction} className="space-y-4">
                {/* File Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        ARCHIVO PDF <span className="text-red-500">*</span>
                    </label>
                    <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-300 hover:border-indigo-500'
                            }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            name="file"
                            accept=".pdf,application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                            required
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer block w-full h-full"
                        >
                            <div className="flex flex-col items-center">
                                <svg className={`w-12 h-12 mb-2 ${isDragging ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <span className="text-indigo-600 font-medium">Seleccionar archivo</span>
                                <span className="text-sm text-gray-500 mt-1">o arrastra y suelta</span>
                                <span className="text-xs text-gray-400 mt-2">PDF (máx. 10MB)</span>
                            </div>
                        </label>
                        {fileName && (
                            <div className="mt-3 text-sm text-gray-700 bg-white p-2 rounded shadow-sm inline-block border border-gray-200">
                                📄 {fileName}
                            </div>
                        )}
                    </div>
                    {!fileName && <p className="text-xs text-gray-500 mt-1">Sin archivos seleccionados</p>}
                </div>

                {/* Centro Médico */}
                <div>
                    <label htmlFor="centerName" className="block text-sm font-medium text-gray-700 mb-2">
                        CENTRO MÉDICO <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="centerName"
                        name="centerName"
                        placeholder="Ej: Clínica..."
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>

                {/* Médico */}
                <div>
                    <label htmlFor="doctorName" className="block text-sm font-medium text-gray-700 mb-2">
                        MÉDICO <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="doctorName"
                        name="doctorName"
                        placeholder="Ej: Dr. Pérez"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>

                {/* Fecha */}
                <div>
                    <label htmlFor="examDate" className="block text-sm font-medium text-gray-700 mb-2">
                        FECHA <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        id="examDate"
                        name="examDate"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>

                {/* Messages */}
                {
                    state.message && (
                        <div className={`p-4 rounded-lg ${state.success
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-red-50 border border-red-200 text-red-800'
                            }`}>
                            {state.message}
                        </div>
                    )
                }

                {/* Submit Button */}
                <SubmitButton />
            </form >
        </div >
    )
}
