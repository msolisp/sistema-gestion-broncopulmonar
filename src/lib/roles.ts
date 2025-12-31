
export enum Role {
    ADMIN = 'ADMIN',
    KINESIOLOGIST = 'KINESIOLOGIST',
    RECEPTIONIST = 'RECEPTIONIST',
    PATIENT = 'PATIENT'
}

export const ROLE_LABELS = {
    [Role.ADMIN]: 'Administrador',
    [Role.KINESIOLOGIST]: 'Kinesiólogo',
    [Role.RECEPTIONIST]: 'Recepcionista',
    [Role.PATIENT]: 'Paciente'
}
