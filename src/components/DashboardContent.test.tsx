
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardContent from './DashboardContent';
import { useRouter, useSearchParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
}));

jest.mock('./PatientsManagementTable', () => () => <div data-testid="patients-table">Patients Table</div>);
jest.mock('./AppointmentCalendar', () => () => <div data-testid="calendar">Calendar</div>);
jest.mock('./PendingExamsWidget', () => () => <div data-testid="exams-widget">Exams</div>);
jest.mock('./master-tables', () => ({
    ComunasManager: () => <div>Comunas Manager</div>
}));

describe('DashboardContent', () => {
    const mockRouter = { push: jest.fn(), refresh: jest.fn() };
    const mockSearchParams = { get: jest.fn() };

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    });

    const defaultProps = {
        initialUsers: [],
        logs: [],
        initialPermissions: [],
        appointments: [],
        pendingExams: [],
        currentUserRole: 'ADMIN',
        currentUserEmail: 'admin@test.com',
        initialRoles: [],
    };

    it('renders default tab for Admin', () => {
        render(<DashboardContent {...defaultProps} />);
        // Admin defaults to Agendamiento tab, which shows "Agendamiento" as title
        expect(screen.getByText('Agendamiento', { selector: 'h1' })).toBeInTheDocument();
    });

    it('hides tabs if no permissions', () => {
        render(<DashboardContent {...defaultProps} currentUserRole="KINESIOLOGO" initialPermissions={[]} />);
        expect(screen.queryByText('Usuarios y Roles')).not.toBeInTheDocument();
        expect(screen.queryByText('Gestión de Usuarios')).not.toBeInTheDocument();
    });

    it('shows tabs based on permissions', () => {
        const permissions = [{ action: 'Ver Usuarios', kinesiologo: true }];
        render(<DashboardContent {...defaultProps} currentUserRole="KINESIOLOGO" initialPermissions={permissions} />);
        expect(screen.getByText('Usuarios y Roles')).toBeInTheDocument();
    });

    it('switches tabs', () => {
        render(<DashboardContent {...defaultProps} />);
        const tab = screen.getByText('Tablas Maestras');
        fireEvent.click(tab);
        expect(screen.getByText('Comunas')).toBeInTheDocument();
    });

    it('updates URL when switching tabs', () => {
        const pushStateSpy = jest.spyOn(window.history, 'pushState');
        render(<DashboardContent {...defaultProps} />);
        const tab = screen.getByText('Usuarios y Roles');
        fireEvent.click(tab);
        expect(pushStateSpy).toHaveBeenCalledWith({}, '', expect.stringContaining('tab=Usuarios'));
        pushStateSpy.mockRestore();
    });

    it('renders PermissionMatrix when on Seguridad tab', () => {
        render(<DashboardContent {...defaultProps} />);
        const tab = screen.getByText('Seguridad - Control de acceso');
        fireEvent.click(tab);
        expect(screen.getByText('Portal Interno (Staff)')).toBeInTheDocument();
        expect(screen.getByText('Portal Pacientes')).toBeInTheDocument();
        expect(screen.getByText('Mantenedor de Roles')).toBeInTheDocument();
    });
});
