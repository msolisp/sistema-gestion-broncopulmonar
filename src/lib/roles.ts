
export enum Role {
    ADMIN = 'ADMIN',
    KINESIOLOGO = 'KINESIOLOGO',
    RECEPCIONISTA = 'RECEPCIONISTA',
    MEDICO = 'MEDICO',
    ENFERMERA = 'ENFERMERA',
    TECNICO_PARVULARIO = 'TECNICO_PARVULARIO',
    PACIENTE = 'PACIENTE'
}

export const ROLE_LABELS = {
    [Role.ADMIN]: 'Administrador',
    [Role.KINESIOLOGO]: 'Kinesiólogo',
    [Role.RECEPCIONISTA]: 'Recepcionista',
    [Role.MEDICO]: 'Médico',
    [Role.ENFERMERA]: 'Enfermera',
    [Role.TECNICO_PARVULARIO]: 'Técnico Parvulario',
    [Role.PACIENTE]: 'Paciente'
}
