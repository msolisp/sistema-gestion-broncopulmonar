'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { Clock, AlertTriangle } from 'lucide-react';

// Configuration
export const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
export const WARNING_MS = 60 * 1000; // 1 minute warning
export const IDLE_TIMEOUT_MS = TIMEOUT_MS - WARNING_MS;

export default function SessionTimeout() {
    const [showModal, setShowModal] = useState(false);
    const [timeLeft, setTimeLeft] = useState(WARNING_MS / 1000);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const notificationRef = useRef<Notification | null>(null);

    const logout = useCallback(async () => {
        if (notificationRef.current) notificationRef.current.close();
        await signOut({ callbackUrl: '/login' });
    }, []);

    const startCountdown = useCallback(() => {
        setShowModal(true);
        setTimeLeft(WARNING_MS / 1000);

        // Web Notification Logic
        try {
            if (typeof window !== 'undefined' && 'Notification' in window && document.hidden && Notification.permission === 'granted') {
                notificationRef.current = new Notification('Alerta de Inactividad', {
                    body: 'Tu sesión está por expirar. Haz clic para mantenerte conectado.',
                    icon: '/favicon.ico', // Adjust if needed
                    requireInteraction: true
                });

                notificationRef.current.onclick = () => {
                    window.focus();
                    notificationRef.current?.close();
                };
            }
        } catch (error) {
            console.error('Notification Error:', error);
            // Ignore notification errors to prevents crash
        }

        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        countdownIntervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                    logout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [logout]);

    const resetTimer = useCallback(() => {
        if (showModal) {
            setShowModal(false);
            if (notificationRef.current) {
                notificationRef.current.close();
                notificationRef.current = null;
            }
        }

        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        idleTimerRef.current = setTimeout(startCountdown, IDLE_TIMEOUT_MS);
    }, [showModal, startCountdown]);

    useEffect(() => {
        // Request Permission on Mount
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'focus'];

        // Initial start
        resetTimer();

        // Attach listeners
        const handleActivity = () => {
            // If modal is showing, only reset if user explicitly interacts (e.g. clicks "Keep Session")
            // actually, the requirement is "activity resets timer". 
            // But usually if modal is open, we want explicit action? 
            // The code before: if (!showModal) resetTimer(). 
            // Let's keep that behavior: background activity doesn't auto-close modal 
            // UNLESS it's the specific "Mantener Sesion" button or maybe a focus verify?
            if (!showModal) {
                resetTimer();
            }
        };

        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            if (notificationRef.current) notificationRef.current.close();
        };
    }, [resetTimer, showModal]);

    if (!showModal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                        <Clock className="w-8 h-8 text-amber-600" />
                    </div>

                    <h2 className="text-xl font-bold text-zinc-900">¿Sigues ahí?</h2>

                    <p className="text-zinc-600">
                        Por seguridad, tu sesión se cerrará automáticamente en:
                    </p>

                    <div className="text-3xl font-mono font-bold text-amber-600">
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>

                    <div className="flex gap-3 w-full mt-4">
                        <button
                            onClick={logout}
                            className="flex-1 px-4 py-2 border border-zinc-200 text-zinc-600 font-medium rounded-lg hover:bg-zinc-50 transition-colors"
                        >
                            Cerrar Sesión
                        </button>
                        <button
                            onClick={resetTimer}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                        >
                            Mantener Sesión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
