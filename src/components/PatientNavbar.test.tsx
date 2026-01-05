
import { render, screen, fireEvent } from '@testing-library/react';
import PatientNavbar from './PatientNavbar';
import { signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

// Mock dependencies
jest.mock('next-auth/react', () => ({
    signOut: jest.fn(),
    useSession: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    usePathname: jest.fn(),
}));

jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    );
});

describe('PatientNavbar', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (usePathname as jest.Mock).mockReturnValue('/portal');
        (useSession as jest.Mock).mockReturnValue({
            data: { user: { name: 'Test User' } },
            status: 'authenticated'
        });
    });

    it('should render navbar with user name from session', () => {
        render(<PatientNavbar />);
        expect(screen.getByText('Portal Paciente')).toBeInTheDocument();
        expect(screen.getByText(/Hola, Test User/)).toBeInTheDocument();
    });

    it('should render default name if no user name', () => {
        (useSession as jest.Mock).mockReturnValue({
            data: { user: { name: null } },
            status: 'authenticated'
        });
        render(<PatientNavbar />);
        expect(screen.getByText(/Hola, Paciente/)).toBeInTheDocument();
    });

    it('should call signOut when logout button is clicked', () => {
        render(<PatientNavbar />);
        const logoutButton = screen.getByRole('button');
        fireEvent.click(logoutButton);
        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
    });
});
