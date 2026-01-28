import * as XLSX from 'xlsx';

// Mock data
const filteredPatients = [
    {
        name: 'John Doe',
        email: 'john@example.com',
        rut: '12345678-9',
        region: 'Metropolitana',
        commune: 'Santiago',
        birthDate: '1990-01-01',
        active: true,
        appointments: [1, 2]
    },
    {
        name: 'Jane Smith',
        email: 'jane@example.com',
        rut: '98765432-1',
        region: 'Valparaíso',
        commune: 'Viña del Mar',
        birthDate: null,
        active: false,
        appointments: []
    }
];

const calculateAge = (birthDate: any) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

const handleExport = () => {
    try {
        const dataToExport = filteredPatients.map(p => ({
            'Nombre': p.name,
            'Email': p.email,
            'RUT': p.rut,
            'Región': p.region,
            'Comuna': p.commune,
            'Edad': calculateAge(p.birthDate),
            'Estado': p.active ? 'Activo' : 'Inactivo',
            'Citas': p.appointments.length
        }));

        console.log('Data to export:', dataToExport);

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pacientes");

        // In Node we can't use writeFile for browser download, but we can write to file
        XLSX.writeFile(wb, 'test_export.xlsx');
        console.log('✅ Export successful (test_export.xlsx)');
    } catch (error) {
        console.error('❌ Export failed:', error);
    }
}

handleExport();
