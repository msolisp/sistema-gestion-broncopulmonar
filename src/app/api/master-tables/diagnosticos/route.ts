import { NextResponse } from 'next/server';
import { getDiagnosticosCIE10 } from '@/lib/master-tables';

export async function GET() {
    try {
        const diagnosticos = await getDiagnosticosCIE10();
        return NextResponse.json(diagnosticos);
    } catch (error) {
        console.error('Error fetching diagnosticos:', error);
        return NextResponse.json(
            { error: 'Failed to fetch diagnosticos' },
            { status: 500 }
        );
    }
}
