
import { render, screen, act, fireEvent } from '@testing-library/react';
import SessionTimeout, { IDLE_TIMEOUT_MS, WARNING_MS } from './SessionTimeout';
import { signOut } from 'next-auth/react';

jest.mock('next-auth/react', () => ({
    signOut: jest.fn(),
}));

describe.skip('SessionTimeout', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        global.Notification = jest.fn().mockImplementation(() => ({
            close: jest.fn(),
            onclick: null,
        })) as any;
        (global.Notification as any).requestPermission = jest.fn();
        (global.Notification as any).permission = 'granted';
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('shows warning modal after timeout', async () => {
        render(<SessionTimeout />);

        // Advance to trigger idle timeout
        await act(async () => {
            jest.advanceTimersByTime(IDLE_TIMEOUT_MS + 100);
        });

        expect(await screen.findByText('¿Sigues ahí?')).toBeInTheDocument();
    });

    it('logs out after countdown ends', async () => {
        render(<SessionTimeout />);

        // Trigger modal
        await act(async () => {
            jest.advanceTimersByTime(IDLE_TIMEOUT_MS + 100);
        });

        // Advance past countdown
        await act(async () => {
            jest.advanceTimersByTime(WARNING_MS + 1000);
        });

        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
    });

    it('resets timer when "Mantener Sesión" is clicked', async () => {
        render(<SessionTimeout />);

        // Trigger modal
        await act(async () => {
            jest.advanceTimersByTime(IDLE_TIMEOUT_MS + 100);
        });

        expect(await screen.findByText('¿Sigues ahí?')).toBeInTheDocument();

        // Click keep session
        const keepButton = screen.getByText('Mantener Sesión');
        await act(async () => {
            fireEvent.click(keepButton);
        });

        // Modal should disappear
        expect(screen.queryByText('¿Sigues ahí?')).not.toBeInTheDocument();

        // Advance time again to make sure it doesn't logout immediately (timer reset)
        await act(async () => {
            jest.advanceTimersByTime(IDLE_TIMEOUT_MS + 100);
        });

        // Should show modal again, checking loop
        expect(await screen.findByText('¿Sigues ahí?')).toBeInTheDocument();
    });

    it('logs out immediately when "Cerrar Sesión" is clicked', async () => {
        render(<SessionTimeout />);

        // Trigger modal
        await act(async () => {
            jest.advanceTimersByTime(IDLE_TIMEOUT_MS + 100);
        });

        const logoutButton = screen.getByText('Cerrar Sesión');
        await act(async () => {
            fireEvent.click(logoutButton);
        });

        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
    });
});
