import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ExamUploadForm from './ExamUploadForm'
import { uploadMedicalExam } from '@/lib/actions'
import { useRouter } from 'next/navigation'

// Mock the server action
jest.mock('@/lib/actions.patients', () => ({
    uploadMedicalExam: jest.fn()
}))

// Mock useRouter
jest.mock('next/navigation', () => ({
    useRouter: jest.fn()
}))

describe('ExamUploadForm', () => {
    const mockRefresh = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
            ; (useRouter as jest.Mock).mockReturnValue({
                refresh: mockRefresh
            })
        // Mock window.alert is necessary or jsdom might error/ignore
        window.alert = jest.fn()
    })

    it('renders correctly', () => {
        render(<ExamUploadForm patientId="p1" />)
        expect(screen.getByText('Subir Nuevo Examen')).toBeInTheDocument()
        expect(screen.getByLabelText(/archivo pdf/i)).toBeInTheDocument()
    })

    it('calls uploadMedicalExam with correct data on submit', async () => {
        render(<ExamUploadForm patientId="p1" />)
        const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' })

        // Fill form
        const fileInput = screen.getByLabelText(/archivo pdf/i)
        fireEvent.change(fileInput, { target: { files: [file] } })

        fireEvent.change(screen.getByPlaceholderText('Ej: Clínica...'), { target: { value: 'Clinic A' } })
        fireEvent.change(screen.getByPlaceholderText('Ej: Dr. Pérez'), { target: { value: 'Dr. John' } })
        // Use container query for date if label is tricky, or getByLabelText with exact match
        fireEvent.change(screen.getByLabelText(/fecha/i), { target: { value: '2025-01-01' } })

            // Mock success response
            ; (uploadMedicalExam as jest.Mock).mockResolvedValueOnce({ success: true })

        // Submit
        // fireEvent.click(screen.getByText('Guardar y Subir')) 
        // Using fireEvent.submit directly on form to ensure JSDOM handles it
        fireEvent.submit(screen.getByText('Guardar y Subir').closest('form')!)

        await waitFor(() => {
            expect(uploadMedicalExam).toHaveBeenCalled()
        })

        // Check FormData content roughly (hard to inspect FormData object in mock calls perfectly without custom matcher, but we ensure it was called)
        const calledFormData = (uploadMedicalExam as jest.Mock).mock.calls[0][0] as FormData
        expect(calledFormData.get('patientId')).toBe('p1')
        expect(calledFormData.get('centerName')).toBe('Clinic A')
    })

    it('displays error alert if upload fails', async () => {
        render(<ExamUploadForm patientId="p1" />)

        // Simplified fill
        const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' })
        fireEvent.change(screen.getByLabelText(/archivo pdf/i), { target: { files: [file] } })
        fireEvent.change(screen.getByPlaceholderText('Ej: Clínica...'), { target: { value: 'Clinic A' } })
        fireEvent.change(screen.getByPlaceholderText('Ej: Dr. Pérez'), { target: { value: 'Dr. John' } })
        fireEvent.change(screen.getByLabelText(/fecha/i), { target: { value: '2025-01-01' } })

            ; (uploadMedicalExam as jest.Mock).mockResolvedValueOnce({ message: 'Error simulado' })

        // fireEvent.click(screen.getByText('Guardar y Subir'))
        fireEvent.submit(screen.getByText('Guardar y Subir').closest('form')!)

        await waitFor(() => {
            expect(screen.getByText('Error simulado')).toBeInTheDocument()
        })
    })
})
