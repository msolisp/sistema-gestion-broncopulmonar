
import { render, screen, fireEvent, act } from '@testing-library/react';
import MasterTableManager from './MasterTableManager';

describe('MasterTableManager', () => {
    const mockRefresh = jest.fn();
    const mockCreate = jest.fn().mockResolvedValue({ message: 'Success' });
    const mockUpdate = jest.fn().mockResolvedValue({ message: 'Success' });
    const mockDelete = jest.fn().mockResolvedValue({ message: 'Success' });

    const props = {
        title: 'Test Table',
        data: [{ id: '1', name: 'Item 1', active: true }, { id: '2', name: 'Item 2', active: false }],
        columns: [{ key: 'name', label: 'Name' }, { key: 'active', label: 'Active' }],
        onRefresh: mockRefresh,
        onCreate: mockCreate,
        onUpdate: mockUpdate,
        onDelete: mockDelete
    };

    it('renders table with data', () => {
        render(<MasterTableManager {...props} />);
        expect(screen.getByText('Test Table')).toBeInTheDocument();
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('filters data by search', () => {
        render(<MasterTableManager {...props} />);
        const input = screen.getByPlaceholderText('Buscar en todos los campos...');
        fireEvent.change(input, { target: { value: 'Item 1' } });
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.queryByText('Item 2')).not.toBeInTheDocument();
    });

    it('opens create modal', () => {
        render(<MasterTableManager {...props} />);
        fireEvent.click(screen.getByText('Nuevo Registro'));
        expect(screen.getByText('Crear Nuevo Registro')).toBeInTheDocument();
    });

    it('calls create action', async () => {
        render(<MasterTableManager {...props} />);
        fireEvent.click(screen.getByText('Nuevo Registro'));

        const input = screen.getByPlaceholderText('Ingrese name...');
        fireEvent.change(input, { target: { value: 'New Item' } });

        const submit = screen.getByText('Crear Registro');
        await act(async () => {
            fireEvent.click(submit);
        });

        expect(mockCreate).toHaveBeenCalled();
    });
});
