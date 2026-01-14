import winston from 'winston';

// Determine log level based on environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Custom format for better readability
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
    process.env.NODE_ENV === 'production'
        ? winston.format.json()
        : winston.format.printf(({ level, message, timestamp, metadata }) => {
            const meta = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : '';
            return `${timestamp} [${level.toUpperCase()}]: ${message} ${meta}`;
        })
);

// Create transports array
const transports: winston.transport[] = [
    new winston.transports.Console({
        format: customFormat
    })
];

// Create logger instance
export const structuredLogger = winston.createLogger({
    level: logLevel,
    format: customFormat,
    defaultMeta: {
        service: 'broncopulmonar-system',
        environment: process.env.NODE_ENV
    },
    transports
});

// Helper functions for common logging patterns
export const loggers = {
    auth: {
        loginSuccess: (email: string, ip?: string) => {
            structuredLogger.info('Login successful', { email, ip, action: 'LOGIN_SUCCESS' });
        },
        loginFailed: (email: string, reason: string, ip?: string) => {
            structuredLogger.warn('Login failed', { email, reason, ip, action: 'LOGIN_FAILURE' });
        },
        logout: (email: string) => {
            structuredLogger.info('User logged out', { email, action: 'LOGOUT' });
        }
    },

    patient: {
        created: (patientId: string, email: string) => {
            structuredLogger.info('Patient created', { patientId, email, action: 'PATIENT_CREATED' });
        },
        updated: (patientId: string, fields: string[]) => {
            structuredLogger.info('Patient updated', { patientId, fields, action: 'PATIENT_UPDATED' });
        },
        deleted: (patientId: string) => {
            structuredLogger.warn('Patient deleted', { patientId, action: 'PATIENT_DELETED' });
        }
    },

    error: {
        database: (operation: string, error: Error) => {
            structuredLogger.error('Database error', {
                operation,
                error: error.message,
                stack: error.stack,
                action: 'DATABASE_ERROR'
            });
        },
        api: (endpoint: string, error: Error, userId?: string) => {
            structuredLogger.error('API error', {
                endpoint,
                error: error.message,
                stack: error.stack,
                userId,
                action: 'API_ERROR'
            });
        }
    },

    system: {
        healthCheck: (status: 'healthy' | 'unhealthy', checks: Record<string, boolean>) => {
            const level = status === 'healthy' ? 'info' : 'error';
            structuredLogger.log(level, `Health check: ${status}`, { checks, action: 'HEALTH_CHECK' });
        }
    }
};

export default structuredLogger;
