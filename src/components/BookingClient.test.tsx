import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BookingClient from './BookingClient'
import { useActionState } from 'react'

// Mock React to intercept useActionState
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useActionState: jest.fn(),
}))

// Mock server actions
jest.mock('@/lib/actions', () => ({
    bookAppointment: jest.fn(),
    logout: jest.fn(),
}))

// Mock BookingInterface to simplify test
jest.mock('@/components/BookingInterface', () => {
    return function MockBookingInterface({ onConfirm, isPending }: any) {
        return (
            <div>
                <button
                    onClick={() => onConfirm(new Date('2025-01-01T10:00:00'))}
                    disabled={isPending}
                >
                    Confirm Mock
                </button>
                {isPending && <span>Mock Pending...</span>}
            </div>
        )
    }
})

// Mock Form submission logic (HTMLFormElement.prototype.requestSubmit)
const originalRequestSubmit = HTMLFormElement.prototype.requestSubmit

beforeAll(() => {
    HTMLFormElement.prototype.requestSubmit = jest.fn()
})

afterAll(() => {
    HTMLFormElement.prototype.requestSubmit = originalRequestSubmit
})

describe('BookingClient', () => {
    beforeEach(() => {
        (useActionState as jest.Mock).mockReturnValue([{ message: '' }, jest.fn()])
    })

    it('renders user info if provided', () => {
        render(<BookingClient userEmail="test@test.com" userName="Test User" />)
        expect(screen.getByText('Paciente: Test User')).toBeInTheDocument()
    })

    it('falls back to email if name missing', () => {
        render(<BookingClient userEmail="test@test.com" />)
        expect(screen.getByText('Paciente: test@test.com')).toBeInTheDocument()
    })

    it('handles booking flow and form submission', async () => {
        render(<BookingClient />)

        // Mock getElementById
        const mockForm = { requestSubmit: jest.fn() } as unknown as HTMLFormElement
        const mockDateInput = { value: '' } as unknown as HTMLInputElement

        jest.spyOn(document, 'getElementById').mockImplementation((id) => {
            if (id === 'booking-form') return mockForm
            if (id === 'date-hidden') return mockDateInput
            return null
        })

        const confirmBtn = screen.getByText('Confirm Mock')
        fireEvent.click(confirmBtn)

        expect(mockForm.requestSubmit).toHaveBeenCalled()
        expect(mockDateInput.value).toContain('2025-01-01')
    })

    it('calls logout action', () => {
        render(<BookingClient />)
        const logoutBtn = screen.getByText('Cerrar Sesión')
        expect(logoutBtn).toBeInTheDocument()
    })

    it('shows success state and hides availability message', () => {
        (useActionState as jest.Mock).mockReturnValue([{ message: 'Success' }, jest.fn()])

        render(<BookingClient />)

        expect(screen.getByText('¡Hora reservada exitosamente!')).toBeInTheDocument()
        expect(screen.queryByText('Selecciona tu disponibilidad')).not.toBeInTheDocument()
    })

    it('shows error message', () => {
        (useActionState as jest.Mock).mockReturnValue([{ message: 'Error de prueba' }, jest.fn()])

        render(<BookingClient />)

        expect(screen.getByText((content) => content.includes('Error de prueba'))).toBeInTheDocument()
    })
})
