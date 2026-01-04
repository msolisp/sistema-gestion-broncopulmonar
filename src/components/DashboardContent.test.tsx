import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DashboardContent from './DashboardContent'
import '@testing-library/jest-dom'

// Mock Data
const mockProps = {
    patients: [
        {
            id: '1',
            rut: '1-9',
            commune: 'Santiago',
            diagnosisDate: new Date('2024-01-01'),
            user: { name: 'Patient One', email: 'p1@test.com' }
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
            createdAt: new Date()
        }
    ],
    initialPermissions: [
        { action: 'Ver Pacientes', kine: true, recep: true },
        { action: 'Editar Pacientes', kine: true, recep: false }
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
}));

describe('DashboardContent Component', () => {
    it('renders without crashing', () => {
        render(<DashboardContent {...mockProps} />)
        expect(screen.getByText('Administración Central')).toBeInTheDocument()
    })

    it('displays user management tab by default', () => {
        render(<DashboardContent {...mockProps} />)
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
        const editBtn = screen.getByText('Editar')
        fireEvent.click(editBtn)
        expect(screen.getByDisplayValue('Kine User')).toBeInTheDocument()
    })

    it('opens new user modal', () => {
        render(<DashboardContent {...mockProps} />)
        const newBtn = screen.getByRole('button', { name: /nuevo usuario/i })
        fireEvent.click(newBtn)
        expect(screen.getByText('Nuevo Usuario', { selector: 'h3' })).toBeInTheDocument()
    })
})
