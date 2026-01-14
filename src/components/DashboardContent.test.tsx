import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DashboardContent from './DashboardContent'
import '@testing-library/jest-dom'

// Mock Data
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve([]),
    })
) as jest.Mock;

const mockProps = {
    patients: [
        {
            id: '1',
            rut: '1-9',
            commune: 'Santiago',
            diagnosisDate: new Date('2024-01-01'),
            gender: 'Male',
            birthDate: new Date('1990-01-01'),
            user: { name: 'Patient One', email: 'p1@test.com', rut: '1-9' }
        }
    ],
    initialUsers: [
        {
            id: '2',
            name: 'Kine User',
            email: 'kine@test.com',
            role: 'KINESIOLOGIST',
            active: true
        }
    ],
    logs: [
        {
            id: 'log1',
            action: 'LOGIN_SUCCESS',
            details: 'User logged in',
            userEmail: 'admin@test.com',
            ipAddress: '127.0.0.1',
            createdAt: new Date().toISOString()
        }
    ],
    initialPermissions: [
        { action: 'Ver Pacientes', kine: true, recep: true },
        { action: 'Editar Pacientes', kine: true, recep: false }
    ],
    appointments: [
        {
            id: 'apt1',
            date: new Date().toISOString(),
            status: 'PENDING',
            notes: 'Test appointment',
            patient: {
                user: {
                    name: 'Patient One',
                    email: 'p1@test.com',
                    rut: '1-9'
                }
            }
        }
    ]
}

// Mock Server Actions
jest.mock('../lib/actions', () => ({
    adminCreateSystemUser: jest.fn().mockResolvedValue({ message: 'Success' }),
    adminUpdateSystemUser: jest.fn().mockResolvedValue({ message: 'Success' }),
    toggleRolePermission: jest.fn().mockResolvedValue({ message: 'Success' })
}))

// Mock useRouter
jest.mock("next/navigation", () => ({
    useRouter() {
        return {
            refresh: jest.fn(),
        };
    },
    useSearchParams() {
        return {
            get: jest.fn().mockReturnValue(null),
        }
    },
}));

describe('DashboardContent Component', () => {
    it('renders without crashing', () => {
        render(<DashboardContent {...mockProps} />)
        expect(screen.getByText('Administración Central')).toBeInTheDocument()
    })

    it('displays Patients Management tab by default', async () => {
        render(<DashboardContent {...mockProps} />)
        await waitFor(() => {
            expect(screen.getByText('Gestion de Pacientes', { selector: 'h2' })).toBeInTheDocument()
        })
    })

    it('navigates to User Management', () => {
        render(<DashboardContent {...mockProps} />)
        fireEvent.click(screen.getByText('Usuarios y Roles'))
        expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument()
        expect(screen.getByText('Kine User')).toBeInTheDocument()
    })

    it('navigates to Other Tabs', () => {
        render(<DashboardContent {...mockProps} />)

        // Tablas Maestras
        fireEvent.click(screen.getByText('Tablas Maestras'))
        expect(screen.getByText('Comunas')).toBeInTheDocument()

        // Auditoría
        fireEvent.click(screen.getByText('Auditoría'))
        expect(screen.getByText('Logs de Sistema (Últimas 24h)')).toBeInTheDocument()
        expect(screen.getByText('LOGIN_SUCCESS')).toBeInTheDocument()
    })

    it('renders and interacts with Permission Matrix', async () => {
        render(<DashboardContent {...mockProps} />)

        // Switch to RBAC tab
        fireEvent.click(screen.getByText('Seguridad - Control de acceso'))

        expect(screen.getByText('Matriz de Permisos')).toBeInTheDocument()
        expect(screen.getByText('Ver Pacientes')).toBeInTheDocument()

        // Toggle a permission (first green button)
        const buttons = screen.getAllByRole('button')
        // We have tabs (4) + matrix buttons. 
        // Matrix buttons are inside table.
        const row = screen.getByText('Ver Pacientes').closest('tr')
        const kineBtn = row?.querySelectorAll('button')[0] // Kine column

        expect(kineBtn).toBeDefined()
        if (kineBtn) {
            fireEvent.click(kineBtn)
            // It should optimistically update. 
            // Since we mock successful action, it stays toggled.
        }
    })

    it('opens existing user modal', () => {
        render(<DashboardContent {...mockProps} />)
        fireEvent.click(screen.getByText('Usuarios y Roles'))
        const editBtn = screen.getByText('Editar')
        fireEvent.click(editBtn)
        expect(screen.getByDisplayValue('Kine User')).toBeInTheDocument()
    })

    it('opens new user modal', () => {
        render(<DashboardContent {...mockProps} />)
        fireEvent.click(screen.getByText('Usuarios y Roles'))
        const newBtn = screen.getByRole('button', { name: /nuevo usuario/i })
        fireEvent.click(newBtn)
        expect(screen.getByText('Nuevo Usuario', { selector: 'h3' })).toBeInTheDocument()
    })
})
