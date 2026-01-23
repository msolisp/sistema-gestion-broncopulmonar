/**
 * Multi-Factor Authentication (MFA) Utilities
 * Using TOTP (Time-based One-Time Password) - RFC 6238
 * Compatible with Google Authenticator, Authy, Microsoft Authenticator, etc.
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface MFASecret {
    base32: string;
    otpauth_url: string;
}

/**
 * Generate a new MFA secret for a user
 * @param email - User's email for labeling in authenticator app
 * @param issuer - Application name (appears in authenticator app)
 * @returns Object with base32 secret and otpauth URL
 */
export function generateMfaSecret(email: string, issuer: string = 'Sistema Broncopulmonar'): MFASecret {
    const secret = speakeasy.generateSecret({
        name: `${issuer} (${email})`,
        issuer: issuer,
        length: 32, // 256 bits of entropy
    });

    return {
        base32: secret.base32!,
        otpauth_url: secret.otpauth_url!,
    };
}

/**
 * Generate QR code as Data URL for display
 * @param otpauthUrl - The otpauth:// URL from generateMfaSecret
 * @returns Promise<string> - Data URL (data:image/png;base64,...)
 */
export async function generateQrCode(otpauthUrl: string): Promise<string> {
    try {
        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        return qrCodeDataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
}

/**
 * Verify a TOTP token against a secret
 * @param token - 6-digit code from authenticator app
 * @param secret - Base32 encoded secret
 * @param window - Time window to check (default: 1 = ±30 seconds)
 * @returns boolean - Whether the token is valid
 */
export function verifyMfaToken(token: string, secret: string, window: number = 1): boolean {
    try {
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: window, // Allow ±30 seconds drift
        });

        return verified;
    } catch (error) {
        console.error('Error verifying MFA token:', error);
        return false;
    }
}

/**
 * Generate emergency backup codes
 * @param count - Number of backup codes to generate (default: 10)
 * @returns Array of objects with plain and hashed codes
 */
export async function generateBackupCodes(count: number = 10): Promise<Array<{ plain: string; hashed: string }>> {
    const codes: Array<{ plain: string; hashed: string }> = [];

    for (let i = 0; i < count; i++) {
        // Generate cryptographically secure 8-digit code
        const plain = crypto.randomBytes(4).toString('hex').toUpperCase().substring(0, 8);

        // Hash it for storage (same as passwords)
        const hashed = await bcrypt.hash(plain, 10);

        codes.push({ plain, hashed });
    }

    return codes;
}

/**
 * Verify a backup code against a hashed version
 * @param code - Plain text backup code from user
 * @param hashedCode - Hashed backup code from database
 * @returns Promise<boolean> - Whether the code matches
 */
export async function verifyBackupCode(code: string, hashedCode: string): Promise<boolean> {
    try {
        return await bcrypt.compare(code.toUpperCase(), hashedCode);
    } catch (error) {
        console.error('Error verifying backup code:', error);
        return false;
    }
}

/**
 * Format backup codes for display (groups of 4)
 * @param code - 8-character backup code
 * @returns Formatted string (e.g., "ABCD-EF12")
 */
export function formatBackupCode(code: string): string {
    if (code.length !== 8) return code;
    return `${code.substring(0, 4)}-${code.substring(4)}`;
}

/**
 * Get current TOTP token (for testing/debugging)
 * @param secret - Base32 encoded secret
 * @returns string - Current 6-digit token
 */
export function getCurrentToken(secret: string): string {
    return speakeasy.totp({
        secret: secret,
        encoding: 'base32'
    });
}
