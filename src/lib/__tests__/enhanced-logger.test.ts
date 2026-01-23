import { createResourceId, parseResourceId, LogActions } from '../enhanced-logger';

describe('Enhanced Logger Utilities', () => {
    describe('createResourceId', () => {
        it('should create properly formatted resource ID', () => {
            expect(createResourceId('Persona', '123')).toBe('Persona:123');
            expect(createResourceId('FichaClinica', 'abc')).toBe('FichaClinica:abc');
            expect(createResourceId('Cita', 'xyz-789')).toBe('Cita:xyz-789');
        });

        it('should handle empty strings', () => {
            expect(createResourceId('Type', '')).toBe('Type:');
            expect(createResourceId('', 'id')).toBe(':id');
        });
    });

    describe('parseResourceId', () => {
        it('should parse valid resource ID correctly', () => {
            const result = parseResourceId('Persona:123');

            expect(result).toEqual({
                type: 'Persona',
                id: '123'
            });
        });

        it('should parse complex IDs', () => {
            const result = parseResourceId('FichaClinica:abc-def-123');

            expect(result).toEqual({
                type: 'FichaClinica',
                id: 'abc-def-123'
            });
        });

        it('should return null for invalid format', () => {
            expect(parseResourceId('invalid')).toBeNull();
            expect(parseResourceId('too:many:parts')).toBeNull();
        });

        it('should handle empty parts', () => {
            const result = parseResourceId(':id');

            expect(result).toEqual({
                type: '',
                id: 'id'
            });
        });
    });

    describe('LogActions constants', () => {
        it('should have all required action constants', () => {
            // Authentication
            expect(LogActions.LOGIN).toBe('LOGIN');
            expect(LogActions.LOGOUT).toBe('LOGOUT');
            expect(LogActions.LOGIN_FAILED).toBe('LOGIN_FAILED');

            // Patient Management
            expect(LogActions.CREATE_PATIENT).toBe('CREATE_PATIENT');
            expect(LogActions.UPDATE_PATIENT).toBe('UPDATE_PATIENT');
            expect(LogActions.DELETE_PATIENT).toBe('DELETE_PATIENT');
            expect(LogActions.VIEW_PATIENT).toBe('VIEW_PATIENT');

            // Clinical Data
            expect(LogActions.CREATE_APPOINTMENT).toBe('CREATE_APPOINTMENT');
            expect(LogActions.UPDATE_APPOINTMENT).toBe('UPDATE_APPOINTMENT');
            expect(LogActions.CANCEL_APPOINTMENT).toBe('CANCEL_APPOINTMENT');
            expect(LogActions.UPLOAD_EXAM).toBe('UPLOAD_EXAM');
            expect(LogActions.DOWNLOAD_EXAM).toBe('DOWNLOAD_EXAM');
            expect(LogActions.VIEW_EXAM).toBe('VIEW_EXAM');

            // User Management
            expect(LogActions.CREATE_USER).toBe('CREATE_USER');
            expect(LogActions.UPDATE_USER).toBe('UPDATE_USER');
            expect(LogActions.DELETE_USER).toBe('DELETE_USER');
            expect(LogActions.CHANGE_PASSWORD).toBe('CHANGE_PASSWORD');
            expect(LogActions.UPDATE_PERMISSIONS).toBe('UPDATE_PERMISSIONS');

            // System
            expect(LogActions.EXPORT_DATA).toBe('EXPORT_DATA');
            expect(LogActions.IMPORT_DATA).toBe('IMPORT_DATA');
            expect(LogActions.BACKUP).toBe('BACKUP');
            expect(LogActions.RESTORE).toBe('RESTORE');
        });
    });
});
