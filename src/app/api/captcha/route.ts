import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

function generateCaptchaText(length: number = 6): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz2345789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function generateCaptchaSVG(text: string): string {
    const width = 200;
    const height = 80;

    // Noise lines
    let noiseLine = '';
    for (let i = 0; i < 5; i++) {
        const x1 = Math.random() * width;
        const y1 = Math.random() * height;
        const x2 = Math.random() * width;
        const y2 = Math.random() * height;
        const hue = Math.random() * 360;
        noiseLine += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="hsl(${hue}, 50%, 70%)" stroke-width="1" />`;
    }

    // Text elements
    let textElements = '';
    const charWidth = width / text.length;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const x = charWidth * i + 20;
        const y = 50;
        const rotation = (Math.random() - 0.5) * 20; // Rotation in degrees
        const hue = Math.random() * 360;
        const fontSize = 30 + Math.random() * 10; // Random size between 30-40

        textElements += `
      <text 
        x="${x}" 
        y="${y}" 
        font-size="${fontSize}" 
        font-weight="bold" 
        fill="hsl(${hue}, 70%, 40%)"
        transform="rotate(${rotation}, ${x}, ${y})"
      >${char}</text>
    `;
    }

    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f8fafc"/>
      ${noiseLine}
      ${textElements}
    </svg>
  `;

    return svg.trim();
}

export async function GET(request: NextRequest) {
    try {
        const text = generateCaptchaText(6);
        const svg = generateCaptchaSVG(text);

        // Create encrypted token with the CAPTCHA text
        const secret = new TextEncoder().encode(
            process.env.AUTH_SECRET || 'fallback-secret-key'
        );

        const token = await new SignJWT({ text: text.toLowerCase() })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('5m')
            .setIssuedAt()
            .sign(secret);

        return NextResponse.json({
            svg,
            token,
        });
    } catch (error) {
        console.error('CAPTCHA generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate CAPTCHA' },
            { status: 500 }
        );
    }
}
