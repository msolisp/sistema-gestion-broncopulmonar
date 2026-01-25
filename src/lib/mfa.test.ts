
import { generateMfaSecret, verifyMfaToken, generateBackupCodes, verifyBackupCode, formatBackupCode } from './mfa';
import speakeasy from 'speakeasy';

// We don't necessarily need to mock speakeasy if we want to test real behavior, 
// but for verifyMfaToken with a fixed token we might need to know the secret state.
// However, speakeasy is deterministic given a secret and time. 
// For unit testing verifyMfaToken properly without relying on time, we might mock speakeasy.

jest.mock('qrcode', () => ({
    toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,fake-qr-code')
}));

describe('MFA Utilities', () => {

    describe('generateMfaSecret', () => {
        it('returns base32 and otpauth_url', () => {
            const result = generateMfaSecret('test@example.com');
            expect(result).toHaveProperty('base32');
            expect(result).toHaveProperty('otpauth_url');
            expect(result.otpauth_url).toContain('test%40example.com');
        });
    });

    describe('verifyMfaToken', () => {
        it('returns true for valid token', () => {
            // Generate a real secret
            const secret = speakeasy.generateSecret().base32;
            // Generate a real token for that secret
            const token = speakeasy.totp({
                secret: secret,
                encoding: 'base32'
            });
            const isValid = verifyMfaToken(token, secret);
            expect(isValid).toBe(true);
        });

        it('returns false for invalid token', () => {
            const secret = speakeasy.generateSecret().base32;
            const isValid = verifyMfaToken('000000', secret);
            expect(isValid).toBe(false);
        });
    });

    describe('generateBackupCodes', () => {
        it('generates specified number of codes', async () => {
            const codes = await generateBackupCodes(5);
            expect(codes).toHaveLength(5);
            expect(codes[0]).toHaveProperty('plain');
            expect(codes[0]).toHaveProperty('hashed');
        });
    });

    describe('verifyBackupCode', () => {
        it('verifies correct code', async () => {
            const codes = await generateBackupCodes(1);
            const { plain, hashed } = codes[0];
            const isValid = await verifyBackupCode(plain, hashed);
            expect(isValid).toBe(true);
        });

        it('rejects incorrect code', async () => {
            const codes = await generateBackupCodes(1);
            const { hashed } = codes[0];
            const isValid = await verifyBackupCode('WRONGCODE', hashed);
            expect(isValid).toBe(false);
        });
    });

    describe('formatBackupCode', () => {
        it('formats 8 char code with hyphen', () => {
            const formatted = formatBackupCode('ABCDEF12');
            expect(formatted).toBe('ABCD-EF12');
        });

        it('returns original if length invalid', () => {
            const formatted = formatBackupCode('ABC');
            expect(formatted).toBe('ABC');
        });
    });
});
