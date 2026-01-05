
import { render, act, fireEvent } from '@testing-library/react';
import { IdleTimer } from './IdleTimer';
import { useSession, signOut } from 'next-auth/react';

// Mock next-auth
jest.mock('next-auth/react');

describe('IdleTimer', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        (useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'Test User' } } });
        (signOut as jest.Mock).mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should sign out after timeout', () => {
        render(<IdleTimer />);

        // Fast-forward time
        act(() => {
            jest.advanceTimersByTime(15 * 60 * 1000);
        });

        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
    });

    it('should reset timer on user activity', () => {
        render(<IdleTimer />);

        // Advance partial time
        act(() => {
            jest.advanceTimersByTime(10 * 60 * 1000);
        });

        // Simulate activity
        fireEvent.mouseMove(window);

        // Advance more time (total > 15 mins, but reset occurred)
        act(() => {
            jest.advanceTimersByTime(10 * 60 * 1000);
        });

        // Should not have timed out yet (only 10 mins since reset)
        expect(signOut).not.toHaveBeenCalled();

        // Advance remaining time
        act(() => {
            jest.advanceTimersByTime(5 * 60 * 1000 + 100);
        });

        expect(signOut).toHaveBeenCalled();
    });

    it('should not do anything if no session', () => {
        (useSession as jest.Mock).mockReturnValue({ data: null });
        render(<IdleTimer />);

        act(() => {
            jest.advanceTimersByTime(20 * 60 * 1000);
        });

        expect(signOut).not.toHaveBeenCalled();
    });
});
