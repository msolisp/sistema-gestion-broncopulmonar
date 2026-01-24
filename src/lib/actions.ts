'use server'

// Re-export actions from new modules
export { bookAppointment } from './actions.appointments';
export {
    adminCreateSystemUser,
    adminUpdateSystemUser,
    adminDeleteSystemUser,
    updateRolePermissions,
    seedPermissions
} from './actions.staff';
export {
    registerPatient,
    updatePatientProfile,
    adminCreatePatient,
    adminUpdatePatient,
    deletePatient,
    uploadMedicalExam,
    reviewMedicalExam
} from './actions.patients';
export { authenticate, logout, changePassword } from './actions.auth';
