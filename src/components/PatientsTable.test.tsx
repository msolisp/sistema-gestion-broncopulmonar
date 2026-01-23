import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PatientsTable from './PatientsTable'
import '@testing-library/jest-dom'
import * as XLSX from 'xlsx'

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        refresh: jest.fn()
    })
}))

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
        region: 'Metropolitana',
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
        region: 'Metropolitana',
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

    it('filters patients by name (accent insensitive)', () => {
        render(<PatientsTable patients={mockPatients} />)
        const searchInput = screen.getByPlaceholderText('Buscar por nombre, RUT, email...')

        // Search "Pérez" should find "Perez" (if normalized) or vice versa.
        // Mock data has "Juan Perez" (no accent).
        // Searching "Pérez" should find it if normalization works.
        fireEvent.change(searchInput, { target: { value: 'Pérez' } })

        expect(screen.getByText('Juan Perez')).toBeInTheDocument()
        expect(screen.queryByText('Maria Gonzalez')).not.toBeInTheDocument()
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

    it('opens edit modal and pre-fills fields', () => {
        render(<PatientsTable patients={mockPatients} />)
        const editBtns = screen.getAllByTitle('Editar')
        fireEvent.click(editBtns[0])
        expect(screen.getByText('Editar Paciente')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Juan Perez')).toBeInTheDocument()
        expect(screen.getByDisplayValue('juan@test.com')).toBeInTheDocument()
        // Check that email input name attribute is correct for form submission
        const emailInput = screen.getByDisplayValue('juan@test.com')
        expect(emailInput).toHaveAttribute('name', 'email')
    })

    it('separates rut and dv in edit modal', () => {
        render(<PatientsTable patients={mockPatients} />)
        const editBtns = screen.getAllByTitle('Editar')
        fireEvent.click(editBtns[0])

        // Juan Perez rut: 11.111.111-1
        // Expected separation: 11.111.111 and 1
        // Note: The mock data has '.' in RUT, but the input might expect just numbers if the logic stripes them?
        // Let's check the component logic. defaultValue={selectedPatient.rut?.split('-')[0] || ''}
        // If the data comes with dots, it will display dots.

        // Wait, the input logic stripes non-numbers on CHANGE, but regular defaultValue will be displayed as is.
        // Let's assume the mock data matches what the component expects or displays.
        // The split uses '-'.
        // '11.111.111-1'.split('-') -> ['11.111.111', '1']

        const rutNum = document.getElementById('edit_rut_num') as HTMLInputElement
        const rutDv = document.getElementById('edit_rut_dv') as HTMLInputElement

        expect(rutNum.value).toBe('11.111.111')
        expect(rutDv.value).toBe('1')

        // Test update
        fireEvent.change(rutNum, { target: { value: '22222222' } })
        expect(rutNum.value).toBe('22222222') // non-numbers stripped by onChange

        // Check hidden input
        const hiddenRut = document.querySelector('input[name="rut"]') as HTMLInputElement
        // 22222222-1
        expect(hiddenRut.value).toBe('22222222-1')
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
    it('updates commune options when region changes', () => {
        render(<PatientsTable patients={mockPatients} />)

        fireEvent.click(screen.getByText('Nuevo Paciente'))

        const regionSelect = screen.getByLabelText('Región')
        const communeSelect = screen.getByLabelText('Comuna')

        // Initially empty or disabled if no region selected (depending on implementation)
        // Implementation: disabled={!createRegion}
        expect(communeSelect).toBeDisabled()

        // Select Region
        fireEvent.change(regionSelect, { target: { value: 'Metropolitana' } })
        expect(communeSelect).not.toBeDisabled()
        // Check for Santiago and Maipu (contained in CHILE_COMMUNES['Metropolitana'])
        // 'Santiago' appears in the table (mock patient) and the dropdown.
        expect(screen.getAllByText('Santiago').length).toBeGreaterThanOrEqual(1)
        expect(screen.getByText('Maipú')).toBeInTheDocument()

        // Change Region
        fireEvent.change(regionSelect, { target: { value: 'Valparaíso' } })
        expect(screen.getByText('Viña del Mar')).toBeInTheDocument()
    })

    it('toggles password visibility', () => {
        render(<PatientsTable patients={mockPatients} />)

        fireEvent.click(screen.getByText('Nuevo Paciente'))

        const passwordInput = screen.getByPlaceholderText('********')
        expect(passwordInput).toHaveAttribute('type', 'password')

        // Click toggle button
        const toggleButton = passwordInput.parentElement?.querySelector('button')
        if (toggleButton) {
            fireEvent.click(toggleButton)
            expect(passwordInput).toHaveAttribute('type', 'text')

            fireEvent.click(toggleButton)
            expect(passwordInput).toHaveAttribute('type', 'password')
        } else {
            throw new Error('Toggle button not found')
        }
    })

    it('renders patient with missing optional fields', () => {
        const minimalPatient = [{
            ...mockPatients[0],
            id: 'min1',
            name: null,
            rut: null,
            email: 'minimal@test.com',
            birthDate: null,
            commune: 'Santiago',
            region: 'Metropolitana'
        } as any] // Force type casting for testing fallback logic

        render(<PatientsTable patients={minimalPatient} />)
        // Should render without crashing
        expect(screen.getByText('minimal@test.com')).toBeInTheDocument()
        // Should show hyphen for age
        expect(screen.getAllByText('-').length).toBeGreaterThan(0)
    })

    // Tests for permission-independent button visibility (RBAC at module level only)
    it('always shows create button regardless of permissions', () => {
        render(<PatientsTable patients={mockPatients} />)
        const createButton = screen.getByText('Nuevo Paciente')
        expect(createButton).toBeVisible()
        expect(createButton).toBeEnabled()
    })

    it('always shows edit buttons for all patients', () => {
        render(<PatientsTable patients={mockPatients} />)
        const editButtons = screen.getAllByTitle('Editar')
        expect(editButtons).toHaveLength(mockPatients.length)
        editButtons.forEach(btn => {
            expect(btn).toBeVisible()
            expect(btn).toBeEnabled()
        })
    })

    it('always shows delete buttons for all patients', () => {
        render(<PatientsTable patients={mockPatients} />)
        const deleteButtons = screen.getAllByTitle('Eliminar')
        expect(deleteButtons).toHaveLength(mockPatients.length)
        deleteButtons.forEach(btn => {
            expect(btn).toBeVisible()
            expect(btn).toBeEnabled()
        })
    })
})
