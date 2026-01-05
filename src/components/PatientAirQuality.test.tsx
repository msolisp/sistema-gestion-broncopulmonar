
import { render, screen } from '@testing-library/react';
import PatientAirQuality from './PatientAirQuality';
import { getRealtimeGlobalAQI } from '@/lib/air-quality';

// Mock the server-side data fetching
jest.mock('@/lib/air-quality', () => ({
    getRealtimeGlobalAQI: jest.fn(),
}));

// Mock Lucide icons to avoid render issues in test environment if any
jest.mock('lucide-react', () => ({
    Cloud: () => <span data-testid="icon-cloud">Cloud</span>,
    CheckCircle: () => <span data-testid="icon-check">Check</span>,
    AlertTriangle: () => <span data-testid="icon-alert">Alert</span>,
    AlertOctagon: () => <span data-testid="icon-emergency">Emergency</span>,
}));

it('should render "Bueno" status correctly', () => {
    const mockData = {
        commune: 'SANTIAGO',
        originalName: 'Parque O Higgins',
        value: 50,
        level: 'Bueno' as const,
        color: '#10b981',
        coords: [-33.46, -70.66] as [number, number]
    };

    render(<PatientAirQuality commune="SANTIAGO" aqiData={mockData} />);

    expect(screen.getByText('Calidad del Aire en SANTIAGO')).toBeInTheDocument();
    expect(screen.getByText('50 AQI')).toBeInTheDocument();
    expect(screen.getByText('Bueno')).toBeInTheDocument();
    expect(screen.getByText('El aire es seguro para realizar actividades al aire libre.')).toBeInTheDocument();
});

it('should render "Regular" status correctly', () => {
    const mockData = {
        commune: 'SANTIAGO',
        originalName: 'Parque O Higgins',
        value: 120,
        level: 'Regular' as const,
        color: '#f59e0b',
        coords: [-33.46, -70.66] as [number, number]
    };

    render(<PatientAirQuality commune="SANTIAGO" aqiData={mockData} />);

    expect(screen.getByText('Regular')).toBeInTheDocument();
    expect(screen.getByText('Calidad aceptable. Personas muy sensibles deberían considerar reducir esfuerzos.')).toBeInTheDocument();
});

it('should render nothing if no data provided', () => {
    const { container } = render(<PatientAirQuality commune="SANTIAGO" aqiData={null} />);
    expect(container).toBeEmptyDOMElement();
});
