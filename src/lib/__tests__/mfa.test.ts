import { generateMfaSecret, generateQrCode, verifyMfaToken, generateBackupCodes, verifyBackupCode, formatBackupCode, getCurrentToken } from '../mfa';

describe('MFA Library', () => {
    describe('generateMfaSecret', () => {
        it('should generate a valid base32 secret', () => {
            const result = generateMfaSecret('test@example.com');

            expect(result.base32).toBeDefined();
            expect(result.base32.length).toBeGreaterThan(0);
            expect(result.otpauth_url).toContain('otpauth://totp/');
            // Email is URL-encoded in OTP URL
            expect(result.otpauth_url).toMatch(/test(@|%40)example\.com/);
        });

        it('should include issuer in otpauth URL', () => {
            const result = generateMfaSecret('user@test.com', 'TestApp');

            // Issuer appears in label
            expect(result.otpauth_url).toContain('TestApp');
        });
    });

    describe('generateQrCode', () => {
        it('should generate a valid data URL', async () => {
            const secret = generateMfaSecret('test@example.com');
            const qrCode = await generateQrCode(secret.otpauth_url);

            expect(qrCode).toContain('data:image/png;base64');
            expect(qrCode.length).toBeGreaterThan(100);
        });
    });

    describe('verifyMfaToken', () => {
        it('should verify correct TOTP token', () => {
            const secret = generateMfaSecret('test@example.com');
            const currentToken = getCurrentToken(secret.base32);

            const isValid = verifyMfaToken(currentToken, secret.base32);

            expect(isValid).toBe(true);
        });

        it('should reject invalid token', () => {
            const secret = generateMfaSecret('test@example.com');

            const isValid = verifyMfaToken('000000', secret.base32);

            expect(isValid).toBe(false);
        });

        it('should reject empty token', () => {
            const secret = generateMfaSecret('test@example.com');

            const isValid = verifyMfaToken('', secret.base32);

            expect(isValid).toBe(false);
        });
    });

    describe('generateBackupCodes', () => {
        it('should generate 10 backup codes by default', async () => {
            const codes = await generateBackupCodes();

            expect(codes).toHaveLength(10);
        }, 20000);

        it('should generate unique codes', async () => {
            const codes = await generateBackupCodes(5);
            const plains = codes.map(c => c.plain);
            const unique = new Set(plains);

            expect(unique.size).toBe(5);
        });

        it('should generate 8-character codes', async () => {
            const codes = await generateBackupCodes(3);

            codes.forEach(code => {
                expect(code.plain).toHaveLength(8);
                expect(code.plain).toMatch(/^[0-9A-F]{8}$/);
            });
        });

        it('should hash codes with bcrypt', async () => {
            const codes = await generateBackupCodes(1);

            expect(codes[0].hashed).toBeDefined();
            expect(codes[0].hashed).toMatch(/^\$2[aby]\$/);
        });
    });

    describe('verifyBackupCode', () => {
        it('should verify correct backup code', async () => {
            const codes = await generateBackupCodes(1);
            const { plain, hashed } = codes[0];

            const isValid = await verifyBackupCode(plain, hashed);

            expect(isValid).toBe(true);
        });

        it('should reject incorrect backup code', async () => {
            const codes = await generateBackupCodes(1);
            const { hashed } = codes[0];

            const isValid = await verifyBackupCode('WRONGCOD', hashed);

            expect(isValid).toBe(false);
        });

        it('should be case insensitive', async () => {
            const codes = await generateBackupCodes(1);
            const { plain, hashed } = codes[0];

            const isValid = await verifyBackupCode(plain.toLowerCase(), hashed);

            expect(isValid).toBe(true);
        });
    });

    describe('formatBackupCode', () => {
        it('should format 8-character code with hyphen', () => {
            const formatted = formatBackupCode('ABCD1234');

            expect(formatted).toBe('ABCD-1234');
        });

        it('should return original if not 8 characters', () => {
            const formatted = formatBackupCode('ABC');

            expect(formatted).toBe('ABC');
        });
    });

    describe('getCurrentToken', () => {
        it('should generate 6-digit token', () => {
            const secret = generateMfaSecret('test@example.com');
            const token = getCurrentToken(secret.base32);

            expect(token).toMatch(/^\d{6}$/);
        });
    });
});
