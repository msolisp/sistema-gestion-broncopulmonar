import { render, screen } from '@testing-library/react';
import AppointmentList from './AppointmentList';

describe('AppointmentList', () => {
    const mockAppointments = [
        {
            id: '1',
            date: new Date('2025-01-20T10:00:00').toISOString(),
            status: 'PENDING',
            patient: { name: 'Juan Perez' }
        },
        {
            id: '2',
            date: new Date('2025-01-21T11:00:00').toISOString(),
            status: 'CONFIRMED',
            patient: { name: 'Maria Gomez' }
        },
        {
            id: '3',
            date: new Date('2025-01-22T12:00:00').toISOString(),
            status: 'CANCELLED',
            patient: { name: 'Pedro Tapia' }
        }
    ];

    it('renders empty state when no appointments', () => {
        render(<AppointmentList appointments={[]} />);
        expect(screen.getByText('Sin reservas aún')).toBeInTheDocument();
        expect(screen.getByText('No tienes horas agendadas en este momento.')).toBeInTheDocument();
    });

    it('renders list of appointments with correct details', () => {
        render(<AppointmentList appointments={mockAppointments} />);

        // Check for statuses
        expect(screen.getByText('Pendiente')).toBeInTheDocument();
        expect(screen.getByText('Confirmada')).toBeInTheDocument();
        expect(screen.getByText('Cancelada')).toBeInTheDocument();

        // Check for dates (partial text match is safer due to locale)
        // We look for parts of the date string or use a broader check
        const listItems = screen.getAllByText(/20/); // 2025 or 20th
        expect(listItems.length).toBeGreaterThan(0);
    });
});
