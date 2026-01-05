import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { authConfig } from "@/auth.config"
import bcrypt from "bcryptjs"

// Lazy load Prisma to avoid cold start issues in Vercel Edge/Serverless if imported globally
// although auth.ts is usually server-side, keeping it safe.
import prisma from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;

                    const user = await prisma.user.findUnique({ where: { email } });
                    if (!user) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) {
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            active: user.active,
                            mustChangePassword: user.mustChangePassword
                        };
                    }
                }
                return null;
            }
        })
    ],
})
