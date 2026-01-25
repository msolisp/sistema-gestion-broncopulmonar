import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardContent from './DashboardContent';
import { useRouter } from 'next/navigation';
import * as actions from '@/lib/actions.staff';

global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve([]),
    })
) as jest.Mock;

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn().mockReturnValue({ get: jest.fn() }),
}));

jest.mock('@/lib/actions.staff', () => ({
    adminCreateSystemUser: jest.fn(),
    adminUpdateSystemUser: jest.fn(),
    toggleRolePermission: jest.fn(),
    seedPermissions: jest.fn(),
    adminDeleteSystemUser: jest.fn(),
    updateRolePermissions: jest.fn(),
}));

describe('DashboardContent - Admin User Editing', () => {
    const mockRouterRefresh = jest.fn();
    const mockRouterPush = jest.fn();

    const adminUser = {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@hospital.cl',
        role: 'ADMIN' as const,
        roleName: 'ADMIN',
        active: true,
        rut: '11.111.111-1'
    };

    const regularUser = {
        id: 'user-1',
        name: 'Regular User',
        email: 'user@hospital.cl',
        role: 'KINESIOLOGIST' as const,
        roleName: 'KINESIOLOGO',
        active: true,
        rut: '22.222.222-2'
    };

    const mockProps = {
        initialUsers: [adminUser, regularUser],
        logs: [],
        initialPermissions: [],
        appointments: [],
        currentUserRole: 'ADMIN' as const,
        currentUserEmail: 'admin@hospital.cl',
        pendingExams: [],
        initialRoles: [{ id: '1', nombre: 'KINESIOLOGIST' }, { id: '2', nombre: 'ADMIN' }],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({
            refresh: mockRouterRefresh,
            push: mockRouterPush,
        });
    });

    it('should show Edit button for admin user', () => {
        render(<DashboardContent {...mockProps} />);

        fireEvent.click(screen.getByText('Usuarios y Roles'));

        // Admin should have Edit button
        const editButtons = screen.getAllByText('Editar');
        expect(editButtons.length).toBeGreaterThan(0);
    });

    it('should NOT show Delete button for admin user', () => {
        render(<DashboardContent {...mockProps} />);

        fireEvent.click(screen.getByText('Usuarios y Roles'));

        // Find the row containing 'Admin User'
        const adminRow = screen.getByText('Admin User').closest('tr');

        // Ensure 'Eliminar' button is NOT within that row
        // queryByText returns null if not found, checking within() the row scoping
        const { queryByText } = require('@testing-library/dom');
        expect(queryByText(adminRow as HTMLElement, 'Eliminar')).not.toBeInTheDocument();
    });

    it('should open edit modal when clicking Edit on admin user', () => {
        render(<DashboardContent {...mockProps} />);

        fireEvent.click(screen.getByText('Usuarios y Roles'));

        // Click first Edit button (admin)
        const editButtons = screen.getAllByText('Editar');
        fireEvent.click(editButtons[0]);

        // Modal should open with admin data
        expect(screen.getByText('Editar Usuario')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Admin User')).toBeInTheDocument();
        expect(screen.getByDisplayValue('admin@hospital.cl')).toBeInTheDocument();
    });

    it('should disable role select when editing admin', () => {
        render(<DashboardContent {...mockProps} />);

        fireEvent.click(screen.getByText('Usuarios y Roles'));

        const editButtons = screen.getAllByText('Editar');
        fireEvent.click(editButtons[0]); // Edit admin

        const roleSelect = screen.getByLabelText(/Rol/) as HTMLSelectElement;
        expect(roleSelect).toBeDisabled();
        expect(screen.getByText('El rol de administrador no puede ser modificado')).toBeInTheDocument();
    });

    it('should disable active checkbox when editing admin', () => {
        render(<DashboardContent {...mockProps} />);

        fireEvent.click(screen.getByText('Usuarios y Roles'));

        const editButtons = screen.getAllByText('Editar');
        fireEvent.click(editButtons[0]); // Edit admin

        const activeCheckbox = screen.getByLabelText(/Usuario Activo/) as HTMLInputElement;
        expect(activeCheckbox).toBeDisabled();
        expect(screen.getByText('(No se puede desactivar admin)')).toBeInTheDocument();
    });

    it('should allow editing admin name and email', async () => {
        (actions.adminUpdateSystemUser as jest.Mock).mockResolvedValue({ message: 'Success' });

        render(<DashboardContent {...mockProps} />);

        fireEvent.click(screen.getByText('Usuarios y Roles'));

        const editButtons = screen.getAllByText('Editar');
        fireEvent.click(editButtons[0]);

        // Change name and email
        const nameInput = screen.getByLabelText(/Nombre Completo/);
        const emailInput = screen.getByLabelText(/Email/);

        fireEvent.change(nameInput, { target: { value: 'Updated Admin Name' } });
        fireEvent.change(emailInput, { target: { value: 'newadmin@hospital.cl' } });

        fireEvent.click(screen.getByText('Guardar Cambios'));

        await waitFor(() => {
            expect(actions.adminUpdateSystemUser).toHaveBeenCalled();
        });
    });

    it('should allow changing admin password', async () => {
        (actions.adminUpdateSystemUser as jest.Mock).mockResolvedValue({ message: 'Success' });

        render(<DashboardContent {...mockProps} />);

        fireEvent.click(screen.getByText('Usuarios y Roles'));

        const editButtons = screen.getAllByText('Editar');
        fireEvent.click(editButtons[0]);

        // Enter new password
        const passwordInput = screen.getByLabelText(/Contraseña/);
        fireEvent.change(passwordInput, { target: { value: 'NewAdminPass123!' } });

        fireEvent.click(screen.getByText('Guardar Cambios'));

        await waitFor(() => {
            expect(actions.adminUpdateSystemUser).toHaveBeenCalled();
        });
    });

    it('should NOT disable role select for non-admin users', () => {
        render(<DashboardContent {...mockProps} />);

        fireEvent.click(screen.getByText('Usuarios y Roles'));

        const editButtons = screen.getAllByText('Editar');
        fireEvent.click(editButtons[1]); // Edit regular user

        const roleSelect = screen.getByLabelText(/Rol/) as HTMLSelectElement;
        expect(roleSelect).not.toBeDisabled();
    });

    it('should NOT disable active checkbox for non-admin users', () => {
        render(<DashboardContent {...mockProps} />);

        fireEvent.click(screen.getByText('Usuarios y Roles'));

        const editButtons = screen.getAllByText('Editar');
        fireEvent.click(editButtons[1]); // Edit regular user

        const activeCheckbox = screen.getByLabelText(/Usuario Activo/) as HTMLInputElement;
        expect(activeCheckbox).not.toBeDisabled();
    });

    it('should show Delete button for non-admin users', () => {
        render(<DashboardContent {...mockProps} />);

        fireEvent.click(screen.getByText('Usuarios y Roles'));

        // Should have Delete button for regular users
        const deleteButtons = screen.getAllByText('Eliminar');
        expect(deleteButtons.length).toBeGreaterThan(0);
    });
});
