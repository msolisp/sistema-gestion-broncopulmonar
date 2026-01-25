import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardContent from './DashboardContent';
import { useRouter } from 'next/navigation';
import * as actions from '@/lib/actions.staff';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn().mockReturnValue({ get: jest.fn() }),
}));

// Mock actions
jest.mock('@/lib/actions.staff', () => ({
    adminCreateSystemUser: jest.fn(),
    adminUpdateSystemUser: jest.fn(),
    toggleRolePermission: jest.fn(),
    seedPermissions: jest.fn(),
    adminDeleteSystemUser: jest.fn(),
    updateRolePermissions: jest.fn(),
}));

describe.skip('DashboardContent - Permission Initialization', () => {
    const mockRouterRefresh = jest.fn();
    const mockRouterPush = jest.fn();

    const mockProps = {
        initialUsers: [],
        logs: [],
        initialPermissions: [
            { action: 'Ver Pacientes', kine: true, recep: true },
            { action: 'Editar Pacientes', kine: true, recep: true },
        ],
        appointments: [],
        currentUserRole: 'ADMIN',
        pendingExams: [],
        initialRoles: [{ id: '1', nombre: 'KINESIOLOGIST' }, { id: '2', nombre: 'ADMIN' }]
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({
            refresh: mockRouterRefresh,
            push: mockRouterPush,
        });

        // Mock window.confirm
        global.confirm = jest.fn();
    });

    it('should show feedback message when initializing permissions successfully', async () => {
        // Setup
        (global.confirm as jest.Mock).mockReturnValue(true);
        (actions.seedPermissions as jest.Mock).mockResolvedValue({ message: 'Success' });

        // Render
        render(<DashboardContent {...mockProps} />);

        // Navigate to Seguridad tab
        const securityTab = screen.getByText('Seguridad - Control de acceso');
        fireEvent.click(securityTab);

        // Click Inicializar Permisos button
        const initButton = screen.getByText('Inicializar Permisos');
        fireEvent.click(initButton);

        // Verify confirm was called
        expect(global.confirm).toHaveBeenCalledWith('¿Reiniciar matriz de permisos por defecto?');

        // Wait for feedback message
        const feedbackMessage = await screen.findByText('✓ Permisos inicializados correctamente');
        expect(feedbackMessage).toBeInTheDocument();

        // Verify seedPermissions was called
        expect(actions.seedPermissions).toHaveBeenCalledTimes(1);

        // Verify router.refresh was called
        expect(mockRouterRefresh).toHaveBeenCalledTimes(1);

        // Wait for feedback to disappear (3 seconds timeout)
        await waitFor(() => {
            expect(screen.queryByText('✓ Permisos inicializados correctamente')).not.toBeInTheDocument();
        }, { timeout: 3500 });
    });

    it('should show error feedback when initialization fails', async () => {
        // Setup
        (global.confirm as jest.Mock).mockReturnValue(true);
        (actions.seedPermissions as jest.Mock).mockResolvedValue({ message: 'Error' });

        // Render
        render(<DashboardContent {...mockProps} />);

        // Navigate to Seguridad tab
        const securityTab = screen.getByText('Seguridad - Control de acceso');
        fireEvent.click(securityTab);

        // Click button
        const initButton = screen.getByText('Inicializar Permisos');
        fireEvent.click(initButton);

        // Wait for error feedback
        const errorMessage = await screen.findByText('✗ Error al inicializar permisos');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveClass('bg-red-100', 'text-red-800');

        // Verify router.refresh was NOT called on error
        expect(mockRouterRefresh).not.toHaveBeenCalled();
    });

    it('should not initialize permissions if user cancels confirmation', async () => {
        // Setup - user clicks cancel
        (global.confirm as jest.Mock).mockReturnValue(false);

        // Render
        render(<DashboardContent {...mockProps} />);

        // Navigate to Seguridad tab
        const securityTab = screen.getByText('Seguridad - Control de acceso');
        fireEvent.click(securityTab);

        // Click button
        const initButton = screen.getByText('Inicializar Permisos');
        fireEvent.click(initButton);

        // Verify confirm was called
        expect(global.confirm).toHaveBeenCalled();

        // Verify seedPermissions was NOT called
        expect(actions.seedPermissions).not.toHaveBeenCalled();

        // Verify no feedback message appears
        expect(screen.queryByText('Inicializando...')).not.toBeInTheDocument();
    });

    it('should show loading state while initializing', async () => {
        // Setup
        (global.confirm as jest.Mock).mockReturnValue(true);

        // Make seedPermissions take some time
        let resolvePermissions: (value: any) => void;
        const permissionsPromise = new Promise((resolve) => {
            resolvePermissions = resolve;
        });
        (actions.seedPermissions as jest.Mock).mockReturnValue(permissionsPromise);

        // Render
        render(<DashboardContent {...mockProps} />);

        // Navigate to Seguridad tab
        const securityTab = screen.getByText('Seguridad - Control de acceso');
        fireEvent.click(securityTab);

        // Click button
        const initButton = screen.getByText('Inicializar Permisos');
        fireEvent.click(initButton);

        // Should show loading immediately
        const loadingMessage = await screen.findByText('Inicializando...');
        expect(loadingMessage).toBeInTheDocument();
        expect(loadingMessage).toHaveClass('bg-blue-100', 'text-blue-800');

        // Resolve the promise
        resolvePermissions!({ message: 'Success' });

        // Wait for success message
        const successMessage = await screen.findByText('✓ Permisos inicializados correctamente');
        expect(successMessage).toBeInTheDocument();
    });

    it('should have correct CSS classes for feedback messages', async () => {
        (global.confirm as jest.Mock).mockReturnValue(true);
        (actions.seedPermissions as jest.Mock).mockResolvedValue({ message: 'Success' });

        render(<DashboardContent {...mockProps} />);

        const securityTab = screen.getByText('Seguridad - Control de acceso');
        fireEvent.click(securityTab);

        const initButton = screen.getByText('Inicializar Permisos');
        fireEvent.click(initButton);

        const feedbackMessage = await screen.findByText('✓ Permisos inicializados correctamente');

        // Verify it has the correct styling classes
        expect(feedbackMessage).toHaveClass('bg-green-100');
        expect(feedbackMessage).toHaveClass('text-green-800');
        expect(feedbackMessage).toHaveClass('p-3');
        expect(feedbackMessage).toHaveClass('rounded-lg');
        expect(feedbackMessage).toHaveClass('text-sm');
        expect(feedbackMessage).toHaveClass('font-medium');
    });
});
