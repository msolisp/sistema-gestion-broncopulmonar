import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserModal } from './UserModal';
import { adminCreateSystemUser, adminUpdateSystemUser } from '@/lib/actions.staff';

// Mock dependencies
jest.mock('@/lib/actions.staff', () => ({
    adminCreateSystemUser: jest.fn(),
    adminUpdateSystemUser: jest.fn(),
}));

jest.mock('@/lib/validators', () => ({
    obtenerCuerpoRut: jest.fn(val => val.split('-')[0]),
    obtenerDigitoVerificador: jest.fn(val => val.split('-')[1] || ''),
    validarRutChileno: jest.fn(() => true),
}));

jest.mock('lucide-react', () => ({
    X: () => <span data-testid="icon-close">X</span>,
    Eye: () => <span data-testid="icon-eye">Eye</span>,
    EyeOff: () => <span data-testid="icon-eye-off">EyeOff</span>,
}));

describe('UserModal', () => {
    const mockOnClose = jest.fn();
    const mockOnSuccess = jest.fn();
    const mockRoles = [
        { id: 'role-1', nombre: 'KINESIOLOGO' },
        { id: 'role-2', nombre: 'ADMIN' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('does not render when closed', () => {
        render(<UserModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} userToEdit={null} roles={mockRoles} />);
        expect(screen.queryByText('Nuevo Usuario')).not.toBeInTheDocument();
    });

    it('renders correctly when open (create mode)', () => {
        render(<UserModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} userToEdit={null} roles={mockRoles} />);
        expect(screen.getByText('Nuevo Usuario')).toBeInTheDocument();

        // Verify autocomplete attributes (The fix)
        expect(screen.getByLabelText('Nombre Completo')).toHaveAttribute('autocomplete', 'off');
        expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'off');
        expect(screen.getByPlaceholderText('12345678')).toHaveAttribute('autocomplete', 'off');
        expect(screen.getByPlaceholderText('K')).toHaveAttribute('autocomplete', 'off');

        // Password should be new-password
        // Note: We need to find by placeholder or label since type is password
        // The label contains a span if editing, so straightforward text match works for create
        expect(screen.getByLabelText(/Contraseña/)).toHaveAttribute('autocomplete', 'new-password');
    });

    it('renders correctly when open (edit mode)', () => {
        const userToEdit = {
            id: 'user-1',
            name: 'John Doe',
            email: 'john@test.com',
            rut: '12345678-K',
            role: 'role-1',
            roleName: 'KINESIOLOGO',
            active: true
        };

        render(<UserModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} userToEdit={userToEdit} roles={mockRoles} />);
        expect(screen.getByText('Editar Usuario')).toBeInTheDocument();
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('12345678')).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        render(<UserModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} userToEdit={null} roles={mockRoles} />);

        const saveBtn = screen.getByText('Guardar Cambios');
        fireEvent.click(saveBtn);

        expect(await screen.findByText('Nombre, Email y RUT son obligatorios')).toBeInTheDocument();
        expect(adminCreateSystemUser).not.toHaveBeenCalled();
    });

    it('submits form successfully (create)', async () => {
        (adminCreateSystemUser as jest.Mock).mockResolvedValue({ message: 'Success' });
        const { validarRutChileno } = require('@/lib/validators');
        validarRutChileno.mockReturnValue(true);

        render(<UserModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} userToEdit={null} roles={mockRoles} />);

        fireEvent.change(screen.getByLabelText('Nombre Completo'), { target: { value: 'New User' } });
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('12345678'), { target: { value: '11111111' } });
        fireEvent.change(screen.getByPlaceholderText('K'), { target: { value: '1' } });
        fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'Pass123!' } });

        fireEvent.click(screen.getByText('Guardar Cambios'));

        await waitFor(() => {
            expect(adminCreateSystemUser).toHaveBeenCalledWith(null, expect.any(FormData));
            const formData = (adminCreateSystemUser as jest.Mock).mock.calls[0][1];
            expect(formData.get('name')).toBe('New User');
            expect(formData.get('password')).toBe('Pass123!');
        });

        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('toggles password visibility', () => {
        render(<UserModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} userToEdit={null} roles={mockRoles} />);

        const passwordInput = screen.getByLabelText(/Contraseña/);
        expect(passwordInput).toHaveAttribute('type', 'password');

        const toggleBtn = screen.getByTestId('icon-eye').closest('button');
        fireEvent.click(toggleBtn!);

        expect(passwordInput).toHaveAttribute('type', 'text');
        expect(screen.getByTestId('icon-eye-off')).toBeInTheDocument();
    });

    it('prevents editing admin role', () => {
        const adminUser = {
            id: 'admin-id',
            name: 'Admin User',
            email: 'admin@hospital.cl',
            rut: '11111111-1',
            role: 'role-2',
            roleName: 'ADMIN',
            active: true
        };

        render(<UserModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} userToEdit={adminUser} roles={mockRoles} />);

        const roleSelect = screen.getByLabelText('Rol');
        expect(roleSelect).toBeDisabled();
        expect(screen.getByText('El rol de administrador no puede ser modificado')).toBeInTheDocument();
    });

    it('populates form with user data when editing', () => {
        const userToEdit = {
            id: 'user-1',
            name: 'Jane Doe',
            email: 'jane@test.com',
            rut: '12345678-K',
            role: 'role-1',
            roleName: 'KINESIOLOGO',
            active: false,
            region: 'Metropolitana de Santiago',
            commune: 'PROVIDENCIA',
            address: 'Av. Test 123'
        };

        render(<UserModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} userToEdit={userToEdit} roles={mockRoles} />);

        expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('jane@test.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('12345678')).toBeInTheDocument();
        // For selects, checking value is safer
        expect(screen.getByLabelText('Región')).toHaveValue('Metropolitana de Santiago');
        expect(screen.getByLabelText('Comuna')).toHaveValue('PROVIDENCIA');
        expect(screen.getByDisplayValue('Av. Test 123')).toBeInTheDocument();
        expect(screen.getByLabelText('Usuario Activo')).not.toBeChecked();
    });

    it('submits form successfully (edit mode) (lines 136-138 coverage)', async () => {
        (adminUpdateSystemUser as jest.Mock).mockResolvedValue({ message: 'Success' });
        const { validarRutChileno } = require('@/lib/validators');
        validarRutChileno.mockReturnValue(true);

        const userToEdit = {
            id: 'user-123',
            name: 'Jane Doe',
            email: 'jane@test.com',
            rut: '12345678-K',
            role: 'role-1',
            roleName: 'KINESIOLOGO',
            active: true
        };

        render(<UserModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} userToEdit={userToEdit} roles={mockRoles} />);

        // Change name
        fireEvent.change(screen.getByLabelText('Nombre Completo'), { target: { value: 'Jane Updated' } });

        fireEvent.click(screen.getByText('Guardar Cambios'));

        await waitFor(() => {
            expect(adminUpdateSystemUser).toHaveBeenCalledWith(null, expect.any(FormData));
            const formData = (adminUpdateSystemUser as jest.Mock).mock.calls[0][1];
            expect(formData.get('name')).toBe('Jane Updated');
            expect(formData.get('id')).toBe('user-123'); // Verify ID is appended
        });

        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles server validation failure (non-exception)', async () => {
        (adminCreateSystemUser as jest.Mock).mockResolvedValue({ message: 'Email already exists' });
        const { validarRutChileno } = require('@/lib/validators');
        validarRutChileno.mockReturnValue(true);

        render(<UserModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} userToEdit={null} roles={mockRoles} />);

        // Fill valid form
        fireEvent.change(screen.getByLabelText('Nombre Completo'), { target: { value: 'User' } });
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('12345678'), { target: { value: '11111111' } });
        fireEvent.change(screen.getByPlaceholderText('K'), { target: { value: '1' } });
        fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'Pass123!' } });

        fireEvent.click(screen.getByText('Guardar Cambios'));

        expect(await screen.findByText('Email already exists')).toBeInTheDocument();
    });

    it('covers missing userToEdit properties logic', () => {
        // userToEdit with null properties to cover lines ~38-45 defaults
        const incompleteUser = {
            id: 'x',
            rut: '1-9',
            // Missing name, email, etc.
        } as any;

        render(<UserModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} userToEdit={incompleteUser} roles={mockRoles} />);

        expect(screen.getByDisplayValue('1')).toBeInTheDocument(); // rutBody
        expect(screen.getByLabelText('Nombre Completo')).toHaveValue('');
    });

    it('updates all fields correctly (function coverage)', () => {
        render(<UserModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} userToEdit={null} roles={mockRoles} />);

        // Region & Commune
        fireEvent.change(screen.getByLabelText('Región'), { target: { value: 'Metropolitana de Santiago' } });
        fireEvent.change(screen.getByLabelText('Comuna'), { target: { value: 'PROVIDENCIA' } });

        // Address
        fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Calle Falsa 123' } });

        // Role
        fireEvent.change(screen.getByLabelText('Rol'), { target: { value: 'role-2' } });

        // Active
        const activeCheck = screen.getByLabelText('Usuario Activo');
        fireEvent.click(activeCheck); // Toggle off
        expect(activeCheck).not.toBeChecked();
        fireEvent.click(activeCheck); // Toggle on
        expect(activeCheck).toBeChecked();
    });

    it('shows error for invalid RUT', async () => {
        const { validarRutChileno } = require('@/lib/validators');
        validarRutChileno.mockReturnValue(false); // Force fail

        render(<UserModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} userToEdit={null} roles={mockRoles} />);

        fireEvent.change(screen.getByLabelText('Nombre Completo'), { target: { value: 'User' } });
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('12345678'), { target: { value: '11111111' } });
        fireEvent.change(screen.getByPlaceholderText('K'), { target: { value: '1' } });

        fireEvent.click(screen.getByText('Guardar Cambios'));

        expect(await screen.findByText('RUT inválido. Verifique el cuerpo y dígito verificador.')).toBeInTheDocument();
    });

    it('validates password complexity on save (lines 98-103)', async () => {
        render(<UserModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} userToEdit={null} roles={mockRoles} />);

        const passwordInput = screen.getByLabelText(/Contraseña/);

        // Enter invalid password
        fireEvent.change(passwordInput, { target: { value: 'short' } });

        // Click save to trigger handleSave validation logic (lines 98-103)
        fireEvent.click(screen.getByText('Guardar Cambios'));

        expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument();

        // Check error formatting (line 242)
        expect(passwordInput).toHaveClass('border-red-500');
        expect(passwordInput).toHaveClass('focus:ring-red-500');
    });

    it('validates password complexity in edit mode (lines 105-110)', async () => {
        const userToEdit = {
            id: 'user-1',
            name: 'Jane Doe',
            email: 'jane@test.com',
            rut: '12345678-K',
            role: 'role-1',
            roleName: 'KINESIOLOGO',
            active: true,
            rutBody: '12345678',
            rutDv: 'K'
        };

        render(<UserModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} userToEdit={userToEdit} roles={mockRoles} />);

        // Enter invalid password
        fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'short' } });

        fireEvent.click(screen.getByText('Guardar Cambios'));

        expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument();
        expect(adminUpdateSystemUser).not.toHaveBeenCalled();
    });

    it('handles unexpected errors (catch block)', async () => {
        // Force an error in execution
        (adminCreateSystemUser as jest.Mock).mockRejectedValue(new Error('Network Error'));
        const { validarRutChileno } = require('@/lib/validators');
        validarRutChileno.mockReturnValue(true);

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        render(<UserModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} userToEdit={null} roles={mockRoles} />);

        fireEvent.change(screen.getByLabelText('Nombre Completo'), { target: { value: 'User' } });
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('12345678'), { target: { value: '11111111' } });
        fireEvent.change(screen.getByPlaceholderText('K'), { target: { value: '1' } });

        // Password is required for new user
        fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'Pass123!' } });

        const saveBtn = screen.getByText('Guardar Cambios');
        fireEvent.click(saveBtn);

        expect(await screen.findByText('Error de conexión')).toBeInTheDocument();
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('resets form when opened for new user (lines 48-60 coverage)', () => {
        const { rerender } = render(<UserModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} userToEdit={null} roles={mockRoles} />);

        rerender(<UserModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} userToEdit={null} roles={mockRoles} />);

        expect(screen.getByLabelText('Nombre Completo')).toHaveValue('');
        expect(screen.getByLabelText('Email')).toHaveValue('');
        expect(screen.getByLabelText('Rol')).toHaveValue('role-1');
    });
});
