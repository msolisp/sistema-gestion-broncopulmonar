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

    it('opens create modal', () => {
        render(<PatientsTable patients={mockPatients} />)
        const createBtn = screen.getByText('Nuevo Paciente')
        fireEvent.click(createBtn)
        expect(screen.getByText('Nuevo Paciente', { selector: 'h3' })).toBeInTheDocument()
    })

    it('opens edit modal', () => {
        render(<PatientsTable patients={mockPatients} />)
        const editBtns = screen.getAllByTitle('Editar')
        fireEvent.click(editBtns[0])
        expect(screen.getByText('Editar Paciente')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Juan Perez')).toBeInTheDocument()
    })

    it('opens delete modal', () => {
        render(<PatientsTable patients={mockPatients} />)
        const deleteBtns = screen.getAllByTitle('Eliminar')
        fireEvent.click(deleteBtns[0])
        expect(screen.getByText('¿Eliminar Paciente?')).toBeInTheDocument()
        // 'Juan Perez' is in the table AND the modal.
        const instances = screen.getAllByText('Juan Perez')
        expect(instances.length).toBeGreaterThan(1)
    })

    it('handles pagination', () => {
        const manyPatients = Array.from({ length: 15 }, (_, i) => ({
            ...mockPatients[0],
            id: i.toString(),
            user: { ...mockPatients[0].user, name: `Patient ${i}` }
        }))
        render(<PatientsTable patients={manyPatients} />)

        // Use custom matcher for text split across elements
        const getPaginationText = (text: string) => screen.getAllByText((content, element) => {
            return element?.tagName.toLowerCase() === 'div' && element.textContent === text
        })

        expect(getPaginationText('Mostrando 1 a 10 de 15 resultados').length).toBeGreaterThan(0)

        const nextBtn = screen.getByRole('button', { name: 'Página Siguiente' })
        fireEvent.click(nextBtn)
        expect(getPaginationText('Mostrando 11 a 15 de 15 resultados').length).toBeGreaterThan(0)

        const prevBtn = screen.getByRole('button', { name: 'Página Anterior' })
        fireEvent.click(prevBtn)
        expect(getPaginationText('Mostrando 1 a 10 de 15 resultados').length).toBeGreaterThan(0)
    })

    it('displays hyphen for missing birth date', () => {
        const patientNoBirth = [{
            ...mockPatients[0],
            birthDate: null
        }]
        render(<PatientsTable patients={patientNoBirth} />)
        const cells = screen.getAllByRole('cell')
        expect(cells[3]).toHaveTextContent('-')
    })

    it('allows toggling active status in edit modal', () => {
        render(<PatientsTable patients={mockPatients} />)

        // Open edit for Juan Perez (Active)
        const editBtns = screen.getAllByTitle('Editar')
        fireEvent.click(editBtns[0]) // Juan

        expect(screen.getByText('Editar Paciente')).toBeInTheDocument()

        const activeCheckbox = screen.getByLabelText('Paciente Activo')
        expect(activeCheckbox).toBeChecked()

        // Uncheck it
        fireEvent.click(activeCheckbox)
        expect(activeCheckbox).not.toBeChecked()

        // We can't easily check the server action call arguments here because useActionState is internal logic,
        // but we verify the UI interaction works.
    })
})
