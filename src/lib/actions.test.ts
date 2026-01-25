
import * as actions from './actions';

describe('Actions Exports', () => {
    it('exports appointments actions', () => {
        expect(actions.bookAppointment).toBeDefined();
    });

    it('exports staff actions', () => {
        expect(actions.adminCreateSystemUser).toBeDefined();
        expect(actions.updateRolePermissions).toBeDefined();
    });

    it('exports patient actions', () => {
        expect(actions.registerPatient).toBeDefined();
        expect(actions.uploadMedicalExam).toBeDefined();
    });

    it('exports auth actions', () => {
        expect(actions.authenticate).toBeDefined();
        expect(actions.logout).toBeDefined();
    });
});
