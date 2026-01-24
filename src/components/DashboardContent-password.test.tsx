import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardContent from './DashboardContent';
import { useRouter } from 'next/navigation';
import * as actions from '@/lib/actions';

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
}));

describe('DashboardContent - Password Validation', () => {
    const mockRouterRefresh = jest.fn();
    const mockRouterPush = jest.fn();

    const mockProps = {
        initialUsers: [],
        logs: [],
        initialPermissions: [],
        appointments: [],
        currentUserRole: 'ADMIN' as const, // Ensure Admin access
        pendingExams: [],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({
            refresh: mockRouterRefresh,
            push: mockRouterPush,
        });
    });

    it('should show password field when creating new user', () => {
        render(<DashboardContent {...mockProps} />);

        const usersTab = screen.getByText('Usuarios y Roles');
        fireEvent.click(usersTab);

        const newUserButton = screen.getByText(/Nuevo Usuario/);
        fireEvent.click(newUserButton);

        expect(screen.getByLabelText(/Contraseña/)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Mínimo 8 caracteres')).toBeInTheDocument();
    });



    it('should validate password with less than 8 characters', () => {
        render(<DashboardContent {...mockProps} />);

        fireEvent.click(screen.getByText('Usuarios y Roles'));
        fireEvent.click(screen.getByText(/Nuevo Usuario/));

        const passwordInput = screen.getByLabelText(/Contraseña/) as HTMLInputElement;
        fireEvent.change(passwordInput, { target: { value: 'Test1!' } });

        expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument();
    });

    it('should validate password without uppercase', () => {
        render(<DashboardContent {...mockProps} />);

        fireEvent.click(screen.getByText('Usuarios y Roles'));
        fireEvent.click(screen.getByText(/Nuevo Usuario/));

        const passwordInput = screen.getByLabelText(/Contraseña/);
        fireEvent.change(passwordInput, { target: { value: 'testtest1!' } });

        expect(screen.getByText('Debe contener al menos una mayúscula')).toBeInTheDocument();
    });

    it('should validate password without lowercase', () => {
        render(<DashboardContent {...mockProps} />);

        fireEvent.click(screen.getByText('Usuarios y Roles'));
        fireEvent.click(screen.getByText(/Nuevo Usuario/));

        const passwordInput = screen.getByLabelText(/Contraseña/);
        fireEvent.change(passwordInput, { target: { value: 'TESTTEST1!' } });

        expect(screen.getByText('Debe contener al menos una minúscula')).toBeInTheDocument();
    });

    it('should validate password without special character', () => {
        render(<DashboardContent {...mockProps} />);

        fireEvent.click(screen.getByText('Usuarios y Roles'));
        fireEvent.click(screen.getByText(/Nuevo Usuario/));

        const passwordInput = screen.getByLabelText(/Contraseña/);
        fireEvent.change(passwordInput, { target: { value: 'TestTest1' } });

        expect(screen.getByText('Debe contener al menos un carácter especial')).toBeInTheDocument();
    });



    it('should prevent submission if password is invalid for new user', async () => {
        (actions.adminCreateSystemUser as jest.Mock).mockResolvedValue({ message: 'Success' });

        render(<DashboardContent {...mockProps} />);

        fireEvent.click(screen.getByText('Usuarios y Roles'));
        fireEvent.click(screen.getByText(/Nuevo Usuario/));

        // Fill in form with invalid password
        fireEvent.change(screen.getByLabelText(/Nombre Completo/), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'weak' } });

        // Try to submit
        fireEvent.click(screen.getByText('Guardar Cambios'));

        // Should NOT call the action
        expect(actions.adminCreateSystemUser).not.toHaveBeenCalled();
    });

    it('should allow submission with valid password', async () => {
        (actions.adminCreateSystemUser as jest.Mock).mockResolvedValue({ message: 'Success' });

        render(<DashboardContent {...mockProps} />);

        fireEvent.click(screen.getByText('Usuarios y Roles'));
        fireEvent.click(screen.getByText(/Nuevo Usuario/));

        // Fill in form with valid password
        fireEvent.change(screen.getByLabelText(/Nombre Completo/), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('12345678'), { target: { value: '11111111' } });
        fireEvent.change(screen.getByPlaceholderText('K'), { target: { value: '1' } });
        fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'ValidPass123!' } });

        // Submit
        fireEvent.click(screen.getByText('Guardar Cambios'));

        // Should call the action
        await waitFor(() => {
            expect(actions.adminCreateSystemUser).toHaveBeenCalledTimes(1);
        });
    });

    it('should accept various special characters', () => {
        const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '=', '[', ']', '{', '}', ';', ':', '"', '|', ',', '.', '<', '>', '/', '?'];

        render(<DashboardContent {...mockProps} />);

        fireEvent.click(screen.getByText('Usuarios y Roles'));
        fireEvent.click(screen.getByText(/Nuevo Usuario/));

        const passwordInput = screen.getByLabelText(/Contraseña/);

        specialChars.forEach(char => {
            const password = `TestPass1${char}`;
            fireEvent.change(passwordInput, { target: { value: password } });

            // Should NOT show error
            expect(screen.queryByText('Debe contener al menos un carácter especial')).not.toBeInTheDocument();
        });
    });

    it('should show different placeholder when editing existing user', () => {
        const existingUsers = [{
            id: '1',
            name: 'Existing User',
            email: 'existing@test.com',
            role: 'KINESIOLOGO' as const,
            active: true
        }];

        render(<DashboardContent {...{ ...mockProps, initialUsers: existingUsers }} />);

        fireEvent.click(screen.getByText('Usuarios y Roles'));
        fireEvent.click(screen.getByText('Editar'));

        const passwordInput = screen.getByPlaceholderText('Dejar vacío para no cambiar');
        expect(passwordInput).toBeInTheDocument();
        expect(screen.getByText('(dejar vacío para mantener)')).toBeInTheDocument();
    });



    it('should validate password if provided when editing user', async () => {
        (actions.adminUpdateSystemUser as jest.Mock).mockResolvedValue({ message: 'Success' });

        const existingUsers = [{
            id: '1',
            name: 'Existing User',
            email: 'existing@test.com',
            role: 'KINESIOLOGO' as const,
            active: true
        }];

        render(<DashboardContent {...{ ...mockProps, initialUsers: existingUsers }} />);

        fireEvent.click(screen.getByText('Usuarios y Roles'));
        fireEvent.click(screen.getByText('Editar'));

        // Enter invalid password
        fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'weak' } });
        fireEvent.click(screen.getByText('Guardar Cambios'));

        // Should NOT call update
        await waitFor(() => {
            expect(actions.adminUpdateSystemUser).not.toHaveBeenCalled();
        });
    });
});
