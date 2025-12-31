import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PatientsTable from './PatientsTable'
import '@testing-library/jest-dom'
import * as XLSX from 'xlsx'

jest.mock('xlsx', () => ({
    utils: {
        json_to_sheet: jest.fn(),
        book_new: jest.fn(),
        book_append_sheet: jest.fn(),
    },
    writeFile: jest.fn(),
}))

jest.mock('@/lib/actions', () => ({
    adminCreatePatient: jest.fn(),
    adminUpdatePatient: jest.fn(),
    deletePatient: jest.fn(),
}))

const mockPatients = [
    {
        id: '1',
        rut: '11.111.111-1',
        commune: 'Santiago',
        address: 'Av. Test 123',
        gender: 'Masculino',
        birthDate: new Date('1990-01-01'),
        diagnosisDate: new Date('2024-01-01'),
        user: { name: 'Juan Perez', email: 'juan@test.com', active: true },
        appointments: []
    },
    {
        id: '2',
        rut: '22.222.222-2',
        commune: 'Providencia',
        address: 'Calle Falsa 123',
        gender: 'Femenino',
        birthDate: new Date('1985-05-05'),
        diagnosisDate: new Date('2024-02-01'),
        user: { name: 'Maria Gonzalez', email: 'maria@test.com', active: false },
        appointments: [1]
    }
]

describe('PatientsTable Component', () => {
    it('renders the list of patients', () => {
        render(<PatientsTable patients={mockPatients} />)
        expect(screen.getByText('Juan Perez')).toBeInTheDocument()
        expect(screen.getByText('Maria Gonzalez')).toBeInTheDocument()
    })

    it('filters patients by name', () => {
        render(<PatientsTable patients={mockPatients} />)
        const searchInput = screen.getByPlaceholderText('Buscar por nombre, RUT, email...')

        fireEvent.change(searchInput, { target: { value: 'Maria' } })

        expect(screen.queryByText('Juan Perez')).not.toBeInTheDocument()
        expect(screen.getByText('Maria Gonzalez')).toBeInTheDocument()
    })

    it('filters patients by RUT', () => {
        render(<PatientsTable patients={mockPatients} />)
        const searchInput = screen.getByPlaceholderText('Buscar por nombre, RUT, email...')

        fireEvent.change(searchInput, { target: { value: '11.111' } })

        expect(screen.getByText('Juan Perez')).toBeInTheDocument()
        expect(screen.queryByText('Maria Gonzalez')).not.toBeInTheDocument()
    })

    it('handles export to excel', () => {
        render(<PatientsTable patients={mockPatients} />)
        const exportBtn = screen.getByText('Exportar a Excel')

        fireEvent.click(exportBtn)

        expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
        expect(XLSX.utils.book_new).toHaveBeenCalled()
        expect(XLSX.writeFile).toHaveBeenCalled()
    })
})
