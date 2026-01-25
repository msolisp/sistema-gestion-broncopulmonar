
import { structuredLogger, loggers } from './structured-logger';
import winston from 'winston';

// Mock Winston
jest.mock('winston', () => {
    const mLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        log: jest.fn(),
    };
    return {
        createLogger: jest.fn(() => mLogger),
        format: {
            combine: jest.fn(),
            timestamp: jest.fn(),
            errors: jest.fn(),
            metadata: jest.fn(),
            json: jest.fn(),
            printf: jest.fn(),
        },
        transports: {
            Console: jest.fn(),
        },
    };
});

describe('Structured Logger', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('loggers helper', () => {
        it('auth logs success', () => {
            loggers.auth.loginSuccess('test@test.com', '127.0.0.1');
            expect(structuredLogger.info).toHaveBeenCalledWith(
                'Login successful',
                expect.objectContaining({ email: 'test@test.com', action: 'LOGIN_SUCCESS' })
            );
        });

        it('auth logs failure', () => {
            loggers.auth.loginFailed('test@test.com', 'bad pass', '127.0.0.1');
            expect(structuredLogger.warn).toHaveBeenCalledWith(
                'Login failed',
                expect.objectContaining({ reason: 'bad pass' })
            );
        });

        it('auth logs logout', () => {
            loggers.auth.logout('test@test.com');
            expect(structuredLogger.info).toHaveBeenCalledWith(
                'User logged out',
                expect.any(Object)
            );
        });

        it('patient logs creation', () => {
            loggers.patient.created('p1', 'p@test.com');
            expect(structuredLogger.info).toHaveBeenCalledWith(
                'Patient created',
                expect.objectContaining({ patientId: 'p1' })
            );
        });

        it('patient logs update', () => {
            loggers.patient.updated('p1', ['field']);
            expect(structuredLogger.info).toHaveBeenCalledWith(
                'Patient updated',
                expect.any(Object)
            );
        });

        it('patient logs deletion', () => {
            loggers.patient.deleted('p1');
            expect(structuredLogger.warn).toHaveBeenCalledWith(
                'Patient deleted',
                expect.any(Object)
            );
        });

        it('error logs database issues', () => {
            const err = new Error('DB Fail');
            loggers.error.database('op', err);
            expect(structuredLogger.error).toHaveBeenCalledWith(
                'Database error',
                expect.objectContaining({ operation: 'op', error: 'DB Fail' })
            );
        });

        it('error logs api issues', () => {
            const err = new Error('API Fail');
            loggers.error.api('/endpoint', err, 'u1');
            expect(structuredLogger.error).toHaveBeenCalledWith(
                'API error',
                expect.objectContaining({ endpoint: '/endpoint', userId: 'u1' })
            );
        });

        it('system logs health check', () => {
            loggers.system.healthCheck('healthy', { db: true });
            expect(structuredLogger.log).toHaveBeenCalledWith(
                'info',
                'Health check: healthy',
                expect.any(Object)
            );

            loggers.system.healthCheck('unhealthy', { db: false });
            expect(structuredLogger.log).toHaveBeenCalledWith(
                'error',
                'Health check: unhealthy',
                expect.any(Object)
            );
        });
    });
});
