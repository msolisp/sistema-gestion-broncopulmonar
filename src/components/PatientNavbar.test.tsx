import { render, screen, waitFor } from '@testing-library/react';
import PatientNavbar from './PatientNavbar';
import { useSession } from 'next-auth/react';
import { getPatientProfile } from '@/actions/patient-profile';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('@/actions/patient-profile', () => ({
    getPatientProfile: jest.fn()
}));
jest.mock('next/link', () => {
    return ({ children }: { children: React.ReactNode }) => {
        return children;
    }
});
jest.mock('lucide-react', () => ({
    LogOut: () => <span data-testid="logout-icon" />,
    Activity: () => <span data-testid="activity-icon" />,
    Calendar: () => <span data-testid="calendar-icon" />,
    FileText: () => <span data-testid="file-icon" />,
    Home: () => <span data-testid="home-icon" />,
    User: () => <span data-testid="user-icon" />,
}));

describe('PatientNavbar', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('displays nothing when session is loading', () => {
        (useSession as jest.Mock).mockReturnValue({
            data: null,
            status: 'loading'
        });

        render(<PatientNavbar />);
        expect(screen.queryByText('Hola, Paciente')).not.toBeInTheDocument();
        expect(screen.queryByText(/Hola,/)).not.toBeInTheDocument();
    });

    it('updates name from session if available', async () => {
        (useSession as jest.Mock).mockReturnValue({
            data: {
                user: {
                    name: 'Pedro Araya',
                    email: 'pedro@email.com',
                    id: '123'
                }
            },
            status: 'authenticated'
        });

        render(<PatientNavbar />);

        await waitFor(() => {
            expect(screen.getByText('Hola, Pedro')).toBeInTheDocument();
        });
    });

    it('fetches profile if session name is generic "Paciente"', async () => {
        (useSession as jest.Mock).mockReturnValue({
            data: {
                user: {
                    name: 'Paciente',
                    email: 'pedro@email.com',
                    id: '123'
                }
            },
            status: 'authenticated'
        });

        (getPatientProfile as jest.Mock).mockResolvedValue({ user: { name: 'Juan Perez' } });

        render(<PatientNavbar />);

        // Should update to Juan eventually
        await waitFor(() => {
            expect(screen.getByText('Hola, Juan')).toBeInTheDocument();
        });
    });

    it('falls back to "Paciente" if unauthenticated or no email', async () => {
        (useSession as jest.Mock).mockReturnValue({
            data: null,
            status: 'unauthenticated'
        });

        render(<PatientNavbar />);

        await waitFor(() => {
            expect(screen.getByText('Hola, Paciente')).toBeInTheDocument();
        });
    });
});
