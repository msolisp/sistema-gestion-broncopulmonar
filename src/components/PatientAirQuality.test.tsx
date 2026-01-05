
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

describe('PatientAirQuality', () => {
    it('should render "Bueno" status correctly', async () => {
        (getRealtimeGlobalAQI as jest.Mock).mockResolvedValue([
            {
                commune: 'SANTIAGO',
                originalName: 'Parque O Higgins',
                value: 50,
                status: 'Good',
                color: '#10b981',
                level: 'Bueno'
            }
        ]);

        const ui = await PatientAirQuality({ commune: 'SANTIAGO' });
        render(ui!);

        expect(screen.getByText('Calidad del Aire en SANTIAGO')).toBeInTheDocument();
        expect(screen.getByText('50 AQI')).toBeInTheDocument();
        expect(screen.getByText('Bueno')).toBeInTheDocument();
        expect(screen.getByText('El aire es seguro para realizar actividades al aire libre.')).toBeInTheDocument();
    });

    it('should render "Regular" status correctly', async () => {
        (getRealtimeGlobalAQI as jest.Mock).mockResolvedValue([
            {
                commune: 'SANTIAGO',
                originalName: 'Parque O Higgins',
                value: 120,
                status: 'Moderate',
                color: '#f59e0b',
                level: 'Regular'
            }
        ]);

        const ui = await PatientAirQuality({ commune: 'SANTIAGO' });
        render(ui!);

        expect(screen.getByText('Regular')).toBeInTheDocument();
        expect(screen.getByText('Calidad aceptable. Personas muy sensibles deberían considerar reducir esfuerzos.')).toBeInTheDocument();
    });

    it('should fallback to Santiago if commune not found', async () => {
        (getRealtimeGlobalAQI as jest.Mock).mockResolvedValue([
            {
                commune: 'SANTIAGO',
                originalName: 'Parque O Higgins',
                value: 50, // 50
                status: 'Good',
                color: '#10b981',
                level: 'Bueno'
            }
        ]);

        // Requesting "LA PINTANA" but logic falls back to Santiago if not found
        const ui = await PatientAirQuality({ commune: 'LA PINTANA' });
        render(ui!);

        expect(screen.getByText(/Calidad del Aire/)).toBeInTheDocument();
        // Since we mocked only Santiago returning, it should use that data
        expect(screen.getByText('Bueno')).toBeInTheDocument();
        expect(screen.getByText(/El aire es seguro/)).toBeInTheDocument();
    });
});
