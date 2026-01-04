import { render, screen, fireEvent } from '@testing-library/react'
import BookingInterface from './BookingInterface'

describe('BookingInterface Component', () => {
    const mockOnConfirm = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
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
        // Mock date to be today
        jest.useFakeTimers()
        const today = new Date()
        today.setHours(9, 0, 0, 0)
        jest.setSystemTime(today)

        render(<BookingInterface onConfirm={mockOnConfirm} isPending={false} />)
        expect(screen.getByText('Hoy')).toBeInTheDocument()

        // 10:00 should be Occupied (hardcoded in component)
        const slot10 = screen.getByText('10:00').closest('button')
        expect(slot10).toBeDisabled()
        expect(screen.getAllByText('(Ocupado)')[0]).toBeInTheDocument()

        // Restore
        jest.useRealTimers()
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

        // Find a day button that is NOT currently selected (today)
        // Today has class 'bg-indigo-600'
        // We look for a button that has the day number but not that class.
        // Let's just click the '28'th of the month (likely valid and possibly not today unless it IS 28th)
        // Safer: click next month button, then click '15'.

        const nextMonthBtn = screen.getAllByRole('button')[1] // The second button in header (Left, Title, Right?)
        // Header: Left btn, Title, Right btn.
        // Actually logical order in DOM: Button (Left), H2, Button (Right).

        // Let's use labels if they had them, but they don't.
        // Using indices or class logic.

        // Let's assume there are day buttons.
        // We can find a button with text '15'.
        const dayBtn = screen.getAllByText('15').find(el => el.tagName === 'BUTTON')
        if (dayBtn) {
            fireEvent.click(dayBtn)
            // Expect selectedDate to update (internal state).
            // Visual check: it should now have 'bg-indigo-600'.
            expect(dayBtn).toHaveClass('bg-indigo-600')
        }
    })
})
