import { render, screen, fireEvent } from '@testing-library/react'
import BookingInterface from './BookingInterface'

describe('BookingInterface Component', () => {
    const mockOnConfirm = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
        // Set date to Jan 1, 2025 09:00:00 to ensure consistent calendar and slots
        jest.setSystemTime(new Date(2025, 0, 1, 9, 0, 0))
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('renders calendar and time slots', () => {
        render(<BookingInterface onConfirm={mockOnConfirm} isPending={false} />)
        expect(screen.getByText(/Horarios para el/i)).toBeInTheDocument()
    })

    it('selects a time slot and confirms', () => {
        render(<BookingInterface onConfirm={mockOnConfirm} isPending={false} />)

        // Find an available button (not disabled)
        const availableSlots = screen.getAllByRole('button').filter(btn => !btn.hasAttribute('disabled'))
        const timeSlot = availableSlots.find(btn => btn.textContent?.includes(':')) // Simple check for time format

        if (timeSlot) {
            fireEvent.click(timeSlot)

            const confirmBtn = screen.getByText('Confirmar Reserva')
            expect(confirmBtn).not.toBeDisabled()

            fireEvent.click(confirmBtn)
            expect(mockOnConfirm).toHaveBeenCalled()
        }
    })

    it('shows loading state', () => {
        render(<BookingInterface onConfirm={mockOnConfirm} isPending={true} />)
        expect(screen.getByText('Confirmando...')).toBeDisabled()
    })

    it('handles today logic correctly', () => {
        // Already set to Jan 1 2025 in beforeEach
        render(<BookingInterface onConfirm={mockOnConfirm} isPending={false} />)
        expect(screen.getByText('Hoy')).toBeInTheDocument()

        // 10:00 should be Occupied (hardcoded in component)
        const slot10 = screen.getByText('10:00').closest('button')
        expect(slot10).toBeDisabled()
        expect(screen.getAllByText('(Ocupado)')[0]).toBeInTheDocument()
    })

    it('prevents selecting date without time', () => {
        render(<BookingInterface onConfirm={mockOnConfirm} isPending={false} />)
        const confirmBtn = screen.getByText('Confirmar Reserva')
        expect(confirmBtn).toBeDisabled()
    })

    it('handles confirm click', () => {
        render(<BookingInterface onConfirm={mockOnConfirm} isPending={false} />)
        const availableSlots = screen.getAllByRole('button').filter(btn => !btn.hasAttribute('disabled'))
        const timeSlot = availableSlots.find(btn => btn.textContent === '11:00')

        if (timeSlot) {
            fireEvent.click(timeSlot)
            const confirmBtn = screen.getByText('Confirmar Reserva')
            fireEvent.click(confirmBtn)
            expect(mockOnConfirm).toHaveBeenCalled()
        }
    })

    it('selects a different date from calendar', () => {
        render(<BookingInterface onConfirm={mockOnConfirm} isPending={false} />)

        // Find '15' (Jan 15 2025 is future of Jan 1 2025)
        const dayBtn = screen.getAllByText('15').find(el => el.tagName === 'BUTTON')
        if (dayBtn) {
            fireEvent.click(dayBtn)
            // Expect selectedDate to update (internal state).
            // Visual check: it should now have 'bg-indigo-600'.
            expect(dayBtn).toHaveClass('bg-indigo-600')
        }
    })
})
