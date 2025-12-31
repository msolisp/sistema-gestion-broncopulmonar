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
})
