
import { render, screen } from '@testing-library/react';
import { PulmonaryChart } from './PulmonaryChart';

// Mock Recharts to avoid Canvas/ResizeObserver issues
jest.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
}));

describe('PulmonaryChart', () => {
    const mockData = [
        {
            id: '1',
            date: new Date('2023-01-01'),
            walkDistance: 500,
            cvfPercent: 80,
            dlcoPercent: 85
        },
        {
            id: '2',
            date: new Date('2023-02-01'),
            walkDistance: 520,
            cvfPercent: 82,
            dlcoPercent: 86
        }
    ];

    it('should render chart title', () => {
        render(<PulmonaryChart data={mockData} />);
        expect(screen.getByText('Tendencia de Función Pulmonar')).toBeInTheDocument();
    });

    it('should render chart container', () => {
        render(<PulmonaryChart data={mockData} />);
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should handle empty data without crashing', () => {
        render(<PulmonaryChart data={[]} />);
        expect(screen.getByText('Tendencia de Función Pulmonar')).toBeInTheDocument();
    });
});
