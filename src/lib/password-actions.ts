
// ... existing imports
import { randomBytes } from 'crypto';

// ... existing code

export async function requestPasswordReset(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;

    if (!email) return { message: 'El email es obligatorio' };

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        // Security: Don't reveal if user exists.
        // Also check if user is active. If inactive, silently fail or return generic message.
        if (!user || !user.active) {
            // Fake delay to prevent timing attacks
            await new Promise(resolve => setTimeout(resolve, 500));
            return { message: 'Si el correo existe y está activo, recibirás instrucciones.' };
        }

        // Generate Token
        const token = randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600 * 1000); // 1 Hour

        // Store Token
        await prisma.passwordResetToken.create({
            data: {
                email,
                token,
                expires
            }
        });

        // SIMULATION: Log token to console because we don't have email service
        console.log('------------------------------------------------');
        console.log(`PASSWORD RESET TOKEN FOR ${email}:`);
        console.log(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`);
        console.log('------------------------------------------------');

        return { message: 'Si el correo existe y está activo, recibirás instrucciones.' };

    } catch (e) {
        console.error(e);
        return { message: 'Error interno al procesar la solicitud.' };
    }
}

export async function resetPassword(prevState: any, formData: FormData) {
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!token || !password || !confirmPassword) return { message: 'Todos los campos son obligatorios' };
    if (password !== confirmPassword) return { message: 'Las contraseñas no coinciden' };
    if (password.length < 6) return { message: 'La contraseña debe tener al menos 6 caracteres' };

    try {
        // Find valid token
        const storedToken = await prisma.passwordResetToken.findUnique({
            where: { token }
        });

        if (!storedToken) return { message: 'Token inválido o expirado' };
        if (storedToken.expires < new Date()) {
            await prisma.passwordResetToken.delete({ where: { id: storedToken.id } });
            return { message: 'El enlace ha expirado. Solicita uno nuevo.' };
        }

        // Find user
        const user = await prisma.user.findUnique({ where: { email: storedToken.email } });
        if (!user) return { message: 'Usuario no encontrado' };
        if (!user.active) return { message: 'Usuario inactivo' };

        // Update Password
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                mustChangePassword: false
            }
        });

        // Delete used token
        await prisma.passwordResetToken.delete({ where: { token } }); // Delete by token unique field

        return { success: true, message: 'Contraseña actualizada exitosamente' };

    } catch (e) {
        console.error(e);
        return { message: 'Error al restablecer la contraseña' };
    }
}
