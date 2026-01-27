'use server'

import { signIn, signOut, auth } from '@/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAction } from './logger';
import { loggers } from './structured-logger';
import { LoginSchema } from './schemas';
import { getSystemConfig } from './actions.system';

export async function logout() {
    await signOut({ redirectTo: '/login' });
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    const rawData = Object.fromEntries(formData);
    const validation = LoginSchema.safeParse(rawData);

    if (!validation.success) {
        return 'Datos inválidos';
    }

    const { email } = validation.data;

    try {
        console.log('Attempting login for:', email);
        console.log('Environment E2E_TESTING:', process.env.E2E_TESTING);
        const portalType = formData.get('portal_type');
        console.log('DEBUG: Auth Attempt:', email);
        console.log('DEBUG: E2E_TESTING:', process.env.E2E_TESTING);
        console.log('DEBUG: Portal Type:', portalType);

        // 1. VISUAL CAPTCHA VALIDATION (First layer)
        const visualCaptchaValue = formData.get('visual-captcha-value') as string;
        const visualCaptchaToken = formData.get('visual-captcha-token') as string;

        // Skip CAPTCHA validation in E2E testing mode
        if (process.env.E2E_TESTING !== 'true' && visualCaptchaValue && visualCaptchaToken) {
            try {
                const { jwtVerify } = await import('jose');
                const secret = new TextEncoder().encode(
                    process.env.AUTH_SECRET || 'fallback-secret-key'
                );

                const { payload } = await jwtVerify(visualCaptchaToken, secret);
                const expectedText = (payload.text as string).toLowerCase();
                const userText = visualCaptchaValue.toLowerCase().trim();

                if (expectedText !== userText) {
                    return 'Código de seguridad incorrecto.';
                }
            } catch (error) {
                console.error('Visual CAPTCHA validation error:', error);
                return 'Código de seguridad expirado o inválido.';
            }
        }

        // 2. Turnstile Captcha Verification (Second layer)
        // Skip Turnstile validation in E2E testing mode or if disabled in config
        const isTurnstileDisabled = (await getSystemConfig('TURNSTILE_ENABLED')) === 'false';
        const captchaToken = formData.get('cf-turnstile-response');

        if (process.env.E2E_TESTING !== 'true' && !isTurnstileDisabled && (process.env.NODE_ENV === 'production' || captchaToken)) {
            if (!captchaToken) {
                return 'Captcha inválido. Por favor intenta de nuevo.';
            }

            const secretKey = process.env.TURNSTILE_SECRET_KEY;
            console.log('DEBUG: Turnstile Secret Key present:', !!secretKey);
            if (!secretKey) {
                console.error('TURNSTILE_SECRET_KEY missing in server env');
                // Fail open or closed depending on security policy. Start with warning but allow if missing config to prevent lockout during setup.
                // But user requested Strict security.
                if (process.env.NODE_ENV === 'production') return 'Error interno de configuración de seguridad.';
            } else {
                const headers = await (await import('next/headers')).headers();
                const ip = headers.get("x-forwarded-for") || headers.get("x-real-ip") || "127.0.0.1";
                const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

                console.log('DEBUG: Verifying Turnstile token with Cloudflare...');
                const verifyParams = new URLSearchParams();
                verifyParams.append('secret', secretKey);
                verifyParams.append('response', captchaToken as string);
                verifyParams.append('remoteip', ip);

                const result = await fetch(verifyUrl, {
                    body: verifyParams,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });
                const outcome = await result.json();
                console.log('DEBUG: Turnstile Outcome:', JSON.stringify(outcome));

                if (!outcome.success) {
                    console.warn(`Turnstile validation failed for ${email}:`, outcome);
                    return 'Verificación de seguridad fallida.';
                }
                console.log('DEBUG: Turnstile validation successful');
            }
        }

        // Rate Limiting
        if (process.env.E2E_TESTING !== 'true') {
            try {
                const { rateLimit } = await import('@/lib/rate-limit');
                await rateLimit(email); // Limit by email
            } catch (e) {
                return 'Demasiados intentos. Por favor espera 1 minuto.';
            }
        }

        // Pre-check role to determine redirection
        let role = '';
        let mustChangePassword = false;
        let active = true;

        if (portalType === 'internal') {
            const persona = await prisma.persona.findUnique({
                where: { email },
                include: {
                    usuarioSistema: {
                        include: { rol_rel: true }
                    },
                    credencial: true
                }
            });

            if (!persona) {
                return 'Credenciales inválidas.';
            }

            if (!persona.usuarioSistema) {
                return 'No tiene acceso al portal interno.';
            }

            // Map roles
            role = (persona.usuarioSistema as any).rol_rel.nombre;

            // Check active status
            active = persona.activo && persona.usuarioSistema.activo;

            // Check credential flags
            if (persona.credencial) {
                mustChangePassword = persona.credencial.debeCambiarPassword;
                // Check lock
                if (persona.credencial.bloqueadoHasta && persona.credencial.bloqueadoHasta > new Date()) {
                    return 'Cuenta bloqueada temporalmente.';
                }
            }
        } else {
            // Check Persona (Patient)
            const persona = await prisma.persona.findUnique({
                where: { email },
                select: { activo: true, credencial: true }
            });
            if (persona) {
                role = 'PACIENTE';
                active = persona.activo;
                // Patient credential check
                if (persona.credencial) {
                    if (persona.credencial.bloqueadoHasta && persona.credencial.bloqueadoHasta > new Date()) {
                        return 'Cuenta bloqueada temporalmente.';
                    }
                }
            }
        }

        if (!active) return 'Cuenta inactiva.';

        let redirectTo = '/reservar'; // Default fallback

        // Security Check: Internal Portal Access
        if (portalType === 'internal') {
            if (role === 'PACIENTE') {
                const isPatient = await prisma.persona.findUnique({ where: { email } });
                const isStaff = await prisma.usuarioSistema.findFirst({ where: { persona: { email } } });
                if (isPatient && !isStaff) return 'No tiene acceso al portal interno.';
            }
        }

        if (mustChangePassword) {
            redirectTo = '/change-password';
        } else if (role === 'ADMIN') {
            redirectTo = '/dashboard';
        } else if (['KINESIOLOGO', 'RECEPCIONISTA'].includes(role)) {
            redirectTo = '/patients';
        } else {
            redirectTo = '/portal';
        }

        // Artificial Delay for Rate Limiting to prevent Brute Force
        if (process.env.E2E_TESTING !== 'true') {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        await signIn('credentials', {
            ...rawData,
            redirectTo
        });

        // Capture IP for Audit
        const { headers } = await import('next/headers');
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "Unknown IP";

        // Multi-layered Audit: logAction (custom) + loggers (structured)
        const userStaff = await prisma.usuarioSistema.findFirst({ where: { persona: { email } } });
        if (userStaff) {
            await prisma.logAccesoSistema.create({
                data: {
                    accion: 'LOGIN_SUCCESS',
                    accionDetalle: `User ${email} logged in`,
                    usuarioId: userStaff.id,
                    recurso: 'AUTH',
                    recursoId: 'SESSION',
                    ipAddress: ip
                }
            });
        }
        loggers.auth.loginSuccess(email, ip);

    } catch (error) {
        if ((error as any).message === 'NEXT_REDIRECT' || (error as any).digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }

        // Capture IP for potential error logging
        const { headers } = await import('next/headers');
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for") || "Unknown IP";

        if (error instanceof AuthError) {
            // Log failure before returning
            await logAction('LOGIN_FAILURE', `Failed login attempt for ${email}`, null, email, ip);
            loggers.auth.loginFailed(email, error.type, ip);

            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Credenciales inválidas.';
                default:
                    return 'Algo salió mal.';
            }
        }

        await logAction('LOGIN_FAILURE', `Failed login attempt for ${email}`, null, email, ip);
        loggers.auth.loginFailed(email, error instanceof AuthError ? error.type : 'Unknown', ip);
        loggers.error.api('/authenticate', error as Error, email);
        throw error;
    }
}

export async function changePassword(formData: FormData) {
    const session = await auth();

    // Safety check: User must be logged in
    if (!session?.user?.email) {
        return { message: 'Unauthorized' };
    }

    const newPassword = formData.get('newPassword') as string;

    if (!newPassword || newPassword.length < 6) {
        return { message: 'La contraseña debe tener al menos 6 caracteres' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
        // Update new Credencial model
        await prisma.credencial.update({
            where: { persona: { email: session.user.email } },
            data: {
                passwordHash: hashedPassword,
                debeCambiarPassword: false
            }
        });

        await logAction('PASSWORD_CHANGE', `User ${session.user.email} changed password`, null, session.user.email);
    } catch (e) {
        console.error('[changePassword] Error:', e);
        return { message: 'Error al cambiar la contraseña' };
    }

    // Sign out to refresh session (JWT token needs to be regenerated)
    await signOut({ redirect: false });

    // Redirect to login with success message
    redirect('/intranet/login?passwordChanged=true');
}
