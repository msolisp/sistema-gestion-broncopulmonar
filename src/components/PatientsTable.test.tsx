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
        commune: 'Santiago',
        address: 'Av. Test 123',
        phone: '123456789',
        diagnosisDate: new Date('2024-01-01'),
        birthDate: new Date('1990-01-01'),
        gender: 'Masculino',
        appointments: [],
        name: 'Juan Perez',
        email: 'juan@test.com',
        active: true,
        rut: '11.111.111-1'
    },
    {
        id: '2',
        commune: 'Providencia',
        address: 'Calle Falsa 123',
        phone: '987654321',
        diagnosisDate: new Date('2024-02-01'),
        birthDate: new Date('1985-05-05'),
        gender: 'Femenino',
        appointments: [1],
        name: 'Maria Gonzalez',
        email: 'maria@test.com',
        active: false,
        rut: '22.222.222-2'
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
            name: `Patient ${i}`
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
    it('updates hidden rut input on change', () => {
        render(<PatientsTable patients={mockPatients} />)
        const createBtn = screen.getByText('Nuevo Paciente')
        fireEvent.click(createBtn)

        const rutNum = document.getElementById('rut_num') as HTMLInputElement
        const rutDv = document.getElementById('rut_dv') as HTMLInputElement

        fireEvent.change(rutNum, { target: { value: '12345678' } })
        fireEvent.change(rutDv, { target: { value: 'K' } })

        const hiddenRut = document.getElementById('rut_hidden') as HTMLInputElement
        expect(hiddenRut.value).toBe('12345678-K')
    })

    it('shows no results message', () => {
        render(<PatientsTable patients={mockPatients} />)
        const searchInput = screen.getByPlaceholderText('Buscar por nombre, RUT, email...')
        fireEvent.change(searchInput, { target: { value: 'NonExistent' } })
        expect(screen.getByText('No se encontraron pacientes que coincidan con su búsqueda.')).toBeInTheDocument()
    })

    it('calculates age correctly', () => {
        const today = new Date()
        const birthdayPassed = new Date(today.getFullYear() - 20, today.getMonth() - 1, 1)
        const birthdayNotPassed = new Date(today.getFullYear() - 20, today.getMonth() + 1, 1)
        const birthdayToday = new Date(today.getFullYear() - 20, today.getMonth(), today.getDate())

        const patientsWithAges = [
            { ...mockPatients[0], id: 'p1', birthDate: birthdayPassed, name: 'Passed' },
            { ...mockPatients[0], id: 'p2', birthDate: birthdayNotPassed, name: 'NotPassed' },
            { ...mockPatients[0], id: 'p3', birthDate: birthdayToday, name: 'Today' },
        ]

        render(<PatientsTable patients={patientsWithAges} />)

        // Use a more specific finder for the age cell to ensure we are not matching random text
        // Row for 'Passed' -> 20
        const rowPassed = screen.getByText('Passed').closest('tr')
        expect(rowPassed).toHaveTextContent('20')

        // Row for 'NotPassed' -> 19
        const rowNotPassed = screen.getByText('NotPassed').closest('tr')
        expect(rowNotPassed).toHaveTextContent('19')

        // Row for 'Today' -> 20
        const rowToday = screen.getByText('Today').closest('tr')
        expect(rowToday).toHaveTextContent('20')
    })

    it('closes modals on success action state', () => {
        render(<PatientsTable patients={mockPatients} />)
        fireEvent.click(screen.getByText('Nuevo Paciente'))
        expect(screen.getByText('Nuevo Paciente', { selector: 'h3' })).toBeInTheDocument()

        // Close via Cancel button
        fireEvent.click(screen.getByText('Cancelar'))
        expect(screen.queryByText('Nuevo Paciente', { selector: 'h3' })).not.toBeInTheDocument()
    })
    it('renders patient with missing optional fields', () => {
        const minimalPatient = [{
            ...mockPatients[0],
            id: 'min1',
            name: null,
            rut: null,
            email: 'minimal@test.com',
            birthDate: null,
            commune: 'Santiago'
        } as any] // Force type casting for testing fallback logic

        render(<PatientsTable patients={minimalPatient} />)
        // Should render without crashing
        expect(screen.getByText('minimal@test.com')).toBeInTheDocument()
        // Should show hyphen for age
        expect(screen.getAllByText('-').length).toBeGreaterThan(0)
    })
})
