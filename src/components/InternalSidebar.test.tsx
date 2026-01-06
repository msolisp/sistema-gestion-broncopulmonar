import { render, screen, fireEvent } from '@testing-library/react';
import InternalSidebar from './InternalSidebar';
import { signOut } from 'next-auth/react';

// Mock next-auth/react
const mockUseSession = jest.fn();
jest.mock('next-auth/react', () => ({
    signOut: jest.fn(),
    useSession: () => mockUseSession(),
}));

describe('InternalSidebar', () => {
    const mockUser = {
        name: 'Test Administrator',
        role: 'ADMIN',
    };

    const mockKine = {
        name: 'Test Kine',
        role: 'KINESIOLOGIST',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Default: no session
        mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    });

    it('renders sidebar with user details from props', () => {
        render(<InternalSidebar user={mockUser} />);

        expect(screen.getByText('Test Administrator')).toBeInTheDocument();
        expect(screen.getByText('ADMIN')).toBeInTheDocument();
        expect(screen.getByText('Pacientes')).toBeInTheDocument();
    });

    it('renders sidebar using session fallback when prop is missing', () => {
        mockUseSession.mockReturnValue({
            data: { user: mockUser },
            status: 'authenticated'
        });

        render(<InternalSidebar />);

        expect(screen.getByText('Test Administrator')).toBeInTheDocument();
        expect(screen.getByText('ADMIN')).toBeInTheDocument();
    });

    it('shows Administration link for ADMIN (via props)', () => {
        render(<InternalSidebar user={mockUser} />);
        expect(screen.getByText('Administración')).toBeInTheDocument();
    });

    it('shows Administration link for ADMIN (via session)', () => {
        mockUseSession.mockReturnValue({
            data: { user: mockUser },
            status: 'authenticated'
        });
        render(<InternalSidebar />);
        expect(screen.getByText('Administración')).toBeInTheDocument();
    });

    it('hides Administration link for non-ADMIN', () => {
        render(<InternalSidebar user={mockKine} />);

        expect(screen.queryByText('Administración')).not.toBeInTheDocument();
    });

    it('calls signOut when logout button is clicked', () => {
        render(<InternalSidebar user={mockUser} />);

        const logoutBtn = screen.getByText('Cerrar Sesión');
        fireEvent.click(logoutBtn);

        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/intranet/login' });
    });

    it('handles missing user in both props and session gracefully', () => {
        mockUseSession.mockReturnValue({ data: null });
        render(<InternalSidebar user={undefined} />);

        expect(screen.getByText('Usuario')).toBeInTheDocument();
        expect(screen.getByText('Role')).toBeInTheDocument();
    });
});
