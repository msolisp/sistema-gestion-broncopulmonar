
'use client';

import { useActionState, useEffect } from 'react';
import { resetPassword } from '@/lib/password-actions';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';

export default function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    // We bind the token to the server action or include it in a hidden field
    const [state, formAction, isPending] = useActionState(resetPassword, null);

    useEffect(() => {
        if (state?.success) {
            // Redirect after brief delay
            const timer = setTimeout(() => {
                router.push('/login');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [state, router]);

    if (!token) {
        return (
            <Card className="max-w-md mx-auto mt-12 border-red-200">
                <CardContent className="pt-6 text-center text-red-600">
                    Token inválido o faltante. Por favor solicita un nuevo enlace.
                </CardContent>
                <CardFooter className="justify-center">
                    <Link href="/forgot-password" className="text-sm text-indigo-600 hover:underline">
                        Solicitar nuevo enlace
                    </Link>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="max-w-md mx-auto mt-12 bg-white/95 backdrop-blur shadow-xl border-zinc-100">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-bold text-indigo-700">Restablecer Contraseña</CardTitle>
            </CardHeader>
            <CardContent>
                {state?.success ? (
                    <div className="text-center space-y-4">
                        <div className="p-3 bg-green-50 text-green-700 rounded-lg">
                            {state.message}
                        </div>
                        <p className="text-sm text-zinc-500">Redirigiendo al inicio de sesión...</p>
                    </div>
                ) : (
                    <form action={formAction} className="space-y-4">
                        <input type="hidden" name="token" value={token} />

                        <div className="space-y-2">
                            <Label htmlFor="password">Nueva Contraseña</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    className="pl-9"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    className="pl-9"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {state?.message && !state.success && (
                            <div className="p-3 rounded-md text-sm bg-red-50 text-red-600">
                                {state.message}
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isPending}>
                            {isPending ? "Actualizando..." : "Cambiar Contraseña"}
                        </Button>
                    </form>
                )}
            </CardContent>
            {!state?.success && (
                <CardFooter className="flex justify-center border-t p-4">
                    <Link href="/login" className="text-sm text-zinc-500 hover:text-indigo-600 flex items-center gap-1">
                        <ArrowLeft className="w-3 h-3" /> Cancelar
                    </Link>
                </CardFooter>
            )}
        </Card>
    );
}
