import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PatientProfileForm from './PatientProfileForm'
import { useActionState } from 'react'

// Mock React useActionState
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useActionState: jest.fn(),
}))

// Mock server action
jest.mock('@/lib/actions', () => ({
    updatePatientProfile: jest.fn(),
}))

describe('PatientProfileForm', () => {
    const mockUser = {
        name: 'John Doe',
        patientProfile: {
            phone: '+56912345678',
            address: 'Calle Falsa 123',
            commune: 'SANTIAGO',
            birthDate: new Date('1990-01-01'),
            gender: 'Masculino',
            healthSystem: 'FONASA'
        }
    }

    beforeEach(() => {
        (useActionState as jest.Mock).mockReturnValue([{ message: '' }, jest.fn()])
    })

    it('renders form values correctly', () => {
        render(<PatientProfileForm user={mockUser} />)
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
        expect(screen.getByDisplayValue('+56912345678')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Calle Falsa 123')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Santiago')).toBeInTheDocument()
        expect(screen.getByDisplayValue('1990-01-01')).toBeInTheDocument()
    })

    it('shows success message', () => {
        (useActionState as jest.Mock).mockReturnValue([{ message: 'Success' }, jest.fn()])
        render(<PatientProfileForm user={mockUser} />)
        expect(screen.getByText('Datos actualizados correctamente')).toBeInTheDocument()
    })

    it('shows error message', () => {
        (useActionState as jest.Mock).mockReturnValue([{ message: 'Failed update' }, jest.fn()])
        render(<PatientProfileForm user={mockUser} />)
        expect(screen.getByText('Error: Failed update')).toBeInTheDocument()
    })
})
