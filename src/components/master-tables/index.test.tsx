
import { render, screen, waitFor } from '@testing-library/react';
import {
    ComunasManager,
    PrevisionesManager,
    DiagnosticosManager,
    MedicamentosManager,
    InsumosManager,
    FeriadosManager
} from './index';
import {
    getComunas,
    getPrevisiones,
    getDiagnosticos,
    getMedicamentos,
    getInsumos,
    getFeriados
} from '@/lib/actions/master-tables';

// Mock actions
jest.mock('@/lib/actions/master-tables', () => ({
    getComunas: jest.fn(),
    createComuna: jest.fn(),
    updateComuna: jest.fn(),
    deleteComuna: jest.fn(),
    getPrevisiones: jest.fn(),
    createPrevision: jest.fn(),
    updatePrevision: jest.fn(),
    deletePrevision: jest.fn(),
    getDiagnosticos: jest.fn(),
    createDiagnostico: jest.fn(),
    updateDiagnostico: jest.fn(),
    deleteDiagnostico: jest.fn(),
    getMedicamentos: jest.fn(),
    createMedicamento: jest.fn(),
    updateMedicamento: jest.fn(),
    deleteMedicamento: jest.fn(),
    getInsumos: jest.fn(),
    createInsumo: jest.fn(),
    updateInsumo: jest.fn(),
    deleteInsumo: jest.fn(),
    getFeriados: jest.fn(),
    createFeriado: jest.fn(),
    updateFeriado: jest.fn(),
    deleteFeriado: jest.fn(),
}));

// Mock MasterTableManager
jest.mock('../MasterTableManager', () => {
    return function MockMasterTableManager({ title, data, onRefresh }: any) {
        return (
            <div data-testid="master-table-manager">
                <h1>{title}</h1>
                <div data-testid="data-count">{Array.isArray(data) ? data.length : 0}</div>
                <button onClick={onRefresh}>Refresh</button>
            </div>
        );
    };
});

// Mock useRouter
jest.mock('next/navigation', () => ({
    useRouter: () => ({ refresh: jest.fn() })
}));

describe('Master Tables Components', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('ComunasManager', () => {
        it('renders and loads data', async () => {
            (getComunas as jest.Mock).mockResolvedValue({
                success: true,
                data: [{ id: '1', nombre: 'Santiago' }]
            });

            render(<ComunasManager />);

            expect(screen.getByText('Comunas')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.getByTestId('data-count')).toHaveTextContent('1');
            });

            expect(getComunas).toHaveBeenCalled();
        });
    });

    describe('PrevisionesManager', () => {
        it('renders and loads data', async () => {
            (getPrevisiones as jest.Mock).mockResolvedValue({
                success: true,
                data: [{ id: '1', nombre: 'Fonasa' }, { id: '2', nombre: 'Isapre' }]
            });

            render(<PrevisionesManager />);

            expect(screen.getByText('Previsiones')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.getByTestId('data-count')).toHaveTextContent('2');
            });

            expect(getPrevisiones).toHaveBeenCalled();
        });
    });

    describe('DiagnosticosManager', () => {
        it('renders and loads data', async () => {
            (getDiagnosticos as jest.Mock).mockResolvedValue({ success: true, data: [{ id: '1', codigo: 'A00' }] });
            render(<DiagnosticosManager />);
            expect(screen.getByText('Diagnósticos CIE-10')).toBeInTheDocument();
            await waitFor(() => {
                expect(screen.getByTestId('data-count')).toHaveTextContent('1');
            });
        });
    });

    describe('MedicamentosManager', () => {
        it('renders and loads data', async () => {
            (getMedicamentos as jest.Mock).mockResolvedValue({ success: true, data: [{ id: '1', nombre: 'Paracetamol' }] });
            render(<MedicamentosManager />);
            expect(screen.getByText('Medicamentos')).toBeInTheDocument();
            await waitFor(() => {
                expect(screen.getByTestId('data-count')).toHaveTextContent('1');
            });
        });
    });

    describe('InsumosManager', () => {
        it('renders and loads data', async () => {
            (getInsumos as jest.Mock).mockResolvedValue({ success: true, data: [{ id: '1', nombre: 'Jeringa' }] });
            render(<InsumosManager />);
            expect(screen.getByText('Insumos')).toBeInTheDocument();
            await waitFor(() => {
                expect(screen.getByTestId('data-count')).toHaveTextContent('1');
            });
        });
    });

    describe('FeriadosManager', () => {
        it('renders and loads data', async () => {
            (getFeriados as jest.Mock).mockResolvedValue({ success: true, data: [{ id: '1', nombre: 'Navidad' }] });
            render(<FeriadosManager />);
            expect(screen.getByText('Feriados')).toBeInTheDocument();
            await waitFor(() => {
                expect(screen.getByTestId('data-count')).toHaveTextContent('1');
            });
        });
    });
});
