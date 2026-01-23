import { NextResponse } from 'next/server';
import { getRegionsWithCommunes } from '@/lib/master-tables';

export async function GET() {
    try {
        const regions = await getRegionsWithCommunes();
        return NextResponse.json(regions);
    } catch (error) {
        console.error('Error fetching regions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch regions' },
            { status: 500 }
        );
    }
}
