import { NextRequest, NextResponse } from "next/server";

// Mock storage API route for development
// Returns a simple PDF placeholder when files are requested
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;

    // Return a simple PDF with text indicating it's a mock file
    const mockPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 150
>>
stream
BT
/F1 24 Tf
100 700 Td
(Archivo Mock de Desarrollo) Tj
0 -50 Td
/F1 12 Tf
(Nombre: ${filename}) Tj
0 -30 Td
(Este es un PDF de prueba simulado.) Tj
0 -20 Td
(En produccion, aqui se mostraria el PDF real.) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
517
%%EOF`;

    return new NextResponse(mockPdfContent, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${filename}"`,
        },
    });
}
