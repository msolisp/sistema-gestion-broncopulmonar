import { logAction, logActionWithTiming, createResourceId, parseResourceId, getClientIp } from './enhanced-logger';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    logAccesoSistema: {
        create: jest.fn(),
    },
}));

jest.mock('next/headers', () => ({
    headers: jest.fn(),
}));

describe('Enhanced Logger', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getClientIp', () => {
        it('returns x-forwarded-for first part', async () => {
            (headers as jest.Mock).mockReturnValue({
                get: (key: string) => key === 'x-forwarded-for' ? '10.0.0.1, 10.0.0.2' : null
            });
            expect(await getClientIp()).toBe('10.0.0.1');
        });

        it('returns x-real-ip if forwarded missing', async () => {
            (headers as jest.Mock).mockReturnValue({
                get: (key: string) => key === 'x-real-ip' ? '10.0.0.2' : null
            });
            expect(await getClientIp()).toBe('10.0.0.2');
        });

        it('returns cf-connecting-ip if others missing', async () => {
            (headers as jest.Mock).mockReturnValue({
                get: (key: string) => key === 'cf-connecting-ip' ? '10.0.0.3' : null
            });
            expect(await getClientIp()).toBe('10.0.0.3');
        });

        it('returns unknown if all missing', async () => {
            (headers as jest.Mock).mockReturnValue({
                get: () => null
            });
            expect(await getClientIp()).toBe('unknown');
        });
    });

    describe('logAction', () => {
        beforeEach(() => {
            (headers as jest.Mock).mockReturnValue({
                get: (key: string) => {
                    if (key === 'x-forwarded-for') return '127.0.0.1';
                    if (key === 'user-agent') return 'Jest Test';
                    return null;
                }
            });
        });

        it('creates a log entry', async () => {
            (prisma.logAccesoSistema.create as jest.Mock).mockResolvedValue({ id: 'log1' });

            const result = await logAction({
                usuarioSistemaId: 'u1',
                accion: 'TEST',
                recurso: 'Resource',
                detalle: { foo: 'bar' }
            });

            expect(result).toEqual({ id: 'log1' });
            expect(prisma.logAccesoSistema.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    usuarioSistemaId: 'u1',
                    accion: 'TEST',
                    ipAddress: '127.0.0.1',
                    userAgent: 'Jest Test'
                })
            }));
        });

        it('handles database errors gracefully', async () => {
            (prisma.logAccesoSistema.create as jest.Mock).mockRejectedValue(new Error('DB Error'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            const result = await logAction({
                usuarioSistemaId: 'u1', accion: 'TEST'
            });

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('logActionWithTiming', () => {
        beforeEach(() => {
            (headers as jest.Mock).mockReturnValue({
                get: () => null
            });
        });

        it('logs success with duration', async () => {
            (prisma.logAccesoSistema.create as jest.Mock).mockResolvedValue({ id: 'log1' });

            const op = async () => {
                await new Promise(r => setTimeout(r, 10));
                return 'result';
            };

            const result = await logActionWithTiming({
                usuarioSistemaId: 'u1', accion: 'TIMED'
            }, op);

            expect(result).toBe('result');
            expect(prisma.logAccesoSistema.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    accion: 'TIMED',
                    resultado: 'SUCCESS',
                    accionDetalle: expect.stringContaining('duracionMs')
                })
            }));
        });

        it('logs error with duration', async () => {
            (prisma.logAccesoSistema.create as jest.Mock).mockResolvedValue({ id: 'log1' });

            const op = async () => {
                throw new Error('Op Failed');
            };

            await expect(logActionWithTiming({
                usuarioSistemaId: 'u1', accion: 'TIMED_ERROR'
            }, op)).rejects.toThrow('Op Failed');

            expect(prisma.logAccesoSistema.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    accion: 'TIMED_ERROR',
                    resultado: 'ERROR',
                    accionDetalle: expect.stringContaining('Op Failed')
                })
            }));
        });
    });

    describe('Resource IDs', () => {
        it('createResourceId formats correctly', () => {
            expect(createResourceId('User', '123')).toBe('User:123');
        });

        it('parseResourceId parses correctly', () => {
            expect(parseResourceId('User:123')).toEqual({ type: 'User', id: '123' });
        });

        it('parseResourceId returns null for invalid format', () => {
            expect(parseResourceId('Invalid')).toBeNull();
        });
    });
});
