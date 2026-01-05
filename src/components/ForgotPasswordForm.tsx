
'use client';

import { useActionState } from 'react';
import { requestPasswordReset } from '@/lib/password-actions';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordForm() {
    const [state, formAction, isPending] = useActionState(requestPasswordReset, null);

    return (
        <Card className="max-w-md mx-auto mt-12 bg-white/95 backdrop-blur shadow-xl border-zinc-100">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-bold text-indigo-700">Recuperar Contraseña</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    <p className="text-sm text-zinc-500 text-center mb-4">
                        Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
                    </p>

                    <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="ejemplo@correo.com"
                                className="pl-9"
                                required
                            />
                        </div>
                    </div>

                    {state?.message && (
                        <div className={`p-3 rounded-md text-sm ${state.message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {state.message}
                        </div>
                    )}

                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isPending}>
                        {isPending ? "Enviando..." : "Enviar Instrucciones"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center border-t p-4">
                <Link href="/login" className="text-sm text-zinc-500 hover:text-indigo-600 flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> Volver al inicio de sesión
                </Link>
            </CardFooter>
        </Card>
    );
}
