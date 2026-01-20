import { render, screen, waitFor } from '@testing-library/react';
import PatientNavbar from './PatientNavbar';
import { useSession } from 'next-auth/react';
import { getPatientProfile } from '@/actions/patient-profile';

// Mock dependencies
const mockUseSession = jest.fn();

// Mock dependencies
jest.mock('next-auth/react', () => ({
    useSession: () => mockUseSession(),
    signOut: jest.fn(),
}));
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
    FileSpreadsheet: () => <span data-testid="spreadsheet-icon" />,
    Stethoscope: () => <span data-testid="stethoscope-icon" />,
}));

describe('PatientNavbar', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseSession.mockReturnValue({ data: null, status: 'loading' });
    });

    it('displays nothing when session is loading', () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'loading'
        });

        render(<PatientNavbar />);
        expect(screen.queryByText('Hola, Paciente')).not.toBeInTheDocument();
        expect(screen.queryByText(/Hola,/)).not.toBeInTheDocument();
    });

    it('updates name from session if available', async () => {
        mockUseSession.mockReturnValue({
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
        mockUseSession.mockReturnValue({
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
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated'
        });

        render(<PatientNavbar />);

        await waitFor(() => {
            expect(screen.getByText('Hola, Paciente')).toBeInTheDocument();
        });
    });
});
