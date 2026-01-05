'use client';

import { useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';

const TIMEOUT_MS = process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MS
    ? parseInt(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MS)
    : 15 * 60 * 1000; // 15 minutes default

export function IdleTimer() {
    const { data: session } = useSession();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!session) return;

        const resetTimer = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => {
                console.log('Session timed out due to inactivity');
                signOut({ callbackUrl: '/login' });
            }, TIMEOUT_MS);
        };

        // Events to listen for
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

        // Initial set
        resetTimer();

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Cleanup
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [session]);

    return null; // This component renders nothing
}
