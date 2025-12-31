import { render, screen } from '@testing-library/react'
import Map from './Map'

// Mock Leaflet because it doesn't work well in JSDOM
jest.mock('react-leaflet', () => ({
    MapContainer: ({ children }: { children: React.ReactNode }) => <div>MapContainer {children}</div>,
    TileLayer: () => <div>TileLayer</div>,
    Marker: ({ children }: { children: React.ReactNode }) => <div>Marker {children}</div>,
    Popup: ({ children }: { children: React.ReactNode }) => <div>Popup {children}</div>,
    Circle: ({ children }: { children: React.ReactNode }) => <div>Circle {children}</div>,
    Tooltip: ({ children }: { children: React.ReactNode }) => <div>Tooltip {children}</div>,
}))

// Mock Leaflet CSS import or just ignore it
jest.mock('leaflet', () => ({
    Icon: {
        Default: {
            prototype: {
                _getIconUrl: jest.fn()
            },
            mergeOptions: jest.fn(),
        },
    },
}))

describe('Map Component', () => {
    const mockPatients = [
        {
            id: '1',
            rut: '11.111.111-1',
            commune: 'SANTIAGO',
            diagnosisDate: new Date(),
            user: { name: 'Juan', email: 'juan@test.com' }
        },
        {
            id: '2',
            rut: '22.222.222-2',
            commune: 'SANTIAGO', // Same commune to trigger jitter
            diagnosisDate: new Date(),
            user: { name: 'Pedro', email: 'pedro@test.com' }
        }
    ]

    it('renders map with markers', () => {
        render(<Map patients={mockPatients} />)
        expect(screen.getByText(/MapContainer/i)).toBeInTheDocument()
        // Map renders Circles with Tooltips. The text "SANTIAGO" should be in the document (Popup content or debug div)
        // Our mock renders: Popup > div > strong > SANTIAGO.
        expect(screen.getByText('SANTIAGO')).toBeInTheDocument()
    })

    it('handles unknown commune', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { })
        const unknownPatient = [{
            id: '3',
            rut: '33.333.333-3',
            commune: 'UNKNOWN_COMMUNE',
            diagnosisDate: new Date(),
            user: { name: 'Unknown', email: 'u@test.com' }
        }]
        render(<Map patients={unknownPatient} />)
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Commune not found'))
        consoleSpy.mockRestore()
    })
})
