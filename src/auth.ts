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
                    .object({ email: z.string().email(), password: z.string().min(6), portal_type: z.string().optional() })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password, portal_type } = parsedCredentials.data;

                    // Internal Portal Login
                    if (portal_type === 'internal') {
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
                    } else {
                        // Patient Portal Login (Default)
                        const patient = await prisma.patient.findUnique({ where: { email } });
                        if (!patient) return null;

                        const passwordsMatch = await bcrypt.compare(password, patient.password);
                        if (passwordsMatch) {
                            return {
                                id: patient.id,
                                name: patient.name,
                                email: patient.email,
                                role: 'PATIENT', // Hardcoded role for patients
                                active: patient.active,
                                mustChangePassword: false // Patients don't have forced reset currently
                            };
                        }
                    }
                }
                return null;
            }
        })
    ],
})
