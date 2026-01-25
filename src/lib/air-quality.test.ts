
import { getRealtimeGlobalAQI, normalizeCommune, AQILevel, AQIData } from './air-quality';

// Mock global fetch
global.fetch = jest.fn();

describe('Air Quality', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('normalizeCommune', () => {
        it('normalizes text', () => {
            expect(normalizeCommune('Ñuñoa')).toBe('NUNOA');
            expect(normalizeCommune('Viña del Mar')).toBe('VINA DEL MAR');
        });
    });

    describe('getRealtimeGlobalAQI', () => {
        it('handles fetch error', async () => {
            (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
            const logs = jest.spyOn(console, 'error').mockImplementation(() => { });

            const result = await getRealtimeGlobalAQI();
            expect(result).toEqual([]);
            expect(logs).toHaveBeenCalled();
            logs.mockRestore();
        });

        it('handles non-ok response', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false
            });
            const logs = jest.spyOn(console, 'error').mockImplementation(() => { });

            const result = await getRealtimeGlobalAQI();
            expect(result).toEqual([]);
            logs.mockRestore();
        });

        it('parses SINCA data correctly', async () => {
            const mockData = [
                {
                    nombre: 'ESTACION 1',
                    comuna: 'Santiago',
                    latitud: '-33.0',
                    longitud: '-70.0',
                    realtime: [
                        {
                            code: 'PM25',
                            info: {
                                rows: [
                                    { c: [null, null, null, { v: '<strong>12 &micro;g</strong>' }] } // 12 -> Good
                                ]
                            }
                        }
                    ]
                }
            ];

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            const result = await getRealtimeGlobalAQI();

            expect(result).toHaveLength(1);
            expect(result[0].commune).toBe('SANTIAGO');
            expect(result[0].value).toBe(50); // 12.0 maps to 50 AQI exactly? Let's check breakpoint.
            // 0-12.0 -> 0-50. 
            // 12.0 is max of Good. So 50.
            expect(result[0].level).toBe('Bueno');
        });

        it('handles fallback to PM10 if PM25 missing', async () => {
            const mockData = [
                {
                    nombre: 'ESTACION 2',
                    latitud: '-33.0',
                    longitud: '-70.0',
                    realtime: [
                        {
                            code: 'PM10', // No PM25
                            info: {
                                rows: [
                                    { c: [null, { v: '15' }] } // value 15
                                ]
                            }
                        }
                    ]
                }
            ];

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            const result = await getRealtimeGlobalAQI();
            expect(result).toHaveLength(1);
            // 15 raw. Breakpoint PM2.5 logic used as fallback simplification?
            // 12.1-35.4 -> 51-100.
            // 15 is in moderate.
            // Calculation: (100-51)/(35.4-12.1) * (15-12.1) + 51 ~ 57.
        });

        it('handles unavailable data', async () => {
            const mockData = [
                {
                    nombre: 'ESTACION 3',
                    latitud: '-33.0',
                    longitud: '-70.0',
                    realtime: [
                        {
                            code: 'PM25',
                            info: {
                                rows: [
                                    { c: [null, null, null, { v: 'no disponible' }] } // Should be skipped
                                ]
                            }
                        }
                    ]
                }
            ];

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            const result = await getRealtimeGlobalAQI();
            expect(result[0].value).toBe(0);
        });

        it('handles mixed valid/invalid rows', async () => {
            const mockData = [
                {
                    nombre: 'ESTACION 4',
                    latitud: '-33.0',
                    longitud: '-70.0',
                    realtime: [
                        {
                            code: 'PM25',
                            info: {
                                rows: [
                                    { c: [null, null, null, { v: '<strong>50 &micro;g</strong>' }] }, // Valid (old)
                                    { c: [null, null, null, { v: 'no disponible' }] } // Invalid (new)
                                ]
                            }
                        }
                    ]
                }
            ];

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            const result = await getRealtimeGlobalAQI();
            // Should pick the Valid row (50) -> US AQI calculation
            // 50 => 35.5-55.4 range. 
            // 101-150 range.
            // (150-101)/(55.4-35.5) * (50-35.5) + 101
            // 49/19.9 * 14.5 + 101 = 2.46*14.5 + 101 = 35.7 + 101 = 136.7 -> 137.
            expect(result[0].value).toBeGreaterThan(100);
            expect(result[0].value).toBeLessThan(150);
        });

        it('handles fallback with extraction failure', async () => {
            const mockData = [
                {
                    nombre: 'ESTACION 5',
                    latitud: '-33.0',
                    longitud: '-70.0',
                    realtime: [
                        {
                            code: 'PM25',
                            info: {
                                rows: [
                                    { c: [null, { v: '20' }, null, { v: 'BAD FORMAT' }] }
                                ]
                            }
                        }
                    ]
                }
            ];

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockData
            });

            const result = await getRealtimeGlobalAQI();
            // Fallback to c[1] which is 20.
            // 20 => 12.1-35.4 range (Moderate 51-100)
            expect(result[0].value).toBeGreaterThan(50);
        });
    });
});
