
/**
 * @jest-environment node
 */
import { getRealtimeGlobalAQI } from './air-quality';

// Mock fetch
global.fetch = jest.fn();

describe('air-quality lib', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockApiResponse = [
        {
            nombre: 'Estación Parque O Higgins',
            latitud: '-33.4641',
            longitud: '-70.6608',
            comuna: 'Santiago',
            realtime: [
                {
                    code: 'PM25',
                    info: {
                        rows: [
                            {
                                c: [
                                    { v: '2023-01-01' },
                                    { v: '50' },
                                    { v: 'Normal' },
                                    { v: '<strong>20 &micro;g&#8260;m<sup>3</sup></strong>' } // Raw Value mocking
                                ]
                            }
                        ]
                    }
                }
            ]
        }
    ];

    describe('getRealtimeGlobalAQI', () => {
        it('should return array of parsed results', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockApiResponse
            });

            const results = await getRealtimeGlobalAQI();

            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeGreaterThan(0);
            expect(results[0]).toHaveProperty('commune', 'SANTIAGO');
            // 20 ug/m3 => US AQI calculation check
            // Based on code: 20 is within [12.1, 35.4] => AQI 51-100
            expect(results[0].value).toBeGreaterThan(0);
        });

        it('should handle API errors gracefully', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false
            });

            const results = await getRealtimeGlobalAQI();
            expect(results).toEqual([]);
        });
    });
});
