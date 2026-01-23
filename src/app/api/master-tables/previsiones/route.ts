import { NextResponse } from 'next/server';
import { getPrevisiones } from '@/lib/master-tables';

export async function GET() {
    try {
        const previsiones = await getPrevisiones();
        return NextResponse.json(previsiones);
    } catch (error) {
        console.error('Error fetching previsiones:', error);
        return NextResponse.json(
            { error: 'Failed to fetch previsiones' },
            { status: 500 }
        );
    }
}
